// Service worker: lets the installed app open offline.
// Network first (so updates show up), falling back to the cache when offline or when
// the network is too slow (weak signal outside).
// Bump CACHE when the file list changes.

const CACHE = "snow-tracker-v1";
const FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./readings.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(respond(event));
});

async function respond(event) {
  const req = event.request;
  const fromCache = async () =>
    (await caches.match(req, { ignoreSearch: true })) ??
      (req.mode === "navigate" ? await caches.match("./index.html") : undefined);

  const network = fetch(req).then(async (res) => {
    if (res.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(req, res.clone());
    }
    return res;
  });
  // Keep the cache update running even if we answer from the cache first.
  event.waitUntil(network.catch(() => {}));

  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS, null));
  try {
    const res = await Promise.race([network, timeout]);
    if (res) return res;
  } catch {
    // Offline: fall through to cache.
  }
  const cached = await fromCache();
  return cached ?? network;
}
