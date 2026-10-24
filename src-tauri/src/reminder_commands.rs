use crate::{desktop::AppState, desktop_preferences::{self, Preferences, Sound}, reminders::{self, Command, Status}, validation::{list, Result}};
use serde::Deserialize;
use std::{fs, io::Read, sync::atomic::Ordering};
use tauri::{Emitter, Manager, State};

fn main_only(webview: &tauri::Webview) -> Result<()> {
    if webview.label() == "main" { Ok(()) } else { Err("Only the workspace can change reminder settings.".into()) }
}
fn reminder_window(webview: &tauri::Webview) -> Result<()> {
    if ["main", "reminders"].contains(&webview.label()) { Ok(()) } else { Err("This window cannot access reminders.".into()) }
}
#[tauri::command]
pub fn reminder_status(webview: tauri::Webview, state: State<'_, AppState>) -> Result<Status> {
    reminder_window(&webview)?;
    state.reminders.status()
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PreferenceInput { tray_enabled: bool, notifications_enabled: bool, volume: u8 }

#[tauri::command]
pub async fn set_reminder_preferences(input: PreferenceInput, app: tauri::AppHandle, webview: tauri::Webview, state: State<'_, AppState>) -> Result<Preferences> {
    main_only(&webview)?;
    let _guard = state.reminders.preferences_lock.lock().map_err(|_| "Reminder settings are unavailable.")?;
    if input.volume == 0 || input.volume > 100 { return Err("Volume must be between 1 and 100%.".into()); }
    if input.notifications_enabled && !input.tray_enabled { return Err("Enable Tray icon before Reminder notifications.".into()); }
    let had_tray = app.tray_by_id("worcog").is_some();
    if input.tray_enabled { reminders::ensure_tray(&app)?; }
    else { reminders::show_main(&app)?; }
    let result = state.store.with(|store| {
        let previous = desktop_preferences::load(store)?;
        let preferences = Preferences { tray_enabled: input.tray_enabled, notifications_enabled: input.notifications_enabled, volume: input.volume, sound: previous.sound };
        desktop_preferences::save(store, &preferences)?;
        Ok(preferences)
    });
    if let Ok(preferences) = &result {
        if !preferences.tray_enabled { app.remove_tray_by_id("worcog"); }
        state.reminders.wake();
    } else if !had_tray { app.remove_tray_by_id("worcog"); }
    result
}

#[tauri::command]
pub async fn choose_reminder_sound(app: tauri::AppHandle, webview: tauri::Webview) -> Result<Option<Preferences>> {
    main_only(&webview)?;
    let Some(file) = rfd::AsyncFileDialog::new().set_title("Choose reminder sound (10 MiB / 60 seconds maximum)")
        .add_filter("Audio", &["wav", "mp3", "ogg", "flac"]).pick_file().await else { return Ok(None); };
    let path = file.path().to_path_buf();
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let _guard = state.reminders.preferences_lock.lock().map_err(|_| "Reminder settings are unavailable.")?;
        let preferences = state.store.with(|store| {
            let mut preferences = desktop_preferences::load(store)?;
            let extension = path.extension().and_then(|value| value.to_str()).unwrap_or("").to_ascii_lowercase();
            if !["wav", "mp3", "ogg", "flac"].contains(&extension.as_str()) { return Err("Choose WAV, MP3, OGG or FLAC audio.".into()); }
            // Validate before copying and again on the managed copy; no output device is needed.
            crate::reminder_audio::decode(&path)?;
            let directory = store.root.join("sounds");
            fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
            let canonical = fs::canonicalize(&store.root).map_err(|error| error.to_string())?.join("sounds");
            if fs::canonicalize(&directory).map_err(|error| error.to_string())? != canonical { return Err("Unsafe managed sounds directory.".into()); }
            let name = format!("{}.{}", uuid::Uuid::new_v4(), extension);
            let target = directory.join(&name);
            let previous = preferences.sound.clone();
            let result = (|| {
                let mut source = fs::File::open(&path).map_err(|error| error.to_string())?.take(10 * 1024 * 1024 + 1);
                let mut output = fs::OpenOptions::new().write(true).create_new(true).open(&target).map_err(|error| error.to_string())?;
                let size = std::io::copy(&mut source, &mut output).map_err(|error| error.to_string())?;
                output.sync_all().map_err(|error| error.to_string())?;
                drop(output);
                if size > 10 * 1024 * 1024 { return Err("Audio file exceeds 10 MiB.".into()); }
                crate::reminder_audio::decode(&target)?;
                preferences.sound = Some(Sound { name: path.file_name().and_then(|value| value.to_str()).unwrap_or("Reminder sound").into(), managed_name: name });
                desktop_preferences::save(store, &preferences)
            })();
            if let Err(error) = result { let _ = fs::remove_file(&target); return Err(error); }
            if let Some(sound) = previous { if let Ok(path) = desktop_preferences::sound_path(store, &sound) { let _ = fs::remove_file(path); } }
            Ok(preferences)
        })?;
        state.reminders.wake();
        Ok(Some(preferences))
    }).await.map_err(|_| "Audio import worker failed.".to_string())?
}

#[tauri::command]
pub async fn reset_reminder_sound(webview: tauri::Webview, state: State<'_, AppState>) -> Result<Preferences> {
    main_only(&webview)?;
    let _guard = state.reminders.preferences_lock.lock().map_err(|_| "Reminder settings are unavailable.")?;
    let preferences = state.store.with(|store| {
        let mut preferences = desktop_preferences::load(store)?;
        let previous = preferences.sound.take();
        desktop_preferences::save(store, &preferences)?;
        if let Some(sound) = previous { if let Ok(path) = desktop_preferences::sound_path(store, &sound) { let _ = fs::remove_file(path); } }
        Ok(preferences)
    })?;
    state.reminders.wake();
    Ok(preferences)
}
#[tauri::command]
pub fn preview_reminder_sound(stop: bool, webview: tauri::Webview, state: State<'_, AppState>) -> Result<()> {
    main_only(&webview)?;
    state.reminders.send(if stop { Command::StopPreview } else { Command::Preview })
}
#[tauri::command]
pub fn reminder_window_ready(webview: tauri::Webview, state: State<'_, AppState>) -> Result<()> {
    if webview.label() != "reminders" { return Err("Not a reminder window.".into()); }
    state.reminders.window_ready.store(true, Ordering::Relaxed);
    state.reminders.wake();
    Ok(())
}
#[tauri::command]
pub fn set_exit_guard(open: bool, webview: tauri::Webview, state: State<'_, AppState>) -> Result<()> {
    main_only(&webview)?;
    state.reminders.exit_guard.store(open, Ordering::Relaxed);
    Ok(())
}
#[tauri::command]
pub async fn dismiss_reminder(id: String, at: String, app: tauri::AppHandle, webview: tauri::Webview, state: State<'_, AppState>) -> Result<()> {
    reminder_window(&webview)?;
    state.store.with(|store| {
        let mut workspace = store.load()?;
        let task = workspace["tasks"].as_array_mut().ok_or("Invalid task collection.")?.iter_mut().find(|task| task["id"].as_str() == Some(&id));
        if let Some(task) = task {
            if task["reminderAt"].as_str() != Some(&at) { return Err("This reminder was rescheduled. The current reminder remains active.".into()); }
            if !task["reminderDismissedAt"].is_string() {
                task["reminderDismissedAt"] = serde_json::json!(chrono::Utc::now().to_rfc3339());
                store.save(workspace)?;
            }
        }
        Ok(())
    })?;
    state.reminders.wake();
    let _ = app.emit_to("main", "reminder-dismissed", ());
    Ok(())
}
#[tauri::command]
pub async fn open_reminder_task(id: String, app: tauri::AppHandle, webview: tauri::Webview, state: State<'_, AppState>) -> Result<()> {
    reminder_window(&webview)?;
    state.store.with(|store| {
        if list(&store.load()?, "tasks")?.iter().any(|task| task["id"].as_str() == Some(&id)) { Ok(()) }
        else { Err("This task no longer exists.".into()) }
    })?;
    reminders::show_main(&app)?;
    app.emit_to("main", "open-reminder-task", id).map_err(|error| error.to_string())
}
#[tauri::command]
pub async fn minimize_workspace(app: tauri::AppHandle, webview: tauri::Webview) -> Result<()> {
    main_only(&webview)?;
    let window = app.get_webview_window("main").ok_or("Main window is unavailable.")?;
    if app.tray_by_id("worcog").is_some() { window.hide() } else { window.minimize() }.map_err(|error| error.to_string())
}
