import * as fs from "fs";
import * as path from "path";
import JSZip from "jszip";
import { log } from "@/node/services/log";
import { Config } from "@/node/config";
import {
    IconThemeDocument,
    InstalledIconTheme,
    DEFAULT_MUP_THEME_ID,
} from "@/common/types/iconTheme";
import { getMuxHome } from "@/common/constants/paths";

/**
 * Service to manage icon themes in MUP.
 * Handles loading, activating, and listing icon themes.
 */
export class IconThemeService {
    private config: Config;
    private iconThemesDir: string;

    constructor(config: Config) {
        this.config = config;
        this.iconThemesDir = path.join(getMuxHome(), "icon-themes");

        // Ensure icon themes directory exists
        if (!fs.existsSync(this.iconThemesDir)) {
            try {
                fs.mkdirSync(this.iconThemesDir, { recursive: true });
            } catch (err) {
                log.error("Failed to create icon themes directory:", err);
            }
        }
    }

    /**
     * Get the ID of the currently active icon theme.
     */
    public getActiveThemeId(): string {
        const config = this.config.loadConfigOrDefault();
        return config.iconThemeConfig?.activeThemeId ?? DEFAULT_MUP_THEME_ID;
    }

    /**
     * Set the active icon theme.
     */
    public async setActiveTheme(themeId: string): Promise<void> {
        await this.config.editConfig((config) => {
            const currentConfig = config.iconThemeConfig ?? {
                activeThemeId: DEFAULT_MUP_THEME_ID,
                installedThemes: [],
            };

            return {
                ...config,
                iconThemeConfig: {
                    ...currentConfig,
                    activeThemeId: themeId,
                },
            };
        });

        log.info(`Active icon theme set to: ${themeId}`);
    }

    /**
     * Get the list of all installed icon themes.
     */
    public getInstalledThemes(): InstalledIconTheme[] {
        const config = this.config.loadConfigOrDefault();
        const installed = config.iconThemeConfig?.installedThemes ?? [];

        // Always include the built-in MUP default theme if not present
        const hasDefault = installed.some(t => t.id === DEFAULT_MUP_THEME_ID);
        if (!hasDefault) {
            return [this.getBuiltinThemeDefinition(), ...installed];
        }

        return installed;
    }

    /**
     * Get the built-in MUP default theme definition.
     * This theme uses the legacy hardcoded icons.
     */
    private getBuiltinThemeDefinition(): InstalledIconTheme {
        // For now, the built-in theme doesn't have a real JSON file or folder on disk
        // In Phase 5, we will bundle it properly.
        return {
            id: DEFAULT_MUP_THEME_ID,
            label: "MUP Default",
            description: "Default MUP file icons",
            isBuiltin: true,
            themeDir: "", // Built-in, handled specially on frontend
            themeJsonPath: "",
        };
    }

    /**
     * Get the IconThemeDocument for the currently active theme.
     */
    public async getActiveThemeDocument(): Promise<IconThemeDocument | null> {
        const activeId = this.getActiveThemeId();
        return this.loadThemeDocument(activeId);
    }

    /**
     * Load the IconThemeDocument (JSON) for a given theme ID.
     * Returns null if theme not found or invalid.
     */
    public async loadThemeDocument(themeId: string): Promise<IconThemeDocument | null> {
        if (themeId === DEFAULT_MUP_THEME_ID) {
            // Built-in theme is handled by frontend fallback logic for now (Phase 3/5)
            // or we could return a minimal JSON here.
            return null;
        }

        const themes = this.getInstalledThemes();
        const theme = themes.find(t => t.id === themeId);

        if (!theme) {
            log.warn(`Icon theme not found: ${themeId}`);
            return null;
        }

        try {
            const jsonPath = path.join(theme.themeDir, theme.themeJsonPath);
            if (!fs.existsSync(jsonPath)) {
                log.error(`Icon theme JSON file missing: ${jsonPath}`);
                return null;
            }

            const content = await fs.promises.readFile(jsonPath, "utf-8");
            return JSON.parse(content) as IconThemeDocument;
        } catch (err) {
            log.error(`Failed to load icon theme ${themeId}:`, err);
            return null;
        }
    }

    /**
     * Delete an installed theme by ID.
     * Cannot delete built-in themes.
     */
    public async deleteTheme(themeId: string): Promise<boolean> {
        if (themeId === DEFAULT_MUP_THEME_ID) {
            return false; // Cannot delete built-in theme
        }

        const config = this.config.loadConfigOrDefault();
        const installed = config.iconThemeConfig?.installedThemes ?? [];
        const themeIndex = installed.findIndex(t => t.id === themeId);

        if (themeIndex === -1) {
            return false; // Theme not found
        }

        const theme = installed[themeIndex];
        if (theme.isBuiltin) {
            return false; // Should satisfy check above, but safe guard
        }

        // 1. Remove from config
        await this.config.editConfig((cfg) => {
            const currentConfig = cfg.iconThemeConfig;
            if (!currentConfig) return cfg;

            const newInstalled = [...currentConfig.installedThemes];
            newInstalled.splice(themeIndex, 1);

            // If deleted theme was active, revert to default
            let newActiveId = currentConfig.activeThemeId;
            if (newActiveId === themeId) {
                newActiveId = DEFAULT_MUP_THEME_ID;
            }

            return {
                ...cfg,
                iconThemeConfig: {
                    ...currentConfig,
                    activeThemeId: newActiveId,
                    installedThemes: newInstalled,
                },
            };
        });

        // 2. Delete files from disk
        try {
            if (theme.themeDir && theme.themeDir.startsWith(this.iconThemesDir)) {
                await fs.promises.rm(theme.themeDir, { recursive: true, force: true });
                log.info(`Deleted icon theme files: ${theme.themeDir}`);
            }
        } catch (err) {
            log.error(`Failed to delete theme directory: ${theme.themeDir}`, err);
            // We still return true because it's removed from config
        }

        return true;
    }

    /**
     * Import an icon theme from a .vsix file (base64-encoded).
     * Extracts the ZIP, parses package.json for contributes.iconThemes,
     * stores the theme files to disk, and registers in config.
     */
    public async importVsix(vsixBase64: string): Promise<{ importedThemeIds: string[]; errors: string[] }> {
        const importedThemeIds: string[] = [];
        const errors: string[] = [];

        try {
            const buffer = Buffer.from(vsixBase64, "base64");
            const zip = await JSZip.loadAsync(buffer);

            // Find package.json inside the extension
            const packageJsonFile =
                zip.file("extension/package.json") ??
                zip.file("package.json");

            if (!packageJsonFile) {
                return { importedThemeIds, errors: ["No package.json found in .vsix"] };
            }

            const packageJsonStr = await packageJsonFile.async("string");
            const packageJson = JSON.parse(packageJsonStr) as {
                name?: string;
                publisher?: string;
                version?: string;
                displayName?: string;
                contributes?: {
                    iconThemes?: Array<{
                        id: string;
                        label: string;
                        path: string;
                    }>;
                };
            };

            const iconThemes = packageJson.contributes?.iconThemes;
            if (!iconThemes || iconThemes.length === 0) {
                return { importedThemeIds, errors: ["No icon themes found in extension contributes"] };
            }

            // Determine the prefix for files inside the ZIP
            // .vsix files typically have files under "extension/"
            const hasExtensionPrefix = zip.file("extension/package.json") !== null;
            const zipPrefix = hasExtensionPrefix ? "extension/" : "";

            for (const themeContrib of iconThemes) {
                try {
                    const themeId = `${packageJson.publisher ?? "unknown"}.${packageJson.name ?? "unknown"}-${themeContrib.id}`;
                    const themeDir = path.join(this.iconThemesDir, themeId);

                    // Clean existing directory if re-importing
                    if (fs.existsSync(themeDir)) {
                        await fs.promises.rm(themeDir, { recursive: true, force: true });
                    }
                    await fs.promises.mkdir(themeDir, { recursive: true });

                    // Extract all files from extension/ to the theme directory
                    const zipEntries = Object.keys(zip.files);
                    for (const entryName of zipEntries) {
                        const entry = zip.files[entryName];
                        if (entry.dir) continue;
                        if (!entryName.startsWith(zipPrefix)) continue;

                        // Strip the prefix to get relative path
                        const relativePath = entryName.slice(zipPrefix.length);
                        if (!relativePath) continue;

                        const targetPath = path.join(themeDir, relativePath);
                        const targetDir = path.dirname(targetPath);

                        // Security: ensure target stays within themeDir
                        const resolvedTarget = path.resolve(targetPath);
                        const resolvedThemeDir = path.resolve(themeDir);
                        if (!resolvedTarget.startsWith(resolvedThemeDir)) {
                            log.warn(`Skipping suspicious path in .vsix: ${entryName}`);
                            continue;
                        }

                        await fs.promises.mkdir(targetDir, { recursive: true });
                        const content = await entry.async("nodebuffer");
                        await fs.promises.writeFile(targetPath, content);
                    }

                    // Normalize the theme JSON path (remove leading ./)
                    const themeJsonPath = themeContrib.path.replace(/^\.[\/\\]/, "");

                    // Verify the theme JSON file was extracted
                    const fullThemeJsonPath = path.join(themeDir, themeJsonPath);
                    if (!fs.existsSync(fullThemeJsonPath)) {
                        errors.push(`Theme JSON not found after extraction: ${themeJsonPath}`);
                        continue;
                    }

                    // Register the theme in config
                    const newTheme: InstalledIconTheme = {
                        id: themeId,
                        label: themeContrib.label || packageJson.displayName || themeContrib.id,
                        description: `Imported from ${packageJson.publisher ?? "unknown"}.${packageJson.name ?? "unknown"}`,
                        publisher: packageJson.publisher,
                        version: packageJson.version,
                        themeDir,
                        themeJsonPath,
                        isBuiltin: false,
                    };

                    await this.config.editConfig((cfg) => {
                        const currentConfig = cfg.iconThemeConfig ?? {
                            activeThemeId: DEFAULT_MUP_THEME_ID,
                            installedThemes: [],
                        };

                        // Remove existing theme with same ID if re-importing
                        const filteredThemes = currentConfig.installedThemes.filter(
                            (t) => t.id !== themeId
                        );

                        return {
                            ...cfg,
                            iconThemeConfig: {
                                ...currentConfig,
                                installedThemes: [...filteredThemes, newTheme],
                            },
                        };
                    });

                    importedThemeIds.push(themeId);
                    log.info(`Imported icon theme: ${themeId} → ${themeDir}`);
                } catch (themeErr) {
                    const msg = themeErr instanceof Error ? themeErr.message : String(themeErr);
                    errors.push(`Failed to import theme ${themeContrib.id}: ${msg}`);
                    log.error(`Failed to import theme ${themeContrib.id}:`, themeErr);
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`Failed to parse .vsix file: ${msg}`);
            log.error("Failed to parse .vsix file:", err);
        }

        return { importedThemeIds, errors };
    }

    /**
     * Get the content of an icon file from a theme directory.
     * Returns base64-encoded data and MIME type.
     */
    public async getIconFile(
        themeId: string,
        iconPath: string
    ): Promise<{ data: string; mimeType: string } | null> {
        const themes = this.getInstalledThemes();
        const theme = themes.find((t) => t.id === themeId);
        if (!theme || !theme.themeDir) return null;

        // Resolve and validate path (prevent traversal)
        const fullPath = path.resolve(theme.themeDir, iconPath);
        const resolvedThemeDir = path.resolve(theme.themeDir);
        if (!fullPath.startsWith(resolvedThemeDir)) {
            log.warn(`Path traversal attempt blocked: ${iconPath}`);
            return null;
        }

        if (!fs.existsSync(fullPath)) return null;

        const content = await fs.promises.readFile(fullPath);
        const ext = path.extname(fullPath).toLowerCase();
        const mimeType = this.getMimeType(ext);

        return {
            data: content.toString("base64"),
            mimeType,
        };
    }

    /**
     * Get the base directory path for icon themes (for static file serving).
     */
    public getIconThemesDir(): string {
        return this.iconThemesDir;
    }

    private getMimeType(ext: string): string {
        const mimeMap: Record<string, string> = {
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".ico": "image/x-icon",
            ".woff": "font/woff",
            ".woff2": "font/woff2",
            ".ttf": "font/ttf",
        };
        return mimeMap[ext] ?? "application/octet-stream";
    }
}
