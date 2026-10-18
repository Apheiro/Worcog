use super::{
    log,
    metadata::{Selection, MAX_DOWNLOAD},
    Result,
};
use sha2::{Digest, Sha256};
use std::{
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
};
pub fn directory(cache: &Path) -> Result<PathBuf> {
    fs::create_dir_all(cache).map_err(|_| "Could not create the application cache.")?;
    let base = fs::canonicalize(cache).map_err(|_| "Could not resolve the application cache.")?;
    let path = base.join("updates");
    fs::create_dir_all(&path).map_err(|_| "Could not create the updates directory.")?;
    if fs::canonicalize(&path).map_err(|_| "Could not resolve updates directory.")? != path {
        return Err("Updates directory must not be a symlink or junction.".into());
    }
    Ok(path)
}
struct Partial(PathBuf);
impl Drop for Partial {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.0);
    }
}
fn inspect(
    mut source: impl Read,
    selection: &Selection,
    mut output: Option<&mut File>,
    root: &Path,
) -> Result<u64> {
    let mut buffer = vec![0u8; 64 * 1024];
    let mut hash = Sha256::new();
    let mut total = 0u64;
    let mut magic = Vec::with_capacity(2);
    let mut reported = 0;
    loop {
        let count = source
            .read(&mut buffer)
            .map_err(|_| "Update transfer was interrupted. Please retry.")?;
        if count == 0 {
            break;
        }
        total += count as u64;
        if total > selection.view.size || total > MAX_DOWNLOAD {
            return Err("Update exceeds the expected size.".into());
        }
        for byte in buffer[..count].iter().take(2 - magic.len()) {
            magic.push(*byte);
        }
        hash.update(&buffer[..count]);
        if let Some(file) = output.as_mut() {
            file.write_all(&buffer[..count])
                .map_err(|_| "Could not write the update file.")?;
        }
        if total - reported >= 4 * 1024 * 1024 {
            log::record(root, "streaming", total);
            reported = total;
        }
    }
    if total != selection.view.size {
        return Err("Update size does not match GitHub metadata.".into());
    }
    if magic != b"MZ" {
        return Err("Update is not a Windows executable (missing MZ header).".into());
    }
    if format!("{:x}", hash.finalize()) != selection.hash {
        return Err("Update SHA-256 does not match GitHub metadata.".into());
    }
    Ok(total)
}
pub fn verify(path: &Path, selection: &Selection, root: &Path) -> Result<()> {
    let meta = fs::symlink_metadata(path).map_err(|_| "Could not inspect the existing update.")?;
    if !meta.file_type().is_file() || meta.len() != selection.view.size {
        return Err("Existing update file is incompatible. Move it out of the updates folder before retrying.".into());
    }
    inspect(
        File::open(path).map_err(|_| "Could not read the existing update.")?,
        selection,
        None,
        root,
    )
    .map_err(|_| {
        "Existing update failed verification. Move it out of the updates folder before retrying."
            .to_string()
    })?;
    log::record(root, "existing-verified", selection.view.size);
    Ok(())
}
pub fn exclusive(root: &Path) -> Result<File> {
    let path = root.join(".download.lock");
    if fs::symlink_metadata(&path).is_ok_and(|m| !m.file_type().is_file()) {
        return Err("Unsafe update lock file.".into());
    }
    let file = OpenOptions::new()
        .create(true)
        .truncate(false)
        .read(true)
        .write(true)
        .open(path)
        .map_err(|_| "Could not lock the updates folder.")?;
    file.try_lock()
        .map_err(|_| "Another application instance is downloading an update.")?;
    Ok(file)
}
pub fn cleanup(root: &Path) -> Result<()> {
    for entry in fs::read_dir(root).map_err(|_| "Could not inspect partial updates.")? {
        let entry = entry.map_err(|_| "Could not inspect partial update.")?;
        let name = entry.file_name().to_string_lossy().into_owned();
        if let Some(id) = name
            .strip_prefix("worklog-")
            .and_then(|s| s.strip_suffix(".part"))
        {
            if uuid::Uuid::parse_str(id).is_ok()
                && !entry
                    .file_type()
                    .map_err(|_| "Could not inspect partial update.")?
                    .is_dir()
            {
                fs::remove_file(entry.path()).map_err(|_| {
                    "Could not remove an interrupted update. Check file permissions."
                })?;
            }
        }
    }
    Ok(())
}
pub fn save(root: &Path, selection: &Selection, source: impl Read) -> Result<PathBuf> {
    let final_path = root.join(&selection.view.filename);
    if final_path.exists() || fs::symlink_metadata(&final_path).is_ok() {
        verify(&final_path, selection, root)?;
        return Ok(final_path);
    }
    let partial_path = root.join(format!("worklog-{}.part", uuid::Uuid::new_v4()));
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&partial_path)
        .map_err(|_| "Could not create a temporary update file.")?;
    let partial = Partial(partial_path);
    let verified = inspect(source, selection, Some(&mut file), root).and_then(|bytes| {
        file.sync_all()
            .map_err(|_| "Could not flush the update file to disk.")?;
        Ok(bytes)
    });
    // Close before the cleanup guard can unlink a failed partial on Windows.
    drop(file);
    let bytes = verified?;
    // Same-directory hard link publishes atomically without replacing a concurrent/existing file.
    fs::hard_link(&partial.0,&final_path).map_err(|_|"Could not publish the update without overwriting an existing file. Check the download folder.")?;
    log::record(root, "verified", bytes);
    Ok(final_path)
}
