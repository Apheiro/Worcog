use crate::validation::Result;

#[derive(Default)]
pub(crate) struct DocumentShortcuts {
    #[cfg(target_os = "windows")]
    items: std::sync::Mutex<Option<(tauri::menu::MenuItem<tauri::Wry>, tauri::menu::MenuItem<tauri::Wry>)>>,
}

/// Native window accelerators also work when the remote editor iframe has focus.
#[tauri::command]
pub(crate) fn set_document_shortcuts(
    enabled: bool,
    webview: tauri::Webview,
    app: tauri::AppHandle,
    state: tauri::State<'_, DocumentShortcuts>,
) -> Result<bool> {
    if webview.label() != "main" {
        return Err("Document shortcuts are available only in the main window.".into());
    }
    #[cfg(target_os = "windows")]
    {
        use tauri::{Emitter, Manager, menu::{Menu, MenuItem}};
        let mut items = state.items.lock().map_err(|_| "Document shortcuts are unavailable.")?;
        if !enabled && items.is_none() {
            return Ok(true);
        }
        if items.is_none() {
            let window = app.get_webview_window("main").ok_or("Main window is unavailable.")?;
            let previous = MenuItem::with_id(&app, "previous-document", "Previous document", enabled, enabled.then_some("Ctrl+Left"))
                .map_err(|error| error.to_string())?;
            let next = MenuItem::with_id(&app, "next-document", "Next document", enabled, enabled.then_some("Ctrl+Right"))
                .map_err(|error| error.to_string())?;
            let menu = Menu::with_items(&app, &[&previous, &next]).map_err(|error| error.to_string())?;
            window.set_menu(menu).map_err(|error| error.to_string())?;
            window.hide_menu().map_err(|error| error.to_string())?;
            window.on_menu_event(|window, event| {
                let direction: i8 = match event.id.as_ref() {
                    "previous-document" => -1,
                    "next-document" => 1,
                    _ => return,
                };
                let _ = window.emit_to("main", "document-window-navigate", direction);
            });
            *items = Some((previous, next));
        }
        if let Some((previous, next)) = items.as_ref() {
            previous.set_accelerator(enabled.then_some("Ctrl+Left")).map_err(|error| error.to_string())?;
            next.set_accelerator(enabled.then_some("Ctrl+Right")).map_err(|error| error.to_string())?;
            previous.set_enabled(enabled).map_err(|error| error.to_string())?;
            next.set_enabled(enabled).map_err(|error| error.to_string())?;
        }
        Ok(true)
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = (enabled, app, state);
        Ok(false)
    }
}
