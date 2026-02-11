/**
 * Agent Performance Analytics Types
 * Defines metrics for tracking agent and model performance
 */

export interface AgentPerformanceMetrics {
  agentId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgCompletionTimeMs: number;
  avgTokens: number;
  avgCostUsd: number;
  lastUsed: number;
}

export interface ModelPerformanceMetrics {
  model: string;
  totalRequests: number;
  avgTtftMs: number;
  avgTpsTokensPerSec: number;
  avgCostPerRequest: number;
  totalCostUsd: number;
  lastUsed: number;
}

export interface AnalyticsTimeRange {
  start: number;
  end: number;
  label: string;
}

export const ANALYTICS_TIME_RANGES: AnalyticsTimeRange[] = [
  {
    start: 0,
    end: Date.now(),
    label: "All Time",
  },
  {
    start: Date.now() - 30 * 24 * 60 * 60 * 1000,
    end: Date.now(),
    label: "Last 30 Days",
  },
  {
    start: Date.now() - 7 * 24 * 60 * 60 * 1000,
    end: Date.now(),
    label: "Last 7 Days",
  },
  {
    start: Date.now() - 24 * 60 * 60 * 1000,
    end: Date.now(),
    label: "Last 24 Hours",
  },
];
