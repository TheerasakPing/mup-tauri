import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useWorkspaceTemplates } from "@/hooks/useWorkspaceTemplates";
import type { WorkspaceTemplateInput } from "@/common/types/workspaceTemplates";
import { X, Download, Upload, Plus, Trash2, Edit } from "lucide-react";

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (templateId: string) => void;
}

/**
 * Template Manager Dialog
 * Allows users to create, edit, delete, and export/import workspace templates
 */
export function TemplateManager({ isOpen, onClose, onSelectTemplate }: TemplateManagerProps) {
  const {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    exportTemplates,
    importTemplates,
  } = useWorkspaceTemplates();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleExport = () => {
    const json = exportTemplates();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mux-templates-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = ev.target?.result as string;
        importTemplates(json);
      } catch (error) {
        alert("Failed to import templates. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Workspace Templates</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-sm opacity-70 hover:opacity-100 transition">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Template
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-secondary/50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <label className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-secondary/50 cursor-pointer">
              <Upload className="h-4 w-4" />
              Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-secondary/30 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{template.name}</h3>
                    {template.isDefault && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                        Default
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  )}
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    <span>Runtime: {template.runtime}</span>
                    {template.model && <span>Model: {template.model}</span>}
                    {template.thinkingLevel !== undefined && (
                      <span>Thinking: {template.thinkingLevel}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {onSelectTemplate && (
                    <button
                      onClick={() => {
                        onSelectTemplate(template.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Use
                    </button>
                  )}
                  <button
                    onClick={() => setEditingId(template.id)}
                    className="p-2 rounded-md hover:bg-secondary/50"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => {
                        if (confirm("Delete this template?")) {
                          deleteTemplate(template.id);
                        }
                      }}
                      className="p-2 rounded-md hover:bg-danger/10 text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
