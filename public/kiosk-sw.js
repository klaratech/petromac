// Kiosk-specific Service Worker
// Scope: /intranet/kiosk/
// Purpose: Cache assets for offline kiosk functionality

const KIOSK_CACHE = "kiosk-cache-v2";
const KIOSK_SCOPE = "/intranet/kiosk/";

// Critical assets to pre-cache on install
const PRECACHE_ASSETS = [
  // Videos
  "/videos/cp8-placeholder.mp4",
  "/videos/cp12-placeholder.mp4",
  "/videos/dice.mp4",
  "/videos/helix.mp4",
  "/videos/intro-loop2.mp4",
  "/videos/pf.mp4",
  "/videos/WirelineExpress.mp4",
  // Core data files
  "/data/country_labels.json",
  "/data/operations_data.json",
  "/data/region_coords.json",
  "/data/region_data.json",
  "/data/successstories-summary.csv",
];

self.addEventListener("install", (event) => {
  console.log("[Kiosk SW] Installing service worker");
  event.waitUntil(
    caches.open(KIOSK_CACHE).then((cache) => {
      console.log("[Kiosk SW] Pre-caching critical assets...");
      return cache.addAll(PRECACHE_ASSETS).then(() => {
        console.log("[Kiosk SW] Pre-cache complete");
      }).catch((error) => {
        console.error("[Kiosk SW] Pre-cache failed:", error);
        // Continue anyway - some assets may have cached successfully
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  console.log("[Kiosk SW] Activating service worker");
  event.waitUntil(
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("kiosk-cache-") && name !== KIOSK_CACHE)
          .map((name) => {
            console.log("[Kiosk SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  
  // Only handle requests under the kiosk scope
  if (!url.pathname.startsWith(KIOSK_SCOPE)) {
    return;
  }
  
  // Cache-first strategy for media files (images, videos, 3D models)
  if (/\.(png|jpg|jpeg|webp|mp4|glb|gltf|pdf)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(KIOSK_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          console.log("[Kiosk SW] Serving from cache:", url.pathname);
          return cached;
        }
        
        try {
          const response = await fetch(event.request);
          if (response.ok) {
            console.log("[Kiosk SW] Caching:", url.pathname);
            cache.put(event.request, response.clone());
          }
          return response;
        } catch (error) {
          console.error("[Kiosk SW] Fetch failed:", url.pathname, error);
          throw error;
        }
      })
    );
  }
  // Network-first strategy for JSON and CSV data files
  else if (/\.(json|csv)$/i.test(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(KIOSK_CACHE);
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          console.log("[Kiosk SW] Network failed, trying cache:", url.pathname);
          const cached = await caches.match(event.request);
          if (cached) {
            return cached;
          }
          throw new Error("No cached version available");
        })
    );
  }
});

// Background sync for data updates
self.addEventListener("sync", (event) => {
  console.log("[Kiosk SW] Sync event:", event.tag);
  
  if (event.tag === "sync-data") {
    event.waitUntil(
      syncDataFiles().then(() => {
        console.log("[Kiosk SW] Data sync completed");
      }).catch((error) => {
        console.error("[Kiosk SW] Data sync failed:", error);
        throw error; // Will retry
      })
    );
  }
});

// Function to sync data files in background
async function syncDataFiles() {
  const dataFiles = [
    "/data/country_labels.json",
    "/data/operations_data.json",
    "/data/region_coords.json",
    "/data/region_data.json",
    "/data/successstories-summary.csv",
  ];
  
  const cache = await caches.open(KIOSK_CACHE);
  
  for (const file of dataFiles) {
    try {
      const response = await fetch(file);
      if (response.ok) {
        await cache.put(file, response);
        console.log("[Kiosk SW] Synced:", file);
      }
    } catch (error) {
      console.error("[Kiosk SW] Failed to sync:", file, error);
    }
  }
}
