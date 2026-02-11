import React from "react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Columns2, Rows, FileDiff } from "lucide-react";

export type DiffViewMode = "inline" | "split" | "unified";

interface DiffViewModeProps {
  value: DiffViewMode;
  onChange: (value: DiffViewMode) => void;
  className?: string;
}

/**
 * View mode selector for diff rendering
 * Supports inline (current default), split (side-by-side), and unified views
 */
export function DiffViewModeSelector({ value, onChange, className }: DiffViewModeProps) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(newValue) => {
        if (newValue) onChange(newValue as DiffViewMode);
      }}
      className={`inline-flex rounded-lg border border-border bg-secondary/30 p-0.5 ${className || ""}`}
    >
      <ToggleGroup.Item
        value="inline"
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary/60 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        title="Inline view (Cmd+Shift+1)"
      >
        <Rows className="h-3.5 w-3.5" />
        Inline
      </ToggleGroup.Item>

      <ToggleGroup.Item
        value="split"
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary/60 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        title="Split view (Cmd+Shift+2)"
      >
        <Columns2 className="h-3.5 w-3.5" />
        Split
      </ToggleGroup.Item>

      <ToggleGroup.Item
        value="unified"
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary/60 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        title="Unified view (Cmd+Shift+3)"
      >
        <FileDiff className="h-3.5 w-3.5" />
        Unified
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}
