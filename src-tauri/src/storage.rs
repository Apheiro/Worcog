use crate::validation::{self, list, string, Result, COLLECTIONS};
use rusqlite::{params, Connection, OptionalExtension};
use serde_json::{json, Value};
use std::{
    fs,
    path::{Path, PathBuf},
};
pub struct Store {
    pub db: Connection,
    pub root: PathBuf,
}
impl Store {
    pub fn open(root: PathBuf) -> Result<Self> {
        fs::create_dir_all(root.join("attachments")).map_err(|e| e.to_string())?;
        fs::create_dir_all(root.join("backups")).map_err(|e| e.to_string())?;
        let db = Connection::open(root.join("workspace.sqlite3")).map_err(|e| e.to_string())?;
        db.execute_batch(
            "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
        )
        .map_err(|e| e.to_string())?;
        let version: u32 = db
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .map_err(|e| e.to_string())?;
        if version > 4 {
            return Err("Database was created by a newer application".into());
        }
        if version == 0 {
            db.execute_batch("BEGIN IMMEDIATE; CREATE TABLE metadata (id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL CHECK(revision>=0)); INSERT INTO metadata VALUES(1,0); CREATE TABLE topics(id TEXT PRIMARY KEY,payload TEXT NOT NULL CHECK(json_valid(payload))); CREATE TABLE sources(id TEXT PRIMARY KEY,payload TEXT NOT NULL CHECK(json_valid(payload))); CREATE TABLE tasks(id TEXT PRIMARY KEY,topic_id TEXT NOT NULL REFERENCES topics(id) DEFERRABLE INITIALLY DEFERRED,parent_id TEXT REFERENCES tasks(id) DEFERRABLE INITIALLY DEFERRED,root_id TEXT REFERENCES tasks(id) DEFERRABLE INITIALLY DEFERRED,occurrence_date TEXT,payload TEXT NOT NULL CHECK(json_valid(payload)),UNIQUE(root_id,occurrence_date)); CREATE INDEX tasks_topic ON tasks(topic_id); CREATE INDEX tasks_parent ON tasks(parent_id); CREATE TABLE activities(id TEXT PRIMARY KEY,payload TEXT NOT NULL CHECK(json_valid(payload))); CREATE TABLE attachments(id TEXT PRIMARY KEY,payload TEXT NOT NULL CHECK(json_valid(payload)));").map_err(|e|e.to_string())?;
            // Join table names and foreign targets are compile-time constants, never user input.
            for kind in COLLECTIONS {
                for (field, target) in validation::relations(kind) {
                    db.execute_batch(&format!("CREATE TABLE {kind}_{field}(owner_id TEXT NOT NULL REFERENCES {kind}(id) ON DELETE CASCADE,target_id TEXT NOT NULL REFERENCES {target}(id) ON DELETE CASCADE,PRIMARY KEY(owner_id,target_id)); CREATE INDEX {kind}_{field}_target ON {kind}_{field}(target_id);")).map_err(|e|e.to_string())?;
                }
            }
            db.execute_batch("PRAGMA user_version=1; COMMIT;")
                .map_err(|e| e.to_string())?;
        }
        if version < 2 {
            db.execute_batch("BEGIN IMMEDIATE; CREATE TABLE IF NOT EXISTS pending_file_deletions(kind TEXT NOT NULL CHECK(kind IN ('attachments','backups')),name TEXT NOT NULL,PRIMARY KEY(kind,name)); PRAGMA user_version=2; COMMIT;").map_err(|e|e.to_string())?;
        }
        if version < 3 {
            db.execute_batch("BEGIN IMMEDIATE; ALTER TABLE metadata ADD COLUMN responsible_names TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(responsible_names)); PRAGMA user_version=3; COMMIT;").map_err(|e| e.to_string())?;
        }
        if version < 4 {
            db.execute_batch("BEGIN IMMEDIATE; ALTER TABLE metadata ADD COLUMN category_colors TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(category_colors)); PRAGMA user_version=4; COMMIT;").map_err(|e| e.to_string())?;
        }
        Ok(Self { db, root })
    }
    pub fn load(&self) -> Result<Value> {
        // A SQLite read transaction also protects snapshots across separate app processes.
        let snapshot = self.db.unchecked_transaction().map_err(|e| e.to_string())?;
        let revision: i64 = snapshot
            .query_row("SELECT revision FROM metadata WHERE id=1", [], |r| r.get(0))
            .map_err(|e| e.to_string())?;
        let directory: String = snapshot
            .query_row(
                "SELECT responsible_names FROM metadata WHERE id=1",
                [],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        let names: Value = serde_json::from_str(&directory).map_err(|e| e.to_string())?;
        let colors: String = snapshot
            .query_row("SELECT category_colors FROM metadata WHERE id=1", [], |r| {
                r.get(0)
            })
            .map_err(|e| e.to_string())?;
        let colors: Value = serde_json::from_str(&colors).map_err(|e| e.to_string())?;
        let mut w = json!({"formatVersion":1,"revision":revision,"responsibleNames":names,"categoryColors":colors});
        for kind in COLLECTIONS {
            let mut stmt = snapshot
                .prepare(&format!("SELECT payload FROM {kind} ORDER BY id"))
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map([], |r| r.get::<_, String>(0))
                .map_err(|e| e.to_string())?;
            let mut entities = vec![];
            for row in rows {
                entities.push(
                    serde_json::from_str::<Value>(&row.map_err(|e| e.to_string())?)
                        .map_err(|e| e.to_string())?,
                );
            }
            w[kind] = Value::Array(entities);
        }
        snapshot.commit().map_err(|e| e.to_string())?;
        validation::validate(&w)?;
        Ok(w)
    }
    pub fn save(&mut self, w: Value) -> Result<Value> {
        self.save_internal(w, false, false, false)
    }
    pub(crate) fn save_internal(
        &mut self,
        mut w: Value,
        delete_removed: bool,
        purge_workspace_files: bool,
        purge_backups: bool,
    ) -> Result<Value> {
        validation::validate(&w)?;
        if (purge_workspace_files || purge_backups)
            && validation::COLLECTIONS
                .iter()
                .any(|kind| w[*kind].as_array().is_none_or(|rows| !rows.is_empty()))
        {
            return Err("Clearing managed directories requires an empty workspace".into());
        }
        for a in list(&w, "attachments")? {
            let path = self
                .root
                .join("attachments")
                .join(string(a, "managedName")?);
            let accessible = fs::metadata(path).is_ok_and(|metadata|
                metadata.is_file() && metadata.len() == a["size"].as_u64().unwrap_or(0));
            if !accessible {
                let previous: Option<String> = self.db.query_row(
                    "SELECT payload FROM attachments WHERE id=?1", [string(a, "id")?],
                    |row| row.get(0),
                ).optional().map_err(|e| e.to_string())?;
                let previous = previous.and_then(|value| serde_json::from_str::<Value>(&value).ok());
                let unchanged = previous.is_some_and(|old|
                    old["managedName"] == a["managedName"] && old["size"] == a["size"]);
                if !unchanged {
                    return Err("File not found or inaccessible; the new attachment was not saved.".into());
                }
            }
        }
        let tx = self.db.transaction().map_err(|e| e.to_string())?;
        let revision: i64 = tx
            .query_row("SELECT revision FROM metadata WHERE id=1", [], |r| r.get(0))
            .map_err(|e| e.to_string())?;
        if w["revision"].as_u64() != Some(revision as u64) {
            return Err("Workspace changed in another window. Reload before saving.".into());
        }
        if delete_removed {
            crate::file_cleanup::enqueue_removed(
                &tx,
                &self.root,
                &w,
                purge_workspace_files,
                purge_backups,
            )?;
        }
        for kind in COLLECTIONS {
            for (field, _) in validation::relations(kind) {
                tx.execute(&format!("DELETE FROM {kind}_{field}"), [])
                    .map_err(|e| e.to_string())?;
            }
        }
        for kind in ["attachments", "activities", "tasks", "sources", "topics"] {
            tx.execute(&format!("DELETE FROM {kind}"), [])
                .map_err(|e| e.to_string())?;
        }
        for kind in ["topics", "sources", "tasks", "activities", "attachments"] {
            for e in list(&w, kind)? {
                let payload = serde_json::to_string(e).map_err(|e| e.to_string())?;
                if kind == "tasks" {
                    tx.execute(
                        "INSERT INTO tasks VALUES(?1,?2,?3,?4,?5,?6)",
                        params![
                            string(e, "id")?,
                            string(e, "topicId")?,
                            e["parentId"].as_str(),
                            e["recurrenceRootId"].as_str(),
                            e["occurrenceDate"].as_str(),
                            payload
                        ],
                    )
                    .map_err(|e| e.to_string())?;
                } else {
                    tx.execute(
                        &format!("INSERT INTO {kind} VALUES(?1,?2)"),
                        params![string(e, "id")?, payload],
                    )
                    .map_err(|e| e.to_string())?;
                }
            }
        }
        for kind in COLLECTIONS {
            for e in list(&w, kind)? {
                for (field, _) in validation::relations(kind) {
                    for target in list(e, field)? {
                        tx.execute(
                            &format!("INSERT INTO {kind}_{field} VALUES(?1,?2)"),
                            params![string(e, "id")?, target.as_str()],
                        )
                        .map_err(|e| e.to_string())?;
                    }
                }
            }
        }
        tx.execute(
            "UPDATE metadata SET revision=?1,responsible_names=?2,category_colors=?3 WHERE id=1",
            params![
                revision + 1,
                serde_json::to_string(
                    &w.get("responsibleNames")
                        .cloned()
                        .unwrap_or_else(|| json!([]))
                )
                .map_err(|e| e.to_string())?,
                serde_json::to_string(
                    &w.get("categoryColors")
                        .cloned()
                        .unwrap_or_else(|| json!({}))
                )
                .map_err(|e| e.to_string())?
            ],
        )
        .map_err(|e| e.to_string())?;
        tx.commit().map_err(|e| e.to_string())?;
        w["revision"] = json!(revision + 1);
        Ok(w)
    }
}
pub fn safe_document(path: &Path) -> Result<()> {
    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    // Explicit passive-document allowlist; no scripts, executables, shortcuts, HTML or macro-enabled Office files.
    if ![
        "pdf", "txt", "md", "csv", "json", "log", "png", "jpg", "jpeg", "gif", "webp", "bmp",
        "docx", "xlsx", "pptx", "odt", "ods", "odp",
    ]
    .contains(&ext.as_str())
    {
        return Err("Unsupported attachment. Choose a document, image or plain-text file.".into());
    }
    use std::io::Read;
    let mut file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut header = [0; 512];
    let n = file.read(&mut header).map_err(|e| e.to_string())?;
    let data = &header[..n];
    if data.starts_with(b"MZ")
        || data.starts_with(b"\x7fELF")
        || data.starts_with(b"#!")
        || data.starts_with(&[0xcf, 0xfa, 0xed, 0xfe])
        || data.starts_with(&[0xca, 0xfe, 0xba, 0xbe])
    {
        return Err("Executable content is not allowed".into());
    }
    if ["txt", "md", "csv", "json", "log"].contains(&ext.as_str()) && data.contains(&0) {
        return Err("Binary file disguised as text".into());
    }
    let magic: Option<&[u8]> = match ext.as_str() {
        "pdf" => Some(b"%PDF-"),
        "png" => Some(b"\x89PNG\r\n\x1a\n"),
        "jpg" | "jpeg" => Some(b"\xff\xd8\xff"),
        "gif" => Some(b"GIF8"),
        "bmp" => Some(b"BM"),
        "docx" | "xlsx" | "pptx" | "odt" | "ods" | "odp" => Some(b"PK\x03\x04"),
        _ => None,
    };
    if magic.is_some_and(|m| !data.starts_with(m)) {
        return Err("File content does not match its type".into());
    }
    if ext == "webp" && (!data.starts_with(b"RIFF") || data.get(8..12) != Some(b"WEBP")) {
        return Err("Invalid WebP file".into());
    }
    Ok(())
}

/// Opens storage on demand so directory or database errors can be shown in the UI
/// and retried after the user fixes permissions, without losing the app window.
pub struct StoreAccess {
    pub root: PathBuf,
    store: std::sync::Mutex<Option<Store>>,
}
impl StoreAccess {
    pub fn new(root: PathBuf) -> Self {
        Self {
            root,
            store: std::sync::Mutex::new(None),
        }
    }
    pub fn with<T>(&self, action: impl FnOnce(&mut Store) -> Result<T>) -> Result<T> {
        let mut slot = self
            .store
            .lock()
            .map_err(|_| "Storage is unavailable. Restart the application.")?;
        if slot.is_none() {
            *slot=Some(Store::open(self.root.clone()).map_err(|error|format!("Cannot open workspace storage at {}. Check directory permissions and available disk space, then retry. {error}",self.root.display()))?);
        }
        action(
            slot.as_mut()
                .ok_or("Storage initialization did not finish. Retry loading the workspace.")?,
        )
    }
}
