// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

