// System tray implementation using tray-icon
use tray_icon::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem},
    TrayIconBuilder, Icon,
};
use tauri::{AppHandle, Emitter, Manager};

/// Create and initialize the system tray
pub fn create_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Get the path to the tray icon - use fallback for dev mode
    let icon_path = app.path().resolve("icons/32x32.png", tauri::path::BaseDirectory::Resource);
    
    // Load the icon - use embedded icon as fallback
    let icon = if let Ok(path) = icon_path {
        Icon::from_path(path, None)?
    } else {
        // Fallback: create a simple icon or skip tray creation in dev
        return Ok(()); // Skip tray if icon not found (dev mode)
    };
    
    // Create menu items
    let new_chat_item = MenuItem::new("New Chat", true, None);
    let settings_item = MenuItem::new("Settings", true, None);
    let separator = PredefinedMenuItem::separator();
    let quit_item = MenuItem::new("Quit", true, None);
    
    // Create the menu
    let menu = Menu::with_items(&[
        &new_chat_item,
        &settings_item,
        &separator,
        &quit_item,
    ])?;
    
    // Build the tray icon with menu
    let _tray = TrayIconBuilder::new()
        .with_tooltip("MUP - Coder Multiplexer")
        .with_icon(icon)
        .with_menu(Box::new(menu))
        .build()?;
    
    // Listen for menu events in a separate thread
    let app_clone = app.clone();
    std::thread::spawn(move || {
        let menu_channel = MenuEvent::receiver();
        while let Ok(event) = menu_channel.recv() {
            handle_menu_event(&app_clone, event);
        }
    });
    
    Ok(())
}

/// Handle menu item events
fn handle_menu_event(app: &AppHandle, event: MenuEvent) {
    match event.id.as_ref() {
        id if id.contains("New Chat") => {
            // Emit an event to the frontend to create a new chat
            let _ = app.emit("tray-new-chat", ());
            
            // Show and focus the main window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        id if id.contains("Settings") => {
            // Emit an event to the frontend to open settings
            let _ = app.emit("tray-open-settings", ());
            
            // Show and focus the main window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        id if id.contains("Quit") => {
            // Exit the application
            app.exit(0);
        }
        _ => {}
    }
}

