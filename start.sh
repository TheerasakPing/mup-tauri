#!/bin/bash

# Mup-Tauri Start Script
# Quick start script for development

set -e

echo "🚀 Starting Mup-Tauri Development Environment..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    print_warning "Bun is not installed. Please install it from https://bun.sh"
    exit 1
fi

print_success "Bun found: $(bun --version)"

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    print_warning "Rust is not installed. Please install it from https://rustup.rs"
    exit 1
fi

print_success "Rust found: $(rustc --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    bun install
    print_success "Dependencies installed"
else
    print_info "Dependencies already installed"
fi

# Parse command line arguments
COMMAND=${1:-"dev"}

case $COMMAND in
    dev|development)
        print_info "Starting development server..."
        bun run tauri dev
        ;;
    build)
        print_info "Building for production..."
        bun run tauri build
        ;;
    test)
        print_info "Running tests..."
        bun run test
        ;;
    test:ui)
        print_info "Starting test UI..."
        bun run test:ui
        ;;
    lint)
        print_info "Running linter..."
        bun run lint
        ;;
    clean)
        print_info "Cleaning build artifacts..."
        rm -rf node_modules
        rm -rf dist
        rm -rf src-tauri/target
        print_success "Clean complete"
        ;;
    install)
        print_info "Installing dependencies..."
        bun install
        print_success "Installation complete"
        ;;
    help|--help|-h)
        echo ""
        echo "Mup-Tauri Start Script"
        echo ""
        echo "Usage: ./start.sh [command]"
        echo ""
        echo "Commands:"
        echo "  dev, development  Start development server (default)"
        echo "  build            Build for production"
        echo "  test             Run tests"
        echo "  test:ui          Start test UI"
        echo "  lint             Run linter"
        echo "  clean            Clean build artifacts"
        echo "  install          Install dependencies"
        echo "  help             Show this help message"
        echo ""
        ;;
    *)
        print_warning "Unknown command: $COMMAND"
        echo "Run './start.sh help' for available commands"
        exit 1
        ;;
esac
