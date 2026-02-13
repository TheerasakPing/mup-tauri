import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAPI } from "@/contexts/API";
import { IconThemeDocument, DEFAULT_MUP_THEME_ID } from "@/common/types/iconTheme";
import { getBrowserBackendBaseUrl } from "@/utils/backendBaseUrl";
import { MUP_DEFAULT_THEME } from "@/utils/defaultIconTheme";
import { getRootIconUrl } from "@/components/FileIcon";

interface ResolveIconOptions {
  isFolder?: boolean;
  isExpanded?: boolean;
  languageId?: string;
}

interface IconThemeContextValue {
  activeThemeId: string;
  activeThemeDocument: IconThemeDocument | null;
  resolveIconUrl: (fileName: string, options?: ResolveIconOptions) => string | undefined;
  refetchTheme: () => Promise<void>;
  isLoading: boolean;
}

const IconThemeContext = createContext<IconThemeContextValue | null>(null);

/**
 * VS Code-compatible icon resolution algorithm.
 * Priority: fileNames > fileExtensions (longest first) > languageIds > defaults
 */
function resolveIconDefinitionId(
  doc: IconThemeDocument,
  fileName: string,
  options: ResolveIconOptions = {}
): string | undefined {
  const { isFolder, isExpanded, languageId } = options;
  const lowerName = fileName.toLowerCase();

  // 1. Folder resolution
  if (isFolder) {
    if (isExpanded && doc.folderNamesExpanded?.[lowerName]) {
      return doc.folderNamesExpanded[lowerName];
    }
    if (doc.folderNames?.[lowerName]) {
      return doc.folderNames[lowerName];
    }
    // Defaults
    if (isExpanded && doc.folderExpanded) return doc.folderExpanded;
    if (doc.folder) return doc.folder;
    return undefined;
  }

  // 2. Exact filename match
  if (doc.fileNames?.[lowerName]) {
    return doc.fileNames[lowerName];
  }
  if (doc.fileNames?.[fileName]) {
    return doc.fileNames[fileName];
  }

  // 3. File extension match (longest first, e.g., "test.ts" before "ts")
  const parts = fileName.split(".");
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i++) {
      const ext = parts.slice(i).join(".").toLowerCase();
      if (doc.fileExtensions?.[ext]) {
        return doc.fileExtensions[ext];
      }
    }
  }

  // 4. Language ID match
  if (languageId && doc.languageIds?.[languageId]) {
    return doc.languageIds[languageId];
  }

  // 5. Default file icon
  if (doc.file) return doc.file;

  return undefined;
}

export const IconThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { api } = useAPI();
  const [activeThemeId, setActiveThemeId] = useState<string>(DEFAULT_MUP_THEME_ID);
  const [activeThemeDocument, setActiveThemeDocument] = useState<IconThemeDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // In Desktop mode, store the HTTP API server base URL for icon file requests.
  // Falls back to getBrowserBackendBaseUrl() (correct for browser/dev-server with proxy).
  const [iconBaseUrl, setIconBaseUrl] = useState<string>(() => getBrowserBackendBaseUrl());

  // Fetch API server URL from Desktop process on mount
  useEffect(() => {
    if (window.api?.getApiServerUrl) {
      window.api.getApiServerUrl().then((url) => {
        if (url) setIconBaseUrl(url);
      });
    }
  }, []);

  const fetchTheme = useCallback(async () => {
    if (!api) return;
    setIsLoading(true);
    try {
      const id = await api.iconTheme.getActiveThemeId();
      setActiveThemeId(id);

      if (id === DEFAULT_MUP_THEME_ID) {
        // Use bundled default theme document (no server fetch needed)
        setActiveThemeDocument(MUP_DEFAULT_THEME);
      } else {
        const doc = await api.iconTheme.getActiveThemeDocument();
        setActiveThemeDocument(doc);
      }
    } catch (err) {
      console.error("Failed to load icon theme:", err);
      // Fall back to default theme on error
      setActiveThemeDocument(MUP_DEFAULT_THEME);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const resolveIconUrl = useCallback(
    (fileName: string, options: ResolveIconOptions = {}): string | undefined => {
      const doc = activeThemeDocument;
      if (!doc) return undefined;

      const definitionId = resolveIconDefinitionId(doc, fileName, options);
      if (!definitionId) return undefined;

      const definition = doc.iconDefinitions[definitionId];
      if (!definition?.iconPath) return undefined;

      if (activeThemeId === DEFAULT_MUP_THEME_ID) {
        // Built-in theme: icon paths are SVG filenames, resolve via import.meta.glob
        return getRootIconUrl(definition.iconPath);
      }

      // Custom theme: construct URL to server-served icon file
      const iconPath = definition.iconPath.replace(/^\.\//, "");
      return `${iconBaseUrl}/icon-themes/${activeThemeId}/${iconPath}`;
    },
    [activeThemeDocument, activeThemeId, iconBaseUrl]
  );

  return (
    <IconThemeContext.Provider
      value={{
        activeThemeId,
        activeThemeDocument,
        resolveIconUrl,
        refetchTheme: fetchTheme,
        isLoading,
      }}
    >
      {children}
    </IconThemeContext.Provider>
  );
};

export const useIconTheme = () => {
  const context = useContext(IconThemeContext);
  if (!context) throw new Error("useIconTheme must be used within IconThemeProvider");
  return context;
};
