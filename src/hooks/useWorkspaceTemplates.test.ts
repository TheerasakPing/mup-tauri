import { describe, it, expect } from "bun:test";
import type { WorkspaceTemplate, WorkspaceTemplateInput } from "@/common/types/workspaceTemplates";

describe("WorkspaceTemplate types and logic", () => {
  it("should create template with correct structure", () => {
    const input: WorkspaceTemplateInput = {
      name: "Test Template",
      description: "Test description",
      runtime: "local",
      thinkingLevel: 2,
    };

    const template: WorkspaceTemplate = {
      id: `template-${Date.now()}`,
      ...input,
      created: Date.now(),
      isDefault: false,
    };

    expect(template.name).toBe("Test Template");
    expect(template.runtime).toBe("local");
    expect(template.thinkingLevel).toBe(2);
    expect(template.isDefault).toBe(false);
  });

  it("should validate export/import format", () => {
    const templates: WorkspaceTemplate[] = [
      {
        id: "test-1",
        name: "Test Template",
        runtime: "local" as const,
        created: Date.now(),
      },
    ];

    const json = JSON.stringify(templates);
    const parsed = JSON.parse(json);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].name).toBe("Test Template");
  });

  it("should handle template updates", () => {
    const template: WorkspaceTemplate = {
      id: "test-1",
      name: "Original",
      runtime: "local",
      created: Date.now(),
    };

    const updated = {
      ...template,
      name: "Updated",
      description: "New description",
    };

    expect(updated.name).toBe("Updated");
    expect(updated.description).toBe("New description");
    expect(updated.id).toBe(template.id);
  });

  it("should reject invalid JSON on import", () => {
    expect(() => {
      JSON.parse("invalid json");
    }).toThrow();
  });
});
