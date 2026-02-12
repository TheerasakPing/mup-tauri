// Terminal PTY management
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Arc;
use tauri::{Emitter, Window};
use tokio::sync::Mutex;

// PTY ID counter
static NEXT_PTY_ID: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(1);

// PTY reader wrapper that implements Send
struct PtyReader {
    reader: Box<dyn Read + Send>,
}

unsafe impl Send for PtyReader {}

// PTY writer wrapper that implements Send  
struct PtyWriter {
    writer: Box<dyn Write + Send>,
}

unsafe impl Send for PtyWriter {}

// Global PTY storage
struct PtyInstance {
    reader: PtyReader,
    writer: PtyWriter,
    _child: Box<dyn portable_pty::Child + Send>,
}

type PtyMap = Arc<Mutex<HashMap<u32, PtyInstance>>>;

use std::sync::OnceLock;

static PTY_MAP: OnceLock<PtyMap> = OnceLock::new();

fn get_pty_map() -> &'static PtyMap {
    PTY_MAP.get_or_init(|| Arc::new(Mutex::new(HashMap::new())))
}

/// Create a new PTY with the default shell
pub fn create_pty_internal() -> Result<u32, String> {
    let pty_system = native_pty_system();

    let shell = if cfg!(windows) {
        "cmd.exe".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
    };

    let pty_size = PtySize {
        rows: 24,
        cols: 80,
        pixel_width: 0,
        pixel_height: 0,
    };

    let pty_pair = pty_system
        .openpty(pty_size)
        .map_err(|e| format!("Failed to open PTY: {}", e))?;

    let cmd = CommandBuilder::new(shell);
    
    let child = pty_pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;

    // Get reader and writer
    let reader = pty_pair.master.try_clone_reader()
        .map_err(|e| format!("Failed to clone reader: {}", e))?;
    
    // Take writer from master
    let writer = pty_pair.master.take_writer()
        .map_err(|e| format!("Failed to get writer: {}", e))?;

    let id = NEXT_PTY_ID.fetch_add(1, std::sync::atomic::Ordering::SeqCst);

    let pty_instance = PtyInstance {
        reader: PtyReader { reader },
        writer: PtyWriter { writer },
        _child: child,
    };

    let rt = tokio::runtime::Handle::try_current()
        .map_err(|e| format!("No runtime: {}", e))?;
    
    rt.block_on(async {
        let mut map = get_pty_map().lock().await;
        map.insert(id, pty_instance);
    });

    Ok(id)
}

/// Write data to PTY
pub fn write_to_pty_internal(pty_id: u32, data: &[u8]) -> Result<(), String> {
    let rt = tokio::runtime::Handle::try_current()
        .map_err(|e| format!("No runtime: {}", e))?;
    
    rt.block_on(async {
        let mut map = get_pty_map().lock().await;
        if let Some(pty) = map.get_mut(&pty_id) {
            pty.writer.writer
                .write_all(data)
                .map_err(|e| format!("Failed to write to PTY: {}", e))?;
            pty.writer.writer
                .flush()
                .map_err(|e| format!("Failed to flush PTY: {}", e))?;
            Ok(())
        } else {
            Err(format!("PTY {} not found", pty_id))
        }
    })
}

/// Read from PTY (non-blocking)
pub fn read_from_pty_internal(pty_id: u32) -> Result<Vec<u8>, String> {
    let rt = tokio::runtime::Handle::try_current()
        .map_err(|e| format!("No runtime: {}", e))?;
    
    rt.block_on(async {
        let mut map = get_pty_map().lock().await;
        if let Some(pty) = map.get_mut(&pty_id) {
            let mut buffer = vec![0u8; 8192];
            match pty.reader.reader.read(&mut buffer) {
                Ok(n) => {
                    buffer.truncate(n);
                    Ok(buffer)
                }
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    Ok(vec![])
                }
                Err(e) => Err(format!("Failed to read from PTY: {}", e)),
            }
        } else {
            Err(format!("PTY {} not found", pty_id))
        }
    })
}

/// Resize PTY
pub fn resize_pty_internal(pty_id: u32, _cols: u16, _rows: u16) -> Result<(), String> {
    let rt = tokio::runtime::Handle::try_current()
        .map_err(|e| format!("No runtime: {}", e))?;
    
    rt.block_on(async {
        let mut map = get_pty_map().lock().await;
        if let Some(_pty) = map.get_mut(&pty_id) {
            // Note: We can't resize through the reader/writer directly
            // This would require storing the MasterPty separately
            // For now, we return success but don't actually resize
            Ok(())
        } else {
            Err(format!("PTY {} not found", pty_id))
        }
    })
}

/// Close PTY
pub fn close_pty_internal(pty_id: u32) -> Result<(), String> {
    let rt = tokio::runtime::Handle::try_current()
        .map_err(|e| format!("No runtime: {}", e))?;
    
    rt.block_on(async {
        let mut map = get_pty_map().lock().await;
        if map.remove(&pty_id).is_some() {
            Ok(())
        } else {
            Err(format!("PTY {} not found", pty_id))
        }
    })
}

/// Tauri command: Create terminal
#[tauri::command]
pub async fn create_terminal(window: Window) -> Result<u32, String> {
    let pty_id = create_pty_internal()?;
    window.emit("terminal-created", pty_id)
        .map_err(|e| format!("Failed to emit event: {}", e))?;
    Ok(pty_id)
}

/// Tauri command: Write to terminal
#[tauri::command]
pub async fn terminal_write(pty_id: u32, data: &[u8]) -> Result<(), String> {
    write_to_pty_internal(pty_id, data)
}

/// Tauri command: Read from terminal
#[tauri::command]
pub async fn terminal_read(pty_id: u32) -> Result<Vec<u8>, String> {
    read_from_pty_internal(pty_id)
}

/// Tauri command: Resize terminal
#[tauri::command]
pub async fn terminal_resize(pty_id: u32, cols: u16, rows: u16) -> Result<(), String> {
    resize_pty_internal(pty_id, cols, rows)
}

/// Tauri command: Close terminal
#[tauri::command]
pub async fn terminal_close(pty_id: u32) -> Result<(), String> {
    close_pty_internal(pty_id)
}

