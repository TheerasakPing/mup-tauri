// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod deeplink;
mod orpc_bridge;
mod terminal;
mod tray;
mod updater;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Initialize the system tray (non-blocking - don't fail if tray fails)
            if let Err(e) = tray::create_tray(app.handle()) {
                eprintln!("Warning: Failed to create system tray: {}", e);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // System info commands
            commands::get_system_info,
            // Window management commands
            commands::minimize_window,
            commands::toggle_maximize_window,
            commands::close_window,
            commands::focus_window,
            commands::hide_window,
            commands::show_window,
            commands::get_window_state,
            // IPC bridge commands
            commands::start_orpc_server,
            // Terminal commands
            terminal::create_terminal,
            terminal::terminal_write,
            terminal::terminal_read,
            terminal::terminal_resize,
            terminal::terminal_close,
            // oRPC bridge commands
            orpc_bridge::forward_orpc_call,
            orpc_bridge::check_orpc_server,
            // Updater commands
            updater::check_for_updates,
            updater::install_update,
            updater::get_app_version,
            // Deep link commands
            deeplink::handle_deep_link,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

