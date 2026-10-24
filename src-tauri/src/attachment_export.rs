use crate::{
    attachment_access,
    storage::Store,
    validation::{list, string, Result},
};
use serde_json::Value;
use std::{
    collections::{HashMap, HashSet},
    fs,
    io::Read,
    path::Path,
};
use zip::{write::SimpleFileOptions, ZipWriter};

const MAX_EXPORT_SIZE: u64 = 2 * 1024 * 1024 * 1024;

fn selected<'a>(workspace: &'a Value, ids: &[String]) -> Result<Vec<&'a Value>> {
    let unique: HashSet<_> = ids.iter().collect();
    if ids.is_empty() || ids.len() > 10_000 || unique.len() != ids.len() {
        return Err("Select between 1 and 10,000 distinct files.".into());
    }
    let files: HashMap<_, _> = list(workspace, "attachments")?
        .iter()
        .filter_map(|file| file["id"].as_str().map(|id| (id, file)))
        .collect();
    ids.iter()
        .map(|id| files.get(id.as_str()).copied().ok_or_else(|| "A selected attachment no longer exists.".into()))
        .collect()
}

// Archive entries are plain filenames, never paths from imported metadata.
fn export_name(file: &Value) -> Result<String> {
    let original = string(file, "originalName")?;
    let managed = string(file, "managedName")?;
    let extension = Path::new(managed).extension().and_then(|value| value.to_str()).ok_or("Missing file extension")?;
    let stem = original.rsplit_once('.').map_or(original, |(stem, _)| stem);
    let mut safe = String::new();
    for character in stem.chars() {
        let character = if character.is_control() || "/\\:<>\"|?*".contains(character) { '_' } else { character };
        if safe.len() + character.len_utf8() > 160 { break; }
        safe.push(character);
    }
    let safe = safe.trim_matches([' ', '.']);
    let safe = if safe.is_empty() { "document" } else { safe };
    let first = safe.split('.').next().unwrap_or("").to_ascii_uppercase();
    let reserved = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"].contains(&first.as_str());
    Ok(format!("{}{safe}.{extension}", if reserved { "_" } else { "" }))
}

pub fn suggested_name(store: &Store, ids: &[String]) -> Result<String> {
    let workspace = store.load()?;
    let files = selected(&workspace, ids)?;
    if files.len() == 1 { export_name(files[0]) }
    else { Ok(format!("worcog-files-{}.zip", chrono::Utc::now().format("%Y%m%dT%H%M%SZ"))) }
}

pub fn export(store: &Store, ids: &[String], destination: &Path) -> Result<()> {
    let workspace = store.load()?;
    let files = selected(&workspace, ids)?;
    let mut entries = Vec::new();
    let mut names = HashSet::new();
    let mut total = 0_u64;
    for file in &files {
        let name = export_name(file)?;
        let path = attachment_access::require(store, file).map_err(|error| format!("{name}: {error}"))?;
        let size = file["size"].as_u64().ok_or("Invalid file size")?;
        total += size;
        if total > MAX_EXPORT_SIZE { return Err("Selected files exceed the 2 GiB export limit.".into()); }
        let (stem, extension) = name.rsplit_once('.').ok_or("Missing file extension")?;
        let mut entry = name.clone();
        let mut number = 2;
        while !names.insert(entry.to_lowercase()) {
            entry = format!("{stem} ({number}).{extension}");
            number += 1;
        }
        entries.push((entry, path, size));
    }
    // Never replace an existing file, including Worcog's own managed copies.
    let output = fs::OpenOptions::new().write(true).create_new(true).open(destination)
        .map_err(|error| if error.kind() == std::io::ErrorKind::AlreadyExists {
            "Destination already exists. Choose a new filename.".to_string()
        } else { error.to_string() })?;
    let result = (|| {
        if entries.len() == 1 {
            let (_, path, size) = &entries[0];
            let mut output = output;
            let copied = std::io::copy(&mut fs::File::open(path).map_err(|error| error.to_string())?.take(size + 1), &mut output).map_err(|error| error.to_string())?;
            if copied != *size { return Err("File changed during export. Retry with the saved version.".into()); }
            output.sync_all().map_err(|error| error.to_string())?;
        } else {
            let mut archive = ZipWriter::new(output);
            let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
            for (name, path, size) in entries {
                archive.start_file(name, options).map_err(|error| error.to_string())?;
                let copied = std::io::copy(&mut fs::File::open(path).map_err(|error| error.to_string())?.take(size + 1), &mut archive).map_err(|error| error.to_string())?;
                if copied != size { return Err("A file changed during export. Retry with the saved version.".into()); }
            }
            archive.finish().map_err(|error| error.to_string())?.sync_all().map_err(|error| error.to_string())?;
        }
        Ok(())
    })();
    if result.is_err() { let _ = fs::remove_file(destination); }
    result
}
