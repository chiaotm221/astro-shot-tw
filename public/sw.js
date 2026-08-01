const VERSION = "astroshot-v6.0-1";
const CORE_CACHE = `${VERSION}-core`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const scopeUrl = new URL(self.registration.scope);
const scoped = (path) => new URL(path.replace(/^\//, ""), scopeUrl).href;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./data/stars.json",
  "./textures/eso-milky-way-panorama-4096.jpg",
  "./icon-512.png",
  "./apple-touch-icon.png",
].map(scoped);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CORE_CACHE).then(async (cache) => {
    await Promise.allSettled(CORE_ASSETS.map((asset) => cache.add(asset)));
    await self.skipWaiting();
  }));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("astroshot-") && key !== CORE_CACHE && key !== RUNTIME_CACHE)
      .map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await caches.match(scoped("./index.html"))) || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== scopeUrl.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
