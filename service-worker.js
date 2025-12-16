const CACHE_NAME = "checkinfra-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./avaliacao.html",
  "./manifest.json",
  "./mapa/escolas.js"
];

self.addEventListener("install", event => {
  console.log("[SW] Install");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
