import React, { useMemo } from "react";
import { cn } from "@/common/lib/utils";

// Import all SVGs as URLs from root icons directory
// The keys will be like "../../../icons/name.svg"
const iconUrls = import.meta.glob("../../../icons/*.svg", {
  eager: true,
  import: "default",
});

// Helper to get URL from relative icon name (e.g., "angular.svg")
export const getRootIconUrl = (iconName: string): string | undefined => {
  const key = `../../../icons/${iconName}`;
  const url = iconUrls[key] as string;

  // Debug logging
  if (!url) {
    console.warn(`[FileIcon] Icon not found: ${iconName}`);
    console.log('[FileIcon] Available keys:', Object.keys(iconUrls).slice(0, 10));
  } else {
    console.log(`[FileIcon] Loaded icon: ${iconName} -> ${url}`);
  }

  return url;
};

// Icon mapping for root icons
const FILE_EXTENSION_ICONS: Record<string, string> = {
  // Programming languages
  "ts": "typescript.svg",
  "tsx": "typescript_react.svg",
  "js": "javascript.svg",
  "jsx": "javascript_react.svg",
  "py": "python.svg",
  "rs": "rust.svg",
  "go": "go.svg",
  "java": "java.svg",
  "cpp": "cpp.svg",
  "c": "c.svg",
  "cs": "csharp.svg",
  "php": "php.svg",
  "rb": "ruby.svg",
  "swift": "swift.svg",
  "kt": "kotlin.svg",
  "scala": "scala.svg",
  "dart": "dart.svg",
  "lua": "lua.svg",
  "r": "r.svg",
  "m": "matlab.svg",
  "sh": "bash.svg",
  "ps1": "powershell.svg",
  "bat": "bat.svg",
  
  // Web technologies
  "html": "html.svg",
  "css": "css.svg",
  "scss": "sass.svg",
  "sass": "sass.svg",
  "less": "less.svg",
  "vue": "vue.svg",
  "svelte": "svelte.svg",
  "json": "json.svg",
  "xml": "xml.svg",
  "yaml": "yaml.svg",
  "yml": "yaml.svg",
  "toml": "toml.svg",
  "md": "markdown.svg",
  "mdx": "markdown_mdx.svg",
  
  // Config files
  "eslintrc": "eslint.svg",
  "eslintrc.js": "eslint.svg",
  "eslintrc.json": "eslint.svg",
  "prettierrc": "prettier.svg",
  "prettierrc.js": "prettier.svg",
  "prettierrc.json": "prettier.svg",
  "editorconfig": "editorconfig.svg",
  "gitignore": "git.svg",
  "dockerfile": "docker.svg",
  "docker-compose.yml": "docker_compose.svg",
  "docker-compose.yaml": "docker_compose.svg",
  "package.json": "package_json.svg",
  "package-lock.json": "npm_lock.svg",
  "yarn.lock": "yarn_lock.svg",
  "bun.lockb": "bun_lock.svg",
  "tsconfig.json": "typescript_config.svg",
  "jsconfig.json": "javascript_config.svg",
  "vite.config.js": "vite.svg",
  "vite.config.ts": "vite.svg",
  "webpack.config.js": "webpack.svg",
  "tailwind.config.js": "tailwind.svg",
  "next.config.js": "next.svg",
  "nuxt.config.js": "nuxt.svg",
  
  // File types
  "png": "image.svg",
  "jpg": "image.svg",
  "jpeg": "image.svg",
  "gif": "image.svg",
  "svg": "svg.svg",
  "pdf": "pdf.svg",
  "zip": "zip.svg",
  "tar": "zip.svg",
  "gz": "zip.svg",
  "mp4": "video.svg",
  "mp3": "audio.svg",
  "wav": "audio.svg",
  "txt": "txt.svg",
  "log": "log.svg",
  "csv": "csv.svg",
};

const FILENAME_ICONS: Record<string, string> = {
  "README": "readme.svg",
  "readme": "readme.svg",
  "LICENSE": "license.svg",
  "license": "license.svg",
  "CONTRIBUTING": "contributing.svg",
  "contributing": "contributing.svg",
  "CHANGELOG": "changelog.svg",
  "changelog": "changelog.svg",
  "Dockerfile": "docker.svg",
  "dockerfile": "docker.svg",
  "Makefile": "makefile.svg",
  "makefile": "makefile.svg",
  ".gitignore": "git.svg",
  ".eslintrc": "eslint.svg",
  ".prettierrc": "prettier.svg",
  ".editorconfig": "editorconfig.svg",
};

const FOLDER_ICONS: Record<string, string> = {
  "src": "folder_src.svg",
  "components": "folder_components.svg",
  "pages": "folder_views.svg",
  "views": "folder_views.svg",
  "utils": "folder_utils.svg",
  "lib": "folder_lib.svg",
  "libs": "folder_lib.svg",
  "assets": "folder_images.svg",
  "public": "folder_public.svg",
  "static": "folder_public.svg",
  "styles": "folder_styles.svg",
  "css": "folder_styles.svg",
  "scss": "folder_sass.svg",
  "sass": "folder_sass.svg",
  "scripts": "folder_scripts.svg",
  "test": "folder_tests.svg",
  "e2e": "folder_tests.svg",
  "integration": "folder_tests.svg",
  "unit": "folder_tests.svg",
  "spec": "folder_tests.svg",
  "specs": "folder_tests.svg",
};

const DEFAULT_FILE_ICON = "file.svg";
const DEFAULT_FOLDER_ICON = "folder.svg";

const resolveIconName = (fileName: string, isFolder: boolean = false): string | undefined => {
  const lowerName = fileName.toLowerCase();
  
  if (isFolder) {
    // Check for specific folder icons first
    if (FOLDER_ICONS[fileName]) {
      return FOLDER_ICONS[fileName];
    }
    if (FOLDER_ICONS[lowerName]) {
      return FOLDER_ICONS[lowerName];
    }
    // Fallback to default folder
    return DEFAULT_FOLDER_ICON;
  }
  
  // 1. Check exact filename first
  if (FILENAME_ICONS[fileName]) return FILENAME_ICONS[fileName];
  if (FILENAME_ICONS[lowerName]) return FILENAME_ICONS[lowerName];
  
  // 2. Check extensions
  const parts = fileName.split(".");
  if (parts.length > 1) {
    // Try matching all possible extensions from longest to shortest
    // e.g. "foo.test.ts" -> "test.ts", "ts"
    for (let i = 1; i < parts.length; i++) {
      const ext = parts.slice(i).join(".");
      if (FILE_EXTENSION_ICONS[ext]) {
        return FILE_EXTENSION_ICONS[ext];
      }
    }
  }
  
  // 3. Fallback to default file
  return DEFAULT_FILE_ICON;
};

export interface FileIconProps {
  fileName?: string | null;
  filePath?: string | null;
  className?: string;
  style?: React.CSSProperties;
  /**
   * If true, treat as a folder.
   * Currently FileIcon is mostly for files, but we support folder defaults.
   */
  isFolder?: boolean;
}

export const FileIcon: React.FC<FileIconProps> = ({
  fileName,
  filePath,
  className,
  style,
  isFolder,
}) => {
  const targetName = fileName ?? (filePath ? (filePath.split("/").pop() ?? "") : "");

  const iconSrc = useMemo(() => {
    if (isFolder) {
      const iconName = resolveIconName(targetName, true);
      return iconName ? getRootIconUrl(iconName) : undefined;
    }

    const iconName = resolveIconName(targetName, false);
    return iconName ? getRootIconUrl(iconName) : undefined;
  }, [targetName, isFolder]);

  if (!iconSrc) {
    return null;
  }

  return (
    <img
      src={iconSrc}
      alt={targetName}
      className={cn("select-none w-[1em] h-[1em]", className)}
      style={{
        // Ensure it behaves like an icon
        display: "inline-block",
        verticalAlign: "middle",
        ...style,
      }}
    />
  );
};
