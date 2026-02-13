// Sidecar Process Management Module
//
// This module manages the Node.js backend sidecar process lifecycle:
// - Spawning the sidecar on app startup
// - Tracking the dynamically assigned port
// - Graceful shutdown on app quit
// - Event emission for backend readiness

use std::sync::atomic::{AtomicU16, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;
use tokio::sync::Mutex;

/// Global sidecar state
static SIDECAR_PORT: AtomicU16 = AtomicU16::new(0);

/// Sidecar process handle
static SIDECAR_PROCESS: std::sync::OnceLock<Arc<Mutex<Option<tauri_plugin_shell::process::CommandChild>>>> = 
    std::sync::OnceLock::new();

/// Get the sidecar port (0 if not started yet)
pub fn get_sidecar_port() -> u16 {
    SIDECAR_PORT.load(Ordering::SeqCst)
}

/// Set the sidecar port
pub fn set_sidecar_port(port: u16) {
    SIDECAR_PORT.store(port, Ordering::SeqCst);
}

/// Sidecar management commands
#[tauri::command]
pub async fn get_backend_port() -> Result<u16, String> {
    let port = get_sidecar_port();
    if port == 0 {
        Err("Backend not started".to_string())
    } else {
        Ok(port)
    }
}

/// Check if backend is healthy
#[tauri::command]
pub async fn check_backend_health() -> Result<bool, String> {
    let port = get_sidecar_port();
    if port == 0 {
        return Ok(false);
    }

    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}/health", port);
    
    match client.get(&url).timeout(std::time::Duration::from_secs(2)).send().await {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(_) => Ok(false),
    }
}

/// Parse port from sidecar stdout
/// The backend emits "MUX_SERVER_PORT:<port>" on startup
fn parse_port_from_line(line: &str) -> Option<u16> {
    if let Some(port_str) = line.strip_prefix("MUX_SERVER_PORT:") {
        port_str.trim().parse().ok()
    } else {
        None
    }
}

/// Spawn the sidecar process
pub fn spawn_sidecar(app: &AppHandle) -> Result<(), String> {
    log::info!("Starting mup-server sidecar...");
    
    // Get the sidecar command
    let sidecar = app
        .shell()
        .sidecar("mup-server")
        .map_err(|e| format!("Failed to create sidecar command: {}", e))?;
    
    // Spawn the process
    let (mut rx, child) = sidecar
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;
    
    // Store the process handle
    let process_handle = SIDECAR_PROCESS.get_or_init(|| Arc::new(Mutex::new(None)));
    {
        let mut guard = process_handle.blocking_lock();
        *guard = Some(child);
    }
    
    let app_handle = app.clone();
    
    // Handle sidecar output in background
    tauri::async_runtime::spawn(async move {
        use tauri_plugin_shell::process::CommandEvent;
        
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let line_str = String::from_utf8_lossy(&line);
                    log::debug!("[sidecar stdout] {}", line_str.trim());
                    
                    // Check for port announcement
                    if let Some(port) = parse_port_from_line(&line_str) {
                        log::info!("Sidecar announced port: {}", port);
                        set_sidecar_port(port);
                        
                        // Emit backend ready event
                        if let Err(e) = app_handle.emit("backend-ready", port) {
                            log::error!("Failed to emit backend-ready event: {}", e);
                        }
                    }
                }
                CommandEvent::Stderr(line) => {
                    log::warn!("[sidecar stderr] {}", String::from_utf8_lossy(&line).trim());
                }
                CommandEvent::Error(err) => {
                    log::error!("[sidecar error] {}", err);
                }
                CommandEvent::Terminated(payload) => {
                    log::info!("[sidecar] Process terminated with code: {:?}", payload.code);
                    
                    // Clear process handle
                    let process_handle = SIDECAR_PROCESS.get_or_init(|| Arc::new(Mutex::new(None)));
                    let mut guard = process_handle.lock().await;
                    *guard = None;
                    
                    // Clear port
                    set_sidecar_port(0);
                    
                    // Emit termination event
                    if let Err(e) = app_handle.emit("backend-terminated", payload.code) {
                        log::error!("Failed to emit backend-terminated event: {}", e);
                    }
                    break;
                }
                _ => {}
            }
        }
    });
    
    Ok(())
}

/// Terminate the sidecar process
pub async fn terminate_sidecar() -> Result<(), String> {
    log::info!("Terminating mup-server sidecar...");
    
    let process_handle = SIDECAR_PROCESS.get_or_init(|| Arc::new(Mutex::new(None)));
    let mut guard = process_handle.lock().await;
    
    if let Some(child) = guard.take() {
        child
            .kill()
            .map_err(|e| format!("Failed to kill sidecar: {}", e))?;
        log::info!("Sidecar process killed");
    }
    
    set_sidecar_port(0);
    Ok(())
}
