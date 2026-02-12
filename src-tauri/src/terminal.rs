// Terminal PTY management
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use tauri::{Emitter, Window};

// PTY ID counter (simple integer)
static NEXT_PTY_ID: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(1);

/// Create a new PTY with the default shell (returns PTY ID)
/// 
/// Note: This is a minimal implementation. The PTY is created but not stored
/// globally yet - that will come in a later phase when we implement read/write.
fn create_pty() -> Result<u32, String> {
    let pty_system = native_pty_system();

    // Determine shell based on platform
    let shell = if cfg!(windows) {
        "cmd.exe".to_string()
    } else {
        // Default to bash on Unix-like systems
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
    };

    // Create PTY size (default 80x24)
    let pty_size = PtySize {
        rows: 24,
        cols: 80,
        pixel_width: 0,
        pixel_height: 0,
    };

    // Open new PTY
    let pty_pair = pty_system
        .openpty(pty_size)
        .map_err(|e| format!("Failed to open PTY: {}", e))?;

    // Build command to run shell
    let cmd = CommandBuilder::new(shell);
    
    // Spawn the shell in the PTY
    let _child = pty_pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;

    // For now, we don't store the reader/writer globally
    // This will be implemented in a later phase
    // The PTY will be dropped here, which is fine for this minimal implementation
    let _reader = pty_pair.master.try_clone_reader()
        .map_err(|e| format!("Failed to clone reader: {}", e))?;
    let _writer = pty_pair.master.take_writer()
        .map_err(|e| format!("Failed to get writer: {}", e))?;

    // Generate and return PTY ID
    let id = NEXT_PTY_ID.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
    Ok(id)
}

/// Tauri command: Create a new terminal PTY
/// 
/// Returns the PTY ID that can be used for future operations
#[tauri::command]
pub async fn create_terminal(window: Window) -> Result<u32, String> {
    let pty_id = create_pty()?;

    // Emit event to notify frontend
    window.emit("terminal-created", pty_id)
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(pty_id)
}

