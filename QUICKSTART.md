# 🚀 Quick Start Guide - Mup-Tauri

## Prerequisites

Before you begin, ensure you have the following installed:

- **Bun** - Fast JavaScript runtime ([Install Bun](https://bun.sh))
- **Rust** - Systems programming language ([Install Rust](https://rustup.rs))
- **Node.js** (optional) - For additional tooling

## Installation

### Quick Install
```bash
# Clone the repository
git clone <repository-url>
cd mup-tauri

# Install dependencies
bun install
```

### Verify Installation
```bash
# Check all dependencies
bun run check
```

## Starting the Application

### Option 1: Using Start Scripts

**Linux/macOS:**
```bash
./start.sh dev
```

**Windows:**
```bash
start.bat dev
```

### Option 2: Using Make
```bash
make dev
```

### Option 3: Using Bun/NPM
```bash
bun run dev
# or
bun run tauri:dev
# or
bun run start
```

## Available Commands

### Development
```bash
bun run dev              # Start development server
bun run start            # Alias for dev
bun run tauri:dev        # Start Tauri in dev mode
```

### Production
```bash
bun run build            # Build for production
bun run tauri:build      # Build Tauri application
```

### Testing
```bash
bun run test             # Run tests
bun run test:ui          # Run tests with UI
bun run test:run         # Run tests once
bun run test:coverage    # Run tests with coverage
```

### Code Quality
```bash
bun run lint             # Run linter
bun run lint:fix         # Fix linting issues
bun run format           # Format code
bun run format:check     # Check code formatting
bun run typecheck        # Type check TypeScript
```

### Maintenance
```bash
bun run clean            # Clean build artifacts
bun run reinstall        # Reinstall dependencies
bun run check            # Check dependency versions
```

## Using Makefile (Linux/macOS)

```bash
make dev          # Start development server
make build        # Build for production
make test         # Run tests
make test-ui      # Start test UI
make lint         # Run linter
make format       # Format code
make typecheck    # Type check
make clean        # Clean build artifacts
make install      # Install dependencies
make help         # Show all available commands
```

## Using Start Scripts

### Linux/macOS (start.sh)
```bash
./start.sh dev          # Start development server
./start.sh build        # Build for production
./start.sh test         # Run tests
./start.sh test:ui      # Start test UI
./start.sh lint         # Run linter
./start.sh clean        # Clean build artifacts
./start.sh install      # Install dependencies
./start.sh help         # Show help
```

### Windows (start.bat)
```bash
start.bat dev           # Start development server
start.bat build         # Build for production
start.bat test          # Run tests
start.bat test:ui       # Start test UI
start.bat lint          # Run linter
start.bat clean         # Clean build artifacts
start.bat install       # Install dependencies
start.bat help          # Show help
```

## Development Workflow

### 1. Start Development Server
```bash
bun run dev
```
This will:
- Start Vite development server
- Launch Tauri window
- Enable hot module replacement (HMR)
- Watch for file changes

### 2. Run Tests
```bash
bun run test
```
This will run all tests in watch mode.

### 3. Build for Production
```bash
bun run build
```
This will:
- Type check TypeScript
- Build optimized frontend bundle
- Compile Rust backend
- Package into platform-specific binary

## Project Structure

```
mup-tauri/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── data/              # Data structures (teamStructure.ts)
│   ├── test/              # Test files
│   └── App.tsx            # Main app component
├── src-tauri/             # Tauri/Rust backend
│   ├── src/               # Rust source code
│   └── tauri.conf.json    # Tauri configuration
├── public/                # Static assets
├── package.json           # Dependencies & scripts
├── Makefile               # Make commands
├── start.sh               # Linux/macOS start script
├── start.bat              # Windows start script
└── QUICKSTART.md          # This file
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Example environment variables
VITE_APP_TITLE=Mup-Tauri
VITE_API_URL=http://localhost:3000
```

## Troubleshooting

### Common Issues

**1. Bun not found**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash
```

**2. Rust not found**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**3. Dependencies issues**
```bash
# Clean and reinstall
bun run clean
bun install
```

**4. Tauri build fails**
```bash
# Check Tauri prerequisites
bun run tauri info
```

### Platform-Specific Notes

**Linux:**
- Ensure you have `webkit2gtk` installed
- Run `sudo apt install libwebkit2gtk-4.0-dev` on Ubuntu/Debian

**macOS:**
- Xcode Command Line Tools required
- Run `xcode-select --install`

**Windows:**
- Microsoft Visual Studio C++ Build Tools required
- WebView2 runtime (usually pre-installed on Windows 10/11)

## Additional Resources

- [Tauri Documentation](https://tauri.app/v2/guide/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Bun Documentation](https://bun.sh/docs)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Tauri documentation
3. Check project issues on GitHub

---

**Happy coding! 🎉**
