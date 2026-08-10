// C-Wallet service worker — NETWORK-FIRST
// Online: always fetch fresh (updates show immediately, no stale cache).
// Offline: fall back to the last cached version so the app still opens.
const C = "cwallet-nf-3";
const ASSETS = ["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS).catch(()=>{})));
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      try { const cache = await caches.open(C); cache.put(req, fresh.clone()); } catch (_) {}
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === "navigate") {
        const idx = await caches.match("./index.html");
        if (idx) return idx;
      }
      throw err;
    }
  })());
});
