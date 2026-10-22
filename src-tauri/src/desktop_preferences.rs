use crate::{storage::Store, validation::Result};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Sound {
    pub name: String,
    pub managed_name: String,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields, default)]
pub struct Preferences {
    pub tray_enabled: bool,
    pub notifications_enabled: bool,
    pub volume: u8,
    pub sound: Option<Sound>,
}
impl Default for Preferences {
    fn default() -> Self {
        Self { tray_enabled: false, notifications_enabled: false, volume: 25, sound: None }
    }
}
impl Preferences {
    pub fn enabled(&self) -> bool { self.tray_enabled && self.notifications_enabled }
    fn validate(&self) -> Result<()> {
        if self.volume == 0 || self.volume > 100 { return Err("Volume must be between 1 and 100%.".into()); }
        if self.notifications_enabled && !self.tray_enabled { return Err("Enable the tray icon before enabling reminder notifications.".into()); }
        if let Some(sound) = &self.sound {
            crate::validation::managed_name(&sound.managed_name)?;
            if sound.name.is_empty() || sound.name.len() > 500 { return Err("Invalid sound name.".into()); }
        }
        Ok(())
    }
}
pub fn load(store: &Store) -> Result<Preferences> {
    let payload: Option<String> = store.db.query_row("SELECT payload FROM desktop_preferences WHERE id=1", [], |row| row.get(0))
        .optional().map_err(|error| error.to_string())?;
    let preferences: Preferences = payload.map(|value| serde_json::from_str(&value)).transpose()
        .map_err(|error| format!("Could not read reminder settings: {error}"))?.unwrap_or_default();
    preferences.validate()?;
    Ok(preferences)
}
pub fn save(store: &Store, preferences: &Preferences) -> Result<()> {
    preferences.validate()?;
    store.db.execute("INSERT INTO desktop_preferences(id,payload) VALUES(1,?1) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
        params![serde_json::to_string(preferences).map_err(|error| error.to_string())?]).map_err(|error| error.to_string())?;
    Ok(())
}
pub fn sound_path(store: &Store, sound: &Sound) -> Result<PathBuf> {
    crate::validation::managed_name(&sound.managed_name)?;
    let root = fs::canonicalize(&store.root).map_err(|error| error.to_string())?;
    let directory = root.join("sounds");
    if fs::canonicalize(&directory).map_err(|error| error.to_string())? != directory {
        return Err("The managed sounds directory is inaccessible or was replaced by a link.".into());
    }
    let path = directory.join(&sound.managed_name);
    if !fs::symlink_metadata(&path).map_err(|error| error.to_string())?.is_file() {
        return Err("The selected sound is no longer a regular file.".into());
    }
    Ok(path)
}
