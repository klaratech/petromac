// Kiosk-specific Service Worker
// Scope: /intranet/kiosk/
// Purpose: Cache assets for offline kiosk functionality

const KIOSK_CACHE = "kiosk-cache-v1";
const KIOSK_SCOPE = "/intranet/kiosk/";

self.addEventListener("install", () => {
  console.log("[Kiosk SW] Installing service worker");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Kiosk SW] Activating service worker");
  event.waitUntil(self.clients.claim());
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
