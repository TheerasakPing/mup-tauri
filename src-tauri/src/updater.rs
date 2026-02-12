// Tauri updater module for application updates
// Replaces electron-updater with Tauri's updater plugin

use tauri::{AppHandle, Emitter};
use tauri_plugin_updater::UpdaterExt;

/// Update status types (mirroring Electron's UpdateStatus)
#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(tag = "type")]
pub enum UpdateStatus {
    #[serde(rename = "idle")]
    Idle,
    #[serde(rename = "checking")]
    Checking,
    #[serde(rename = "available")]
    Available { 
        version: String,
        body: Option<String>,
        date: Option<String>,
    },
    #[serde(rename = "up-to-date")]
    UpToDate,
    #[serde(rename = "downloading")]
    Downloading { 
        progress: u64, 
        total: u64 
    },
    #[serde(rename = "downloaded")]
    Downloaded {
        version: String,
        body: Option<String>,
        date: Option<String>,
    },
    #[serde(rename = "error")]
    Error { 
        message: String 
    },
}

/// Check for available updates
/// 
/// This command checks if a new version is available and emits
/// update status events to the frontend.
#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<UpdateStatus, String> {
    // Emit checking status
    let status = UpdateStatus::Checking;
    app.emit("update-status", &status)
        .map_err(|e| format!("Failed to emit status: {}", e))?;

    // Check for updates
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    // Update available
                    let date_str = update.date.as_ref().map(|d| d.to_string());
                    let status = UpdateStatus::Available {
                        version: update.version.clone(),
                        body: update.body.clone(),
                        date: date_str,
                    };
                    
                    app.emit("update-status", &status)
                        .map_err(|e| format!("Failed to emit status: {}", e))?;
                    
                    Ok(status)
                }
                Ok(None) => {
                    // No update available
                    let status = UpdateStatus::UpToDate;
                    
                    app.emit("update-status", &status)
                        .map_err(|e| format!("Failed to emit status: {}", e))?;
                    
                    Ok(status)
                }
                Err(e) => {
                    // Error checking for updates
                    let status = UpdateStatus::Error {
                        message: e.to_string(),
                    };
                    
                    app.emit("update-status", &status)
                        .map_err(|e| format!("Failed to emit status: {}", e))?;
                    
                    Ok(status)
                }
            }
        }
        Err(e) => {
            let status = UpdateStatus::Error {
                message: format!("Updater not available: {}", e),
            };
            
            app.emit("update-status", &status)
                .map_err(|e| format!("Failed to emit status: {}", e))?;
            
            Ok(status)
        }
    }
}

/// Download and install available update
/// 
/// This command initiates the update download and installation.
/// When dialog is enabled in tauri.conf.json, Tauri's updater plugin
/// will show a built-in dialog to the user.
#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<String, String> {
    match app.updater() {
        Ok(updater) => {
            // The updater with dialog: true handles download and install automatically
            // We just need to trigger the check which will show the dialog if an update is available
            match updater.check().await {
                Ok(Some(update)) => {
                    // Update is available
                    // Note: With dialog enabled, Tauri handles the UI
                    // We'll emit status for the frontend to know
                    let date_str = update.date.as_ref().map(|d| d.to_string());
                    let status = UpdateStatus::Available {
                        version: update.version.clone(),
                        body: update.body.clone(),
                        date: date_str,
                    };
                    
                    app.emit("update-status", &status)
                        .map_err(|e| format!("Failed to emit status: {}", e))?;
                    
                    Ok("Update available. See dialog for installation.".to_string())
                }
                Ok(None) => {
                    Err("No update available to install".to_string())
                }
                Err(e) => {
                    let status = UpdateStatus::Error {
                        message: format!("Failed to check for updates: {}", e),
                    };
                    
                    app.emit("update-status", &status)
                        .map_err(|e| format!("Failed to emit status: {}", e))?;
                    
                    Err(format!("Failed to check for updates: {}", e))
                }
            }
        }
        Err(e) => {
            let status = UpdateStatus::Error {
                message: format!("Updater not available: {}", e),
            };
            
            app.emit("update-status", &status)
                .map_err(|e| format!("Failed to emit status: {}", e))?;
            
            Err(format!("Updater not available: {}", e))
        }
    }
}

/// Get current app version
#[tauri::command]
pub async fn get_app_version(app: AppHandle) -> Result<String, String> {
    Ok(app.package_info().version.to_string())
}

