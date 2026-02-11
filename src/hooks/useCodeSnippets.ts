import { useCallback, useMemo } from "react";
import { usePersistedState } from "./usePersistedState";
import { CODE_SNIPPETS_KEY } from "@/common/constants/storage";
import type { CodeSnippet, SnippetInput, SnippetFilters } from "@/common/types/codeSnippets";

/**
 * Hook for managing code snippets
 * Provides CRUD operations, search/filter, and import/export functionality
 */
export function useCodeSnippets() {
  const [snippets, setSnippets] = usePersistedState<CodeSnippet[]>(CODE_SNIPPETS_KEY, []);

  // Create new snippet
  const createSnippet = useCallback(
    (input: SnippetInput): CodeSnippet => {
      const newSnippet: CodeSnippet = {
        id: crypto.randomUUID(),
        name: input.name,
        description: input.description,
        code: input.code,
        language: input.language,
        tags: input.tags ?? [],
        category: input.category,
        created: Date.now(),
        usageCount: 0,
      };

      setSnippets((prev) => [newSnippet, ...prev]);
      return newSnippet;
    },
    [setSnippets]
  );

  // Update existing snippet
  const updateSnippet = useCallback(
    (id: string, updates: Partial<SnippetInput>) => {
      setSnippets((prev) =>
        prev.map((snippet) => (snippet.id === id ? { ...snippet, ...updates } : snippet))
      );
    },
    [setSnippets]
  );

  // Delete snippet
  const deleteSnippet = useCallback(
    (id: string) => {
      setSnippets((prev) => prev.filter((s) => s.id !== id));
    },
    [setSnippets]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    (id: string) => {
      setSnippets((prev) =>
        prev.map((snippet) =>
          snippet.id === id ? { ...snippet, isFavorite: !snippet.isFavorite } : snippet
        )
      );
    },
    [setSnippets]
  );

  // Record usage (update lastUsed and usageCount)
  const recordUsage = useCallback(
    (id: string) => {
      setSnippets((prev) =>
        prev.map((snippet) =>
          snippet.id === id
            ? {
                ...snippet,
                lastUsed: Date.now(),
                usageCount: snippet.usageCount + 1,
              }
            : snippet
        )
      );
    },
    [setSnippets]
  );

  // Duplicate snippet
  const duplicateSnippet = useCallback(
    (id: string) => {
      const snippet = snippets.find((s) => s.id === id);
      if (!snippet) return;

      const duplicate: CodeSnippet = {
        ...snippet,
        id: crypto.randomUUID(),
        name: `${snippet.name} (copy)`,
        created: Date.now(),
        usageCount: 0,
        lastUsed: undefined,
      };

      setSnippets((prev) => [duplicate, ...prev]);
    },
    [snippets, setSnippets]
  );

  // Filter snippets
  const filterSnippets = useCallback(
    (filters: SnippetFilters): CodeSnippet[] => {
      let filtered = [...snippets];

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(searchLower) ||
            s.description?.toLowerCase().includes(searchLower) ||
            s.code.toLowerCase().includes(searchLower) ||
            s.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }

      // Language filter
      if (filters.language) {
        filtered = filtered.filter((s) => s.language === filters.language);
      }

      // Category filter
      if (filters.category) {
        filtered = filtered.filter((s) => s.category === filters.category);
      }

      // Tags filter (match any)
      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter((s) => filters.tags!.some((tag) => s.tags.includes(tag)));
      }

      // Favorites filter
      if (filters.favorites) {
        filtered = filtered.filter((s) => s.isFavorite);
      }

      return filtered;
    },
    [snippets]
  );

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    snippets.forEach((s) => s.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [snippets]);

  // Get all unique categories
  const allCategories = useMemo(() => {
    const categorySet = new Set<string>();
    snippets.forEach((s) => {
      if (s.category) categorySet.add(s.category);
    });
    return Array.from(categorySet).sort();
  }, [snippets]);

  // Export snippets as JSON
  const exportSnippets = useCallback(() => {
    const dataStr = JSON.stringify(snippets, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `code-snippets-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [snippets]);

  // Import snippets from JSON
  const importSnippets = useCallback(
    (file: File): Promise<number> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string) as CodeSnippet[];

            // Validate structure
            if (!Array.isArray(imported)) {
              reject(new Error("Invalid file format"));
              return;
            }

            // Merge with existing, avoiding duplicates by name
            const existingNames = new Set(snippets.map((s) => s.name));
            const newSnippets = imported.filter((s) => !existingNames.has(s.name));

            setSnippets((prev) => [...newSnippets, ...prev]);
            resolve(newSnippets.length);
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });
    },
    [snippets, setSnippets]
  );

  return {
    snippets,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    toggleFavorite,
    recordUsage,
    duplicateSnippet,
    filterSnippets,
    allTags,
    allCategories,
    exportSnippets,
    importSnippets,
  };
}
