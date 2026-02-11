import type { DiffViewMode } from "../shared/DiffViewMode";

export interface EnhancedDiffRendererProps {
  content: string;
  showLineNumbers?: boolean;
  lineNumberMode?: "both" | "old" | "new";
  oldStart?: number;
  newStart?: number;
  filePath?: string;
  fontSize?: string;
  maxHeight?: string;
  className?: string;
  viewMode?: DiffViewMode;
  onViewModeChange?: (mode: DiffViewMode) => void;
  showViewModeSwitcher?: boolean;
}
