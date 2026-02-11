import { usePersistedState } from "./usePersistedState";
import type { WorkspaceTemplate, WorkspaceTemplateInput } from "@/common/types/workspaceTemplates";
import { DEFAULT_TEMPLATES } from "@/common/types/workspaceTemplates";

const WORKSPACE_TEMPLATES_KEY = "workspaceTemplates:list";

/**
 * Hook for managing workspace templates
 * Provides CRUD operations with localStorage persistence
 */
export function useWorkspaceTemplates() {
  const [templates, setTemplates] = usePersistedState<WorkspaceTemplate[]>(
    WORKSPACE_TEMPLATES_KEY,
    DEFAULT_TEMPLATES
  );

  const createTemplate = (input: WorkspaceTemplateInput): WorkspaceTemplate => {
    const newTemplate: WorkspaceTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...input,
      created: Date.now(),
      isDefault: false,
    };

    setTemplates((prev) => [...prev, newTemplate]);
    return newTemplate;
  };

  const updateTemplate = (id: string, updates: Partial<WorkspaceTemplateInput>): void => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTemplate = (id: string): void => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const getTemplate = (id: string): WorkspaceTemplate | undefined => {
    return templates.find((t) => t.id === id);
  };

  const exportTemplates = (): string => {
    return JSON.stringify(templates, null, 2);
  };

  const importTemplates = (jsonString: string): void => {
    try {
      const imported = JSON.parse(jsonString) as WorkspaceTemplate[];
      setTemplates((prev) => [...prev, ...imported]);
    } catch (error) {
      console.error("Failed to import templates:", error);
      throw new Error("Invalid template JSON format");
    }
  };

  return {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    exportTemplates,
    importTemplates,
  };
}
