import React from "react";
import { Loader2, Server } from "lucide-react";
import type { MCPServerInfo } from "@/common/types/mcp";
import { useAPI } from "@/contexts/API";
import { useSettings } from "@/contexts/SettingsContext";
import { getMCPServersKey } from "@/common/constants/storage";
import { readPersistedState, updatePersistedState } from "@/hooks/usePersistedState";

interface ChatPaneMCPStatusProps {
    projectPath: string;
}

/**
 * Compact MCP server status shown in the ChatPane empty state.
 * Displays enabled MCP servers so users know which integrations are active.
 */
export const ChatPaneMCPStatus: React.FC<ChatPaneMCPStatusProps> = ({ projectPath }) => {
    const { api } = useAPI();
    const settings = useSettings();

    const [loading, setLoading] = React.useState(false);
    const [servers, setServers] = React.useState<Record<string, MCPServerInfo>>(() =>
        readPersistedState<Record<string, MCPServerInfo>>(getMCPServersKey(projectPath), {})
    );

    React.useEffect(() => {
        if (!api || settings.isOpen) return;
        let cancelled = false;

        setLoading(true);
        api.mcp
            .list({ projectPath })
            .then((result) => {
                if (cancelled) return;
                const newServers = result ?? {};
                setServers(newServers);
                updatePersistedState(getMCPServersKey(projectPath), newServers);
            })
            .catch(() => {
                if (cancelled) return;
                setServers({});
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [api, projectPath, settings.isOpen]);

    const enabledServers = Object.entries(servers)
        .filter(([, info]) => !info.disabled)
        .sort(([a], [b]) => a.localeCompare(b));

    // Nothing to show
    if (!loading && enabledServers.length === 0) return null;

    return (
        <button
            type="button"
            onClick={() => settings.open("mcp")}
            className="border-border/50 hover:border-border hover:bg-bg-lighter group mt-5 w-full max-w-sm cursor-pointer rounded-lg border px-4 py-3 text-left transition-colors"
        >
            <div className="flex items-center gap-2">
                <Server className="text-muted h-3.5 w-3.5 shrink-0" />
                <span className="text-muted text-xs font-medium">
                    MCP Servers
                    {!loading && (
                        <span className="text-muted/60 ml-1">({enabledServers.length})</span>
                    )}
                </span>
                {loading && <Loader2 className="text-muted h-3 w-3 animate-spin" />}
            </div>

            {enabledServers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {enabledServers.map(([name, info]) => (
                        <span
                            key={name}
                            className="bg-separator/60 text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]"
                        >
                            <span
                                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-green-500"
                                title={info.transport}
                            />
                            {name}
                        </span>
                    ))}
                </div>
            )}
        </button>
    );
};
