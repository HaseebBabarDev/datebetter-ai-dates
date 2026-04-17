import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativeShell } from "@/lib/capacitor/initNativeShell";
import { initPurchases } from "@/lib/revenuecat/initPurchases";

void initNativeShell();
void initPurchases();

// Auto-recover from stale PWA cache / chunk loading failures
const handleChunkError = () => {
  const reloadKey = "chunk-error-reload";
  // Prevent infinite reload loops — only auto-reload once
  if (sessionStorage.getItem(reloadKey)) return;
  sessionStorage.setItem(reloadKey, "1");

  const cleanup = async () => {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
    window.location.reload();
  };

  cleanup().catch(() => window.location.reload());
};

const isChunkError = (msg: string) =>
  msg.includes("Failed to fetch dynamically imported module") ||
  msg.includes("Importing a module script failed") ||
  msg.includes("error loading dynamically imported module") ||
  msg.includes("Loading chunk") ||
  msg.includes("Loading CSS chunk");

window.addEventListener("error", (event) => {
  if (event.message && isChunkError(event.message)) {
    handleChunkError();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason?.message || String(event.reason || "");
  if (isChunkError(msg)) {
    event.preventDefault();
    handleChunkError();
  }
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
