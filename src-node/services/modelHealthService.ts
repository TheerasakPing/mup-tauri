/**
 * Model Health Check Service
 *
 * Validates model configurations by running a series of checks:
 * 1. Authentication  - Verify provider credentials are configured
 * 2. Model Exists    - Check if model ID is recognized (built-in) or custom
 * 3. Token Limits    - Validate configured limits are reasonable
 * 4. Pricing         - Sanity-check custom pricing values
 * 5. Connectivity    - Basic reachability check (provider base URL validation)
 */

import type { Config } from "@/node/config";
import { KNOWN_MODELS } from "@/common/constants/knownModels";
import { SUPPORTED_PROVIDERS, type ProviderName } from "@/common/constants/providers";
import {
    resolveProviderCredentials,
    type ProviderConfigRaw,
} from "@/node/utils/providerRequirements";
import type { CustomModelMetadata } from "@/common/orpc/schemas/api";
import * as fs from "fs";
import * as path from "path";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export type CheckStatus = "pass" | "warn" | "fail" | "skip";
export type OverallStatus = "healthy" | "warning" | "error";

export interface CheckResult {
    status: CheckStatus;
    message: string;
    details?: string;
}

export interface HealthCheckResult {
    modelId: string;
    provider: string;
    timestamp: number;
    status: OverallStatus;
    checks: {
        authentication: CheckResult;
        modelExists: CheckResult;
        tokenLimits: CheckResult;
        pricing: CheckResult;
        connectivity: CheckResult;
    };
}

// ────────────────────────────────────────────────────────────────
// Service
// ────────────────────────────────────────────────────────────────

export class ModelHealthService {
    private cache = new Map<string, HealthCheckResult>();

    constructor(private readonly config: Config) { }

    async checkModel(
        provider: string,
        modelId: string,
        customMetadata?: CustomModelMetadata,
    ): Promise<HealthCheckResult> {
        const authentication = this.checkAuthentication(provider);
        const modelExists = this.checkModelExists(provider, modelId);
        const tokenLimits = this.checkTokenLimits(customMetadata);
        const pricing = this.checkPricing(customMetadata);
        const connectivity = this.checkConnectivity(provider);

        const checks = { authentication, modelExists, tokenLimits, pricing, connectivity };

        const statuses = Object.values(checks).map((c) => c.status);
        let status: OverallStatus = "healthy";
        if (statuses.some((s) => s === "fail")) status = "error";
        else if (statuses.some((s) => s === "warn")) status = "warning";

        const result: HealthCheckResult = {
            modelId,
            provider,
            timestamp: Date.now(),
            status,
            checks,
        };

        this.cache.set(`${provider}:${modelId}`, result);
        return result;
    }

    async checkAllModels(
        models: Array<{ provider: string; modelId: string; metadata?: CustomModelMetadata }>,
    ): Promise<HealthCheckResult[]> {
        const results: HealthCheckResult[] = [];
        for (const m of models) {
            results.push(await this.checkModel(m.provider, m.modelId, m.metadata));
        }
        return results;
    }

    getLastResults(): HealthCheckResult[] {
        return Array.from(this.cache.values());
    }

    // ────────────── Individual checks ──────────────

    private checkAuthentication(provider: string): CheckResult {
        try {
            const rawConfig = this.loadProviderConfig(provider);
            if (!rawConfig) {
                return {
                    status: "warn",
                    message: "No provider config found",
                    details: "Provider section missing from providers.jsonc",
                };
            }

            if (!SUPPORTED_PROVIDERS.includes(provider as ProviderName)) {
                const hasKey = typeof rawConfig.apiKey === "string" && rawConfig.apiKey.length > 0;
                return hasKey
                    ? { status: "pass", message: "API key present (custom provider)" }
                    : { status: "warn", message: "No API key found for custom provider" };
            }

            const creds = resolveProviderCredentials(provider as ProviderName, rawConfig);
            if (creds.isConfigured) {
                return { status: "pass", message: "Credentials configured" };
            }
            return {
                status: "fail",
                message: `Missing ${creds.missingRequirement ?? "credentials"}`,
                details: `Provider "${provider}" requires ${creds.missingRequirement ?? "credentials"} to be set`,
            };
        } catch {
            return { status: "fail", message: "Error checking authentication" };
        }
    }

    private checkModelExists(provider: string, modelId: string): CheckResult {
        const fullId = `${provider}:${modelId}`;
        const known = KNOWN_MODELS[fullId];
        if (known) {
            return { status: "pass", message: "Built-in model recognized" };
        }

        const knownByAlias = Object.values(KNOWN_MODELS).find(
            (m) => m.provider === provider && m.aliases?.includes(modelId),
        );
        if (knownByAlias) {
            return { status: "pass", message: `Known model (alias of ${knownByAlias.id})` };
        }

        return {
            status: "warn",
            message: "Custom model — not in built-in registry",
            details:
                "Model may still work if the provider supports it. Verify by sending a test request.",
        };
    }

    private checkTokenLimits(customMetadata?: CustomModelMetadata): CheckResult {
        if (!customMetadata?.maxInputTokens && !customMetadata?.maxOutputTokens) {
            return { status: "skip", message: "No custom token limits configured" };
        }

        const warnings: string[] = [];

        if (customMetadata.maxInputTokens && customMetadata.maxInputTokens < 1000) {
            warnings.push(`Input token limit (${customMetadata.maxInputTokens}) seems very low`);
        }
        if (customMetadata.maxOutputTokens && customMetadata.maxOutputTokens < 100) {
            warnings.push(`Output token limit (${customMetadata.maxOutputTokens}) seems very low`);
        }
        if (
            customMetadata.maxInputTokens &&
            customMetadata.maxOutputTokens &&
            customMetadata.maxOutputTokens > customMetadata.maxInputTokens
        ) {
            warnings.push("Output limit exceeds input limit — this is unusual");
        }

        if (warnings.length > 0) {
            return {
                status: "warn",
                message: "Token limit configuration may need review",
                details: warnings.join("; "),
            };
        }
        return { status: "pass", message: "Token limits look reasonable" };
    }

    private checkPricing(customMetadata?: CustomModelMetadata): CheckResult {
        if (!customMetadata?.inputCostPerToken && !customMetadata?.outputCostPerToken) {
            return { status: "skip", message: "No custom pricing configured" };
        }

        const warnings: string[] = [];

        if (customMetadata.inputCostPerToken && customMetadata.inputCostPerToken < 0) {
            warnings.push("Input cost per token is negative");
        }
        if (customMetadata.outputCostPerToken && customMetadata.outputCostPerToken < 0) {
            warnings.push("Output cost per token is negative");
        }
        if (
            customMetadata.inputCostPerToken &&
            customMetadata.outputCostPerToken &&
            customMetadata.inputCostPerToken > customMetadata.outputCostPerToken
        ) {
            warnings.push(
                "Input cost is higher than output cost — this is unusual for most providers",
            );
        }

        if (warnings.length > 0) {
            return {
                status: "warn",
                message: "Pricing configuration may need review",
                details: warnings.join("; "),
            };
        }
        return { status: "pass", message: "Pricing looks reasonable" };
    }

    private checkConnectivity(provider: string): CheckResult {
        try {
            const rawConfig = this.loadProviderConfig(provider);
            if (!rawConfig) {
                return { status: "skip", message: "No provider config — skipping connectivity" };
            }

            if (rawConfig.baseUrl || rawConfig.baseURL) {
                const url = rawConfig.baseUrl ?? rawConfig.baseURL ?? "";
                try {
                    new URL(url);
                    return { status: "pass", message: `Custom base URL configured: ${url}` };
                } catch {
                    return {
                        status: "fail",
                        message: "Invalid base URL",
                        details: `"${url}" is not a valid URL`,
                    };
                }
            }

            return { status: "pass", message: "Using default provider endpoint" };
        } catch {
            return { status: "warn", message: "Unable to check connectivity" };
        }
    }

    // ────────────── Helpers ──────────────

    private loadProviderConfig(provider: string): ProviderConfigRaw | null {
        try {
            const providersFile = path.join(this.config.rootDir, "providers.jsonc");
            if (!fs.existsSync(providersFile)) return null;

            const raw = fs.readFileSync(providersFile, "utf-8");
            const stripped = raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
            const parsed = JSON.parse(stripped) as Record<string, unknown>;
            const providerConfig = parsed[provider];
            if (!providerConfig || typeof providerConfig !== "object") return null;

            return providerConfig as ProviderConfigRaw;
        } catch {
            return null;
        }
    }
}
