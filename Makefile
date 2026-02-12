# Mup-Tauri Makefile
# Quick commands for development

.PHONY: dev build test test-ui lint clean install help start

# Default target
.DEFAULT_GOAL := help

# Development
dev: ## Start development server
	@echo "🚀 Starting development server..."
	bun run tauri dev

start: dev ## Alias for dev

# Production
build: ## Build for production
	@echo "📦 Building for production..."
	bun run tauri build

# Testing
test: ## Run tests
	@echo "🧪 Running tests..."
	bun run test

test-ui: ## Start test UI
	@echo "🔬 Starting test UI..."
	bun run test:ui

test-coverage: ## Run tests with coverage
	@echo "📊 Running tests with coverage..."
	bun run test:coverage

# Code Quality
lint: ## Run linter
	@echo "🔍 Running linter..."
	bun run lint

format: ## Format code
	@echo "✨ Formatting code..."
	bun run format

typecheck: ## Type check
	@echo "📝 Type checking..."
	bun run typecheck

# Maintenance
clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf node_modules dist src-tauri/target
	@echo "✓ Clean complete"

install: ## Install dependencies
	@echo "📥 Installing dependencies..."
	bun install
	@echo "✓ Installation complete"

update: ## Update dependencies
	@echo "🔄 Updating dependencies..."
	bun update
	@echo "✓ Update complete"

# Tauri specific
tauri-dev: ## Start Tauri in development mode
	bun run tauri dev

tauri-build: ## Build Tauri application
	bun run tauri build

tauri-icon: ## Generate Tauri icons (requires image path)
	@echo "🖼️  Generating Tauri icons..."
	bun run tauri icon $(ICON_PATH)

# Utilities
check: ## Check all dependencies and versions
	@echo "🔍 Checking dependencies..."
	@echo "Bun version: $$(bun --version)"
	@echo "Rust version: $$(rustc --version)"
	@echo "Cargo version: $$(cargo --version)"
	@echo "Node version: $$(node --version 2>/dev/null || echo 'Not installed')"

docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	docker build -t mup-tauri .

docker-run: ## Run Docker container
	@echo "🐳 Running Docker container..."
	docker run -it mup-tauri

# Help
help: ## Show this help message
	@echo "Mup-Tauri Makefile"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make dev          # Start development server"
	@echo "  make test         # Run tests"
	@echo "  make build        # Build for production"
	@echo "  make clean        # Clean build artifacts"
