/*
 * Service worker: makes the page work offline once it has been opened.
 * App files: served from cache, refreshed in the background (stale-while-revalidate).
 * Google Fonts: cached at runtime the same way; without them the page falls back to system fonts.
 * Bump VERSION whenever files change so installed copies pick up the update.
 */
const VERSION = "v2";
const APP_CACHE = `ledger-app-${VERSION}`;
const FONT_CACHE = "ledger-fonts";
const APP_FILES = [
  "./", "./index.html", "./manifest.webmanifest",
  "./css/style.css",
  "./data/sources.js", "./data/parameters.js", "./data/comparators.js",
  "./js/model.js", "./js/charts.js", "./js/pictos.js", "./js/app.js",
  "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("ledger-app-") && k !== APP_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(cache =>
    cache.match(request, { ignoreSearch: true }).then(cached => {
      const network = fetch(request)
        .then(res => { if (res && (res.ok || res.type === "opaque")) cache.put(request, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    // Navigations fall back to the cached page when offline.
    if (req.mode === "navigate") {
      event.respondWith(fetch(req).catch(() => caches.match("./index.html")));
      return;
    }
    event.respondWith(staleWhileRevalidate(req, APP_CACHE));
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(staleWhileRevalidate(req, FONT_CACHE));
  }
});
