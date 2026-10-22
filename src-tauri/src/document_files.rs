use crate::{storage, validation::{list, string, Result}};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{fs, io::{Read, Write}, path::PathBuf};

const MAX_SIZE: usize = 100 * 1024 * 1024;

fn attachment<'a>(workspace: &'a Value, id: &str) -> Result<&'a Value> {
    list(workspace, "attachments")?.iter()
        .find(|file| file["id"].as_str() == Some(id))
        .ok_or_else(|| "Attachment no longer exists.".into())
}

fn directory(store: &storage::Store) -> Result<PathBuf> {
    let root = fs::canonicalize(&store.root).map_err(|e| e.to_string())?;
    let directory = root.join("attachments");
    if fs::canonicalize(&directory).map_err(|e| e.to_string())? != directory {
        return Err("Managed attachment directory was replaced by a link.".into());
    }
    Ok(directory)
}

fn extension(file: &Value) -> Result<&str> {
    let name = string(file, "managedName")?;
    crate::validation::managed_name(name)?;
    let ext = name.rsplit('.').next().unwrap_or("");
    if !["docx", "xlsx", "pptx", "csv"].contains(&ext) {
        return Err("Open this format with the default application.".into());
    }
    Ok(ext)
}

pub fn read(store: &storage::Store, id: &str) -> Result<Vec<u8>> {
    let workspace = store.load()?;
    read_attachment(store, attachment(&workspace, id)?)
}

fn read_attachment(store: &storage::Store, file: &Value) -> Result<Vec<u8>> {
    extension(file)?;
    let path = crate::attachment_access::require(store, file)?;
    let metadata = fs::symlink_metadata(&path).map_err(|e| e.to_string())?;
    if !metadata.is_file() || metadata.len() > MAX_SIZE as u64 {
        return Err("Choose a regular document up to 100 MiB.".into());
    }
    storage::safe_document(&path)?;
    let mut bytes = Vec::new();
    fs::File::open(path).map_err(|e| e.to_string())?
        .take(MAX_SIZE as u64 + 1).read_to_end(&mut bytes).map_err(|e| e.to_string())?;
    if bytes.len() > MAX_SIZE || bytes.len() as u64 != file["size"].as_u64().unwrap_or(0) {
        return Err("Attachment changed outside Worklog. Reopen it before editing.".into());
    }
    Ok(bytes)
}

pub fn save(store: &mut storage::Store, id: &str, expected_hash: &str, bytes: &[u8]) -> Result<crate::file_cleanup::WorkspaceResult> {
    if bytes.is_empty() || bytes.len() > MAX_SIZE {
        return Err("The edited document must be between 1 byte and 100 MiB.".into());
    }
    let mut workspace = store.load()?;
    let file = attachment(&workspace, id)?;
    let current = read_attachment(store, file)?;
    if format!("{:x}", Sha256::digest(&current)) != expected_hash {
        return Err("This file changed since it was opened. Your edits remain in the editor; the saved file was not overwritten.".into());
    }
    if bytes == current.as_slice() {
        return Ok(crate::file_cleanup::WorkspaceResult { workspace, cleanup_warning: None });
    }
    let ext = extension(file)?.to_owned();
    let name = format!("{}.{}", uuid::Uuid::new_v4(), ext);
    let path = directory(store)?.join(&name);
    // Write a new managed copy first. A failed write or DB commit preserves the original.
    let result = (|| {
        let mut output = fs::OpenOptions::new().write(true).create_new(true)
            .open(&path).map_err(|e| e.to_string())?;
        output.write_all(bytes).map_err(|e| e.to_string())?;
        output.sync_all().map_err(|e| e.to_string())?;
        drop(output);
        storage::safe_document(&path)?;
        if ["docx", "xlsx", "pptx"].contains(&ext.as_str()) {
            let archive = zip::ZipArchive::new(std::io::Cursor::new(bytes)).map_err(|e| e.to_string())?;
            let entry = match ext.as_str() {
                "docx" => "word/document.xml",
                "xlsx" => "xl/workbook.xml",
                _ => "ppt/presentation.xml",
            };
            if !archive.file_names().any(|name| name == entry) {
                return Err("The exported document does not match the original format.".into());
            }
        }
        let file = workspace["attachments"].as_array_mut()
            .ok_or("Invalid attachments")?.iter_mut()
            .find(|file| file["id"].as_str() == Some(id)).ok_or("Attachment no longer exists.")?;
        file["managedName"] = json!(name);
        file["size"] = json!(bytes.len());
        // Queue the superseded copy in the same DB commit, then remove only unreferenced files.
        store.save_with_cleanup(workspace, false, false)
    })();
    if result.is_err() { let _ = fs::remove_file(path); }
    result
}
