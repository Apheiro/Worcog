use crate::{
    storage::Store,
    validation::{self, list, string, Result},
};
use rusqlite::{params, Transaction};
use serde::Serialize;
use serde_json::Value;
use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceResult {
    pub workspace: Value,
    pub cleanup_warning: Option<String>,
}

fn directory(root: &Path, kind: &str) -> Result<PathBuf> {
    if !["attachments", "backups"].contains(&kind) {
        return Err("Invalid cleanup location".into());
    }
    let base = fs::canonicalize(root).map_err(|e| e.to_string())?;
    let path = root.join(kind);
    // Do not follow a replaced directory/junction outside the managed universe.
    if fs::canonicalize(&path).map_err(|e| e.to_string())? != base.join(kind) {
        return Err("Managed directory was replaced by a link; file cleanup was stopped".into());
    }
    Ok(path)
}
fn filename(kind: &str, name: &str) -> Result<()> {
    if name.is_empty() || name == "." || name == ".." || name.contains(['/', '\\', ':', '\0']) {
        return Err("Unsafe cleanup filename".into());
    }
    if kind == "attachments" {
        validation::managed_name(name)?;
    }
    Ok(())
}
pub fn enqueue_removed(
    tx: &Transaction<'_>,
    root: &Path,
    next: &Value,
    purge_files: bool,
    purge_backups: bool,
) -> Result<()> {
    let live: HashSet<&str> = list(next, "attachments")?
        .iter()
        .map(|file| string(file, "managedName"))
        .collect::<Result<_>>()?;
    let mut stmt = tx
        .prepare("SELECT payload FROM attachments")
        .map_err(|e| e.to_string())?;
    let old = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    for row in old {
        let file: Value =
            serde_json::from_str(&row.map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
        let name = string(&file, "managedName")?;
        if !live.contains(name) {
            filename("attachments", name)?;
            tx.execute(
                "INSERT OR IGNORE INTO pending_file_deletions VALUES('attachments',?1)",
                [name],
            )
            .map_err(|e| e.to_string())?;
        }
    }
    for (kind, enabled) in [("attachments", purge_files), ("backups", purge_backups)] {
        if !enabled {
            continue;
        }
        for entry in fs::read_dir(directory(root, kind)?).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            // Reset includes orphaned managed copies. Never traverse subdirectories.
            if entry.file_type().map_err(|e| e.to_string())?.is_dir() {
                continue;
            }
            let name = entry
                .file_name()
                .into_string()
                .map_err(|_| "Invalid managed filename")?;
            filename(kind, &name)?;
            tx.execute(
                "INSERT OR IGNORE INTO pending_file_deletions VALUES(?1,?2)",
                params![kind, name],
            )
            .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
impl Store {
    /// Metadata changes and deletion intent commit together. Actual file removal
    /// happens only after commit; failures stay queued across restarts for retry.
    pub fn save_with_cleanup(
        &mut self,
        w: Value,
        purge_files: bool,
        purge_backups: bool,
    ) -> Result<WorkspaceResult> {
        let workspace = self.save_internal(w, true, purge_files, purge_backups)?;
        let cleanup_warning=match self.cleanup_deleted_files() {
            Ok(warning)=>warning,
            Err(error)=>Some(format!("Records saved. File cleanup is pending: {error}. Retry cleanup in Storage & backups.")),
        };
        Ok(WorkspaceResult {
            workspace,
            cleanup_warning,
        })
    }
    pub fn load_with_cleanup(&mut self) -> Result<WorkspaceResult> {
        let cleanup_warning = match self.cleanup_deleted_files() {
            Ok(warning) => warning,
            Err(error) => Some(format!(
                "File cleanup is pending: {error}. Retry in Storage & backups."
            )),
        };
        Ok(WorkspaceResult {
            workspace: self.load()?,
            cleanup_warning,
        })
    }
    pub fn cleanup_deleted_files(&mut self) -> Result<Option<String>> {
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)
            .map_err(|e| e.to_string())?;
        let pending = {
            let mut stmt = tx
                .prepare("SELECT kind,name FROM pending_file_deletions")
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map([], |row| {
                    Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
                })
                .map_err(|e| e.to_string())?;
            rows.collect::<std::result::Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())?
        };
        let live = {
            let mut stmt = tx
                .prepare("SELECT json_extract(payload,'$.managedName') FROM attachments")
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map([], |row| row.get::<_, String>(0))
                .map_err(|e| e.to_string())?;
            rows.collect::<std::result::Result<HashSet<_>, _>>()
                .map_err(|e| e.to_string())?
        };
        let mut failures = 0;
        for (kind, name) in pending {
            filename(&kind, &name)?;
            if kind == "attachments" && live.contains(&name) {
                tx.execute(
                    "DELETE FROM pending_file_deletions WHERE kind=?1 AND name=?2",
                    params![kind, name],
                )
                .map_err(|e| e.to_string())?;
                continue;
            }
            let deleted = directory(&self.root, &kind).and_then(|dir| {
                match fs::remove_file(dir.join(&name)) {
                    Ok(()) => Ok(()),
                    Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
                    Err(error) => Err(error.to_string()),
                }
            });
            if deleted.is_err() {
                failures += 1;
                continue;
            }
            tx.execute(
                "DELETE FROM pending_file_deletions WHERE kind=?1 AND name=?2",
                params![kind, name],
            )
            .map_err(|e| e.to_string())?;
        }
        tx.commit().map_err(|e| e.to_string())?;
        Ok(if failures > 0 {
            Some(format!("Records deleted, but {failures} file(s) could not be removed. Close programs using them, check permissions, then choose Retry file cleanup in Storage & backups."))
        } else {
            None
        })
    }
}
