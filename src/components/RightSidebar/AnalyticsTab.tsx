import React, { useState } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { BarChart, TrendingUp, Clock, DollarSign } from "lucide-react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";

interface AnalyticsTabProps {
  workspaceId: string;
}

/**
 * Analytics Tab Component
 * Displays agent performance metrics, model comparison, and cost analytics
 */
export function AnalyticsTab({ workspaceId }: AnalyticsTabProps) {
  const [timeRange, setTimeRange] = usePersistedState<string>(
    `analytics:timeRange:${workspaceId}`,
    "all"
  );

  // Mock data - actual implementation would aggregate from workspace stats
  const mockAgentMetrics = [
    { agentId: "frontend-specialist", successRate: 95, avgTime: 3200, requests: 45 },
    { agentId: "backend-specialist", successRate: 92, avgTime: 2800, requests: 38 },
    { agentId: "mobile-developer", successRate: 88, avgTime: 4100, requests: 22 },
  ];

  const mockModelMetrics = [
    { model: "claude-3.5-sonnet", avgTtft: 850, avgTps: 45, requests: 105, cost: 2.45 },
    { model: "gpt-4-turbo", avgTtft: 1200, avgTps: 38, requests: 42, cost: 1.82 },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">Performance Analytics</h2>

        <ToggleGroup.Root
          type="single"
          value={timeRange}
          onValueChange={(val) => val && setTimeRange(val)}
          className="inline-flex rounded-lg border border-border bg-secondary/30 p-0.5"
        >
          <ToggleGroup.Item
            value="all"
            className="px-3 py-1.5 text-xs rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            All Time
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="30d"
            className="px-3 py-1.5 text-xs rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            30 Days
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="7d"
            className="px-3 py-1.5 text-xs rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            7 Days
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Agent Performance */}
        <section>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Agent Success Rates
          </h3>
          <div className="space-y-2">
            {mockAgentMetrics.map((agent) => (
              <div
                key={agent.agentId}
                className="p-3 rounded-md bg-secondary/20 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{agent.agentId}</span>
                  <span className="text-sm text-success">{agent.successRate}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-success h-2 rounded-full"
                    style={{ width: `${agent.successRate}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{agent.requests} requests</span>
                  <span>{agent.avgTime}ms avg</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Model Performance */}
        <section>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Model Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Model</th>
                  <th className="pb-2 font-medium">TTFT</th>
                  <th className="pb-2 font-medium">TPS</th>
                  <th className="pb-2 font-medium">Requests</th>
                  <th className="pb-2 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockModelMetrics.map((model) => (
                  <tr key={model.model}>
                    <td className="py-2">{model.model}</td>
                    <td className="py-2">{model.avgTtft}ms</td>
                    <td className="py-2">{model.avgTps} tok/s</td>
                    <td className="py-2">{model.requests}</td>
                    <td className="py-2">${model.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Export */}
        <div className="pt-4 border-t border-border">
          <button className="w-full px-4 py-2 text-sm rounded-md border border-border hover:bg-secondary/50">
            Export Analytics CSV
          </button>
        </div>
      </div>
    </div>
  );
}
