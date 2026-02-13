import { useCallback } from "react";
import { useAPI } from "@/contexts/API";
import type { RuntimeConfig } from "@/common/types/runtime";
import { isSSHRuntime, isDevcontainerRuntime } from "@/common/types/runtime";
import {
  createTerminalSession,
  openTerminalPopout,
  type TerminalSessionCreateOptions,
} from "@/utils/terminal";

/**
 * Hook to open a terminal window for a workspace.
 * Handles the difference between Desktop (Electron/Tauri) and Browser (Web) environments.
 *
 * For SSH/Devcontainer workspaces: Always opens a web-based xterm.js terminal that
 * connects through the backend PTY service (works in both browser and Desktop modes).
 *
 * For local workspaces in Desktop: Opens the user's native terminal emulator
 * (Ghostty, Terminal.app, etc.) with the working directory set to the workspace path.
 *
 * For local workspaces in browser: Opens a web-based xterm.js terminal in a popup window.
 */
export function useOpenTerminal() {
  const { api } = useAPI();

  return useCallback(
    async (
      workspaceId: string,
      runtimeConfig?: RuntimeConfig,
      options?: TerminalSessionCreateOptions
    ) => {
      if (!api) return;

      // Check if running in browser mode
      // window.api is only available in Desktop (Electron/Tauri, set by preload/shim)
      // If window.api exists, we're in Desktop; if not, we're in browser mode
      const isBrowser = !window.api;
      const isSSH = isSSHRuntime(runtimeConfig);
      const isDevcontainer = isDevcontainerRuntime(runtimeConfig);

      // SSH/Devcontainer workspaces always use web terminal (in browser popup or Electron window)
      // because the PTY service handles the SSH/container connection
      if (isBrowser || isSSH || isDevcontainer) {
        // Create terminal session first - window needs sessionId to connect
        const session = await createTerminalSession(api, workspaceId, options);
        openTerminalPopout(api, workspaceId, session.sessionId);
      } else {
        void api.terminal.openNative({ workspaceId });
      }
    },
    [api]
  );
}
