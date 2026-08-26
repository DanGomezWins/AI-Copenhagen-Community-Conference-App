"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that backs the PWA install and, from Phase 5,
 * web push. Kept out of layout.tsx so the layout can stay a server component.
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed", err);
    });
  }, []);

  return null;
}
