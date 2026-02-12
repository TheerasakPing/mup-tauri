@echo off
REM Mup-Tauri Start Script for Windows
REM Quick start script for development

echo.
echo 🚀 Starting Mup-Tauri Development Environment...
echo.

REM Parse command line arguments
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=dev

REM Check if bun is installed
where bun >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ⚠ Bun is not installed. Please install it from https://bun.sh
    exit /b 1
)

REM Check if Rust is installed
where rustc >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ⚠ Rust is not installed. Please install it from https://rustup.rs
    exit /b 1
)

if "%COMMAND%"=="dev" goto dev
if "%COMMAND%"=="development" goto dev
if "%COMMAND%"=="build" goto build
if "%COMMAND%"=="test" goto test
if "%COMMAND%"=="test:ui" goto testui
if "%COMMAND%"=="lint" goto lint
if "%COMMAND%"=="clean" goto clean
if "%COMMAND%"=="install" goto install
if "%COMMAND%"=="help" goto help
if "%COMMAND%"=="--help" goto help
if "%COMMAND%"=="-h" goto help

echo ⚠ Unknown command: %COMMAND%
echo Run 'start.bat help' for available commands
exit /b 1

:dev
echo ℹ Starting development server...
bun run tauri dev
goto end

:build
echo ℹ Building for production...
bun run tauri build
goto end

:test
echo ℹ Running tests...
bun run test
goto end

:testui
echo ℹ Starting test UI...
bun run test:ui
goto end

:lint
echo ℹ Running linter...
bun run lint
goto end

:clean
echo ℹ Cleaning build artifacts...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
if exist src-tauri\target rmdir /s /q src-tauri\target
echo ✓ Clean complete
goto end

:install
echo ℹ Installing dependencies...
bun install
echo ✓ Installation complete
goto end

:help
echo.
echo Mup-Tauri Start Script
echo.
echo Usage: start.bat [command]
echo.
echo Commands:
echo   dev, development  Start development server (default)
echo   build            Build for production
echo   test             Run tests
echo   test:ui          Start test UI
echo   lint             Run linter
echo   clean            Clean build artifacts
echo   install          Install dependencies
echo   help             Show this help message
echo.
goto end

:end
