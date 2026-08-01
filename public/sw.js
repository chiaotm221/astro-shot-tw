const VERSION = "astroshot-v6.1-1";
const CORE_CACHE = `${VERSION}-core`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const scopeUrl = new URL(self.registration.scope);
const scoped = (path) => new URL(path.replace(/^\//, ""), scopeUrl).href;
const READY_MARKER = scoped("./__offline-ready__");
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
  event.waitUntil(cacheOfflineAssets(false));
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

async function cacheOfflineAssets(refresh) {
  const cache = await caches.open(CORE_CACHE);
  let cached = 0;
  let failed = 0;
  const cacheAssets = async (assets) => Promise.all(assets.map(async (asset) => {
    try {
      if (!refresh && await cache.match(asset)) { cached += 1; return; }
      const response = await fetch(asset, { cache: "reload" });
      if (!response.ok) throw new Error("Offline asset request failed");
      await cache.put(asset, response);
      cached += 1;
    } catch { failed += 1; }
  }));
  await cacheAssets(CORE_ASSETS);

  try {
    const entry = await cache.match(scoped("./index.html")) || await cache.match(scoped("./"));
    if (!entry) throw new Error("Application entry point is unavailable");
    const html = await entry.text();
    const discovered = new Set();
    for (const match of html.matchAll(/(?:src|href)=["']([^"'#]+)["']/gi)) {
      const url = new URL(match[1], scopeUrl);
      if (url.origin === scopeUrl.origin && url.pathname.startsWith(scopeUrl.pathname)) discovered.add(url.href);
    }
    await cacheAssets([...discovered]);
  } catch { failed += 1; }

  if (failed === 0) {
    await cache.put(READY_MARKER, new Response(JSON.stringify({ version: VERSION, cachedAt: Date.now() }), { headers: { "content-type": "application/json" } }));
  } else {
    await cache.delete(READY_MARKER);
  }
  return { ok: failed === 0, cached, failed };
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === "CACHE_OFFLINE") {
    event.waitUntil(cacheOfflineAssets(Boolean(event.data.refresh)).then((result) => {
      event.ports[0]?.postMessage(result);
    }));
  }
});
