/**
 * AgentMonitor - Realtime dashboard showing live agent activity.
 *
 * Subscribes to existing WorkspaceStore state (streamingTokenCount, streamingTPS,
 * pendingStreamModel, canInterrupt, etc.) without any new backend service.
 *
 * Shows: status indicator, model, tokens/sec, elapsed time, tool calls, cost burn.
 */

import React, { useEffect, useState } from "react";
import { cn } from "@/common/lib/utils";
import {
    useWorkspaceState,
    useWorkspaceStatsSnapshot,
    useWorkspaceUsage,
} from "@/stores/WorkspaceStore";
import { sumUsageHistory, type ChatUsageDisplay } from "@/common/utils/tokens/usageAggregator";
import { Activity, Zap, Clock, Cpu, DollarSign, Pause, AlertCircle } from "lucide-react";
import type { RuntimeStatusEvent } from "@/common/types/stream";

interface AgentMonitorProps {
    workspaceId: string;
}

type AgentStatusType = "idle" | "starting" | "streaming" | "runtime-status" | "error";

function deriveAgentStatus(state: {
    isStreamStarting: boolean;
    canInterrupt: boolean;
    runtimeStatus: RuntimeStatusEvent | null;
    lastAbortReason: unknown;
}): AgentStatusType {
    if (state.runtimeStatus && state.runtimeStatus.phase !== "ready") return "runtime-status";
    if (state.isStreamStarting) return "starting";
    if (state.canInterrupt) return "streaming";
    if (state.lastAbortReason) return "error";
    return "idle";
}

const STATUS_CONFIG: Record<AgentStatusType, { label: string; color: string; icon: React.ElementType }> = {
    idle: { label: "Idle", color: "text-muted", icon: Pause },
    starting: { label: "Starting…", color: "text-yellow-400", icon: Activity },
    streaming: { label: "Streaming", color: "text-green-400", icon: Zap },
    "runtime-status": { label: "Runtime", color: "text-blue-400", icon: Cpu },
    error: { label: "Error", color: "text-red-400", icon: AlertCircle },
};

function StatusPulse({ status }: { status: AgentStatusType }) {
    const isActive = status === "streaming" || status === "starting" || status === "runtime-status";
    if (!isActive) return null;

    return (
        <span className="relative ml-1.5 inline-flex h-2 w-2">
            <span
                className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                    status === "streaming" ? "bg-green-400" : status === "starting" ? "bg-yellow-400" : "bg-blue-400"
                )}
            />
            <span
                className={cn(
                    "relative inline-flex h-2 w-2 rounded-full",
                    status === "streaming" ? "bg-green-400" : status === "starting" ? "bg-yellow-400" : "bg-blue-400"
                )}
            />
        </span>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
    subValue,
    className,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    subValue?: string;
    className?: string;
}) {
    return (
        <div className={cn("bg-panel rounded-lg border border-border-light px-3 py-2", className)}>
            <div className="text-muted mb-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                <Icon className="h-3 w-3" />
                {label}
            </div>
            <div className="text-foreground text-sm font-medium tabular-nums">{value}</div>
            {subValue && <div className="text-muted mt-0.5 text-[10px]">{subValue}</div>}
        </div>
    );
}

function ElapsedTime({ startTime }: { startTime: number | null }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) {
            setElapsed(0);
            return;
        }

        setElapsed(Date.now() - startTime);
        const interval = setInterval(() => setElapsed(Date.now() - startTime), 250);
        return () => clearInterval(interval);
    }, [startTime]);

    if (!startTime) return <span className="text-muted">—</span>;

    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hrs = Math.floor(minutes / 60);

    if (hrs > 0) return <>{hrs}h {minutes % 60}m</>;
    if (minutes > 0) return <>{minutes}m {seconds % 60}s</>;
    return <>{seconds}s</>;
}

function AgentMonitorComponent({ workspaceId }: AgentMonitorProps) {
    const state = useWorkspaceState(workspaceId);
    const statsSnapshot = useWorkspaceStatsSnapshot(workspaceId);
    const usage = useWorkspaceUsage(workspaceId);

    const status = deriveAgentStatus(state);
    const config = STATUS_CONFIG[status];
    const StatusIcon = config.icon;

    const isActive = status !== "idle" && status !== "error";

    // Live cost calculation
    const sessionCost = React.useMemo(() => {
        const parts: ChatUsageDisplay[] = [];
        if (usage.sessionTotal) parts.push(usage.sessionTotal);
        if (usage.liveCostUsage) parts.push(usage.liveCostUsage);
        if (parts.length === 0) return 0;

        const aggregated = sumUsageHistory(parts);
        if (!aggregated) return 0;

        return (
            (aggregated.input.cost_usd ?? 0) +
            (aggregated.cached.cost_usd ?? 0) +
            (aggregated.cacheCreate.cost_usd ?? 0) +
            (aggregated.output.cost_usd ?? 0) +
            (aggregated.reasoning.cost_usd ?? 0)
        );
    }, [usage.sessionTotal, usage.liveCostUsage]);

    // Session stats
    const sessionResponseCount = statsSnapshot?.session?.responseCount ?? 0;
    const totalOutputTokens = statsSnapshot?.session?.totalOutputTokens ?? 0;
    const totalReasoningTokens = statsSnapshot?.session?.totalReasoningTokens ?? 0;

    return (
        <div className="space-y-4">
            {/* Status Header */}
            <div className="bg-panel rounded-lg border border-border-light p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <StatusIcon className={cn("h-4 w-4", config.color)} />
                        <span className={cn("text-sm font-medium", config.color)}>
                            {config.label}
                        </span>
                        <StatusPulse status={status} />
                    </div>
                    {state.pendingStreamModel && (
                        <span className="bg-accent/20 text-accent rounded px-2 py-0.5 text-[11px] font-medium">
                            {state.pendingStreamModel}
                        </span>
                    )}
                </div>

                {/* Active stream info */}
                {isActive && (
                    <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border-light pt-2">
                        <div className="text-center">
                            <div className="text-muted text-[10px] uppercase">TPS</div>
                            <div className="text-foreground text-sm font-medium tabular-nums">
                                {state.streamingTPS !== undefined
                                    ? state.streamingTPS.toFixed(1)
                                    : "—"}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-muted text-[10px] uppercase">Tokens</div>
                            <div className="text-foreground text-sm font-medium tabular-nums">
                                {state.streamingTokenCount !== undefined
                                    ? state.streamingTokenCount.toLocaleString()
                                    : "—"}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-muted text-[10px] uppercase">Elapsed</div>
                            <div className="text-foreground text-sm font-medium tabular-nums">
                                <ElapsedTime startTime={state.pendingStreamStartTime} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Runtime status detail */}
                {state.runtimeStatus && state.runtimeStatus.phase !== "ready" && (
                    <div className="mt-2 border-t border-border-light pt-2">
                        <div className="text-muted flex items-center gap-1.5 text-[11px]">
                            <Cpu className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                                {state.runtimeStatus.detail ?? `Runtime: ${state.runtimeStatus.phase}`}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Session Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
                <MetricCard
                    icon={DollarSign}
                    label="Session Cost"
                    value={sessionCost > 0 ? `$${sessionCost.toFixed(4)}` : "$0.00"}
                />
                <MetricCard
                    icon={Activity}
                    label="Responses"
                    value={sessionResponseCount.toString()}
                />
                <MetricCard
                    icon={Zap}
                    label="Output Tokens"
                    value={totalOutputTokens.toLocaleString()}
                    subValue={totalReasoningTokens > 0 ? `+${totalReasoningTokens.toLocaleString()} reasoning` : undefined}
                />
                <MetricCard
                    icon={Clock}
                    label="Session Time"
                    value={formatDuration(statsSnapshot?.session?.totalDurationMs ?? 0)}
                    subValue={
                        statsSnapshot?.session?.totalToolExecutionMs
                            ? `${formatDuration(statsSnapshot.session.totalToolExecutionMs)} in tools`
                            : undefined
                    }
                />
            </div>

            {/* Per-Model Breakdown */}
            {statsSnapshot?.session?.byModel && Object.keys(statsSnapshot.session.byModel).length > 0 && (
                <div className="bg-panel rounded-lg border border-border-light p-3">
                    <h4 className="text-muted mb-2 text-[10px] uppercase tracking-wider">Model Breakdown</h4>
                    <div className="space-y-1.5">
                        {Object.entries(statsSnapshot.session.byModel).map(([model, stats]) => (
                            <div key={model} className="flex items-center justify-between text-xs">
                                <span className="text-foreground truncate font-medium" title={model}>
                                    {model.split("/").pop() ?? model}
                                </span>
                                <div className="text-muted flex gap-3 tabular-nums">
                                    <span>{stats.responseCount}×</span>
                                    <span>{stats.totalOutputTokens.toLocaleString()} tok</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Stream Timing */}
            {statsSnapshot?.active && (
                <div className="bg-panel rounded-lg border border-border-light p-3">
                    <h4 className="text-muted mb-2 text-[10px] uppercase tracking-wider">Active Stream</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="text-muted">Model</div>
                        <div className="text-foreground truncate text-right font-medium">
                            {statsSnapshot.active.model?.split("/").pop() ?? "—"}
                        </div>
                        <div className="text-muted">TTFT</div>
                        <div className="text-foreground text-right tabular-nums">
                            {statsSnapshot.active.ttftMs != null ? `${statsSnapshot.active.ttftMs}ms` : "—"}
                        </div>
                        <div className="text-muted">Live TPS</div>
                        <div className="text-foreground text-right tabular-nums">
                            {statsSnapshot.active.liveTPS != null
                                ? statsSnapshot.active.liveTPS.toFixed(1)
                                : "—"}
                        </div>
                        <div className="text-muted">Tokens</div>
                        <div className="text-foreground text-right tabular-nums">
                            {statsSnapshot.active.liveTokenCount?.toLocaleString() ?? "—"}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatDuration(ms: number): string {
    if (ms <= 0) return "0s";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}

export const AgentMonitor = React.memo(AgentMonitorComponent);
