// WHAT:    Service worker: keeps the app and the map files already seen on this device, so the app opens quickly, works
//          without a network once visited, and can be installed as an app (F8).
// IN:      Requests the page makes to its own site. The build fills in VERSION and PRECACHE (see vite.config.ts).
// OUT:     Answers from the device's cache where allowed; everything else goes to the network as before.
// USED BY: src/ui/install.ts registers it in the built site only, never in the dev server.
// RULES:   Live NASA feeds and NASA's photos are on other sites and always go to the network, so "live" stays live.
//          Each deploy has its own cache. A new version takes over open pages at once and deletes the older caches.
//          Site files under data/ other than tiles go to the network first: their names do not change between deploys.
// TRAPS:   PITFALLS 10: every address is relative to this file, because the site is served under the repository name.
//          A full phone can refuse to save; a failed save must never lose the answer the network gave.
// OWNER:   Role B.

const VERSION = '__BUILD_ID__';
const PRECACHE = __PRECACHE__;
const CACHE = `tether-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // One file that cannot be fetched must not stop the install.
    await Promise.all(PRECACHE.map((path) => cache.add(new Request(path, { cache: 'reload' })).catch(() => undefined)));
    // Take over at once. Waiting until every tab closed left the old worker answering a new page with the old
    // deploy's saved data files (a new site.json with an old heightM.f32), and loading the site failed. A page
    // opened before the deploy may now miss a removed script chunk; reloading it fixes that.
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Every older build's cache goes, so no saved file from another deploy can be served again.
    for (const key of await caches.keys()) {
      if (key.startsWith('tether-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

/** Save a copy, but never fail because of it: a full device must still get the answer the network gave. */
async function safePut(cache, key, response) {
  try {
    await cache.put(key, response);
  } catch (error) {
    // Most likely the storage quota. The file is simply not kept for offline use.
  }
}

/** The page itself: the network when it answers, so a new deploy is seen; the saved copy when offline. */
async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  let response;
  try {
    response = await fetch(request);
  } catch (error) {
    return (await cache.match(request, { ignoreSearch: true })) ?? (await cache.match('./')) ?? Response.error();
  }
  if (response.ok) await safePut(cache, './', response.clone());
  return response;
}

/** Site files whose names stay the same across deploys (site.json, grids, vectors): the network when it answers, so
 *  a definition and its grids always come from the same deploy; the saved copy when offline. */
async function networkFirstData(request) {
  const cache = await caches.open(CACHE);
  let response;
  try {
    response = await fetch(request);
  } catch (error) {
    return (await cache.match(request)) ?? Response.error();
  }
  if (response.ok && response.status === 200) await safePut(cache, request, response.clone());
  return response;
}

/** The app manifest: the saved copy at once, refreshed behind it. */
async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request);
  const fresh = fetch(request).then(async (response) => {
    if (response.ok) await safePut(cache, request, response.clone());
    return response;
  });
  if (saved) {
    event.waitUntil(fresh.catch(() => undefined));
    return saved;
  }
  return fresh;
}

/** Map tiles and built scripts: scripts have a new name when they change, and a tile is a picture that no other file
 *  must agree with, so a saved copy is used without asking the network. */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok && response.status === 200) await safePut(cache, request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.includes('/data/') && !url.pathname.includes('/tiles/')) {
    event.respondWith(networkFirstData(request));
  } else if (url.pathname.endsWith('.json') || url.pathname.endsWith('.webmanifest')) {
    event.respondWith(staleWhileRevalidate(event, request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
