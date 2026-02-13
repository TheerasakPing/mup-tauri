# Mup-Tauri

[![CI](https://github.com/TheerasakPing/mup-tauri/actions/workflows/ci.yml/badge.svg)](https://github.com/TheerasakPing/mup-tauri/actions/workflows/ci.yml)
[![Release](https://github.com/TheerasakPing/mup-tauri/actions/workflows/release.yml/badge.svg)](https://github.com/TheerasakPing/mup-tauri/actions/workflows/release.yml)
[![License](https://img.shields.io/badge/license-Private-red.svg)](LICENSE)

> A modern desktop application built with Tauri, React, and TypeScript

## 🚀 Quick Start

### Prerequisites

- **Bun** - [Install](https://bun.sh)
- **Rust** - [Install](https://rustup.rs)
- **Git LFS** - [Install](https://git-lfs.github.com/) (required for large binaries)

### Installation & Start

```bash
# Clone the repository
git clone https://github.com/TheerasakPing/mup-tauri.git
cd mup-tauri

# Install Git LFS (if not already installed)
git lfs install

# Install dependencies
bun install

# Start development server
bun run dev
```

**Alternative start methods:**

```bash
# Linux/macOS
./start.sh dev

# Windows
start.bat dev

# Using Make
make dev
```

📖 **See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions**

## 📋 Available Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `bun run dev`       | Start development server |
| `bun run build`     | Build for production     |
| `bun run test`      | Run tests                |
| `bun run test:ui`   | Run tests with UI        |
| `bun run lint`      | Run linter               |
| `bun run format`    | Format code              |
| `bun run typecheck` | Type check               |
| `bun run clean`     | Clean build artifacts    |

## 📚 Documentation

### Project Documentation

- **[Quick Start Guide](./QUICKSTART.md)** - Detailed setup and usage instructions
- **[AI Team Structure (Thai)](./AI_TEAM_STRUCTURE_THAI.md)** - โครงสร้างทีม AI 21 คน

### Data Files

- `src/data/teamStructure.ts` - TypeScript data structure for team information

## 🛠️ Tech Stack

### Frontend

- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite 7** - Build tool
- **Tailwind CSS** - Utility-first CSS

### Backend

- **Rust** - Systems programming
- **Tauri 2** - Desktop application framework
- **Node.js Sidecar** - Backend server bundled as sidecar binary

### Testing

- **Vitest** - Unit testing
- **React Testing Library** - React component testing

## 🏗️ Project Structure

```
mup-tauri/
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── data/           # Data structures
│   └── test/           # Test files
├── src-tauri/          # Rust backend
│   ├── binaries/       # Sidecar binaries (Git LFS)
│   └── src/            # Rust source code
├── public/             # Static assets
├── start.sh            # Linux/macOS start script
├── start.bat           # Windows start script
├── Makefile            # Make commands
└── QUICKSTART.md       # Detailed guide
```

## 🧪 Testing

```bash
# Run tests
bun run test

# Run tests with UI
bun run test:ui

# Run tests with coverage
bun run test:coverage
```

## 📦 Building

```bash
# Build for production
bun run build

# Build Tauri application
bun run tauri:build
```

## 🛠️ Development

### Code Quality

```bash
bun run lint          # Check code quality
bun run lint:fix      # Fix linting issues
bun run format        # Format code
bun run typecheck     # Type check
```

### Maintenance

```bash
bun run clean         # Clean build artifacts
bun run reinstall     # Reinstall dependencies
bun run check         # Check dependency versions
```

## 📦 Git LFS

This repository uses Git LFS for large binary files. The following files are tracked:

- `src-tauri/binaries/mup-server-x86_64-pc-windows-msvc.exe`

Make sure Git LFS is installed before cloning:

```bash
git lfs install
git lfs pull  # Download LFS files
```

## 🔧 IDE Setup

Recommended VS Code extensions:

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🚀 Release Process

### Automated Releases

This project uses GitHub Actions for automated CI/CD:

- **CI Workflow**: Runs on every push/PR to `main` and `develop` branches
  - Linting (ESLint, Clippy, rustfmt)
  - Type checking
  - Tests
  - Build verification

- **Release Workflow**: Triggered by pushing a version tag
  - Builds for all platforms (Windows, macOS Intel/ARM, Linux)
  - Creates draft GitHub Release with installers

### Creating a Release

1. **Update version numbers:**

   ```bash
   # Update package.json version
   # Update src-tauri/Cargo.toml version
   ```

2. **Update CHANGELOG.md** with release notes

3. **Commit and tag:**

   ```bash
   git add .
   git commit -m "chore: release vX.X.X"
   git tag vX.X.X
   git push origin main --tags
   ```

4. **GitHub Actions** will automatically:
   - Build sidecar binaries
   - Build Tauri apps for all platforms
   - Create a draft release

5. **Publish release** from GitHub Releases page

### Required Secrets

Set these secrets in your GitHub repository settings:

| Secret               | Description                                                                   |
| -------------------- | ----------------------------------------------------------------------------- |
| `TAURI_PRIVATE_KEY`  | Private key for signing Tauri updates (generate with `tauri signer generate`) |
| `TAURI_KEY_PASSWORD` | Password for the Tauri private key                                            |

### Manual Release

You can also trigger a release manually from the Actions tab:

1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Enter the version (e.g., `v1.0.0`)

## 📖 Additional Resources

- [Tauri Documentation](https://tauri.app/v2/guide/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Bun Documentation](https://bun.sh/docs)

## 📄 License

This project is private and unlicensed.

---

_Last updated: 2025_
