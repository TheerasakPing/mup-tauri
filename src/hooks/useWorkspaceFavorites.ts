import { usePersistedState } from "./usePersistedState";
import type { WorkspaceFavorite } from "@/common/types/workspaceFavorites";

const WORKSPACE_FAVORITES_KEY = "workspaceFavorites:list";

/**
 * Hook for managing workspace favorites
 * Provides pin/unpin functionality with localStorage persistence
 */
export function useWorkspaceFavorites() {
  const [favorites, setFavorites] = usePersistedState<WorkspaceFavorite[]>(
    WORKSPACE_FAVORITES_KEY,
    [],
    { listener: true } // Enable cross-component sync
  );

  const addFavorite = (workspaceId: string): void => {
    setFavorites((prev) => {
      if (prev.some((f) => f.workspaceId === workspaceId)) {
        return prev;
      }
      return [...prev, { workspaceId, pinnedAt: Date.now() }];
    });
  };

  const removeFavorite = (workspaceId: string): void => {
    setFavorites((prev) => prev.filter((f) => f.workspaceId !== workspaceId));
  };

  const toggleFavorite = (workspaceId: string): void => {
    if (isFavorite(workspaceId)) {
      removeFavorite(workspaceId);
    } else {
      addFavorite(workspaceId);
    }
  };

  const isFavorite = (workspaceId: string): boolean => {
    return favorites.some((f) => f.workspaceId === workspaceId);
  };

  const getFavoriteWorkspaceIds = (): string[] => {
    return favorites
      .sort((a, b) => b.pinnedAt - a.pinnedAt) // Most recent first
      .map((f) => f.workspaceId);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoriteWorkspaceIds,
  };
}
