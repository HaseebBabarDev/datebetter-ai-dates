import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle chunk loading failures from stale PWA cache
window.addEventListener("error", (event) => {
  if (
    event.message?.includes("Failed to fetch dynamically imported module") ||
    event.message?.includes("Importing a module script failed") ||
    event.message?.includes("error loading dynamically imported module")
  ) {
    // Clear service workers and caches, then reload
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
      });
    }
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    // Reload after a brief delay to let cleanup finish
    setTimeout(() => window.location.reload(), 500);
  }
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
