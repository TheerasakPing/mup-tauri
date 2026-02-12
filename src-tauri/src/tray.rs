// System tray implementation for Tauri
use tauri_plugin_tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};

/// Create and initialize the system tray
pub fn create_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Get the path to the tray icon
    // Use the 32x32 icon which is suitable for tray
    let icon_path = app.path().resolve("icons/32x32.png", tauri::path::BaseDirectory::Resource)?;
    
    // Build the tray icon with menu items
    let _tray = TrayIconBuilder::new()
        .icon(icon_path)
        .menu_on_left_click(true)
        .tooltip("MUP - Coder Multiplexer")
        .build(app)?;
    
    Ok(())
}

/// Handle tray icon events
pub fn on_tray_event(app: &AppHandle, event: TrayIconEvent) {
    match event {
        TrayIconEvent::Click {
            id: _,
            position: _,
            rect: _,
            button: _,
            button_state: _,
        } => {
            // Show the main window when tray is clicked
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        TrayIconEvent::DoubleClick {
            id: _,
            position: _,
            rect: _,
            button: _,
            button_state: _,
        } => {
            // Toggle window visibility on double-click
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        _ => {}
    }
}

