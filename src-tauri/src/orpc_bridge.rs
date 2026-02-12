// oRPC Bridge Module
// 
// This module provides a bridge between Tauri and the Node.js backend's oRPC server.
// It forwards invoke calls from the frontend to the Node.js backend via HTTP.

use reqwest::Client;
use serde_json::Value as JsonValue;
use std::sync::Arc;
use tokio::sync::Mutex;

// HTTP client for communicating with oRPC server
type HttpClient = Arc<Mutex<Option<Client>>>;

// Global HTTP client using OnceLock
use std::sync::OnceLock;

static HTTP_CLIENT: OnceLock<HttpClient> = OnceLock::new();

fn get_http_client() -> HttpClient {
    HTTP_CLIENT.get_or_init(|| Arc::new(Mutex::new(None))).clone()
}

/// Initialize the HTTP client
fn ensure_client() -> Result<Client, String> {
    let client_ref = get_http_client();
    let mut client_guard = client_ref.try_lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    if client_guard.is_none() {
        *client_guard = Some(Client::new());
    }
    
    client_guard.as_ref()
        .cloned()
        .ok_or_else(|| "Failed to create HTTP client".to_string())
}

/// Forward an oRPC call to the Node.js backend
/// 
/// # Arguments
/// * method - The RPC method name (e.g., "getProjects", "createProject")
/// * params - Optional JSON parameters for the RPC call
/// 
/// # Returns
/// JSON result from the oRPC server
#[tauri::command]
pub async fn forward_orpc_call(method: String, params: Option<JsonValue>) -> Result<JsonValue, String> {
    let client = ensure_client()?;
    
    // Build URL: http://localhost:3000/orpc/{method}
    let url = format!("http://localhost:3000/orpc/{}", method);
    
    // Prepare request body
    let body = if let Some(params) = params {
        params
    } else {
        serde_json::json!({})
    };
    
    // Send POST request
    let response = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;
    
    // Check response status
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unable to read error response".to_string());
        return Err(format!("oRPC server returned error {}: {}", status, error_text));
    }
    
    // Parse and return response
    let response_json = response
        .json::<JsonValue>()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    Ok(response_json)
}

/// Check if the oRPC server is available
#[tauri::command]
pub async fn check_orpc_server() -> Result<bool, String> {
    let client = ensure_client()?;
    
    let url = "http://localhost:3000/orpc/health";
    
    let response = client
        .get(url)
        .send()
        .await;
    
    match response {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(_) => Ok(false),
    }
}

