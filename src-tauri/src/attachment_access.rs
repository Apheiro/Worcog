use crate::{storage::Store, validation::{list, string, Result}};
use serde::Serialize;
use serde_json::Value;
use std::{collections::HashMap, fs, path::PathBuf};

#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum AttachmentStatus { Available, Missing, Inaccessible }

pub fn status(store: &Store, file: &Value) -> AttachmentStatus {
    let Ok(name) = string(file, "managedName") else { return AttachmentStatus::Inaccessible; };
    if crate::validation::managed_name(name).is_err() { return AttachmentStatus::Inaccessible; }
    let base = store.root.join("attachments");
    let Ok(root) = fs::canonicalize(&store.root) else { return AttachmentStatus::Inaccessible; };
    match fs::canonicalize(&base) {
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return AttachmentStatus::Missing,
        Ok(directory) if directory == root.join("attachments") => {},
        _ => return AttachmentStatus::Inaccessible,
    }
    let path = base.join(name);
    match fs::symlink_metadata(&path) {
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => AttachmentStatus::Missing,
        Ok(metadata) if metadata.is_file()
            && metadata.len() == file["size"].as_u64().unwrap_or(0)
            && fs::File::open(path).is_ok() => AttachmentStatus::Available,
        _ => AttachmentStatus::Inaccessible,
    }
}

pub fn require(store: &Store, file: &Value) -> Result<PathBuf> {
    match status(store, file) {
        AttachmentStatus::Available => Ok(store.root.join("attachments").join(string(file, "managedName")?)),
        AttachmentStatus::Missing => Err("File not found.".into()),
        AttachmentStatus::Inaccessible => Err("File inaccessible or changed outside Worklog.".into()),
    }
}

pub fn statuses(store: &Store, id: Option<&str>) -> Result<HashMap<String, AttachmentStatus>> {
    let workspace = store.load()?;
    let mut statuses = HashMap::new();
    for file in list(&workspace, "attachments")? {
        let file_id = string(file, "id")?;
        if id.is_none_or(|id| id == file_id) { statuses.insert(file_id.to_owned(), status(store, file)); }
    }
    if let Some(id) = id { statuses.entry(id.to_owned()).or_insert(AttachmentStatus::Missing); }
    Ok(statuses)
}
