import { useCallback, useMemo, useState } from "react";
import { Loader2, Plus, ShieldCheck, Bookmark } from "lucide-react";
import { useProviderOptions } from "@/browser/hooks/useProviderOptions";
import { Button } from "@/browser/components/ui/button";
import { ProviderWithIcon } from "@/browser/components/ProviderIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/browser/components/ui/select";
import { useAPI } from "@/browser/contexts/API";
import { getSuggestedModels, useModelsFromSettings } from "@/browser/hooks/useModelsFromSettings";
import { migrateGatewayModel, useGateway } from "@/browser/hooks/useGatewayModels";
import { usePersistedState } from "@/browser/hooks/usePersistedState";
import { useProvidersConfig } from "@/browser/hooks/useProvidersConfig";
import { SearchableModelSelect } from "../components/SearchableModelSelect";
import { KNOWN_MODELS } from "@/common/constants/knownModels";
import { usePolicy } from "@/browser/contexts/PolicyContext";
import { supports1MContext } from "@/common/utils/ai/models";
import { getAllowedProvidersForUi, isModelAllowedByPolicy } from "@/browser/utils/policyUi";
import {
  LAST_CUSTOM_MODEL_PROVIDER_KEY,
  PREFERRED_COMPACTION_MODEL_KEY,
} from "@/common/constants/storage";
import { ModelRow } from "./ModelRow";
import { EditModelDialog } from "./EditModelDialog";
import { ModelPresetsDialog } from "./ModelPresetsDialog";
import { HealthCheckDialog } from "./HealthCheckDialog";
import { CustomModelMetadata } from "@/common/orpc/schemas/api";

// Providers to exclude from the custom models UI (handled specially or internal)
const HIDDEN_PROVIDERS = new Set(["mux-gateway"]);

// Shared header cell styles
const headerCellBase = "py-1.5 pr-2 text-xs font-medium text-muted";

// Table header component to avoid duplication
function ModelsTableHeader() {
  return (
    <thead>
      <tr className="border-border-medium bg-background-secondary/50 border-b">
        <th className={`${headerCellBase} pl-2 text-left md:pl-3`}>Provider</th>
        <th className={`${headerCellBase} text-left`}>Model</th>
        <th className={`${headerCellBase} w-16 text-right md:w-20`}>Context</th>
        <th className={`${headerCellBase} w-28 text-right md:w-32 md:pr-3`}>Actions</th>
      </tr>
    </thead>
  );
}

interface EditingState {
  provider: string;
  originalModelId: string;
  metadata?: CustomModelMetadata;
}

export function ModelsSection() {
  const policyState = usePolicy();
  const effectivePolicy =
    policyState.status.state === "enforced" ? (policyState.policy ?? null) : null;
  const visibleProviders = useMemo(
    () => getAllowedProvidersForUi(effectivePolicy),
    [effectivePolicy]
  );

  const { api } = useAPI();
  const { config, loading, updateModelsOptimistically } = useProvidersConfig();
  const [lastProvider, setLastProvider] = usePersistedState(LAST_CUSTOM_MODEL_PROVIDER_KEY, "");
  const [newModelId, setNewModelId] = useState("");
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [healthCheckTarget, setHealthCheckTarget] = useState<{
    provider: string;
    modelId: string;
    metadata?: CustomModelMetadata;
  } | null>(null);

  const selectableProviders = visibleProviders.filter(
    (provider) => !HIDDEN_PROVIDERS.has(provider)
  );
  const { defaultModel, setDefaultModel, hiddenModels, hideModel, unhideModel } =
    useModelsFromSettings();
  const gateway = useGateway();
  const { has1MContext, toggle1MContext } = useProviderOptions();

  // Compaction model preference
  const [compactionModel, setCompactionModel] = usePersistedState<string>(
    PREFERRED_COMPACTION_MODEL_KEY,
    "",
    { listener: true }
  );

  const setCompactionModelAndPersist = useCallback(
    (value: string) => {
      const canonical = migrateGatewayModel(value).trim();
      setCompactionModel(canonical);

      if (!api?.config?.updateModelPreferences) {
        return;
      }

      api.config.updateModelPreferences({ preferredCompactionModel: canonical }).catch(() => {
        // Best-effort only.
      });
    },
    [api, setCompactionModel]
  );

  // All models (including hidden) for the settings dropdowns.
  // PolicyService enforces model access on the backend, but we also filter here so users can't
  // select models that will be denied at send time.
  const allModels = getSuggestedModels(config);
  const selectableModels = effectivePolicy
    ? allModels.filter((model) => isModelAllowedByPolicy(effectivePolicy, model))
    : allModels;

  // Check if a model already exists (for duplicate prevention)
  const modelExists = useCallback(
    (provider: string, modelId: string, excludeOriginal?: string): boolean => {
      if (!config) return false;
      const currentModels = config[provider]?.models ?? [];
      return currentModels.some((m) => m === modelId && m !== excludeOriginal);
    },
    [config]
  );

  const handleAddModel = useCallback(() => {
    if (!config || !lastProvider || !newModelId.trim()) return;

    // mux-gateway is a routing layer, not a provider users should add models under.
    if (HIDDEN_PROVIDERS.has(lastProvider)) {
      setError("Mux Gateway models can't be added directly. Enable Gateway per-model instead.");
      return;
    }
    const trimmedModelId = newModelId.trim();

    // Check for duplicates
    if (modelExists(lastProvider, trimmedModelId)) {
      setError(`Model "${trimmedModelId}" already exists for this provider`);
      return;
    }

    if (!api) return;
    setError(null);

    // Optimistic update - returns new models array for API call
    const updatedModels = updateModelsOptimistically(lastProvider, (models) => [
      ...models,
      trimmedModelId,
    ]);
    setNewModelId("");

    // Save in background
    void api.providers.setModels({ provider: lastProvider, models: updatedModels });
  }, [api, lastProvider, newModelId, config, modelExists, updateModelsOptimistically]);

  const handleRemoveModel = useCallback(
    (provider: string, modelId: string) => {
      if (!config || !api) return;

      // Optimistic update - returns new models array for API call
      const updatedModels = updateModelsOptimistically(provider, (models) =>
        models.filter((m) => m !== modelId)
      );

      // Save in background
      void api.providers.setModels({ provider, models: updatedModels });
    },
    [api, config, updateModelsOptimistically]
  );

  const handleStartEdit = useCallback(
    (provider: string, modelId: string) => {
      const metadata = config?.[provider]?.modelMetadata?.[modelId];
      setEditing({ provider, originalModelId: modelId, metadata });
      setError(null);
    },
    [config]
  );

  const handleSaveEdit = useCallback(
    (newModelId: string, metadata: CustomModelMetadata) => {
      if (!config || !editing || !api) return;

      const trimmedModelId = newModelId.trim();
      if (!trimmedModelId) {
        setError("Model ID cannot be empty");
        return;
      }

      // Check for duplicates if ID changed
      if (trimmedModelId !== editing.originalModelId) {
        if (modelExists(editing.provider, trimmedModelId)) {
          // We can't easily show error in dialog from here without more state.
          // For now, let's just alert or log, or better, we could pass an error callback to dialog.
          // But ModelsSection structure is top-level.
          // Let's assume validation happens or we just fail.
          // Ideally EditModelDialog should handle validation before calling onSave.
          // But duplicate check requires access to all models.
          console.error(`Model "${trimmedModelId}" already exists for this provider`);
          return;
        }
      }

      setError(null);

      // If ID changed, we need to update the models list
      if (trimmedModelId !== editing.originalModelId) {
        const updatedModels = updateModelsOptimistically(editing.provider, (models) =>
          models.map((m) => (m === editing.originalModelId ? trimmedModelId : m))
        );
        void api.providers.setModels({ provider: editing.provider, models: updatedModels });
      }

      // Save metadata (always, as it might have changed)
      // Note: If ID changed, we should probably delete old metadata?
      // The backend setModelMetadata acts on the modelID passed.
      // If we rename, we effectively create a new model entry.
      // We should save metadata for the *new* ID.
      // Old metadata might become orphaned in config, but that's acceptable for now (or backend cleans it up).

      void api.providers.setModelMetadata({
        provider: editing.provider,
        modelId: trimmedModelId,
        metadata,
      });

      setEditing(null);
    },
    [api, editing, config, modelExists, updateModelsOptimistically]
  );

  // Show loading state while config is being fetched
  if (loading || !config) {
    return (
      <div className="flex items-center justify-center gap-2 py-12">
        <Loader2 className="text-muted h-5 w-5 animate-spin" />
        <span className="text-muted text-sm">Loading settings...</span>
      </div>
    );
  }

  // Get all custom models across providers (excluding hidden providers like mux-gateway)
  const getCustomModels = (): Array<{
    provider: string;
    modelId: string;
    fullId: string;
    metadata?: CustomModelMetadata;
  }> => {
    const models: Array<{
      provider: string;
      modelId: string;
      fullId: string;
      metadata?: CustomModelMetadata;
    }> = [];
    for (const [provider, providerConfig] of Object.entries(config)) {
      // Skip hidden providers (mux-gateway models are accessed via the cloud toggle, not listed separately)
      if (HIDDEN_PROVIDERS.has(provider)) continue;
      if (providerConfig.models) {
        for (const modelId of providerConfig.models) {
          models.push({
            provider,
            modelId,
            fullId: `${provider}:${modelId}`,
            metadata: providerConfig.modelMetadata?.[modelId],
          });
        }
      }
    }
    return models;
  };

  const builtInModels = Object.values(KNOWN_MODELS)
    .map((model) => ({
      provider: model.provider,
      modelId: model.providerModelId,
      fullId: model.id,
      aliases: model.aliases,
    }))
    .filter((model) => isModelAllowedByPolicy(effectivePolicy, model.fullId));

  const customModels = getCustomModels();

  return (
    <div className="space-y-4">
      {policyState.status.state === "enforced" && (
        <div className="border-border-medium bg-background-secondary/50 text-muted flex items-center gap-2 rounded-md border px-3 py-2 text-xs">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          <span>Your settings are controlled by a policy.</span>
        </div>
      )}

      {/* Model Defaults - styled to match table aesthetic */}
      <div className="border-border-medium overflow-hidden rounded-md border">
        {/* Header row - matches table header */}
        <div className="border-border-medium bg-background-secondary/50 border-b px-2 py-1.5 md:px-3">
          <span className="text-muted text-xs font-medium">Model Defaults</span>
        </div>
        {/* Content rows - match table row styling */}
        <div className="divide-border-medium divide-y">
          {/* Default Model row */}
          <div className="flex items-center gap-4 px-2 py-2 md:px-3">
            <div className="w-28 shrink-0 md:w-32">
              <div className="text-muted text-xs">Default Model</div>
              <div className="text-muted-light text-[10px]">New workspaces</div>
            </div>
            <div className="min-w-0 flex-1">
              <SearchableModelSelect
                value={defaultModel}
                onChange={setDefaultModel}
                models={selectableModels}
                placeholder="Select model"
              />
            </div>
          </div>
          {/* Compaction Model row */}
          <div className="flex items-center gap-4 px-2 py-2 md:px-3">
            <div className="w-28 shrink-0 md:w-32">
              <div className="text-muted text-xs">Compaction Model</div>
              <div className="text-muted-light text-[10px]">History summary</div>
            </div>
            <div className="min-w-0 flex-1">
              <SearchableModelSelect
                value={compactionModel}
                onChange={setCompactionModelAndPersist}
                models={selectableModels}
                emptyOption={{ value: "", label: "Use workspace model" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Models */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-muted text-xs font-medium tracking-wide uppercase">Custom Models</div>
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={() => setPresetsOpen(true)}
          >
            <Bookmark className="h-3 w-3" />
            Presets
          </Button>
        </div>

        {/* Add new model form - styled to match table */}
        <div className="border-border-medium overflow-hidden rounded-md border">
          <div className="border-border-medium bg-background-secondary/50 flex flex-wrap items-center gap-1.5 border-b px-2 py-1.5 md:px-3">
            <Select value={lastProvider} onValueChange={setLastProvider}>
              <SelectTrigger className="bg-background border-border-medium focus:border-accent h-7 w-auto shrink-0 rounded border px-2 text-xs">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {selectableProviders.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    <ProviderWithIcon provider={provider} displayName />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="text"
              value={newModelId}
              onChange={(e) => setNewModelId(e.target.value)}
              placeholder="model-id"
              className="bg-background border-border-medium focus:border-accent min-w-0 flex-1 rounded border px-2 py-1 font-mono text-xs focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAddModel();
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddModel}
              disabled={!lastProvider || !newModelId.trim()}
              className="h-7 shrink-0 gap-1 px-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          {error && <div className="text-error px-2 py-1.5 text-xs md:px-3">{error}</div>}
        </div>

        {/* Table of custom models */}
        {customModels.length > 0 && (
          <div className="border-border-medium overflow-hidden rounded-md border">
            <table className="w-full">
              <ModelsTableHeader />
              <tbody>
                {customModels.map((model) => (
                  <ModelRow
                    key={model.fullId}
                    provider={model.provider}
                    modelId={model.modelId}
                    fullId={model.fullId}
                    isCustom={true}
                    isDefault={defaultModel === model.fullId}
                    customMetadata={model.metadata}
                    isGatewayEnabled={gateway.modelUsesGateway(model.fullId)}
                    is1MContextEnabled={has1MContext(model.fullId)}
                    onSetDefault={() => setDefaultModel(model.fullId)}
                    onStartEdit={() => handleStartEdit(model.provider, model.modelId)}
                    onRemove={() => handleRemoveModel(model.provider, model.modelId)}
                    isHiddenFromSelector={hiddenModels.includes(model.fullId)}
                    onToggleVisibility={() =>
                      hiddenModels.includes(model.fullId)
                        ? unhideModel(model.fullId)
                        : hideModel(model.fullId)
                    }
                    onToggleGateway={
                      gateway.canToggleModel(model.fullId)
                        ? () => gateway.toggleModelGateway(model.fullId)
                        : undefined
                    }
                    onToggle1MContext={
                      supports1MContext(model.fullId)
                        ? () => toggle1MContext(model.fullId)
                        : undefined
                    }
                    onHealthCheck={() =>
                      setHealthCheckTarget({
                        provider: model.provider,
                        modelId: model.modelId,
                        metadata: model.metadata,
                      })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <EditModelDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          provider={editing.provider}
          modelId={editing.originalModelId}
          initialMetadata={editing.metadata}
          onSave={handleSaveEdit}
        />
      )}

      <ModelPresetsDialog
        open={presetsOpen}
        onOpenChange={setPresetsOpen}
        currentModels={customModels.map((m) => ({
          provider: m.provider,
          modelId: m.modelId,
          metadata: m.metadata,
        }))}
        onApplyPreset={(presetModels) => {
          if (!api) return;
          // Apply preset — set models for each provider
          const byProvider = new Map<string, { modelId: string; metadata?: CustomModelMetadata }[]>();
          for (const m of presetModels) {
            const list = byProvider.get(m.provider) ?? [];
            list.push({ modelId: m.modelId, metadata: m.metadata });
            byProvider.set(m.provider, list);
          }
          for (const [provider, entries] of byProvider) {
            const modelIds = entries.map((e) => e.modelId);
            void api.providers.setModels({ provider, models: modelIds });
            for (const entry of entries) {
              if (entry.metadata) {
                void api.providers.setModelMetadata({
                  provider,
                  modelId: entry.modelId,
                  metadata: entry.metadata,
                });
              }
            }
          }
        }}
      />

      {healthCheckTarget && (
        <HealthCheckDialog
          open={!!healthCheckTarget}
          onOpenChange={(open) => !open && setHealthCheckTarget(null)}
          provider={healthCheckTarget.provider}
          modelId={healthCheckTarget.modelId}
          metadata={healthCheckTarget.metadata}
        />
      )}
      {/* Built-in Models */}
      <div className="space-y-3">
        <div className="text-muted text-xs font-medium tracking-wide uppercase">
          Built-in Models
        </div>
        <div className="border-border-medium overflow-hidden rounded-md border">
          <table className="w-full">
            <ModelsTableHeader />
            <tbody>
              {builtInModels.map((model) => (
                <ModelRow
                  key={model.fullId}
                  provider={model.provider}
                  modelId={model.modelId}
                  fullId={model.fullId}
                  aliases={model.aliases}
                  isCustom={false}
                  isDefault={defaultModel === model.fullId}
                  isGatewayEnabled={gateway.modelUsesGateway(model.fullId)}
                  is1MContextEnabled={has1MContext(model.fullId)}
                  onSetDefault={() => setDefaultModel(model.fullId)}
                  isHiddenFromSelector={hiddenModels.includes(model.fullId)}
                  onToggleVisibility={() =>
                    hiddenModels.includes(model.fullId)
                      ? unhideModel(model.fullId)
                      : hideModel(model.fullId)
                  }
                  onToggleGateway={
                    gateway.canToggleModel(model.fullId)
                      ? () => gateway.toggleModelGateway(model.fullId)
                      : undefined
                  }
                  onToggle1MContext={
                    supports1MContext(model.fullId)
                      ? () => toggle1MContext(model.fullId)
                      : undefined
                  }
                  onHealthCheck={() =>
                    setHealthCheckTarget({
                      provider: model.provider,
                      modelId: model.modelId,
                    })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Oneshot Tips */}
      <div className="space-y-2">
        <div className="text-muted text-xs font-medium tracking-wide uppercase">
          Quick Shortcuts
        </div>
        <div className="border-border-medium bg-background-secondary/50 rounded-md border px-3 py-2.5 text-xs leading-relaxed">
          <p className="text-foreground mb-1.5 font-medium">
            Use model aliases as slash commands for one-shot overrides:
          </p>
          <div className="text-muted space-y-0.5 font-mono">
            <div>
              <span className="text-accent">/sonnet</span> explain this code
              <span className="text-muted/60 ml-2">— send one message with Sonnet</span>
            </div>
            <div>
              <span className="text-accent">/opus+high</span> deep review
              <span className="text-muted/60 ml-2">— Opus with high thinking</span>
            </div>
            <div>
              <span className="text-accent">/haiku+0</span> quick answer
              <span className="text-muted/60 ml-2">— Haiku with thinking off</span>
            </div>
            <div>
              <span className="text-accent">/+2</span> analyze this
              <span className="text-muted/60 ml-2">— current model, thinking level 2</span>
            </div>
          </div>
          <p className="text-muted mt-1.5">
            Numeric levels are relative to each model (0=lowest allowed, 1=next, etc.). Named
            levels: off, low, med, high, max.
          </p>
        </div>
      </div>
    </div>
  );
}
