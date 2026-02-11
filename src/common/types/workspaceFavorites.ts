/**
 * Workspace Favorites Types
 * Defines structure for pinning workspaces
 */

export interface WorkspaceFavorite {
  workspaceId: string;
  pinnedAt: number; // timestamp for ordering
}
