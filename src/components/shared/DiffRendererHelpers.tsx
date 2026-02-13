import { useEffect } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { DIFF_VIEW_MODE_KEY } from "@/common/constants/storage";
import type { DiffViewMode } from "./DiffViewModeSelector";

/**
 * Keyboard shortcut handler for view modes
 */
export function useDiffViewModeShortcuts(onViewModeChange: (mode: DiffViewMode) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        if (e.key === "1") {
          e.preventDefault();
          onViewModeChange("inline");
        } else if (e.key === "2") {
          e.preventDefault();
          onViewModeChange("split");
        } else if (e.key === "3") {
          e.preventDefault();
          onViewModeChange("unified");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onViewModeChange]);
}

/**
 * Helper to render split view - separates old and new lines
 */
export function prepareSplitViewLines(
  chunks: Array<{
    type: "add" | "remove" | "context" | "header";
    lines: Array<{ html: string; originalIndex: number }>;
  }>
): {
  oldLines: Array<{ html: string; lineNum: number; type: string }>;
  newLines: Array<{ html: string; lineNum: number; type: string }>;
} {
  const oldLines: Array<{ html: string; lineNum: number; type: string }> = [];
  const newLines: Array<{ html: string; lineNum: number; type: string }> = [];

  let oldLineNum = 1;
  let newLineNum = 1;

  for (const chunk of chunks) {
    if (chunk.type === "header") {
      for (const line of chunk.lines) {
        oldLines.push({ html: line.html, lineNum: 0, type: "header" });
        newLines.push({ html: line.html, lineNum: 0, type: "header" });
      }
    } else if (chunk.type === "remove") {
      for (const line of chunk.lines) {
        oldLines.push({ html: line.html, lineNum: oldLineNum++, type: "remove" });
        newLines.push({ html: "", lineNum: 0, type: "empty" });
      }
    } else if (chunk.type === "add") {
      for (const line of chunk.lines) {
        oldLines.push({ html: "", lineNum: 0, type: "empty" });
        newLines.push({ html: line.html, lineNum: newLineNum++, type: "add" });
      }
    } else {
      // context
      for (const line of chunk.lines) {
        oldLines.push({ html: line.html, lineNum: oldLineNum++, type: "context" });
        newLines.push({ html: line.html, lineNum: newLineNum++, type: "context" });
      }
    }
  }

  return { oldLines, newLines };
}

// Hook for managing diff view mode with persistence
export function useDiffViewMode() {
  const [viewMode, setViewMode] = usePersistedState<DiffViewMode>(DIFF_VIEW_MODE_KEY, "inline");

  return { viewMode, setViewMode };
}
