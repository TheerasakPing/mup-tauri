/**
 * Constants for slash commands that are only available within a workspace
 * (not during workspace creation)
 */

import type { ParsedCommand } from "@/utils/slashCommands/types";

/**
 * Command types that are only available within an existing workspace.
 * These commands cannot be used during workspace creation.
 */
export const WORKSPACE_ONLY_COMMAND_TYPES: Set<ParsedCommand["type"]> = new Set([
  "clear",
  "truncate",
  "compact",
  "fork",
  "new",
  "plan-show",
  "plan-open",
  "debug-llm-request",
  "idle-compaction",
]);

/**
 * Command keys (definition keys) that are only available within an existing workspace.
 * These command definitions cannot be used during workspace creation.
 */
export const WORKSPACE_ONLY_COMMAND_KEYS: Set<string> = new Set([
  "clear",
  "truncate",
  "compact",
  "fork",
  "new",
  "plan",
  "plan-show",
  "plan-open",
  "debug-llm-request",
  "idle-compaction",
  "vim",
]);
