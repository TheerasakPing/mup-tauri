import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

// Tauri-compatible entry point
// Note: Electron-specific imports (AppLoader, telemetry, titlebar) removed for Tauri

// Global error handlers for renderer process
window.addEventListener("error", (event) => {
  console.error("Uncaught error in renderer:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection in renderer:", event.reason);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
