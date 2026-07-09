// Service worker mínimo para que la app sea instalable (PWA) y tenga
// una pantalla de "sin conexión". No cachea páginas autenticadas.
const CACHE = "taller-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Navegaciones: red primero; si no hay conexión, pantalla offline.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Assets estáticos de la app: cache-first (íconos, logo, chunks de Next).
  const url = new URL(req.url);
  const esEstatico =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/icon") ||
      url.pathname === "/logo.png" ||
      url.pathname.startsWith("/_next/static"));

  if (esEstatico) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
});
