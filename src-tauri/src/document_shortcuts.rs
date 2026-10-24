use crate::validation::Result;

#[derive(Default)]
pub(crate) struct DocumentShortcuts {
    #[cfg(any(target_os = "windows", target_os = "macos"))]
    items: std::sync::Mutex<Option<(tauri::menu::MenuItem<tauri::Wry>, tauri::menu::MenuItem<tauri::Wry>)>>,
}

/// Native window accelerators also work when the remote editor iframe has focus.
#[tauri::command]
pub(crate) fn set_document_shortcuts(
    enabled: bool,
    previous: Option<String>,
    next: Option<String>,
    webview: tauri::Webview,
    app: tauri::AppHandle,
    state: tauri::State<'_, DocumentShortcuts>,
) -> Result<bool> {
    if webview.label() != "main" {
        return Err("Document shortcuts are available only in the main window.".into());
    }
    #[cfg(any(target_os = "windows", target_os = "macos"))]
    {
        use tauri::{Emitter, Manager, menu::{Menu, MenuItem}};
        fn accelerator(value: Option<String>) -> Result<Option<String>> {
            value.filter(|value| !value.is_empty()).map(|value| {
                if value.len() > 80 || !value.chars().all(|c| c.is_ascii_alphanumeric() || c == '+') {
                    return Err("Invalid document shortcut.".into());
                }
                Ok(value.replace("Arrow", "").replace("Meta", "Super"))
            }).transpose()
        }
        let previous_key = accelerator(previous)?;
        let next_key = accelerator(next)?;
        if previous_key.is_some() && previous_key == next_key {
            return Err("Document shortcuts must be different.".into());
        }
        let mut items = state.items.lock().map_err(|_| "Document shortcuts are unavailable.")?;
        if !enabled && items.is_none() {
            return Ok(true);
        }
        if items.is_none() {
            let window = app.get_webview_window("main").ok_or("Main window is unavailable.")?;
            let previous = MenuItem::with_id(&app, "previous-document", "Previous document", false, None::<&str>)
                .map_err(|error| error.to_string())?;
            let next = MenuItem::with_id(&app, "next-document", "Next document", false, None::<&str>)
                .map_err(|error| error.to_string())?;
            #[cfg(target_os = "windows")]
            {
                let menu = Menu::with_items(&app, &[&previous, &next]).map_err(|error| error.to_string())?;
                window.set_menu(menu).map_err(|error| error.to_string())?;
                window.hide_menu().map_err(|error| error.to_string())?;
            }
            #[cfg(target_os = "macos")]
            {
                use tauri::menu::Submenu;
                let menu = match app.menu() {
                    Some(menu) => menu,
                    None => Menu::default(&app).map_err(|error| error.to_string())?,
                };
                let documents = Submenu::with_items(&app, "Documents", true, &[&previous, &next])
                    .map_err(|error| error.to_string())?;
                menu.append(&documents).map_err(|error| error.to_string())?;
                app.set_menu(menu).map_err(|error| error.to_string())?;
            }
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
            previous.set_accelerator(None::<&str>).map_err(|error| error.to_string())?;
            next.set_accelerator(None::<&str>).map_err(|error| error.to_string())?;
            previous.set_accelerator(previous_key.as_deref().filter(|_| enabled)).map_err(|error| error.to_string())?;
            next.set_accelerator(next_key.as_deref().filter(|_| enabled)).map_err(|error| error.to_string())?;
            previous.set_enabled(enabled && previous_key.is_some()).map_err(|error| error.to_string())?;
            next.set_enabled(enabled && next_key.is_some()).map_err(|error| error.to_string())?;
        }
        Ok(true)
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        let _ = (enabled, previous, next, app, state);
        Ok(false)
    }
}
