import { describe, it, expect } from "bun:test";
import type { WorkspaceFavorite } from "@/common/types/workspaceFavorites";

describe("WorkspaceFavorite types and logic", () => {
  it("should create favorite entry correctly", () => {
    const favorite: WorkspaceFavorite = {
      workspaceId: "workspace-1",
      pinnedAt: Date.now(),
    };

    expect(favorite.workspaceId).toBe("workspace-1");
    expect(favorite.pinnedAt).toBeGreaterThan(0);
  });

  it("should detect duplicates in array", () => {
    const favorites: WorkspaceFavorite[] = [
      { workspaceId: "workspace-1", pinnedAt: Date.now() },
      { workspaceId: "workspace-2", pinnedAt: Date.now() },
    ];

    const isDuplicate = (id: string) => favorites.some((f) => f.workspaceId === id);

    expect(isDuplicate("workspace-1")).toBe(true);
    expect(isDuplicate("workspace-3")).toBe(false);
  });

  it("should sort by pinnedAt descending", () => {
    const now = Date.now();
    const favorites: WorkspaceFavorite[] = [
      { workspaceId: "workspace-1", pinnedAt: now - 1000 },
      { workspaceId: "workspace-2", pinnedAt: now },
      { workspaceId: "workspace-3", pinnedAt: now - 500 },
    ];

    const sorted = favorites.sort((a, b) => b.pinnedAt - a.pinnedAt);

    expect(sorted[0].workspaceId).toBe("workspace-2");
    expect(sorted[1].workspaceId).toBe("workspace-3");
    expect(sorted[2].workspaceId).toBe("workspace-1");
  });

  it("should add favorite to empty array", () => {
    const favorites: WorkspaceFavorite[] = [];

    const newFavorite: WorkspaceFavorite = {
      workspaceId: "new-workspace",
      pinnedAt: Date.now(),
    };

    favorites.push(newFavorite);

    expect(favorites).toHaveLength(1);
    expect(favorites[0].workspaceId).toBe("new-workspace");
  });

  it("should remove favorite from array", () => {
    const favorites: WorkspaceFavorite[] = [
      { workspaceId: "workspace-1", pinnedAt: Date.now() },
      { workspaceId: "workspace-2", pinnedAt: Date.now() },
    ];

    const filtered = favorites.filter((f) => f.workspaceId !== "workspace-1");

    expect(filtered).toHaveLength(1);
    expect(filtered[0].workspaceId).toBe("workspace-2");
  });
});
