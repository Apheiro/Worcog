use crate::{archive, storage, validation};
use serde_json::{json, Value};
use std::{
    fs,
    sync::{Arc, Mutex},
};
use tauri::{Manager, State};
use tauri_plugin_opener::OpenerExt;
use validation::{string, Result};
pub(crate) struct AppState {
    pub(crate) store: storage::StoreAccess,
    pub(crate) reminders: Arc<crate::reminders::Service>,
    staged: Mutex<Option<archive::StagedImport>>,
    cache: std::path::PathBuf,
    updates: Arc<crate::updates::Updates>,
}
fn lock<T>(m: &Mutex<T>) -> Result<std::sync::MutexGuard<'_, T>> {
    m.lock()
        .map_err(|_| "Storage is unavailable. Restart the application.".into())
}
#[tauri::command]
async fn load_workspace(
    state: State<'_, AppState>,
) -> Result<crate::file_cleanup::WorkspaceResult> {
    state.store.with(|store| store.load_with_cleanup())
}
#[tauri::command]
async fn save_workspace(
    mut workspace: Value,
    purge_workspace_files: Option<bool>,
    purge_backups: Option<bool>,
    state: State<'_, AppState>,
) -> Result<crate::file_cleanup::WorkspaceResult> {
    let cleared = purge_workspace_files.unwrap_or(false);
    // Match restore's lock order and acquire before any database commit.
    let mut staged = if cleared {
        Some(lock(&state.staged)?)
    } else {
        None
    };
    let result = state.store.with(|store| {
        crate::reminders::validate_schedule(store, &mut workspace)?;
        store.save_with_cleanup(workspace, cleared, purge_backups.unwrap_or(false))
    })?;
    if let Some(ref mut pending) = staged {
        **pending = None;
    }
    state.reminders.wake();
    Ok(result)
}
#[tauri::command]
async fn cleanup_deleted_files(state: State<'_, AppState>) -> Result<Option<String>> {
    state.store.with(|store| store.cleanup_deleted_files())
}
#[tauri::command]
async fn storage_info(state: State<'_, AppState>) -> Result<Value> {
    state.store.with(|store| Ok(
        json!({"data":store.root,"attachments":store.root.join("attachments"),"backups":store.root.join("backups"),"cache":state.cache}),
    ))
}
#[tauri::command]
async fn attach_file(path: Option<String>, state: State<'_, AppState>) -> Result<Option<Value>> {
    let selected_path = if let Some(path) = path {
        std::path::PathBuf::from(path)
    } else {
        let Some(selected) = rfd::AsyncFileDialog::new()
            .set_title("Attach a document (100 MiB maximum)")
            .pick_file()
            .await
        else {
            return Ok(None);
        };
        selected.path().to_path_buf()
    };
    let path = selected_path.as_path();
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    if !metadata.is_file() || metadata.len() > 100 * 1024 * 1024 {
        return Err("Choose a regular file up to 100 MiB".into());
    }
    storage::safe_document(path)?;
    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .ok_or("Missing extension")?
        .to_ascii_lowercase();
    let id = uuid::Uuid::new_v4().to_string();
    let managed = format!("{id}.{ext}");
    state.store.with(|store| {
    let target = store.root.join("attachments").join(&managed);
    let copied = (|| {
        fs::copy(path, &target).map_err(|e| e.to_string())?;
        storage::safe_document(&target)?;
        let size = fs::metadata(&target).map_err(|e| e.to_string())?.len();
        if size > 100 * 1024 * 1024 { return Err("File changed during copy".into()); }
        Ok(size)
    })();
    let size=match copied { Ok(size)=>size, Err(error)=> { let _=fs::remove_file(&target); return Err(error); } };
    Ok(Some(
        json!({"id":id,"originalName":path.file_name().and_then(|s|s.to_str()).unwrap_or("document"),"managedName":managed,"mime":mime_guess::from_path(path).first_or_octet_stream().to_string(),"size":size,"addedAt":chrono::Utc::now().to_rfc3339(),"topicIds":[],"taskIds":[],"activityIds":[],"sourceIds":[]}),
    ))
    })
}
#[tauri::command]
async fn discard_draft_attachment(managed_name: String, state: State<'_, AppState>) -> Result<()> {
    validation::managed_name(&managed_name)?;
    state.store.with(|store| {
        let w = store.load()?;
        if validation::list(&w, "attachments")?
            .iter()
            .any(|a| a["managedName"].as_str() == Some(managed_name.as_str()))
        {
            return Err("Cannot discard a saved attachment".into());
        }
        let path = store.root.join("attachments").join(&managed_name);
        match fs::remove_file(path) {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(e) => Err(e.to_string()),
        }
    })
}
#[tauri::command]
async fn open_attachment(
    id: String,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<()> {
    state.store.with(|store| {
        let w = store.load()?;
        let a = validation::list(&w, "attachments")?
            .iter()
            .find(|a| a["id"].as_str() == Some(&id))
            .ok_or("Attachment not found")?;
        let path = crate::attachment_access::require(store, a)?;
        storage::safe_document(&path)?;
        app.opener()
            .open_path(path.to_string_lossy(), None::<&str>)
            .map_err(|e| e.to_string())
    })
}
#[tauri::command]
async fn export_attachments(
    ids: Vec<String>,
    app: tauri::AppHandle,
    webview: tauri::Webview,
    state: State<'_, AppState>,
) -> Result<Option<String>> {
    if webview.label() != "main" { return Err("Only the workspace can export attachments.".into()); }
    let name = state.store.with(|store| crate::attachment_export::suggested_name(store, &ids))?;
    let extension = std::path::Path::new(&name).extension().and_then(|value| value.to_str()).ok_or("Missing file extension")?;
    let Some(file) = rfd::AsyncFileDialog::new()
        .set_title(if ids.len() == 1 { "Export file copy" } else { "Export selected files as ZIP" })
        .set_file_name(&name)
        .add_filter("Exported file", &[extension])
        .save_file()
        .await
    else { return Ok(None); };
    let destination = file.path().to_path_buf();
    let path = destination.to_string_lossy().into_owned();
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        state.store.with(|store| crate::attachment_export::export(store, &ids, &destination))
    }).await.map_err(|_| "File export worker failed.".to_string())??;
    Ok(Some(path))
}
#[tauri::command]
fn open_reference(url: String, app: tauri::AppHandle) -> Result<()> {
    validation::validate_url(&url)?;
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| e.to_string())
}
#[tauri::command]
fn read_document(id: String, webview: tauri::Webview, state: State<'_, AppState>) -> Result<tauri::ipc::Response> {
    if webview.label() != "main" { return Err("Only the workspace can read documents.".into()); }
    state.store.with(|store| crate::document_files::read(store, &id).map(tauri::ipc::Response::new))
}

#[tauri::command]
fn attachment_statuses(id: Option<String>, state: State<'_, AppState>) -> Result<std::collections::HashMap<String, crate::attachment_access::AttachmentStatus>> {
    state.store.with(|store| crate::attachment_access::statuses(store, id.as_deref()))
}

#[tauri::command]
fn save_document(request: tauri::ipc::Request<'_>, webview: tauri::Webview, state: State<'_, AppState>) -> Result<crate::file_cleanup::WorkspaceResult> {
    if webview.label() != "main" { return Err("Only the workspace can save documents.".into()); }
    let id = request.headers().get("x-document-id").and_then(|value| value.to_str().ok()).ok_or("Missing document ID")?;
    let hash = request.headers().get("x-document-version").and_then(|value| value.to_str().ok()).ok_or("Missing document version")?;
    let tauri::ipc::InvokeBody::Raw(bytes) = request.body() else { return Err("Expected document bytes".into()); };
    state.store.with(|store| crate::document_files::save(store, id, hash, bytes))
}
#[tauri::command]
async fn create_backup(state: State<'_, AppState>) -> Result<String> {
    state
        .store
        .with(|store| Ok(archive::backup(store)?.to_string_lossy().into()))
}
#[tauri::command]
async fn export_workspace(state: State<'_, AppState>) -> Result<Option<String>> {
    let Some(file) = rfd::AsyncFileDialog::new()
        .set_title("Export complete workspace to a new ZIP file")
        .set_file_name(format!(
            "worklog-{}.zip",
            chrono::Utc::now().format("%Y%m%dT%H%M%SZ")
        ))
        .add_filter("Worklog export", &["zip"])
        .save_file()
        .await
    else {
        return Ok(None);
    };
    state
        .store
        .with(|store| archive::export(store, file.path()))?;
    Ok(Some(file.path().to_string_lossy().into()))
}
#[tauri::command]
async fn inspect_import(state: State<'_, AppState>) -> Result<Option<Value>> {
    let Some(file) = rfd::AsyncFileDialog::new()
        .set_title("Inspect workspace ZIP before restore")
        .add_filter("Worklog export", &["zip"])
        .pick_file()
        .await
    else {
        return Ok(None);
    };
    let staged = state
        .store
        .with(|store| archive::inspect(file.path(), &store.root))?;
    let summary=format!("Replace current workspace with {} topics, {} tasks, {} activities, {} sources and {} attachments. A complete backup of the current workspace will be kept before replacement.",validation::list(&staged.workspace,"topics")?.len(),validation::list(&staged.workspace,"tasks")?.len(),validation::list(&staged.workspace,"activities")?.len(),validation::list(&staged.workspace,"sources")?.len(),validation::list(&staged.workspace,"attachments")?.len());
    let result = json!({"token":staged.token,"summary":summary});
    *lock(&state.staged)? = Some(staged);
    Ok(Some(result))
}
#[tauri::command]
async fn restore_import(token: String, state: State<'_, AppState>) -> Result<Value> {
    let mut pending = lock(&state.staged)?;
    if pending.as_ref().map(|s| s.token.as_str()) != Some(token.as_str()) {
        return Err("Import expired. Inspect the archive again.".into());
    }
    let staged = pending.take().ok_or("Missing import")?;
    state.store.with(|store| archive::restore(store, staged))
}

#[tauri::command]
async fn update_status(state: State<'_, AppState>) -> Result<crate::updates::Status> {
    let updates = state.updates.clone();
    tauri::async_runtime::spawn_blocking(move || updates.status())
        .await
        .map_err(|_| "Update worker failed.")?
}
#[tauri::command]
async fn set_update_token(
    token: Option<String>,
    state: State<'_, AppState>,
) -> Result<crate::updates::Status> {
    let updates = state.updates.clone();
    tauri::async_runtime::spawn_blocking(move || updates.set_token(token))
        .await
        .map_err(|_| "Credential worker failed.")?
}
#[tauri::command]
async fn check_updates(
    development_token: Option<String>,
    state: State<'_, AppState>,
) -> Result<Option<crate::updates::metadata::Available>> {
    let updates = state.updates.clone();
    tauri::async_runtime::spawn_blocking(move || updates.check(development_token))
        .await
        .map_err(|_| "Update worker failed.")?
}
#[tauri::command]
async fn download_update(
    development_token: Option<String>,
    state: State<'_, AppState>,
) -> Result<crate::updates::Receipt> {
    let updates = state.updates.clone();
    tauri::async_runtime::spawn_blocking(move || updates.download(development_token))
        .await
        .map_err(|_| "Download worker failed.")?
}
#[tauri::command]
fn open_update_folder(app: tauri::AppHandle, state: State<'_, AppState>) -> Result<()> {
    let folder = state.updates.folder()?;
    app.opener()
        .open_path(folder.to_string_lossy(), None::<&str>)
        .map_err(|_| "Could not open the download folder.".into())
}
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| { let _ = crate::reminders::show_main(app); }))
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let root = app.path().app_data_dir()?;
            let cache = app.path().app_cache_dir()?;
            // Cache is regenerable; a failure must not prevent access to primary data.
            let _ = fs::create_dir_all(&cache);
            let (reminders, receiver) = crate::reminders::Service::new();
            app.manage(crate::document_shortcuts::DocumentShortcuts::default());
            app.manage(AppState {
                reminders: Arc::new(reminders),
                store: storage::StoreAccess::new(root),
                staged: Mutex::new(None),
                updates: Arc::new(crate::updates::Updates::new(
                    cache.clone(),
                    app.package_info().version.to_string(),
                )),
                cache,
            });
            crate::reminders::start(app.handle().clone(), receiver);
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" && matches!(event, tauri::WindowEvent::Resized(_))
                && window.app_handle().tray_by_id("worklog").is_some()
                && window.is_minimized().unwrap_or(false) {
                let _ = window.hide();
            }
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                if window.label() == "main" {
                    if window.app_handle().tray_by_id("worklog").is_some() { let _ = window.hide(); }
                    else { crate::reminders::request_exit(window.app_handle()); }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            crate::document_shortcuts::set_document_shortcuts,
            crate::reminder_commands::reminder_status,
            crate::reminder_commands::set_reminder_preferences,
            crate::reminder_commands::choose_reminder_sound,
            crate::reminder_commands::reset_reminder_sound,
            crate::reminder_commands::preview_reminder_sound,
            crate::reminder_commands::reminder_window_ready,
            crate::reminder_commands::set_exit_guard,
            crate::reminder_commands::dismiss_reminder,
            crate::reminder_commands::open_reminder_task,
            crate::reminder_commands::minimize_workspace,
            attachment_statuses,
            read_document,
            save_document,
            update_status,
            set_update_token,
            check_updates,
            download_update,
            open_update_folder,
            load_workspace,
            save_workspace,
            cleanup_deleted_files,
            storage_info,
            attach_file,
            discard_draft_attachment,
            open_attachment,
            export_attachments,
            open_reference,
            create_backup,
            export_workspace,
            inspect_import,
            restore_import
        ])
        .run(tauri::generate_context!())
        .expect("Unable to start Worklog");
}
