"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker in production (and on localhost for testing).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (process.env.NODE_ENV !== "production" && !isLocalhost) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (err) {
        console.error("Service worker registration failed", err);
      }
    };

    void register();
  }, []);

  return null;
}
