// AIC Info service worker.
// Phase 1: install/activate only, so the PWA is installable.
// Phase 5 (days 12-13) adds the push + notificationclick handlers.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
