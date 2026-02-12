import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import writeFileAtomic from "write-file-atomic";
import type { Config } from "@/node/config";
import type { CustomModelMetadata } from "@/common/orpc/schemas/api";
import type { Result } from "@/common/types/result";
import { log } from "./log";

// --- Data Model ---

export interface PresetModelEntry {
    provider: string;
    modelId: string;
    metadata?: CustomModelMetadata;
}

export interface ModelPreset {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
    models: PresetModelEntry[];
}

interface ModelPresetsFile {
    version: 1;
    presets: ModelPreset[];
}

const EMPTY_FILE: ModelPresetsFile = { version: 1, presets: [] };

/**
 * Service for managing model presets.
 *
 * Presets let users snapshot their model configurations and restore them later.
 * Data is stored in `~/.mux/model-presets.json` using atomic writes.
 */
export class ModelPresetsService {
    private readonly PRESETS_FILE = "model-presets.json";
    private readonly config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    private getFilePath(): string {
        return path.join(this.config.rootDir, this.PRESETS_FILE);
    }

    private async readFile(): Promise<ModelPresetsFile> {
        try {
            const data = await fs.readFile(this.getFilePath(), "utf-8");
            return JSON.parse(data) as ModelPresetsFile;
        } catch (error) {
            if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
                return { ...EMPTY_FILE };
            }
            log.warn("[ModelPresetsService] Error reading presets file", { error });
            return { ...EMPTY_FILE };
        }
    }

    private async writeFile(data: ModelPresetsFile): Promise<void> {
        const filePath = this.getFilePath();
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await writeFileAtomic(filePath, JSON.stringify(data, null, 2));
    }

    /** List all saved presets. */
    async listPresets(): Promise<ModelPreset[]> {
        const file = await this.readFile();
        return file.presets;
    }

    /** Save a new preset from the provided models. */
    async savePreset(
        name: string,
        models: PresetModelEntry[],
        description?: string
    ): Promise<ModelPreset> {
        const file = await this.readFile();
        const now = Date.now();
        const preset: ModelPreset = {
            id: crypto.randomUUID(),
            name,
            description,
            createdAt: now,
            updatedAt: now,
            models,
        };
        file.presets.push(preset);
        await this.writeFile(file);
        return preset;
    }

    /** Get a single preset by ID. */
    async getPreset(id: string): Promise<ModelPreset | undefined> {
        const file = await this.readFile();
        return file.presets.find((p) => p.id === id);
    }

    /** Delete a preset by ID. Returns success/error result. */
    async deletePreset(id: string): Promise<Result<void, string>> {
        const file = await this.readFile();
        const index = file.presets.findIndex((p) => p.id === id);
        if (index === -1) {
            return { success: false, error: `Preset not found: ${id}` };
        }
        file.presets.splice(index, 1);
        await this.writeFile(file);
        return { success: true, data: undefined };
    }

    /** Update an existing preset. */
    async updatePreset(
        id: string,
        updates: { name?: string; description?: string; models?: PresetModelEntry[] }
    ): Promise<Result<ModelPreset, string>> {
        const file = await this.readFile();
        const preset = file.presets.find((p) => p.id === id);
        if (!preset) {
            return { success: false, error: `Preset not found: ${id}` };
        }
        if (updates.name !== undefined) preset.name = updates.name;
        if (updates.description !== undefined) preset.description = updates.description;
        if (updates.models !== undefined) preset.models = updates.models;
        preset.updatedAt = Date.now();
        await this.writeFile(file);
        return { success: true, data: preset };
    }

    /**
     * Export presets as a portable JSON string.
     * If ids are provided, only those presets are exported; otherwise all.
     */
    async exportPresets(ids?: string[]): Promise<string> {
        const file = await this.readFile();
        const presets = ids ? file.presets.filter((p) => ids.includes(p.id)) : file.presets;
        const exportData = { version: 1 as const, presets };
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import presets from a JSON string. Validates structure before importing.
     * Imported presets get new IDs to avoid collisions.
     */
    async importPresets(json: string): Promise<Result<ModelPreset[], string>> {
        let parsed: unknown;
        try {
            parsed = JSON.parse(json);
        } catch {
            return { success: false, error: "Invalid JSON" };
        }

        if (!parsed || typeof parsed !== "object") {
            return { success: false, error: "Expected an object with presets array" };
        }

        const obj = parsed as Record<string, unknown>;
        if (!Array.isArray(obj.presets)) {
            return { success: false, error: "Missing or invalid 'presets' array" };
        }

        const file = await this.readFile();
        const imported: ModelPreset[] = [];
        const now = Date.now();

        for (const raw of obj.presets) {
            if (!raw || typeof raw !== "object") continue;
            const p = raw as Record<string, unknown>;

            if (typeof p.name !== "string" || !Array.isArray(p.models)) {
                continue; // skip malformed entries
            }

            const models: PresetModelEntry[] = [];
            for (const m of p.models as unknown[]) {
                if (!m || typeof m !== "object") continue;
                const model = m as Record<string, unknown>;
                if (typeof model.provider !== "string" || typeof model.modelId !== "string") continue;
                models.push({
                    provider: model.provider,
                    modelId: model.modelId,
                    metadata: model.metadata as CustomModelMetadata | undefined,
                });
            }

            const preset: ModelPreset = {
                id: crypto.randomUUID(), // new ID to avoid collision
                name: p.name as string,
                description: typeof p.description === "string" ? p.description : undefined,
                createdAt: now,
                updatedAt: now,
                models,
            };
            file.presets.push(preset);
            imported.push(preset);
        }

        if (imported.length === 0) {
            return { success: false, error: "No valid presets found in import data" };
        }

        await this.writeFile(file);
        return { success: true, data: imported };
    }
}
