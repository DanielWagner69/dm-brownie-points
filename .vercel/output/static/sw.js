/**
 * Pawmise service worker — installability only.
 * No offline cache of HTML/JS. Caching the app shell caused "Failed to fetch
 * dynamically imported module" after deploys (stale HTML → missing hashed chunks).
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// Intentionally no fetch handler — always hit the network for app code & data.
