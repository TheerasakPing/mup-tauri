import { useState, useEffect, useCallback } from "react";
import { Save, Upload, Download, Trash2, FolderOpen, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAPI } from "@/contexts/API";
import type { CustomModelMetadata } from "@/common/orpc/schemas/api";

// Matches PresetModelEntry from the backend service
interface PresetModelEntry {
    provider: string;
    modelId: string;
    metadata?: CustomModelMetadata;
}

interface ModelPreset {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
    models: PresetModelEntry[];
}

type Tab = "save" | "load" | "export" | "import";

interface ModelPresetsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Current custom models — used when saving a new preset */
    currentModels: PresetModelEntry[];
    /** Called after successfully loading/importing a preset to refresh the config */
    onApplyPreset: (models: PresetModelEntry[]) => void;
}

const tabItems: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "save", label: "Save", icon: Save },
    { id: "load", label: "Load", icon: FolderOpen },
    { id: "export", label: "Export", icon: Download },
    { id: "import", label: "Import", icon: Upload },
];

export function ModelPresetsDialog({
    open,
    onOpenChange,
    currentModels,
    onApplyPreset,
}: ModelPresetsDialogProps) {
    const { api } = useAPI();
    const [tab, setTab] = useState<Tab>("save");
    const [presets, setPresets] = useState<ModelPreset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Save form state
    const [presetName, setPresetName] = useState("");
    const [presetDescription, setPresetDescription] = useState("");

    // Import state
    const [importJson, setImportJson] = useState("");

    // Export state
    const [exportedJson, setExportedJson] = useState("");

    const clearMessages = useCallback(() => {
        setError(null);
        setSuccess(null);
    }, []);

    const loadPresets = useCallback(async () => {
        if (!api) return;
        setLoading(true);
        try {
            const result = await api.modelPresets.list();
            setPresets(result);
        } catch {
            setError("Failed to load presets");
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        if (open) {
            clearMessages();
            setPresetName("");
            setPresetDescription("");
            setImportJson("");
            setExportedJson("");
            void loadPresets();
        }
    }, [open, loadPresets, clearMessages]);

    useEffect(() => {
        clearMessages();
    }, [tab, clearMessages]);

    const handleSave = async () => {
        if (!api || !presetName.trim()) return;
        clearMessages();
        setLoading(true);
        try {
            await api.modelPresets.save({
                name: presetName.trim(),
                description: presetDescription.trim() || undefined,
                models: currentModels,
            });
            setSuccess(`Preset "${presetName.trim()}" saved with ${currentModels.length} model(s)`);
            setPresetName("");
            setPresetDescription("");
            await loadPresets();
        } catch {
            setError("Failed to save preset");
        } finally {
            setLoading(false);
        }
    };

    const handleLoad = async (preset: ModelPreset) => {
        clearMessages();
        onApplyPreset(preset.models);
        setSuccess(`Applied preset "${preset.name}" with ${preset.models.length} model(s)`);
    };

    const handleDelete = async (preset: ModelPreset) => {
        if (!api) return;
        clearMessages();
        try {
            await api.modelPresets.delete({ id: preset.id });
            setSuccess(`Deleted preset "${preset.name}"`);
            await loadPresets();
        } catch {
            setError("Failed to delete preset");
        }
    };

    const handleExport = async () => {
        if (!api) return;
        clearMessages();
        setLoading(true);
        try {
            const json = await api.modelPresets.export({});
            setExportedJson(json);
            setSuccess("Presets exported — copy the JSON below");
        } catch {
            setError("Failed to export presets");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyExport = async () => {
        try {
            await navigator.clipboard.writeText(exportedJson);
            setSuccess("Copied to clipboard");
        } catch {
            setError("Failed to copy to clipboard");
        }
    };

    const handleImport = async () => {
        if (!api || !importJson.trim()) return;
        clearMessages();
        setLoading(true);
        try {
            const result = await api.modelPresets.import({ json: importJson.trim() });
            if (result.success) {
                setSuccess(`Imported ${result.data.length} preset(s)`);
                setImportJson("");
                await loadPresets();
            } else {
                setError(result.error);
            }
        } catch {
            setError("Failed to import presets");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Model Presets</DialogTitle>
                    <DialogDescription className="sr-only">
                        Save, load, export, and import model presets
                    </DialogDescription>
                </DialogHeader>

                {/* Tab navigation */}
                <div className="border-border-medium flex gap-0.5 rounded-md border p-0.5">
                    {tabItems.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors ${tab === id
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted hover:text-foreground hover:bg-background-secondary"
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Feedback messages */}
                {error && <div className="text-error rounded-md bg-red-500/10 px-3 py-2 text-xs">{error}</div>}
                {success && (
                    <div className="rounded-md bg-green-500/10 px-3 py-2 text-xs text-green-400">{success}</div>
                )}

                {/* Tab Content */}
                <div className="min-h-[160px]">
                    {/* SAVE TAB */}
                    {tab === "save" && (
                        <div className="space-y-3">
                            <div className="text-muted mb-2 text-xs">
                                Save current {currentModels.length} custom model(s) as a preset
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Preset Name</Label>
                                <Input
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                    placeholder="e.g. My Production Setup"
                                    className="h-8 text-xs"
                                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Description (optional)</Label>
                                <Input
                                    value={presetDescription}
                                    onChange={(e) => setPresetDescription(e.target.value)}
                                    placeholder="Add a note about this preset"
                                    className="h-8 text-xs"
                                />
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={loading || !presetName.trim() || currentModels.length === 0}
                                size="sm"
                                className="w-full gap-1.5"
                            >
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                Save Preset
                            </Button>
                        </div>
                    )}

                    {/* LOAD TAB */}
                    {tab === "load" && (
                        <div className="space-y-2">
                            {loading ? (
                                <div className="flex items-center justify-center gap-2 py-6">
                                    <Loader2 className="text-muted h-4 w-4 animate-spin" />
                                    <span className="text-muted text-xs">Loading presets...</span>
                                </div>
                            ) : presets.length === 0 ? (
                                <div className="text-muted py-6 text-center text-xs">
                                    No presets saved yet. Save your current models first.
                                </div>
                            ) : (
                                <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1">
                                    {presets.map((preset) => (
                                        <div
                                            key={preset.id}
                                            className="border-border-medium hover:bg-background-secondary/50 group flex items-center gap-2 rounded-md border px-3 py-2 transition-colors"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="text-foreground truncate text-xs font-medium">{preset.name}</div>
                                                {preset.description && (
                                                    <div className="text-muted truncate text-[10px]">{preset.description}</div>
                                                )}
                                                <div className="text-muted-light text-[10px]">
                                                    {preset.models.length} model(s) · {formatDate(preset.updatedAt)}
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="h-6 gap-1 px-2 text-[10px]"
                                                    onClick={() => handleLoad(preset)}
                                                >
                                                    <FolderOpen className="h-3 w-3" />
                                                    Apply
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-muted hover:text-error h-6 w-6 p-0"
                                                    onClick={() => handleDelete(preset)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* EXPORT TAB */}
                    {tab === "export" && (
                        <div className="space-y-3">
                            <div className="text-muted text-xs">
                                Export all saved presets as JSON for backup or sharing
                            </div>
                            {!exportedJson ? (
                                <Button onClick={handleExport} disabled={loading} size="sm" className="w-full gap-1.5">
                                    {loading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Download className="h-3.5 w-3.5" />
                                    )}
                                    Export All Presets
                                </Button>
                            ) : (
                                <>
                                    <textarea
                                        readOnly
                                        value={exportedJson}
                                        className="bg-background border-border-medium h-[160px] w-full resize-none rounded-md border p-2 font-mono text-[10px]"
                                    />
                                    <Button onClick={handleCopyExport} size="sm" variant="outline" className="w-full gap-1.5">
                                        Copy to Clipboard
                                    </Button>
                                </>
                            )}
                        </div>
                    )}

                    {/* IMPORT TAB */}
                    {tab === "import" && (
                        <div className="space-y-3">
                            <div className="text-muted text-xs">
                                Paste exported preset JSON below to import
                            </div>
                            <textarea
                                value={importJson}
                                onChange={(e) => setImportJson(e.target.value)}
                                placeholder='{"version":1,"presets":[...]}'
                                className="bg-background border-border-medium focus:border-accent h-[160px] w-full resize-none rounded-md border p-2 font-mono text-[10px] focus:outline-none"
                            />
                            <Button
                                onClick={handleImport}
                                disabled={loading || !importJson.trim()}
                                size="sm"
                                className="w-full gap-1.5"
                            >
                                {loading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Upload className="h-3.5 w-3.5" />
                                )}
                                Import Presets
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" size="sm">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
