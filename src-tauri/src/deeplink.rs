// Deep link handler for mux:// protocol

use std::path::Path;
use tauri::{Emitter, Window};

/// Represents a parsed deep link payload
#[derive(Debug, Clone, serde::Serialize)]
pub struct DeepLinkPayload {
    #[serde(rename = "type")]
    pub payload_type: String,
    pub project: Option<String>,
    pub project_path: Option<String>,
    pub project_id: Option<String>,
    pub prompt: Option<String>,
    pub section_id: Option<String>,
}

/// Parse a mux:// deep link URL into a structured payload
///
/// Currently supported routes:
/// - mux://chat/new?project=...&prompt=...
pub fn parse_deep_link(url_str: &str) -> Result<DeepLinkPayload, String> {
    let url = url::Url::parse(url_str)
        .map_err(|e| format!("Invalid URL: {}", e))?;

    // Verify protocol
    if url.scheme() != "mux" {
        return Err("Protocol must be 'mux'".to_string());
    }

    // Normalize pathname (remove trailing slashes)
    let normalized_path = url.path().trim_end_matches('/');

    // Parse route: mux://chat/new
    if normalized_path != "/chat/new" {
        return Err(format!("Unsupported path: {}", normalized_path));
    }

    // Extract query parameters
    let project = get_query_param(&url, "project");
    let project_path = get_query_param(&url, "projectPath");
    let project_id = get_query_param(&url, "projectId");
    let prompt = get_query_param(&url, "prompt");
    let section_id = get_query_param(&url, "sectionId");

    Ok(DeepLinkPayload {
        payload_type: "new_chat".to_string(),
        project,
        project_path,
        project_id,
        prompt,
        section_id,
    })
}

/// Get a non-empty query parameter from URL
fn get_query_param(url: &url::Url, key: &str) -> Option<String> {
    url.query_pairs()
        .find(|(k, _)| k == key)
        .map(|(_, v)| v.to_string())
        .filter(|v| !v.is_empty())
}

/// Validate that a project path exists on the filesystem
pub fn validate_project_path(path: &str) -> Result<(), String> {
    let path_obj = Path::new(path);
    
    if !path_obj.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    
    if !path_obj.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }
    
    Ok(())
}

/// Handle a deep link URL from the frontend
///
/// This command:
/// 1. Parses the mux:// URL
/// 2. Validates the project path (if provided)
/// 3. Emits a deep-link event to the frontend
#[tauri::command]
pub async fn handle_deep_link(window: Window, url: String) -> Result<(), String> {
    // Parse the URL
    let payload = parse_deep_link(&url)?;
    
    // Validate project path if provided
    if let Some(ref project_path) = payload.project_path {
        validate_project_path(project_path)?;
    }
    
    // Emit event to frontend
    window
        .emit("mux:deep-link", payload)
        .map_err(|e| format!("Failed to emit deep-link event: {}", e))?;
    
    Ok(())
}
