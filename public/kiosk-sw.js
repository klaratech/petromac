// Kiosk-specific Service Worker
// Scope: /intranet/kiosk/
// Purpose: Cache assets for offline kiosk functionality

const VERSION = 'v4';
const PRECACHE = `kiosk-precache-${VERSION}`;
const RUNTIME_STATIC = `kiosk-static-${VERSION}`;
const RUNTIME_MEDIA = `kiosk-media-${VERSION}`;
const RUNTIME_DATA = `kiosk-data-${VERSION}`;
const META_CACHE = `kiosk-meta-${VERSION}`;

const MAX_STATIC_ENTRIES = 80;
const MAX_MEDIA_ENTRIES = 60;
const MAX_DATA_ENTRIES = 40;

const MAX_MEDIA_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MAX_DATA_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const MEDIA_PATHS = ['/videos/', '/models/', '/flipbooks/', '/images/'];

// Critical assets to pre-cache on install (small, stable files only)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/data/country_labels.json',
  '/data/operations_data.json',
  '/data/region_coords.json',
  '/data/region_data.json',
  '/data/successstories-summary.csv',
  '/data/world-110m.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('[Kiosk SW] Pre-cache failed:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name.startsWith('kiosk-') && !name.endsWith(VERSION))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Cache kiosk navigations (network-first, fallback to cache)
  if (request.mode === 'navigate' && url.pathname.startsWith('/intranet/kiosk')) {
    event.respondWith(networkFirst(request, RUNTIME_STATIC, MAX_STATIC_ENTRIES));
    return;
  }

  // Cache Next.js static assets
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, RUNTIME_STATIC, MAX_STATIC_ENTRIES));
    return;
  }

  // Cache data files with network-first strategy
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      networkFirst(request, RUNTIME_DATA, MAX_DATA_ENTRIES, MAX_DATA_AGE_SECONDS)
    );
    return;
  }

  // Cache media assets (videos, models, flipbooks, images)
  if (MEDIA_PATHS.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(
      cacheFirst(request, RUNTIME_MEDIA, MAX_MEDIA_ENTRIES, MAX_MEDIA_AGE_SECONDS)
    );
  }
});

async function cacheFirst(request, cacheName, maxEntries, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached && !(await isExpired(request, maxAgeSeconds))) {
    return cached;
  }

  if (cached) {
    await cache.delete(request);
    await deleteMetadata(request);
  }

  const response = await fetch(request);
  if (response && response.ok) {
    await cache.put(request, response.clone());
    await setMetadata(request);
    await trimCache(cache, maxEntries);
  }

  return response;
}

async function networkFirst(request, cacheName, maxEntries, maxAgeSeconds) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      await setMetadata(request);
      await trimCache(cache, maxEntries);
    }
    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached && !(await isExpired(request, maxAgeSeconds))) return cached;
    throw error;
  }
}

async function setMetadata(request) {
  const cache = await caches.open(META_CACHE);
  const body = JSON.stringify({ cachedAt: Date.now() });
  await cache.put(request, new Response(body));
}

async function deleteMetadata(request) {
  const cache = await caches.open(META_CACHE);
  await cache.delete(request);
}

async function isExpired(request, maxAgeSeconds) {
  if (!maxAgeSeconds) return false;

  const cache = await caches.open(META_CACHE);
  const response = await cache.match(request);
  if (!response) return false;

  try {
    const { cachedAt } = await response.json();
    if (!cachedAt) return false;
    return Date.now() - cachedAt > maxAgeSeconds * 1000;
  } catch {
    return false;
  }
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;

  const deletes = keys.length - maxEntries;
  for (let i = 0; i < deletes; i += 1) {
    await cache.delete(keys[i]);
    await deleteMetadata(keys[i]);
  }
}
