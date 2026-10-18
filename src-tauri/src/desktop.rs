use crate::{archive, storage, validation};
use serde_json::{json, Value};
use std::{
    fs,
    sync::{Arc, Mutex},
};
use tauri::{Manager, State};
use tauri_plugin_opener::OpenerExt;
use validation::{string, Result};
struct AppState {
    store: storage::StoreAccess,
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
    workspace: Value,
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
        store.save_with_cleanup(workspace, cleared, purge_backups.unwrap_or(false))
    })?;
    if let Some(ref mut pending) = staged {
        **pending = None;
    }
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
async fn attach_file(state: State<'_, AppState>) -> Result<Option<Value>> {
    let Some(selected) = rfd::AsyncFileDialog::new()
        .set_title("Attach a document (100 MiB maximum)")
        .pick_file()
        .await
    else {
        return Ok(None);
    };
    let path = selected.path();
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
        let path = store
            .root
            .join("attachments")
            .join(string(a, "managedName")?);
        storage::safe_document(&path)?;
        app.opener()
            .open_path(path.to_string_lossy(), None::<&str>)
            .map_err(|e| e.to_string())
    })
}
#[tauri::command]
fn open_reference(url: String, app: tauri::AppHandle) -> Result<()> {
    validation::validate_url(&url)?;
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| e.to_string())
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
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let root = app.path().app_data_dir()?;
            let cache = app.path().app_cache_dir()?;
            // Cache is regenerable; a failure must not prevent access to primary data.
            let _ = fs::create_dir_all(&cache);
            app.manage(AppState {
                store: storage::StoreAccess::new(root),
                staged: Mutex::new(None),
                updates: Arc::new(crate::updates::Updates::new(
                    cache.clone(),
                    app.package_info().version.to_string(),
                )),
                cache,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
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
            open_attachment,
            open_reference,
            create_backup,
            export_workspace,
            inspect_import,
            restore_import
        ])
        .run(tauri::generate_context!())
        .expect("Unable to start Worklog");
}
