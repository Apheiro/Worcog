use crate::{desktop::AppState, desktop_preferences::{self, Preferences}, reminder_audio::Audio, storage::Store, validation::{list, string, Result}};
use chrono::{DateTime, Utc};
use serde::Serialize;
use serde_json::Value;
use std::{collections::HashMap, sync::{Mutex, atomic::{AtomicBool, Ordering}, mpsc::{self, Receiver, Sender}}, time::{Duration, Instant}};
use tauri::{Emitter, Manager, menu::{Menu, MenuItem}, tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}};

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Alert { pub id: String, pub title: String, pub topic_title: String, pub at: String }
#[derive(Clone, Debug, PartialEq, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    pub preferences: Preferences,
    pub pending: Vec<Alert>,
    pub sound_error: Option<String>,
    pub error: Option<String>,
    pub previewing: bool,
}
pub enum Command { Refresh, Preview, StopPreview }
pub struct Service {
    status: Mutex<Status>,
    sender: Sender<Command>,
    pub window_ready: AtomicBool,
    pub exit_guard: AtomicBool,
    exit_confirmation: AtomicBool,
    pub preferences_lock: Mutex<()>,
}
impl Service {
    pub fn new() -> (Self, Receiver<Command>) {
        let (sender, receiver) = mpsc::channel();
        (Self { status: Mutex::new(Status::default()), sender, window_ready: AtomicBool::new(false), exit_guard: AtomicBool::new(false), exit_confirmation: AtomicBool::new(false), preferences_lock: Mutex::new(()) }, receiver)
    }
    pub fn status(&self) -> Result<Status> { self.status.lock().map(|value| value.clone()).map_err(|_| "Reminder state is unavailable.".into()) }
    pub fn send(&self, command: Command) -> Result<()> { self.sender.send(command).map_err(|_| "Reminder worker is unavailable. Restart Worcog.".into()) }
    pub fn wake(&self) { let _ = self.send(Command::Refresh); }
}

pub fn show_main(app: &tauri::AppHandle) -> Result<()> {
    let window = app.get_webview_window("main").ok_or("Main window is unavailable.")?;
    window.show().map_err(|error| error.to_string())?;
    window.unminimize().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())
}

pub fn request_exit(app: &tauri::AppHandle) {
    let state = app.state::<AppState>();
    if !state.reminders.exit_guard.load(Ordering::Relaxed) { app.exit(0); return; }
    if state.reminders.exit_confirmation.swap(true, Ordering::Relaxed) { return; }
    let app = app.clone();
    std::thread::spawn(move || {
        let answer = rfd::MessageDialog::new().set_title("Exit Worcog?")
            .set_description("A form, document or operation is open. Finish saving your changes before exiting. Exit anyway?")
            .set_buttons(rfd::MessageButtons::YesNo).show();
        app.state::<AppState>().reminders.exit_confirmation.store(false, Ordering::Relaxed);
        if answer == rfd::MessageDialogResult::Yes { app.exit(0); }
        else { let _ = show_main(&app); }
    });
}

pub fn ensure_tray(app: &tauri::AppHandle) -> Result<()> {
    if app.tray_by_id("worcog").is_some() { return Ok(()); }
    let open = MenuItem::with_id(app, "open-worcog", "Open Worcog", true, None::<&str>).map_err(|error| error.to_string())?;
    let exit = MenuItem::with_id(app, "exit-worcog", "Exit", true, None::<&str>).map_err(|error| error.to_string())?;
    let menu = Menu::with_items(app, &[&open, &exit]).map_err(|error| error.to_string())?;
    TrayIconBuilder::with_id("worcog")
        .icon(app.default_window_icon().ok_or("Application icon is unavailable.")?.clone())
        .tooltip("Worcog")
        .menu(&menu).show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if matches!(event, TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. }) {
                let _ = show_main(tray.app_handle());
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open-worcog" => { let _ = show_main(app); },
            "exit-worcog" => {
                request_exit(app);
            },
            _ => {},
        }).build(app).map_err(|error| error.to_string())?;
    Ok(())
}

pub fn validate_schedule(store: &Store, workspace: &mut Value) -> Result<()> {
    let previous = store.load()?;
    let old_tasks: HashMap<_, _> = list(&previous, "tasks")?.iter().filter_map(|task| task["id"].as_str().map(|id| (id, task))).collect();
    let tasks = workspace["tasks"].as_array_mut().ok_or("Invalid task collection.")?;
    for task in tasks {
        let old = task["id"].as_str().and_then(|id| old_tasks.get(id).copied());
        // A form opened before a popup was dismissed must not undo that dismissal.
        if let Some(old) = old {
            if old["reminderAt"] == task["reminderAt"] && old["reminderDismissedAt"].is_string() {
                task["reminderDismissedAt"] = old["reminderDismissedAt"].clone();
            }
        }
        if task["reminderAt"].is_string() && ["completed", "canceled"].contains(&task["status"].as_str().unwrap_or("")) {
            if !task["reminderDismissedAt"].is_string() { task["reminderDismissedAt"] = serde_json::json!(Utc::now().to_rfc3339()); }
        }
        if task["reminderAt"].is_string() && !task["reminderDismissedAt"].is_string() {
            if old.is_none_or(|old| old["reminderAt"] != task["reminderAt"] || old["reminderDismissedAt"].is_string()) {
                if !desktop_preferences::load(store)?.enabled() {
                    return Err("Cannot enable a reminder. Enable both Tray icon and Reminder notifications in Settings → General first.".into());
                }
                let date = DateTime::parse_from_rfc3339(string(task, "reminderAt")?).map_err(|_| "Invalid reminder date.")?;
                if date <= Utc::now() { return Err("Choose a future date and time for the reminder.".into()); }
            }
        }
    }
    Ok(())
}

fn pending(store: &Store, previous: &[Alert]) -> Result<Vec<Alert>> {
    let mut statement = store.db.prepare("SELECT tasks.payload,topics.payload FROM tasks JOIN topics ON topics.id=tasks.topic_id WHERE json_extract(tasks.payload,'$.reminderAt') IS NOT NULL AND json_extract(tasks.payload,'$.reminderDismissedAt') IS NULL AND json_extract(tasks.payload,'$.status') NOT IN ('completed','canceled') AND json_extract(topics.payload,'$.archived')=0 AND json_extract(topics.payload,'$.status') NOT IN ('completed','canceled')").map_err(|error| error.to_string())?;
    let records = statement.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))).map_err(|error| error.to_string())?;
    let now = Utc::now();
    let mut alerts = Vec::new();
    for record in records {
        let (task, topic) = record.map_err(|error| error.to_string())?;
        let task: Value = serde_json::from_str(&task).map_err(|error| error.to_string())?;
        let topic: Value = serde_json::from_str(&topic).map_err(|error| error.to_string())?;
        let at = string(&task, "reminderAt")?;
        let date = DateTime::parse_from_rfc3339(at).map_err(|_| "Invalid reminder date.")?;
        let id = string(&task, "id")?;
        if date <= now || previous.iter().any(|alert| alert.id == id && alert.at == at) {
            alerts.push(Alert { id: id.into(), title: string(&task, "title")?.into(), topic_title: string(&topic, "title")?.into(), at: at.into() });
        }
    }
    alerts.sort_by(|a, b| DateTime::parse_from_rfc3339(&a.at).ok().cmp(&DateTime::parse_from_rfc3339(&b.at).ok()).then(a.id.cmp(&b.id)));
    Ok(alerts)
}

fn present(app: &tauri::AppHandle, service: &Service, count: usize) -> Result<()> {
    if count == 0 {
        if let Some(window) = app.get_webview_window("reminders") {
            window.hide().map_err(|error| error.to_string())?;
        }
        return Ok(());
    }
    let window = if let Some(window) = app.get_webview_window("reminders") { window } else {
        service.window_ready.store(false, Ordering::Relaxed);
        tauri::WebviewWindowBuilder::new(app, "reminders", tauri::WebviewUrl::App("reminders/".into()))
            .title("Worcog reminders").decorations(false).resizable(false).always_on_top(true)
            .skip_taskbar(true).focused(false).visible(false).inner_size(400.0, 240.0)
            .build().map_err(|error| format!("Could not open reminder window: {error}"))?
    };
    let monitor = app.get_webview_window("main").and_then(|main| main.current_monitor().ok().flatten())
        .or_else(|| window.primary_monitor().ok().flatten()).ok_or("No monitor is available for reminders.")?;
    let work = monitor.work_area();
    let scale = monitor.scale_factor();
    let width = (400.0 * scale).min(f64::from(work.size.width.saturating_sub(24))).max(1.0) as u32;
    let height = ((100 + count.min(3) * 130) as f64 * scale).min(f64::from(work.size.height.saturating_sub(24))).max(1.0) as u32;
    let gap = (16.0 * scale) as i32;
    window.set_size(tauri::PhysicalSize::new(width, height)).map_err(|error| error.to_string())?;
    window.set_position(tauri::PhysicalPosition::new(
        work.position.x + (work.size.width as i32 - width as i32 - gap).max(0),
        work.position.y + (work.size.height as i32 - height as i32 - gap).max(0),
    )).map_err(|error| error.to_string())?;
    if service.window_ready.load(Ordering::Relaxed) && !window.is_visible().unwrap_or(false) {
        window.show().map_err(|error| error.to_string())?;
    }
    Ok(())
}

pub fn start(app: tauri::AppHandle, receiver: Receiver<Command>) {
    std::thread::spawn(move || {
        let mut audio: Option<Audio> = None;
        let mut preview_until: Option<Instant> = None;
        let mut last_sound: Option<String> = None;
        let mut retry_at = Instant::now();
        let mut presentation_error: Option<String> = None;
        let mut state = Status::default();
        let mut command = None;
        loop {
            let app_state = app.state::<AppState>();
            let service = &app_state.reminders;
            let snapshot = app_state.store.with(|store| {
                let preferences = desktop_preferences::load(store)?;
                let pending = if preferences.enabled() { pending(store, &state.pending)? } else { Vec::new() };
                let (path, path_error) = match preferences.sound.as_ref().map(|sound| desktop_preferences::sound_path(store, sound)) {
                    Some(Ok(path)) => (Some(path), None),
                    Some(Err(error)) => (None, Some(format!("Custom sound unavailable; using the default tone. {error}"))),
                    None => (None, None),
                };
                Ok((preferences, pending, path, path_error))
            });
            match snapshot {
                Ok((preferences, pending, path, path_error)) => {
                    if state.pending.is_empty() && !pending.is_empty() { retry_at = Instant::now(); }
                    state.preferences = preferences;
                    state.pending = pending;
                    state.error = None;
                    if state.preferences.tray_enabled {
                        let tray: Result<()> = (|| {
                            let _guard = service.preferences_lock.lock().map_err(|_| "Reminder settings are unavailable.")?;
                            // Do not recreate a tray that Settings disabled after this tick's snapshot.
                            let enabled = app_state.store.with(|store| desktop_preferences::load(store).map(|preferences| preferences.tray_enabled))?;
                            if enabled { ensure_tray(&app)?; }
                            Ok(())
                        })();
                        if let Err(error) = tray { state.error = Some(error); }
                    }
                    match command.take() {
                        Some(Command::Preview) if state.pending.is_empty() => {
                            audio = None;
                            preview_until = Some(Instant::now() + Duration::from_secs(5));
                            retry_at = Instant::now();
                        },
                        Some(Command::StopPreview) => { preview_until = None; if state.pending.is_empty() { audio = None; } },
                        _ => {},
                    }
                    if !state.pending.is_empty() && preview_until.take().is_some() { audio = None; }
                    if preview_until.is_some_and(|until| Instant::now() >= until) { preview_until = None; audio = None; }
                    let sound_key = state.preferences.sound.as_ref().map(|sound| sound.managed_name.clone()).unwrap_or_default();
                    if last_sound.as_ref() != Some(&sound_key) { audio = None; retry_at = Instant::now(); last_sound = Some(sound_key); }
                    if audio.as_ref().is_some_and(|audio| audio.failed()) {
                        audio = None; state.sound_error = Some("Audio output was interrupted. Reconnecting…".into()); retry_at = Instant::now() + Duration::from_secs(5);
                    }
                    if state.pending.is_empty() && preview_until.is_none() { audio = None; state.sound_error = None; }
                    else if audio.is_none() && Instant::now() >= retry_at {
                        match Audio::start(path.as_deref(), state.preferences.volume, !state.pending.is_empty()) {
                            Ok((playing, warning)) => { audio = Some(playing); state.sound_error = path_error.or(warning); },
                            Err(error) => { state.sound_error = Some(error); retry_at = Instant::now() + Duration::from_secs(15); },
                        }
                    }
                    if let Some(playing) = &audio { playing.volume(state.preferences.volume); }
                    if preview_until.is_some() && audio.as_ref().is_some_and(|audio| audio.empty()) { audio = None; preview_until = None; }
                    state.previewing = preview_until.is_some();
                    match present(&app, service, state.pending.len()) {
                        Err(error) => {
                            if presentation_error.as_ref() != Some(&error) { let _ = show_main(&app); }
                            presentation_error = Some(error.clone());
                            state.error = Some(error);
                        },
                        Ok(()) => presentation_error = None,
                    }
                },
                Err(error) => { audio = None; preview_until = None; state.previewing = false; state.error = Some(error); },
            }
            if let Ok(mut previous) = service.status.lock() {
                if *previous != state {
                    *previous = state.clone();
                    let _ = app.emit_to("main", "reminders-changed", &state);
                    let _ = app.emit_to("reminders", "reminders-changed", &state);
                }
            }
            match receiver.recv_timeout(Duration::from_secs(2)) {
                Ok(next) => command = Some(next),
                Err(mpsc::RecvTimeoutError::Timeout) => {},
                Err(mpsc::RecvTimeoutError::Disconnected) => break,
            }
        }
    });
}
