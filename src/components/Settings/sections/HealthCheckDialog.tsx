import { useState, useCallback } from "react";
import { Activity, Loader2, CheckCircle, AlertTriangle, XCircle, MinusCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from "@/browser/components/ui/dialog";
import { Button } from "@/browser/components/ui/button";
import { cn } from "@/common/lib/utils";
import { useAPI } from "@/browser/contexts/API";
import type { HealthCheckResultType } from "@/common/orpc/schemas/api";
import type { CustomModelMetadata } from "@/common/orpc/schemas/api";

const CHECK_LABELS: Record<string, string> = {
    authentication: "Authentication",
    modelExists: "Model Exists",
    tokenLimits: "Token Limits",
    pricing: "Pricing",
    connectivity: "Connectivity",
};

const STATUS_CONFIG = {
    pass: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", label: "Pass" },
    warn: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Warning" },
    fail: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Fail" },
    skip: { icon: MinusCircle, color: "text-muted", bg: "bg-background-secondary", label: "Skipped" },
} as const;

const OVERALL_CONFIG = {
    healthy: { color: "text-green-400", label: "Healthy" },
    warning: { color: "text-yellow-400", label: "Warning" },
    error: { color: "text-red-400", label: "Error" },
} as const;

interface HealthCheckDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    provider: string;
    modelId: string;
    metadata?: CustomModelMetadata;
}

export function HealthCheckDialog({
    open,
    onOpenChange,
    provider,
    modelId,
    metadata,
}: HealthCheckDialogProps) {
    const { api } = useAPI();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<HealthCheckResultType | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runCheck = useCallback(async () => {
        if (!api) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await api.modelHealth.checkModel({ provider, modelId, metadata });
            setResult(res);
        } catch {
            setError("Failed to run health check. Make sure the backend is reachable.");
        } finally {
            setLoading(false);
        }
    }, [api, provider, modelId, metadata]);

    const handleOpen = useCallback(
        (isOpen: boolean) => {
            onOpenChange(isOpen);
            if (isOpen) {
                setResult(null);
                setError(null);
                void runCheck();
            }
        },
        [onOpenChange, runCheck]
    );

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Health Check
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Health check results for {provider}/{modelId}
                    </DialogDescription>
                </DialogHeader>

                <div className="text-muted mb-1 text-xs">
                    <span className="text-foreground font-mono">{modelId}</span>
                    <span className="mx-1">·</span>
                    <span>{provider}</span>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center gap-2 py-8">
                        <Loader2 className="text-accent h-5 w-5 animate-spin" />
                        <span className="text-muted text-xs">Running health checks…</span>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="space-y-3">
                        <div className="text-error rounded-md bg-red-500/10 px-3 py-2 text-xs">{error}</div>
                        <Button onClick={runCheck} size="sm" variant="outline" className="w-full gap-1.5">
                            <Activity className="h-3.5 w-3.5" />
                            Retry
                        </Button>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="space-y-3">
                        {/* Overall status badge */}
                        <div
                            className={cn(
                                "flex items-center justify-between rounded-md px-3 py-2",
                                result.status === "healthy"
                                    ? "bg-green-500/10"
                                    : result.status === "warning"
                                        ? "bg-yellow-500/10"
                                        : "bg-red-500/10"
                            )}
                        >
                            <span className="text-xs font-medium">Overall Status</span>
                            <span className={cn("text-xs font-bold", OVERALL_CONFIG[result.status].color)}>
                                {OVERALL_CONFIG[result.status].label}
                            </span>
                        </div>

                        {/* Individual checks */}
                        <div className="space-y-1.5">
                            {(Object.entries(result.checks) as [string, { status: keyof typeof STATUS_CONFIG; message: string; details?: string }][]).map(
                                ([key, check]) => {
                                    const cfg = STATUS_CONFIG[check.status];
                                    const Icon = cfg.icon;
                                    return (
                                        <div
                                            key={key}
                                            className={cn(
                                                "flex items-start gap-2 rounded-md px-3 py-1.5",
                                                cfg.bg
                                            )}
                                        >
                                            <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", cfg.color)} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <span className="text-foreground text-xs font-medium">
                                                        {CHECK_LABELS[key] ?? key}
                                                    </span>
                                                    <span className={cn("shrink-0 text-[10px] font-medium", cfg.color)}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <div className="text-muted text-[10px] leading-tight">{check.message}</div>
                                                {check.details && (
                                                    <div className="text-muted-light mt-0.5 text-[10px] leading-tight">
                                                        {check.details}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>

                        {/* Timestamp */}
                        <div className="text-muted-light text-right text-[10px]">
                            Checked at{" "}
                            {new Date(result.timestamp).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                            })}
                        </div>

                        {/* Recheck button */}
                        <Button
                            onClick={runCheck}
                            disabled={loading}
                            size="sm"
                            variant="outline"
                            className="w-full gap-1.5"
                        >
                            {loading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Activity className="h-3.5 w-3.5" />
                            )}
                            Re-check
                        </Button>
                    </div>
                )}

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
