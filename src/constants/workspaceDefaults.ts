/**
 * Workspace default configuration values
 */

export const WORKSPACE_DEFAULTS = {
  model: "claude-sonnet-4-20250514",
  agentId: "exec",
  thinkingLevel: "medium" as const,
  autoRetry: false,
  reviewBase: "main",
};

/**
 * Storage key generators for workspace-related data
 */
export const STORAGE_KEYS = {
  reviewDefaultBase: (projectPath: string) => `reviewDefaultBase:${projectPath}`,
  reviewDiffBase: (workspaceId: string) => `reviewDiffBase:${workspaceId}`,
};
