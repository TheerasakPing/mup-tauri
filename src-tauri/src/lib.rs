// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod deeplink;
mod orpc_bridge;
mod sidecar;
mod terminal;
mod tray;
mod updater;

use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logger
    env_logger::init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Initialize the system tray (non-blocking - don't fail if tray fails)
            if let Err(e) = tray::create_tray(app.handle()) {
                eprintln!("Warning: Failed to create system tray: {}", e);
            }
            
            // Spawn the backend sidecar process
            if let Err(e) = sidecar::spawn_sidecar(app.handle()) {
                eprintln!("Failed to spawn backend sidecar: {}", e);
                // Don't fail startup - frontend can handle missing backend gracefully
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
            // Sidecar commands
            sidecar::get_backend_port,
            sidecar::check_backend_health,
            // Updater commands
            updater::check_for_updates,
            updater::install_update,
            updater::get_app_version,
            // Deep link commands
            deeplink::handle_deep_link,
        ])
        .on_window_event(|window, event| {
            // Handle window close - terminate sidecar
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Signal sidecar termination (async, non-blocking)
                let _ = window.app_handle().emit("app-closing", ());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

