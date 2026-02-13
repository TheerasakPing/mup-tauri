

/**
 * Definition of an icon within a theme.
 * Corresponds to VS Code's `iconDefinitions` values.
 */
export interface IconDefinition {
    iconPath: string; // Relative path to the icon file (SVG, PNG, etc.) inside the theme
    fontCharacter?: string; // Font character for font-based icons (not yet supported)
    fontColor?: string; // Color for font-based icons
    fontSize?: string; // Size for font-based icons
    fontId?: string; // Font ID for font-based icons
}

/**
 * VS Code Icon Theme Document Structure (JSON format)
 * Based on: https://code.visualstudio.com/api/extension-guides/file-icon-theme
 */
export interface IconThemeDocument {
    /**
     * Font definitions (not yet supported, placeholder for future)
     */
    fonts?: unknown[];

    /**
     * Icon definitions keyed by identifier
     */
    iconDefinitions: Record<string, IconDefinition>;

    /**
     * Default file icon
     */
    file?: string;

    /**
     * Default folder icon
     */
    folder?: string;

    /**
     * Default expanded folder icon
     */
    folderExpanded?: string;

    /**
     * Default root folder icon (workspace root)
     */
    rootFolder?: string;

    /**
     * Default expanded root folder icon
     */
    rootFolderExpanded?: string;

    /**
     * Associations for file extensions
     * Key: file extension (e.g. "ts"), Value: iconDefinition ID
     */
    fileExtensions?: Record<string, string>;

    /**
     * Associations for specific file names
     * Key: file name (e.g. "package.json"), Value: iconDefinition ID
     */
    fileNames?: Record<string, string>;

    /**
     * Associations for specific folder names
     * Key: folder name (e.g. "src"), Value: iconDefinition ID
     */
    folderNames?: Record<string, string>;

    /**
     * Associations for specific expanded folder names
     * Key: folder name (e.g. "src"), Value: iconDefinition ID
     */
    folderNamesExpanded?: Record<string, string>;

    /**
     * Associations for language IDs
     * Key: language ID (e.g. "typescript"), Value: iconDefinition ID
     */
    languageIds?: Record<string, string>;

    /**
     * Light theme overrides
     */
    light?: Partial<Omit<IconThemeDocument, "iconDefinitions" | "light" | "highContrast">>;

    /**
     * High contrast theme overrides
     */
    highContrast?: Partial<Omit<IconThemeDocument, "iconDefinitions" | "light" | "highContrast">>;

    /**
     * Disable filestem splitting (if true, "foo.test.ts" won't match "test.ts")
     */
    hidesExplorerArrows?: boolean;
}

/**
 * Metadata for an installed icon theme in MUP
 */
export interface InstalledIconTheme {
    id: string; // Unique ID (usually publisher.name-themeName)
    label: string; // Display name
    description?: string;
    publisher?: string;
    version?: string;

    /**
     * Absolute path to the directory containing the extracted theme
     */
    themeDir: string;

    /**
     * Path to the theme JSON file relative to themeDir
     */
    themeJsonPath: string;

    /**
     * Whether this is a built-in theme (cannot be deleted)
     */
    isBuiltin: boolean;
}

/**
 * MUP Icon Theme Configuration State
 */
export interface IconThemeConfig {
    /**
     * ID of the currently active theme
     */
    activeThemeId: string;

    /**
     * List of all installed themes (built-in + user installed)
     */
    installedThemes: InstalledIconTheme[];
}

/**
 * Default ID for the built-in MUP theme
 */
export const DEFAULT_MUP_THEME_ID = "mup-default";
