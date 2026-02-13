# Sidecar Binaries

This directory contains the compiled Node.js backend binaries for Tauri sidecar.

## Binary Naming Convention

Tauri requires specific naming for sidecar binaries based on the target platform:

- `mup-server-x86_64-pc-windows-msvc.exe` (Windows x64)
- `mup-server-aarch64-apple-darwin` (macOS ARM64)
- `mup-server-x86_64-apple-darwin` (macOS Intel)
- `mup-server-x86_64-unknown-linux-gnu` (Linux x64)

## Building

Run the sidecar build script from the project root:

```bash
bun run build:sidecar
```

This uses `bun build --compile` to create standalone executables.

## Development

For development, the sidecar can be run directly with:

```bash
bun run dev:sidecar
```

This starts the server without compiling, useful for debugging.
