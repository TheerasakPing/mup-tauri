// Tauri command handlers for IPC communication

use std::process::Command;
use tauri::{Emitter, Window};

// System info structure
#[derive(serde::Serialize)]
pub struct SystemInfo {
    platform: String,
    arch: String,
    is_rosetta: bool,
    is_windows_wsl_shell: bool,
}

/// Get platform information
#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, String> {
    let platform = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();
    
    // Check if running under Rosetta (macOS)
    let is_rosetta = if platform == "macos" {
        check_is_rosetta()
    } else {
        false
    };
    
    // Check if using WSL on Windows
    let is_windows_wsl_shell = if platform == "windows" {
        check_is_windows_wsl_shell()
    } else {
        false
    };
    
    Ok(SystemInfo {
        platform,
        arch,
        is_rosetta,
        is_windows_wsl_shell,
    })
}

/// Check if running under Rosetta on macOS
fn check_is_rosetta() -> bool {
    match Command::new("sysctl")
        .args(["-n", "sysctl.proc_translated"])
        .output()
    {
        Ok(output) => {
            let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
            result == "1"
        }
        Err(_) => false,
    }
}

/// Check if using WSL on Windows
fn check_is_windows_wsl_shell() -> bool {
    // Check SHELL environment variable
    if let Ok(env_shell) = std::env::var("SHELL") {
        let shell_lower = env_shell.to_lowercase();
        if shell_lower.contains("wsl") || shell_lower.contains("bash.exe") {
            return true;
        }
    }
    
    // Try using 'where bash' command
    if let Ok(output) = Command::new("where")
        .args(["bash"])
        .output()
    {
        let result = String::from_utf8_lossy(&output.stdout);
        let first_path = result
            .lines()
            .map(|l| l.trim())
            .find(|l| !l.is_empty());

        if let Some(path) = first_path {
            let path_lower = path.to_lowercase();
            return path_lower.contains("wsl")
                || path_lower.contains("\\windows\\system32\\bash.exe");
        }
    }
    
    false
}

/// Window management commands
/// Minimize window
#[tauri::command]
pub fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

/// Maximize or restore window
#[tauri::command]
pub fn toggle_maximize_window(window: Window) -> Result<bool, String> {
    let is_maximized = window.is_maximized().map_err(|e| e.to_string())?;
    
    if is_maximized {
        window.unmaximize().map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        window.maximize().map_err(|e| e.to_string())?;
        Ok(true)
    }
}

/// Close window
#[tauri::command]
pub fn close_window(window: Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

/// Focus window
#[tauri::command]
pub fn focus_window(window: Window) -> Result<(), String> {
    window.set_focus().map_err(|e| e.to_string())
}

/// Hide window
#[tauri::command]
pub fn hide_window(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

/// Show window
#[tauri::command]
pub fn show_window(window: Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())
}

/// Get window state
#[derive(serde::Serialize)]
pub struct WindowState {
    is_maximized: bool,
    is_minimized: bool,
    is_visible: bool,
    is_focused: bool,
}

#[tauri::command]
pub fn get_window_state(window: Window) -> Result<WindowState, String> {
    Ok(WindowState {
        is_maximized: window.is_maximized().map_err(|e| e.to_string())?,
        is_minimized: window.is_minimized().map_err(|e| e.to_string())?,
        is_visible: window.is_visible().map_err(|e| e.to_string())?,
        is_focused: window.is_focused().map_err(|e| e.to_string())?,
    })
}

/// Simple IPC bridge for oRPC (placeholder for future implementation)
#[tauri::command]
pub async fn start_orpc_server(window: Window) -> Result<(), String> {
    // Placeholder for future oRPC implementation
    // For now, just emit an event to notify the frontend
    window.emit("orpc-server-started", ()).map_err(|e| e.to_string())?;
    Ok(())
}
