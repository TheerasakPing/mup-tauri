# Mup-Tauri

> A modern desktop application built with Tauri, React, and TypeScript

## 🚀 Quick Start

### Prerequisites
- **Bun** - [Install](https://bun.sh)
- **Rust** - [Install](https://rustup.rs)

### Installation & Start

**Using start scripts (Recommended):**

```bash
# Linux/macOS
./start.sh dev

# Windows
start.bat dev
```

**Using Make:**
```bash
make dev
```

**Using Bun:**
```bash
bun install
bun run dev
```

📖 **See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions**

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run test` | Run tests |
| `bun run test:ui` | Run tests with UI |
| `bun run lint` | Run linter |
| `bun run format` | Format code |
| `bun run typecheck` | Type check |
| `bun run clean` | Clean build artifacts |

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

## 🔧 IDE Setup

Recommended VS Code extensions:
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## 📖 Additional Resources

- [Tauri Documentation](https://tauri.app/v2/guide/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Bun Documentation](https://bun.sh/docs)

## 📄 License

This project is private and unlicensed.

---

*Last updated: 2025*
