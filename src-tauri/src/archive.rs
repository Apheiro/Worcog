use crate::{
    storage::{safe_document, Store},
    validation::{self, list, string, Result},
};
use serde_json::Value;
use std::{
    collections::HashSet,
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
};
use zip::{write::SimpleFileOptions, ZipArchive, ZipWriter};
const MAX_TOTAL: u64 = 2 * 1024 * 1024 * 1024;
pub struct StagedImport {
    pub token: String,
    pub workspace: Value,
    pub directory: PathBuf,
}
impl Drop for StagedImport {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.directory);
    }
}
pub fn export(store: &Store, destination: &Path) -> Result<()> {
    let w = store.load()?;
    let manifest = serde_json::to_vec_pretty(&w).map_err(|e| e.to_string())?;
    if manifest.len() > 50 * 1024 * 1024 || list(&w, "attachments")?.len() > 100_000 {
        return Err("Export exceeds portable format limits".into());
    }
    let parent = destination.parent().ok_or("Invalid destination")?;
    let temp = parent.join(format!(".worcog-{}.tmp", uuid::Uuid::new_v4()));
    let result = (|| {
        let file = fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temp)
            .map_err(|e| e.to_string())?;
        let mut zip = ZipWriter::new(file);
        let options =
            SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
        zip.start_file("workspace.json", options)
            .map_err(|e| e.to_string())?;
        zip.write_all(&manifest).map_err(|e| e.to_string())?;
        let mut total = manifest.len() as u64;
        for a in list(&w, "attachments")? {
            let name = string(a, "managedName")?;
            let path = store.root.join("attachments").join(name);
            let size = fs::metadata(&path).map_err(|e| e.to_string())?.len();
            if Some(size) != a["size"].as_u64() {
                return Err("Attachment changed; export canceled".into());
            }
            total += size;
            if total > MAX_TOTAL {
                return Err("Export exceeds 2 GiB limit".into());
            }
            zip.start_file(format!("attachments/{name}"), options)
                .map_err(|e| e.to_string())?;
            let copied = std::io::copy(
                &mut fs::File::open(path)
                    .map_err(|e| e.to_string())?
                    .take(size + 1),
                &mut zip,
            )
            .map_err(|e| e.to_string())?;
            if copied != size {
                return Err("Attachment changed while exporting; export canceled".into());
            }
        }
        let file = zip.finish().map_err(|e| e.to_string())?;
        file.sync_all().map_err(|e| e.to_string())?;
        // Native save dialog confirms overwrite. Windows rename cannot replace, so leave existing destination untouched and require a new name.
        if destination.exists() {
            return Err("Destination already exists. Choose a new export filename.".into());
        }
        fs::rename(&temp, destination).map_err(|e| e.to_string())?;
        Ok(())
    })();
    if result.is_err() {
        let _ = fs::remove_file(temp);
    }
    result
}
pub fn inspect(path: &Path, root: &Path) -> Result<StagedImport> {
    let file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut zip = ZipArchive::new(file).map_err(|_| "Invalid or corrupted ZIP archive")?;
    if zip.len() > 100_002 {
        return Err("Archive contains too many files".into());
    }
    let mut names = HashSet::new();
    let mut seen = HashSet::new();
    let mut total = 0;
    for i in 0..zip.len() {
        let entry = zip.by_index(i).map_err(|e| e.to_string())?;
        let name = entry.name();
        if entry.unix_mode().is_some_and(|m| m & 0o170000 == 0o120000) {
            return Err(format!("Symbolic links are not allowed in archives: {name}"));
        }
        if !seen.insert(name.to_string()) {
            return Err(format!("Duplicate archive entry: {name}"));
        }
        if entry.is_dir() {
            // Desktop ZIP tools commonly add the containing directory entry.
            // Only this known empty directory is allowed; files remain strict.
            if name != "attachments/" || entry.size() != 0 {
                return Err(format!("Unexpected archive directory: {name}"));
            }
            continue;
        }
        names.insert(name.to_string());
        if names.len() > 100_001 {
            return Err("Archive contains too many files".into());
        }
        if name != "workspace.json" {
            let managed = name
                .strip_prefix("attachments/")
                .ok_or("Unexpected archive path")?;
            validation::managed_name(managed)?;
        }
        let limit = if name == "workspace.json" {
            50 * 1024 * 1024
        } else {
            100 * 1024 * 1024
        };
        if entry.size() > limit {
            return Err("Archive entry exceeds size limit".into());
        }
        total += entry.size();
        if total > MAX_TOTAL {
            return Err("Archive exceeds 2 GiB limit".into());
        }
    }
    let mut manifest = String::new();
    zip.by_name("workspace.json")
        .map_err(|_| "Missing workspace.json")?
        .take(50 * 1024 * 1024 + 1)
        .read_to_string(&mut manifest)
        .map_err(|_| "Corrupt workspace manifest")?;
    if manifest.len() > 50 * 1024 * 1024 {
        return Err("Manifest too large".into());
    }
    let w: Value = serde_json::from_str(&manifest).map_err(|_| "Invalid workspace manifest")?;
    validation::validate(&w)?;
    let token = uuid::Uuid::new_v4().to_string();
    let directory = root.join(format!("import-{token}"));
    fs::create_dir_all(&directory).map_err(|e| e.to_string())?;
    let staged = StagedImport {
        token,
        workspace: w,
        directory,
    };
    let mut expected = HashSet::from(["workspace.json".to_string()]);
    for a in list(&staged.workspace, "attachments")? {
        let name = string(a, "managedName")?;
        let archive_name = format!("attachments/{name}");
        expected.insert(archive_name.clone());
        let entry = zip
            .by_name(&archive_name)
            .map_err(|_| "Missing attachment in archive")?;
        if Some(entry.size()) != a["size"].as_u64() {
            return Err("Attachment size mismatch".into());
        }
        let target = staged.directory.join(name);
        let mut out = fs::OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&target)
            .map_err(|e| e.to_string())?;
        let size = entry.size();
        let copied = std::io::copy(&mut entry.take(size + 1), &mut out)
            .map_err(|_| "Corrupted attachment content")?;
        if Some(copied) != a["size"].as_u64() {
            return Err("Attachment length mismatch".into());
        }
        safe_document(&target)?;
    }
    if expected != names {
        return Err("Archive contains unreferenced files".into());
    }
    Ok(staged)
}
pub fn backup(store: &Store) -> Result<PathBuf> {
    let path = store.root.join("backups").join(format!(
        "backup-{}-{}.zip",
        chrono::Utc::now().format("%Y%m%dT%H%M%SZ"),
        uuid::Uuid::new_v4()
    ));
    export(store, &path)?;
    Ok(path)
}
pub fn restore(store: &mut Store, staged: StagedImport) -> Result<Value> {
    // Capture the expected revision before backup so another process cannot
    // introduce an unbacked edit between the snapshot and replacement.
    let expected_revision = store.load()?["revision"].clone();
    // Keep a complete, portable pre-restore backup before any mutation.
    backup(store)?;
    let mut w = staged.workspace.clone();
    w["revision"] = expected_revision;
    // Give imported files new names, retaining previous managed files even if IDs or names collide.
    for a in w["attachments"]
        .as_array_mut()
        .ok_or("Invalid attachments")?
    {
        let old = string(a, "managedName")?;
        let ext = Path::new(old)
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("");
        let name = format!("{}.{}", uuid::Uuid::new_v4(), ext);
        fs::copy(
            staged.directory.join(old),
            store.root.join("attachments").join(&name),
        )
        .map_err(|e| e.to_string())?;
        a["managedName"] = Value::String(name);
    }
    store.save(w)
}
