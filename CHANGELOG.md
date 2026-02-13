# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

## [0.17.4] - 2025-02-13

### Added

- CI/CD workflows for automated testing and releases
- Git LFS support for large binary files
- Cross-platform release automation (Windows, macOS, Linux)
- Initial Tauri 2 desktop application

### Changed

- Enhanced README.md with Git LFS instructions
- Improved .gitignore with comprehensive patterns

## Release Process

1. Update version in `package.json` and `src-tauri/Cargo.toml`
2. Update `CHANGELOG.md` with release notes
3. Commit changes: `git commit -am "chore: release v0.17.4"`
4. Create tag: `git tag v0.17.4`
5. Push: `git push origin main --tags`
6. GitHub Actions will automatically build and create a draft release

[unreleased]: https://github.com/TheerasakPing/mup-tauri/compare/v0.17.4...HEAD
[0.17.4]: https://github.com/TheerasakPing/mup-tauri/releases/tag/v0.17.4
