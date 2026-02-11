import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import topLevelAwait from "vite-plugin-top-level-await";
import svgr from "vite-plugin-svgr";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const disableMermaid = process.env.VITE_DISABLE_MERMAID === "1";

// Tauri development configuration
const host = process.env.TAURI_DEV_HOST;

const alias: Record<string, string> = {
  "@": path.resolve(__dirname, "./src"),
};

if (disableMermaid) {
  alias["mermaid"] = path.resolve(__dirname, "./src/mocks/mermaidStub.ts");
}

// React Compiler configuration
const reactCompilerConfig = {
  target: "18",
};

const babelPlugins = [["babel-plugin-react-compiler", reactCompilerConfig]];

const basePlugins = [
  svgr(),
  react({
    babel: {
      plugins: babelPlugins,
    },
  }),
  tailwindcss(),
];

const getPlugins = (mode: string) => {
  const plugins = [...basePlugins];

  if (mode === "development") {
    plugins.push(topLevelAwait());
  }

  return plugins;
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProfiling = mode === "profiling";
  const aliasMap: Record<string, string> = { ...alias };

  if (isProfiling) {
    aliasMap["react-dom$"] = "react-dom/profiling";
    aliasMap["scheduler/tracing"] = "scheduler/tracing-profiling";
  }

  return {
    plugins: getPlugins(mode),
    resolve: {
      alias: aliasMap,
    },
    define: {
      "globalThis.__MUX_MD_URL_OVERRIDE__": JSON.stringify(process.env.MUX_MD_URL_OVERRIDE ?? ""),
      ...(isProfiling ? { __PROFILE__: "true" } : {}),
    },
    base: "./",
    
    // Vite options tailored for Tauri development
    clearScreen: false,
    
    build: {
      outDir: "dist",
      assetsDir: ".",
      emptyOutDir: true,
      sourcemap: mode === "development" || isProfiling,
      minify: "esbuild",
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
          terminal: path.resolve(__dirname, "terminal.html"),
        },
        output: {
          format: "es",
          inlineDynamicImports: false,
          sourcemapExcludeSources: false,
        },
      },
      chunkSizeWarningLimit: 2000,
      target: "esnext",
    },
    worker: {
      format: "es",
      plugins: () => [topLevelAwait()],
    },
    
    // Tauri-specific server configuration
    server: {
      port: 1420,
      strictPort: true,
      host: host || false,
      hmr: host
        ? {
            protocol: "ws",
            host,
            port: 1421,
          }
        : undefined,
      watch: {
        // Tell Vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**", "**/node_modules/**", "**/dist/**", "**/.git/**"],
        
        // Use polling on Windows
        usePolling: process.platform === "win32",
        interval: 1000,
        ...(process.platform === "win32" && {
          binaryInterval: 1000,
          awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100,
          },
        }),
      },
      sourcemapIgnoreList: () => false,
    },
    
    optimizeDeps: {
      esbuildOptions: {
        target: "esnext",
      },
      entries: ["index.html", "terminal.html"],
      force: false,
    },
    assetsInclude: ["**/*.wasm"],
  };
});
