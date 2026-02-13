import React, { useState, useCallback, useEffect, useRef } from "react";
import { Upload, Trash2, Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAPI } from "@/contexts/API";
import { useIconTheme } from "@/contexts/IconThemeContext";
import type { InstalledIconTheme } from "@/common/types/iconTheme";
import { DEFAULT_MUP_THEME_ID } from "@/common/types/iconTheme";

export function AppearanceSection() {
  const { api } = useAPI();
  const { activeThemeId, refetchTheme } = useIconTheme();

  const [installedThemes, setInstalledThemes] = useState<InstalledIconTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchThemes = useCallback(async () => {
    if (!api) return;
    setIsLoading(true);
    try {
      const themes = await api.iconTheme.getInstalledThemes();
      setInstalledThemes(themes);
    } catch (err) {
      console.error("Failed to load themes:", err);
      setError("Failed to load installed themes.");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  // Auto-clear success message
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleActivateTheme = useCallback(
    async (themeId: string) => {
      if (!api) return;
      setError(null);
      try {
        await api.iconTheme.setActiveTheme({ themeId });
        await refetchTheme();
        setSuccessMessage(`Theme activated!`);
        await fetchThemes();
      } catch {
        setError("Failed to activate theme.");
      }
    },
    [api, fetchThemes, refetchTheme]
  );

  const handleDeleteTheme = useCallback(
    async (themeId: string, label: string) => {
      if (!api) return;
      const confirmed = confirm(`Delete icon theme "${label}"? This cannot be undone.`);
      if (!confirmed) return;

      setError(null);
      try {
        await api.iconTheme.deleteTheme({ themeId });
        setSuccessMessage(`"${label}" deleted.`);
        await fetchThemes();
      } catch {
        setError("Failed to delete theme.");
      }
    },
    [api, fetchThemes]
  );

  const handleImportVsix = useCallback(
    async (file: File) => {
      if (!api) return;
      setIsImporting(true);
      setError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        const result = await api.iconTheme.importVsix({ vsixBase64: base64 });

        if (result.errors.length > 0) {
          setError(`Import warnings: ${result.errors.join(", ")}`);
        }

        if (result.importedThemeIds.length > 0) {
          setSuccessMessage(
            `Imported ${result.importedThemeIds.length} theme(s): ${result.importedThemeIds.join(", ")}`
          );
          // Auto-activate the first imported theme
          await api.iconTheme.setActiveTheme({ themeId: result.importedThemeIds[0] });
          await refetchTheme();
          await fetchThemes();
        } else if (result.errors.length === 0) {
          setError("No icon themes found in the .vsix file.");
        }
      } catch (err) {
        console.error("Import failed:", err);
        setError(
          "Failed to import .vsix file. Make sure it's a valid VS Code icon theme extension."
        );
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [api, fetchThemes, refetchTheme]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      void handleImportVsix(file);
    },
    [handleImportVsix]
  );

  return (
    <div className="space-y-6">
      {/* Icon Theme Section */}
      <div>
        <h3 className="text-foreground text-sm font-medium">Icon Theme</h3>
        <div className="text-muted mt-1 text-xs">
          Choose which icon theme to use for file and folder icons. Import .vsix files from VS Code
          Marketplace extensions.
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
          {successMessage}
        </div>
      )}

      {/* Theme List */}
      {isLoading ? (
        <div className="text-muted text-sm">Loading themes…</div>
      ) : (
        <div className="space-y-2">
          {/* Default MUP theme (always first) */}
          <ThemeCard
            id={DEFAULT_MUP_THEME_ID}
            label="MUP Default"
            description="Built-in file icons"
            isActive={activeThemeId === DEFAULT_MUP_THEME_ID}
            isBuiltin
            onActivate={() => void handleActivateTheme(DEFAULT_MUP_THEME_ID)}
          />

          {/* User-installed themes */}
          {installedThemes
            .filter((t) => !t.isBuiltin)
            .map((theme) => (
              <ThemeCard
                key={theme.id}
                id={theme.id}
                label={theme.label}
                description={
                  [theme.publisher, theme.version && `v${theme.version}`]
                    .filter(Boolean)
                    .join(" • ") || undefined
                }
                isActive={activeThemeId === theme.id}
                isBuiltin={false}
                onActivate={() => void handleActivateTheme(theme.id)}
                onDelete={() => void handleDeleteTheme(theme.id, theme.label)}
              />
            ))}
        </div>
      )}

      {/* Import Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".vsix"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={isImporting}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isImporting ? "Importing…" : "Import .vsix Icon Theme"}
        </Button>
      </div>
    </div>
  );
}

/** Individual theme card */
function ThemeCard({
  id,
  label,
  description,
  isActive,
  isBuiltin,
  onActivate,
  onDelete,
}: {
  id: string;
  label: string;
  description?: string;
  isActive: boolean;
  isBuiltin: boolean;
  onActivate: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`border-border-medium bg-background-secondary flex items-center justify-between gap-3 rounded border px-3 py-2 ${
        isActive ? "ring-accent/40 ring-1" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Palette className={`h-4 w-4 shrink-0 ${isActive ? "text-accent" : "text-muted"}`} />
        <div className="min-w-0">
          <div className="text-foreground flex items-center gap-2 text-sm font-medium">
            <span className="truncate">{label}</span>
            {isActive && (
              <span className="bg-accent/20 text-accent shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                Active
              </span>
            )}
          </div>
          {description && <div className="text-muted truncate text-xs">{description}</div>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!isActive && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onActivate}>
            <Check className="mr-1 h-3 w-3" />
            Activate
          </Button>
        )}
        {!isBuiltin && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted hover:text-red-400"
            onClick={onDelete}
            aria-label={`Delete ${label}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
