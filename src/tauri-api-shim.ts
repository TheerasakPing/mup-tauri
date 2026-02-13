/**
 * Tauri API Shim - Provides Electron-compatible window.api interface
 * 
 * This module bridges Electron IPC calls to Tauri invoke commands.
 * It maintains backward compatibility with the existing frontend code
 * while using Tauri's IPC under the hood.
 */

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

// Deep link payload type (matches the frontend's expected structure)
interface MuxDeepLinkPayload {
  type: "new_chat";
  project?: string;
  projectPath?: string;
  projectId?: string;
  prompt?: string;
  sectionId?: string;
}

// WindowApi interface definition (from global.d.ts)
interface WindowApi {
  platform: NodeJS.Platform;
  versions: {
    node?: string;
    chrome?: string;
    electron?: string;
  };
  muxMdUrlOverride?: string;
  debugLlmRequest?: boolean;
  enableTelemetryInDev?: boolean;
  isE2E?: boolean;
  isRosetta?: boolean;
  isWindowsWslShell?: boolean;
  getApiServerUrl?: () => Promise<string | null>;
  getIsRosetta?: () => Promise<boolean>;
  getIsWindowsWslShell?: () => Promise<boolean>;
  onNotificationClicked?: (callback: (data: { workspaceId: string }) => void) => () => void;
  consumePendingDeepLinks?: () => MuxDeepLinkPayload[];
  onDeepLink?: (callback: (payload: MuxDeepLinkPayload) => void) => () => void;
  tokenizer?: unknown;
  providers?: unknown;
  nameGeneration?: unknown;
  workspace?: unknown;
  projects?: unknown;
  window?: unknown;
  terminal?: unknown;
  update?: unknown;
  server?: unknown;
}

// Extend Window interface to include api
declare global {
  interface Window {
    api?: WindowApi;
  }
}

// Platform detection
function detectPlatform(): NodeJS.Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "win32";
  if (ua.includes("mac")) return "darwin";
  if (ua.includes("linux")) return "linux";
  if (ua.includes("freebsd")) return "freebsd";
  return "linux"; // Default fallback
}

// System info from Tauri
interface SystemInfo {
  platform: string;
  arch: string;
  is_rosetta: boolean;
  is_windows_wsl_shell: boolean;
}

// Deep link payload from Tauri (matches Rust struct)
interface TauriDeepLinkPayload {
  payload_type: string;
  project?: string;
  project_path?: string;
  project_id?: string;
  prompt?: string;
  section_id?: string;
}

// Convert Tauri deep link payload to frontend format
function convertDeepLinkPayload(tauri: TauriDeepLinkPayload): MuxDeepLinkPayload {
  return {
    type: tauri.payload_type as "new_chat",
    project: tauri.project,
    projectPath: tauri.project_path,
    projectId: tauri.project_id,
    prompt: tauri.prompt,
    sectionId: tauri.section_id,
  };
}

/**
 * Initialize the Tauri API shim on window.api
 * This should be called early in the app lifecycle
 */
export async function initTauriApiShim(): Promise<void> {
  // Only initialize in Tauri environment
  if (typeof window === "undefined") {
    return;
  }

  // Check if running in Tauri (has __TAURI__ global)
  const isTauri = "__TAURI__" in window;
  if (!isTauri) {
    console.log("[TauriShim] Not running in Tauri, skipping initialization");
    return;
  }

  // Fetch system info from Tauri backend
  let systemInfo: SystemInfo | null = null;
  try {
    systemInfo = await invoke<SystemInfo>("get_system_info");
    console.log("[TauriShim] System info:", systemInfo);
  } catch (error) {
    console.error("[TauriShim] Failed to get system info:", error);
  }

  const platform = systemInfo?.platform ?? detectPlatform();
  const isRosetta = systemInfo?.is_rosetta ?? false;
  const isWindowsWslShell = systemInfo?.is_windows_wsl_shell ?? false;

  // Pending deep links that arrived before subscription
  let pendingDeepLinks: MuxDeepLinkPayload[] = [];
  let deepLinkCallbacks: ((payload: MuxDeepLinkPayload) => void)[] = [];

  // Listen for deep link events from Tauri
  let deepLinkUnsubscribe: UnlistenFn | null = null;
  try {
    deepLinkUnsubscribe = await listen<TauriDeepLinkPayload>("mux:deep-link", (event) => {
      const payload = convertDeepLinkPayload(event.payload);
      if (deepLinkCallbacks.length > 0) {
        deepLinkCallbacks.forEach((cb) => cb(payload));
      } else {
        pendingDeepLinks.push(payload);
      }
    });
    console.log("[TauriShim] Deep link listener registered");
  } catch (error) {
    console.error("[TauriShim] Failed to register deep link listener:", error);
  }

  // Create the window.api interface
  const api: WindowApi = {
    platform: platform as NodeJS.Platform,
    versions: {
      // Tauri doesn't have Node/Chrome/Electron versions
      // These are placeholders for compatibility
      node: undefined,
      chrome: undefined,
      electron: undefined,
    },
    
    // Rosetta detection (macOS)
    isRosetta,
    async getIsRosetta() {
      return isRosetta;
    },
    
    // Windows WSL shell detection
    isWindowsWslShell,
    async getIsWindowsWslShell() {
      return isWindowsWslShell;
    },
    
    // API server URL - in Tauri, we use localhost directly
    async getApiServerUrl() {
      return "http://localhost:3000";
    },
    
    // Deep link handling
    consumePendingDeepLinks() {
      const links = [...pendingDeepLinks];
      pendingDeepLinks = [];
      return links;
    },
    
    onDeepLink(callback) {
      deepLinkCallbacks.push(callback);
      
      // Return unsubscribe function
      return () => {
        const index = deepLinkCallbacks.indexOf(callback);
        if (index > -1) {
          deepLinkCallbacks.splice(index, 1);
        }
      };
    },
    
    // Notification click handling
    // Note: This would need to be implemented in the Tauri backend
    onNotificationClicked(callback) {
      // TODO: Implement notification handling in Tauri
      // For now, return a no-op unsubscribe
      console.warn("[TauriShim] onNotificationClicked not yet implemented");
      return () => {};
    },
    
    // Debug flags - read from environment or localStorage
    get debugLlmRequest() {
      return localStorage.getItem("debugLlmRequest") === "true";
    },
    set debugLlmRequest(value: boolean | undefined) {
      if (value) {
        localStorage.setItem("debugLlmRequest", "true");
      } else {
        localStorage.removeItem("debugLlmRequest");
      }
    },
    
    get enableTelemetryInDev() {
      return localStorage.getItem("enableTelemetryInDev") === "true";
    },
    set enableTelemetryInDev(value: boolean | undefined) {
      if (value) {
        localStorage.setItem("enableTelemetryInDev", "true");
      } else {
        localStorage.removeItem("enableTelemetryInDev");
      }
    },
    
    get isE2E() {
      return localStorage.getItem("isE2E") === "true";
    },
    set isE2E(value: boolean | undefined) {
      if (value) {
        localStorage.setItem("isE2E", "true");
      } else {
        localStorage.removeItem("isE2E");
      }
    },
    
    get muxMdUrlOverride() {
      return localStorage.getItem("muxMdUrlOverride") ?? undefined;
    },
    set muxMdUrlOverride(value: string | undefined) {
      if (value) {
        localStorage.setItem("muxMdUrlOverride", value);
      } else {
        localStorage.removeItem("muxMdUrlOverride");
      }
    },
  };

  // Install on window
  window.api = api;
  console.log("[TauriShim] window.api initialized for Tauri environment");
}

// Export a function to check if we're in Tauri
export function isTauriEnv(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

// Export a function to check if we're in desktop mode (Electron or Tauri)
export function isDesktopMode(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.api?.getIsRosetta === "function";
}
