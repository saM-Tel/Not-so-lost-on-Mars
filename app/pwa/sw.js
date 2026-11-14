// WHAT:    Service worker: keeps the app and the map files already seen on this device, so the app opens quickly, works
//          without a network once visited, and can be installed as an app (F8).
// IN:      Requests the page makes to its own site. The build fills in VERSION and PRECACHE (see vite.config.ts).
// OUT:     Answers from the device's cache where allowed; everything else goes to the network as before.
// USED BY: src/ui/install.ts registers it in the built site only, never in the dev server.
// RULES:   Live NASA feeds and NASA's photos are on other sites and always go to the network, so "live" stays live.
//          Each deploy has its own cache; the old one is deleted when the new version takes over.
// TRAPS:   PITFALLS 10: every address is relative to this file, because the site is served under the repository name.
// OWNER:   Role B.

const VERSION = '__BUILD_ID__';
const PRECACHE = __PRECACHE__;
const CACHE = `tether-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // One file that cannot be fetched must not stop the install.
    await Promise.all(PRECACHE.map((path) => cache.add(new Request(path, { cache: 'reload' })).catch(() => undefined)));
  })());
  // No skipWaiting: an open page keeps the version it started with, so it never asks for files a newer deploy removed.
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('tether-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

/** The page itself: the network when it answers, so a new deploy is seen; the saved copy when offline. */
async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put('./', response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request, { ignoreSearch: true })) ?? (await cache.match('./')) ?? Response.error();
  }
}

/** Small files that a rebuild may change (layers.json, sites.json): the saved copy at once, refreshed behind it. */
async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request);
  const fresh = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(request, response.clone());
    return response;
  });
  if (saved) {
    event.waitUntil(fresh.catch(() => undefined));
    return saved;
  }
  return fresh;
}

/** Tiles, grids and built scripts: their address changes when they change within a deploy, so a saved copy is kept. */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok && response.status === 200) await cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.endsWith('.json') || url.pathname.endsWith('.webmanifest')) {
    event.respondWith(staleWhileRevalidate(event, request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
