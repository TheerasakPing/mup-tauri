import { test, expect, describe, beforeEach } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useCodeSnippets } from "@/browser/hooks/useCodeSnippets";
import type { SnippetInput } from "@/common/types/codeSnippets";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useCodeSnippets", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("should create a new snippet", () => {
    const { result } = renderHook(() => useCodeSnippets());

    const input: SnippetInput = {
      name: "Test Snippet",
      code: "console.log('test');",
      language: "javascript",
      tags: ["test"],
      category: "Utils",
      description: "A test snippet",
    };

    act(() => {
      result.current.createSnippet(input);
    });

    expect(result.current.snippets).toHaveLength(1);
    expect(result.current.snippets[0].name).toBe("Test Snippet");
    expect(result.current.snippets[0].code).toBe("console.log('test');");
    expect(result.current.snippets[0].usageCount).toBe(0);
  });

  test("should update an existing snippet", () => {
    const { result } = renderHook(() => useCodeSnippets());

    const input: SnippetInput = {
      name: "Original",
      code: "original code",
      language: "typescript",
    };

    let snippetId: string;
    act(() => {
      const created = result.current.createSnippet(input);
      snippetId = created.id;
    });

    act(() => {
      result.current.updateSnippet(snippetId, {
        name: "Updated",
        code: "updated code",
      });
    });

    expect(result.current.snippets[0].name).toBe("Updated");
    expect(result.current.snippets[0].code).toBe("updated code");
  });

  test("should delete a snippet", () => {
    const { result } = renderHook(() => useCodeSnippets());

    const input: SnippetInput = {
      name: "To Delete",
      code: "delete me",
      language: "python",
    };

    let snippetId: string;
    act(() => {
      const created = result.current.createSnippet(input);
      snippetId = created.id;
    });

    expect(result.current.snippets).toHaveLength(1);

    act(() => {
      result.current.deleteSnippet(snippetId);
    });

    expect(result.current.snippets).toHaveLength(0);
  });

  test("should toggle favorite status", () => {
    const { result } = renderHook(() => useCodeSnippets());

    const input: SnippetInput = {
      name: "Favorite Test",
      code: "fav code",
      language: "rust",
    };

    let snippetId: string;
    act(() => {
      const created = result.current.createSnippet(input);
      snippetId = created.id;
    });

    expect(result.current.snippets[0].isFavorite).toBeUndefined();

    act(() => {
      result.current.toggleFavorite(snippetId);
    });

    expect(result.current.snippets[0].isFavorite).toBe(true);

    act(() => {
      result.current.toggleFavorite(snippetId);
    });

    expect(result.current.snippets[0].isFavorite).toBe(false);
  });

  test("should record snippet usage", () => {
    const { result } = renderHook(() => useCodeSnippets());

    const input: SnippetInput = {
      name: "Usage Test",
      code: "usage code",
      language: "go",
    };

    let snippetId: string;
    act(() => {
      const created = result.current.createSnippet(input);
      snippetId = created.id;
    });

    expect(result.current.snippets[0].usageCount).toBe(0);
    expect(result.current.snippets[0].lastUsed).toBeUndefined();

    act(() => {
      result.current.recordUsage(snippetId);
    });

    expect(result.current.snippets[0].usageCount).toBe(1);
    expect(result.current.snippets[0].lastUsed).toBeGreaterThan(0);

    act(() => {
      result.current.recordUsage(snippetId);
    });

    expect(result.current.snippets[0].usageCount).toBe(2);
  });

  test("should duplicate a snippet", () => {
    const { result } = renderHook(() => useCodeSnippets());

    const input: SnippetInput = {
      name: "Original",
      code: "original code",
      language: "cpp",
      tags: ["tag1"],
      category: "Testing",
    };

    let snippetId: string;
    act(() => {
      const created = result.current.createSnippet(input);
      snippetId = created.id;
    });

    expect(result.current.snippets).toHaveLength(1);

    act(() => {
      result.current.duplicateSnippet(snippetId);
    });

    expect(result.current.snippets).toHaveLength(2);
    expect(result.current.snippets[0].name).toBe("Original (copy)");
    expect(result.current.snippets[0].code).toBe("original code");
    expect(result.current.snippets[0].id).not.toBe(snippetId);
    expect(result.current.snippets[0].usageCount).toBe(0);
  });

  test("should filter snippets by search text", () => {
    const { result } = renderHook(() => useCodeSnippets());

    act(() => {
      result.current.createSnippet({
        name: "React Hook",
        code: "useState",
        language: "typescript",
        description: "State management",
      });
      result.current.createSnippet({
        name: "Python Script",
        code: "print('hello')",
        language: "python",
      });
    });

    const filtered = result.current.filterSnippets({ search: "react" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("React Hook");
  });

  test("should filter snippets by language", () => {
    const { result } = renderHook(() => useCodeSnippets());

    act(() => {
      result.current.createSnippet({
        name: "TS Snippet",
        code: "const x = 1;",
        language: "typescript",
      });
      result.current.createSnippet({
        name: "JS Snippet",
        code: "var x = 1;",
        language: "javascript",
      });
    });

    const filtered = result.current.filterSnippets({ language: "typescript" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("TS Snippet");
  });

  test("should filter snippets by category", () => {
    const { result } = renderHook(() => useCodeSnippets());

    act(() => {
      result.current.createSnippet({
        name: "API Call",
        code: "fetch()",
        language: "typescript",
        category: "API",
      });
      result.current.createSnippet({
        name: "DB Query",
        code: "SELECT",
        language: "sql",
        category: "Database",
      });
    });

    const filtered = result.current.filterSnippets({ category: "API" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("API Call");
  });

  test("should filter snippets by tags", () => {
    const { result } = renderHook(() => useCodeSnippets());

    act(() => {
      result.current.createSnippet({
        name: "Tagged1",
        code: "code1",
        language: "typescript",
        tags: ["react", "hooks"],
      });
      result.current.createSnippet({
        name: "Tagged2",
        code: "code2",
        language: "typescript",
        tags: ["vue"],
      });
    });

    const filtered = result.current.filterSnippets({ tags: ["react"] });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Tagged1");
  });

  test("should get all unique tags", () => {
    const { result } = renderHook(() => useCodeSnippets());

    act(() => {
      result.current.createSnippet({
        name: "Snippet1",
        code: "code",
        language: "typescript",
        tags: ["react", "hooks"],
      });
      result.current.createSnippet({
        name: "Snippet2",
        code: "code",
        language: "typescript",
        tags: ["vue", "react"],
      });
    });

    expect(result.current.allTags).toEqual(["hooks", "react", "vue"]);
  });

  test("should get all unique categories", () => {
    const { result } = renderHook(() => useCodeSnippets());

    act(() => {
      result.current.createSnippet({
        name: "Snippet1",
        code: "code",
        language: "typescript",
        category: "Utils",
      });
      result.current.createSnippet({
        name: "Snippet2",
        code: "code",
        language: "typescript",
        category: "API",
      });
    });

    expect(result.current.allCategories).toEqual(["API", "Utils"]);
  });
});
