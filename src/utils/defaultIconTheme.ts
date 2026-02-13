import { IconThemeDocument } from "@/common/types/iconTheme";

/**
 * MUP Default Icon Theme
 *
 * This is a proper IconThemeDocument that mirrors the hardcoded maps
 * previously used in FileIcon.tsx. Icon paths are SVG filenames from
 * the root /icons/ directory, resolved at runtime by getRootIconUrl.
 */

// Helper to build iconDefinitions from a list of SVG filenames
function defs(names: string[]): Record<string, { iconPath: string }> {
    const result: Record<string, { iconPath: string }> = {};
    for (const name of names) {
        const id = name.replace(".svg", "");
        result[id] = { iconPath: name };
    }
    return result;
}

const ICON_SVGS = [
    // Programming languages
    "typescript.svg", "typescript_react.svg", "javascript.svg", "javascript_react.svg",
    "python.svg", "rust.svg", "go.svg", "java.svg", "cpp.svg", "c.svg", "csharp.svg",
    "php.svg", "ruby.svg", "swift.svg", "kotlin.svg", "scala.svg", "dart.svg", "lua.svg",
    "r.svg", "matlab.svg", "bash.svg", "powershell.svg", "bat.svg",
    // Web
    "html.svg", "css.svg", "sass.svg", "less.svg", "vue.svg", "svelte.svg",
    "json.svg", "xml.svg", "yaml.svg", "toml.svg", "markdown.svg", "markdown_mdx.svg",
    // Config
    "eslint.svg", "prettier.svg", "editorconfig.svg", "git.svg",
    "docker.svg", "docker_compose.svg",
    "package_json.svg", "npm_lock.svg", "yarn_lock.svg", "bun_lock.svg",
    "typescript_config.svg", "javascript_config.svg",
    "vite.svg", "webpack.svg", "tailwind.svg", "next.svg", "nuxt.svg",
    // File types
    "image.svg", "svg.svg", "pdf.svg", "zip.svg", "video.svg", "audio.svg",
    "txt.svg", "log.svg", "csv.svg",
    // Special files
    "readme.svg", "license.svg", "contributing.svg", "changelog.svg", "makefile.svg",
    // Defaults
    "file.svg", "folder.svg",
    // Folder icons
    "folder_src.svg", "folder_components.svg", "folder_views.svg", "folder_utils.svg",
    "folder_lib.svg", "folder_images.svg", "folder_public.svg", "folder_styles.svg",
    "folder_sass.svg", "folder_scripts.svg", "folder_tests.svg",
];

export const MUP_DEFAULT_THEME: IconThemeDocument = {
    iconDefinitions: defs(ICON_SVGS),

    // Default icons
    file: "file",
    folder: "folder",

    // File extension → icon definition ID
    fileExtensions: {
        "ts": "typescript",
        "tsx": "typescript_react",
        "js": "javascript",
        "jsx": "javascript_react",
        "py": "python",
        "rs": "rust",
        "go": "go",
        "java": "java",
        "cpp": "cpp",
        "c": "c",
        "cs": "csharp",
        "php": "php",
        "rb": "ruby",
        "swift": "swift",
        "kt": "kotlin",
        "scala": "scala",
        "dart": "dart",
        "lua": "lua",
        "r": "r",
        "m": "matlab",
        "sh": "bash",
        "ps1": "powershell",
        "bat": "bat",
        "html": "html",
        "css": "css",
        "scss": "sass",
        "sass": "sass",
        "less": "less",
        "vue": "vue",
        "svelte": "svelte",
        "json": "json",
        "xml": "xml",
        "yaml": "yaml",
        "yml": "yaml",
        "toml": "toml",
        "md": "markdown",
        "mdx": "markdown_mdx",
        "png": "image",
        "jpg": "image",
        "jpeg": "image",
        "gif": "image",
        "svg": "svg",
        "pdf": "pdf",
        "zip": "zip",
        "tar": "zip",
        "gz": "zip",
        "mp4": "video",
        "mp3": "audio",
        "wav": "audio",
        "txt": "txt",
        "log": "log",
        "csv": "csv",
    },

    // Exact filename → icon definition ID
    fileNames: {
        "readme": "readme",
        "readme.md": "readme",
        "license": "license",
        "contributing": "contributing",
        "changelog": "changelog",
        "dockerfile": "docker",
        "makefile": "makefile",
        ".gitignore": "git",
        ".eslintrc": "eslint",
        ".eslintrc.js": "eslint",
        ".eslintrc.json": "eslint",
        ".prettierrc": "prettier",
        ".prettierrc.js": "prettier",
        ".prettierrc.json": "prettier",
        ".editorconfig": "editorconfig",
        "docker-compose.yml": "docker_compose",
        "docker-compose.yaml": "docker_compose",
        "package.json": "package_json",
        "package-lock.json": "npm_lock",
        "yarn.lock": "yarn_lock",
        "bun.lockb": "bun_lock",
        "tsconfig.json": "typescript_config",
        "jsconfig.json": "javascript_config",
        "vite.config.js": "vite",
        "vite.config.ts": "vite",
        "webpack.config.js": "webpack",
        "tailwind.config.js": "tailwind",
        "next.config.js": "next",
        "nuxt.config.js": "nuxt",
    },

    // Folder name → icon definition ID
    folderNames: {
        "src": "folder_src",
        "components": "folder_components",
        "pages": "folder_views",
        "views": "folder_views",
        "utils": "folder_utils",
        "lib": "folder_lib",
        "libs": "folder_lib",
        "assets": "folder_images",
        "public": "folder_public",
        "static": "folder_public",
        "styles": "folder_styles",
        "css": "folder_styles",
        "scss": "folder_sass",
        "sass": "folder_sass",
        "scripts": "folder_scripts",
        "test": "folder_tests",
        "tests": "folder_tests",
        "e2e": "folder_tests",
        "integration": "folder_tests",
        "unit": "folder_tests",
        "spec": "folder_tests",
        "specs": "folder_tests",
    },

    folderNamesExpanded: {},

    light: {},
    highContrast: {},
};
