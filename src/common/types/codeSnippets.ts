/**
 * Code Snippet Library Types
 *
 * Defines the structure for saving, organizing, and managing code snippets
 */

export interface CodeSnippet {
  id: string;
  name: string;
  description?: string;
  code: string;
  language: string; // "typescript", "python", "bash", "json", etc.
  tags: string[]; // for categorization and search
  category?: string; // "React", "API", "Utils", "CLI", etc.
  created: number; // timestamp
  lastUsed?: number; // timestamp
  usageCount: number;
  isFavorite?: boolean;
}

export interface SnippetCategory {
  name: string;
  color?: string; // hex color for UI categorization
  icon?: string; // optional icon name from lucide-react
}

export interface SnippetInput {
  name: string;
  description?: string;
  code: string;
  language: string;
  tags?: string[];
  category?: string;
}

export interface SnippetFilters {
  search?: string; // search in name, description, code
  language?: string;
  category?: string;
  tags?: string[];
  favorites?: boolean;
}

// Default categories
export const DEFAULT_SNIPPET_CATEGORIES: SnippetCategory[] = [
  { name: "React", color: "#61DAFB" },
  { name: "API", color: "#FF6B6B" },
  { name: "Utils", color: "#4ECDC4" },
  { name: "CLI", color: "#95E1D3" },
  { name: "Database", color: "#F38181" },
  { name: "Testing", color: "#AA96DA" },
  { name: "Other", color: "#9E9E9E" },
];

// Supported languages for syntax highlighting
export const SUPPORTED_LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "bash",
  "shell",
  "json",
  "yaml",
  "markdown",
  "html",
  "css",
  "sql",
  "rust",
  "go",
  "java",
  "cpp",
  "c",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
