import * as fs from "fs/promises";
import * as path from "path";
import writeFileAtomic from "write-file-atomic";
import type { Config } from "@/node/config";
import { log } from "./log";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CostEntry {
    timestamp: number;
    workspaceId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    cacheCreateTokens: number;
    reasoningTokens: number;
    cost: number; // USD
}

export interface DailySummary {
    date: string; // "YYYY-MM-DD"
    totalCost: number;
    requestCount: number;
    byModel: Record<string, { cost: number; requests: number; tokens: number }>;
}

interface CostHistoryFile {
    version: 1;
    entries: CostEntry[];
    dailySummaries: Record<string, DailySummary>;
}

export interface CostHistoryRange {
    start?: number; // timestamp
    end?: number;   // timestamp
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const EMPTY_FILE: CostHistoryFile = { version: 1, entries: [], dailySummaries: {} };
const DEFAULT_RETENTION_DAYS = 90;

export class CostTrackingService {
    private readonly filePath: string;

    constructor(config: Config) {
        this.filePath = path.join(config.rootDir, "cost-history.json");
    }

    // -- Read / Write ---------------------------------------------------------

    private async read(): Promise<CostHistoryFile> {
        try {
            const raw = await fs.readFile(this.filePath, "utf-8");
            const data = JSON.parse(raw) as CostHistoryFile;
            if (data.version !== 1) return { ...EMPTY_FILE };
            return data;
        } catch {
            return { ...EMPTY_FILE };
        }
    }

    private async write(data: CostHistoryFile): Promise<void> {
        const dir = path.dirname(this.filePath);
        await fs.mkdir(dir, { recursive: true });
        await writeFileAtomic(this.filePath, JSON.stringify(data, null, 2));
    }

    // -- Public API -----------------------------------------------------------

    /**
     * Record a cost entry from a completed stream.
     * Also updates the daily summary atomically.
     */
    async recordCost(entry: CostEntry): Promise<void> {
        const data = await this.read();
        data.entries.push(entry);

        // Update daily summary
        const dateKey = new Date(entry.timestamp).toISOString().slice(0, 10);
        const summary = data.dailySummaries[dateKey] ?? {
            date: dateKey,
            totalCost: 0,
            requestCount: 0,
            byModel: {},
        };

        summary.totalCost += entry.cost;
        summary.requestCount += 1;

        const modelSummary = summary.byModel[entry.model] ?? { cost: 0, requests: 0, tokens: 0 };
        modelSummary.cost += entry.cost;
        modelSummary.requests += 1;
        modelSummary.tokens +=
            entry.inputTokens + entry.outputTokens + entry.cachedTokens + entry.reasoningTokens;
        summary.byModel[entry.model] = modelSummary;

        data.dailySummaries[dateKey] = summary;

        await this.write(data);
    }

    /**
     * Get cost entries within a time range.
     */
    async getCostHistory(range?: CostHistoryRange): Promise<CostEntry[]> {
        const data = await this.read();
        if (!range?.start && !range?.end) return data.entries;
        return data.entries.filter((e) => {
            if (range.start && e.timestamp < range.start) return false;
            if (range.end && e.timestamp > range.end) return false;
            return true;
        });
    }

    /**
     * Get daily summaries within a date range.
     */
    async getDailySummaries(
        startDate?: string,
        endDate?: string,
    ): Promise<DailySummary[]> {
        const data = await this.read();
        const summaries = Object.values(data.dailySummaries).sort(
            (a, b) => a.date.localeCompare(b.date),
        );
        if (!startDate && !endDate) return summaries;
        return summaries.filter((s) => {
            if (startDate && s.date < startDate) return false;
            if (endDate && s.date > endDate) return false;
            return true;
        });
    }

    /**
     * Get per-model cost breakdown for the given range.
     */
    async getModelBreakdown(
        range?: CostHistoryRange,
    ): Promise<Record<string, { cost: number; requests: number; tokens: number }>> {
        const entries = await this.getCostHistory(range);
        const breakdown: Record<string, { cost: number; requests: number; tokens: number }> = {};
        for (const e of entries) {
            const m = breakdown[e.model] ?? { cost: 0, requests: 0, tokens: 0 };
            m.cost += e.cost;
            m.requests += 1;
            m.tokens += e.inputTokens + e.outputTokens + e.cachedTokens + e.reasoningTokens;
            breakdown[e.model] = m;
        }
        return breakdown;
    }

    /**
     * Remove entries older than retentionDays from the file.
     */
    async pruneOldEntries(retentionDays: number = DEFAULT_RETENTION_DAYS): Promise<number> {
        const data = await this.read();
        const cutoff = Date.now() - retentionDays * 86_400_000;
        const cutoffDate = new Date(cutoff).toISOString().slice(0, 10);
        const before = data.entries.length;
        data.entries = data.entries.filter((e) => e.timestamp >= cutoff);

        // Prune daily summaries too
        for (const key of Object.keys(data.dailySummaries)) {
            if (key < cutoffDate) delete data.dailySummaries[key];
        }

        const pruned = before - data.entries.length;
        if (pruned > 0) {
            await this.write(data);
            log.info(`Pruned ${pruned} old cost entries (retention: ${retentionDays}d)`);
        }
        return pruned;
    }

    /**
     * Get summary totals for today, this week, and this month.
     */
    async getSummaryTotals(): Promise<{
        today: number;
        thisWeek: number;
        thisMonth: number;
        previousDay: number;
        previousWeek: number;
        previousMonth: number;
    }> {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);

        // Week start (Monday)
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - mondayOffset);
        weekStart.setHours(0, 0, 0, 0);

        // Month start
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Previous periods for comparison
        const prevDayStr = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
        const prevWeekStart = new Date(weekStart.getTime() - 7 * 86_400_000);
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const data = await this.read();
        const summaries = data.dailySummaries;

        let today = 0;
        let thisWeek = 0;
        let thisMonth = 0;
        let previousDay = 0;
        let previousWeek = 0;
        let previousMonth = 0;

        for (const [date, summary] of Object.entries(summaries)) {
            if (date === todayStr) today += summary.totalCost;
            if (date === prevDayStr) previousDay += summary.totalCost;

            if (date >= weekStart.toISOString().slice(0, 10) && date <= todayStr) {
                thisWeek += summary.totalCost;
            }
            if (
                date >= prevWeekStart.toISOString().slice(0, 10) &&
                date < weekStart.toISOString().slice(0, 10)
            ) {
                previousWeek += summary.totalCost;
            }

            if (date >= monthStart.toISOString().slice(0, 10) && date <= todayStr) {
                thisMonth += summary.totalCost;
            }
            if (
                date >= prevMonthStart.toISOString().slice(0, 10) &&
                date <= prevMonthEnd.toISOString().slice(0, 10)
            ) {
                previousMonth += summary.totalCost;
            }
        }

        return { today, thisWeek, thisMonth, previousDay, previousWeek, previousMonth };
    }
}
