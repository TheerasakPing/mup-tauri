import React from "react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Rows, Columns2, FileDiff } from "lucide-react";
import { cn } from "@/common/lib/utils";

export type DiffViewMode = "inline" | "split" | "unified";

interface DiffViewModeSelectorProps {
  value: DiffViewMode;
  onChange: (mode: DiffViewMode) => void;
  className?: string;
}

/**
 * Diff View Mode Selector
 * Allows users to switch between inline, split, and unified diff views
 *
 * Keyboard shortcuts:
 * - Cmd/Ctrl + Shift + 1: Inline view
 * - Cmd/Ctrl + Shift + 2: Split view
 * - Cmd/Ctrl + Shift + 3: Unified view
 */
export function DiffViewModeSelector({ value, onChange, className }: DiffViewModeSelectorProps) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(val) => val && onChange(val as DiffViewMode)}
      className={cn("inline-flex rounded-lg border border-border bg-secondary/30 p-0.5", className)}
      aria-label="Diff view mode"
    >
      <ToggleGroup.Item
        value="inline"
        className="px-3 py-1.5 text-xs rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm flex items-center gap-1.5 hover:bg-secondary/50 transition"
        title="Inline view (Cmd+Shift+1)"
      >
        <Rows className="h-3.5 w-3.5" />
        <span>Inline</span>
      </ToggleGroup.Item>

      <ToggleGroup.Item
        value="split"
        className="px-3 py-1.5 text-xs rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm flex items-center gap-1.5 hover:bg-secondary/50 transition"
        title="Split view (Cmd+Shift+2)"
      >
        <Columns2 className="h-3.5 w-3.5" />
        <span>Split</span>
      </ToggleGroup.Item>

      <ToggleGroup.Item
        value="unified"
        className="px-3 py-1.5 text-xs rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm flex items-center gap-1.5 hover:bg-secondary/50 transition"
        title="Unified view (Cmd+Shift+3)"
      >
        <FileDiff className="h-3.5 w-3.5" />
        <span>Unified</span>
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}
