/**
 * Workspace Template Types
 * Defines structure for pre-configured workspace setups
 */

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description?: string;
  runtime: "local" | "worktree" | "ssh" | "docker" | "devcontainer";
  model?: string;
  agent?: string;
  thinkingLevel?: number;
  mcpServers?: string[];
  created: number;
  isDefault?: boolean;
}

export interface WorkspaceTemplateInput {
  name: string;
  description?: string;
  runtime: WorkspaceTemplate["runtime"];
  model?: string;
  agent?: string;
  thinkingLevel?: number;
  mcpServers?: string[];
}

export const DEFAULT_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: "feature-dev",
    name: "Feature Development",
    description: "Standard setup for implementing new features",
    runtime: "worktree",
    thinkingLevel: 2,
    created: Date.now(),
    isDefault: true,
  },
  {
    id: "bug-fix",
    name: "Bug Fix",
    description: "Quick setup for debugging and fixing issues",
    runtime: "local",
    thinkingLevel: 1,
    created: Date.now(),
    isDefault: true,
  },
  {
    id: "code-review",
    name: "Code Review",
    description: "Review-focused workspace with minimal context",
    runtime: "local",
    thinkingLevel: 0,
    created: Date.now(),
    isDefault: true,
  },
];
