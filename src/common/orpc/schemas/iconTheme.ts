import { z } from "zod";

export const IconDefinitionSchema = z.object({
    iconPath: z.string(),
    fontCharacter: z.string().optional(),
    fontColor: z.string().optional(),
    fontSize: z.string().optional(),
    fontId: z.string().optional(),
});

// Recursive parts simplified for now to avoid deep nesting issues in Zod inference if not needed strictly
export const IconThemeDocumentSchema = z.object({
    fonts: z.array(z.unknown()).optional(),
    iconDefinitions: z.record(z.string(), IconDefinitionSchema),
    file: z.string().optional(),
    folder: z.string().optional(),
    folderExpanded: z.string().optional(),
    rootFolder: z.string().optional(),
    rootFolderExpanded: z.string().optional(),
    fileExtensions: z.record(z.string(), z.string()).optional(),
    fileNames: z.record(z.string(), z.string()).optional(),
    folderNames: z.record(z.string(), z.string()).optional(),
    folderNamesExpanded: z.record(z.string(), z.string()).optional(),
    languageIds: z.record(z.string(), z.string()).optional(),
    hidesExplorerArrows: z.boolean().optional(),
    light: z.record(z.string(), z.unknown()).optional(),
    highContrast: z.record(z.string(), z.unknown()).optional(),
});

export const InstalledIconThemeSchema = z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    publisher: z.string().optional(),
    version: z.string().optional(),
    themeDir: z.string(),
    themeJsonPath: z.string(),
    isBuiltin: z.boolean(),
});

export const iconTheme = {
    getActiveThemeId: {
        input: z.void(),
        output: z.string(),
    },
    setActiveTheme: {
        input: z.object({ themeId: z.string() }),
        output: z.void(),
    },
    getInstalledThemes: {
        input: z.void(),
        output: z.array(InstalledIconThemeSchema),
    },
    deleteTheme: {
        input: z.object({ themeId: z.string() }),
        output: z.boolean(),
    },
    getActiveThemeDocument: {
        input: z.void(),
        output: IconThemeDocumentSchema.nullable(),
    },
    importVsix: {
        input: z.object({ vsixBase64: z.string() }),
        output: z.object({
            importedThemeIds: z.array(z.string()),
            errors: z.array(z.string()),
        }),
    },
    getIconFile: {
        input: z.object({ themeId: z.string(), iconPath: z.string() }),
        output: z.object({ data: z.string(), mimeType: z.string() }).nullable(),
    },
};
