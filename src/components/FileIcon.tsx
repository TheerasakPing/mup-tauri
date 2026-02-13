import React, { useMemo } from "react";
import { cn } from "@/common/lib/utils";
import { useIconTheme } from "@/contexts/IconThemeContext";

// Import all SVGs as URLs from root icons directory
// The keys will be like "../../../icons/name.svg"
const iconUrls = import.meta.glob("../../../icons/*.svg", {
  eager: true,
  import: "default",
});

// Helper to get URL from relative icon name (e.g., "angular.svg")
// Exported for use by IconThemeContext when resolving built-in theme icons
export const getRootIconUrl = (iconName: string): string | undefined => {
  const key = `../../../icons/${iconName}`;
  return iconUrls[key] as string | undefined;
};

export interface FileIconProps {
  fileName?: string | null;
  filePath?: string | null;
  className?: string;
  style?: React.CSSProperties;
  /**
   * If true, treat as a folder.
   */
  isFolder?: boolean;
}

export const FileIcon: React.FC<FileIconProps> = ({
  fileName,
  filePath,
  className,
  style,
  isFolder,
}) => {
  const { resolveIconUrl } = useIconTheme();
  const targetName = fileName ?? (filePath ? (filePath.split("/").pop() ?? "") : "");

  const iconSrc = useMemo(() => {
    return resolveIconUrl(targetName, { isFolder });
  }, [targetName, isFolder, resolveIconUrl]);

  if (!iconSrc) {
    return null;
  }

  return (
    <img
      src={iconSrc}
      alt={targetName}
      className={cn("select-none w-[1em] h-[1em]", className)}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        ...style,
      }}
    />
  );
};
