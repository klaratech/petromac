# Kiosk Service Worker hardening patch (trade‑show safe)

This note includes:

1. **What to change** (and why) in the kiosk Service Worker.
2. **How to patch** the repo (step‑by‑step).
3. **What to update in docs/README**.
4. A **drop‑in updated `kiosk-sw.js`** (copy/paste).

---

## Why we’re patching

Your SW is already well-structured (versioned caches, separate buckets, install precache, activate cleanup).  
However, there are a few edge cases that can make kiosk offline behavior **flaky in the field**:

### Issues to address

1. **Metadata keying is inconsistent**  
   Metadata is stored using the Request object but later deleted using a different Request object instance. This can leave orphaned metadata and make expiry checks unreliable.

2. **Kiosk navigation has no “boot” fallback if first load is offline**  
   If the booth Wi‑Fi is poor and the kiosk is opened for the first time offline, the SW won’t have cached the HTML shell.

3. **Possible wrong manifest/icon URLs**  
   If the kiosk manifest is scoped under `/intranet/kiosk/...`, precaching `/manifest.json` won’t help.

4. **`/_next/image` not cached** (only if you use Next `<Image />`)  
   Many images will be requested via `/_next/image?...` and won’t be available offline unless cached.

5. **Range requests for video** (optional but recommended)  
   Browsers frequently use `Range` for MP4. Cache-first with Range can cause unexpected cache misses.

---

## Patch instructions (step‑by‑step)

### Step 0 — Identify kiosk entry route and manifest/icon URLs

Confirm, in your kiosk layout/component:

- kiosk entry URL (examples):
  - `/intranet/kiosk`
  - `/intranet/kiosk/`
  - `/intranet/kiosk/home`

- kiosk manifest URL (examples):
  - `/manifest.json` (global)
  - `/intranet/kiosk/manifest.json` (scoped)

- icon URLs actually referenced by the manifest or `<link rel="icon">`.

Update the `PRECACHE_ASSETS` list accordingly.

---

### Step 1 — Patch `kiosk-sw.js`

Replace the existing `kiosk-sw.js` with the updated code in the next section.  
Key changes you should see:

- Metadata is stored and looked up by `request.url` **string keys** (deterministic).
- Adds a precached kiosk “app shell” route (`KIOSK_SHELL_ROUTES`).
- Adds caching for `/_next/image` (optional but safe).
- Adds safe handling for `Range` requests (optional; keeps logic simple).

---

### Step 2 — Bump cache version when kiosk assets change

When you change kiosk critical assets (CSV/JSON/manifest/icons), bump:

```js
const VERSION = 'v5';
```

This automatically:
- creates fresh caches
- deletes old kiosk caches on activation

---

### Step 3 — Validate offline behavior locally

1. `pnpm install`
2. `pnpm run build`
3. `pnpm start` (or whatever port you use)
4. Open kiosk route (e.g. `/intranet/kiosk`)
5. In DevTools:
   - Application → Service Workers → confirm SW is active
   - Application → Cache Storage → confirm caches populated
6. Simulate offline:
   - DevTools → Network → Offline
   - Hard refresh the kiosk route
7. Confirm:
   - kiosk boots
   - success stories CSV loads
   - map data loads
   - representative images load
   - (if required) representative video/model loads offline

---

### Step 4 — Update documentation

#### Update `KIOSK.md` (if you have it)
Add:
- the “why” summary above
- the explicit rule: **bump `VERSION` when kiosk critical assets change**
- the offline validation checklist in Step 3
- note about `/_next/image` caching (if applicable)

#### Update main `README.md`
Add a short section:

- **Kiosk offline support:** see `KIOSK.md`  
- Mention `pnpm exec playwright install` before running e2e tests.

Example snippet:

```md
## Kiosk
Kiosk routes live under `/intranet/kiosk`. Offline caching is implemented via a kiosk-scoped Service Worker.
See `KIOSK.md` for cache versioning and offline validation steps.

### E2E tests
Install Playwright browsers once:
`pnpm exec playwright install`
Then run:
`pnpm run test:e2e`
```

---

### Step 5 — Run checks

- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run test:e2e` (after `pnpm exec playwright install`)

---

## Updated `kiosk-sw.js` (drop‑in)

> **IMPORTANT:** update `KIOSK_SHELL_ROUTES`, `MANIFEST_URL`, and icon paths to match your real kiosk URLs.

```js
// Kiosk-specific Service Worker
// Scope: /intranet/kiosk/
// Purpose: Cache assets for offline kiosk functionality

const VERSION = 'v5';

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

// If kiosk uses Next/Image, cache its optimized outputs as well.
const NEXT_IMAGE_PATH = '/_next/image';

const MEDIA_PATHS = ['/videos/', '/models/', '/flipbooks/', '/images/'];

// Kiosk shell routes to precache so first-ever offline load can still boot.
// Adjust to your real kiosk entry routes.
const KIOSK_SHELL_ROUTES = [
  '/intranet/kiosk',
  '/intranet/kiosk/',
];

// Adjust if your manifest is kiosk-scoped rather than root-scoped.
const MANIFEST_URL = '/manifest.json';

// Critical assets to pre-cache on install (small, stable files only)
const PRECACHE_ASSETS = [
  ...KIOSK_SHELL_ROUTES,

  MANIFEST_URL,
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

  // For Range requests (common for video), caching can be unreliable.
  // Keep it simple: let the network handle Range requests when online;
  // offline playback should still work if the full file was cached earlier.
  if (request.headers.has('range')) return;

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

  // Cache Next.js image optimization outputs (if used)
  if (url.pathname.startsWith(NEXT_IMAGE_PATH)) {
    event.respondWith(cacheFirst(request, RUNTIME_STATIC, MAX_STATIC_ENTRIES, MAX_DATA_AGE_SECONDS));
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
    return;
  }
});

async function cacheFirst(request, cacheName, maxEntries, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached && !(await isExpired(request, maxAgeSeconds))) {
    return cached;
  }

  // If we have cached but it's expired, prefer network; if network fails, fall back to stale cached.
  const staleCached = cached || null;

  if (cached) {
    await cache.delete(request);
    await deleteMetadata(request.url);
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
      await setMetadata(request.url);
      await trimCache(cache, maxEntries);
    }
    return response;
  } catch (err) {
    if (staleCached) return staleCached;
    throw err;
  }
}

async function networkFirst(request, cacheName, maxEntries, maxAgeSeconds) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      await setMetadata(request.url);
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

// Store metadata by URL (string key) for deterministic lookup and deletion.
async function setMetadata(url) {
  const cache = await caches.open(META_CACHE);
  const body = JSON.stringify({ cachedAt: Date.now() });
  await cache.put(url, new Response(body));
}

async function deleteMetadata(url) {
  const cache = await caches.open(META_CACHE);
  await cache.delete(url);
}

async function isExpired(request, maxAgeSeconds) {
  if (!maxAgeSeconds) return false;

  const cache = await caches.open(META_CACHE);
  const response = await cache.match(request.url);
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
    await deleteMetadata(keys[i].url);
  }
}
```

---

## Quick checklist for the agent / PR description

- [ ] Update `kiosk-sw.js` with deterministic metadata keying and kiosk shell precache.
- [ ] Confirm kiosk manifest/icon URLs match actual kiosk layout.
- [ ] Ensure kiosk layout registers SW only for kiosk routes.
- [ ] Update `KIOSK.md` with version bump + offline validation steps.
- [ ] Add a README pointer to `KIOSK.md`.
- [ ] Run `pnpm run build`, `pnpm run lint`, `pnpm run typecheck`, and smoke tests.

---

If you want, I can tailor `KIOSK_SHELL_ROUTES` and manifest/icon paths exactly to your repo once you confirm the kiosk entry URL and manifest location.
