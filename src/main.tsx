import React from "react";
import ReactDOM from "react-dom/client";
import { AppLoader } from "@/components/AppLoader";
import { initTelemetry, trackAppStarted } from "@/common/telemetry";
import { initTitlebarInsets } from "@/hooks/useDesktopTitlebar";
import { initTauriApiShim } from "@/tauri-api-shim";

// Initialize Tauri API shim (provides window.api compatibility layer)
// This must be called before any code that accesses window.api
initTauriApiShim().catch((error) => {
  console.error("Failed to initialize Tauri API shim:", error);
});

// Initialize telemetry on app startup
initTelemetry();
trackAppStarted();

// Initialize titlebar CSS custom properties (platform-specific insets)
initTitlebarInsets();

// Global error handlers for renderer process
// These catch errors that escape the ErrorBoundary
window.addEventListener("error", (event) => {
  console.error("Uncaught error in renderer:", event.error);
  console.error("Error details:", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection in renderer:", event.reason);
  console.error("Promise:", event.promise);
  if (event.reason instanceof Error) {
    console.error("Stack:", event.reason.stack);
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  import.meta.env.MODE === "development" ? (
    <React.StrictMode>
      <AppLoader />
    </React.StrictMode>
  ) : (
    <AppLoader />
  )
);

// Register service worker for PWA support
if ("serviceWorker" in navigator) {
  const isHttpProtocol =
    window.location.protocol === "http:" || window.location.protocol === "https:";
  if (isHttpProtocol) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    });
  }
}
