
// Change VERSION à chaque mise à jour pour forcer le rafraîchissement du cache.

const VERSION = "spity-1.5";

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e =>
  e.waitUntil(
    caches.keys()
      .then(k =>
        Promise.all(
          k.filter(n => n !== VERSION)
            .map(n => caches.delete(n))
        )
      )
      .then(() => clients.claim())
  )
);

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request, { cache: "no-cache" })
      .then(r => {
        const c = r.clone();

        caches.open(VERSION)
          .then(ca => ca.put(e.request, c));

        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
