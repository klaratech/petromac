/* eslint-disable no-undef */
// service-worker.js
import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, NetworkOnly, NetworkFirst } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";

self.skipWaiting();
clientsClaim();

// Injected at build time by next-pwa/workbox
precacheAndRoute(self.__WB_MANIFEST || []);

// ---- Background Sync Queues ----
const emailQueue = new BackgroundSyncPlugin("queue-email", {
  maxRetentionTime: 24 * 60, // minutes
});

const pdfQueue = new BackgroundSyncPlugin("queue-pdf", {
  maxRetentionTime: 24 * 60,
});

// Helper: match POSTs to endpoint
const isPostTo = (path) => ({ url, request }) =>
  request.method === "POST" && url.pathname.startsWith(path);

// Queue Email API when offline/fails
registerRoute(
  isPostTo("/api/email/send"),
  new NetworkOnly({
    plugins: [emailQueue],
  }),
  "POST"
);

// Queue PDF build requests (download mode)
registerRoute(
  isPostTo("/api/pdf/success-stories"),
  new NetworkOnly({
    plugins: [pdfQueue],
  }),
  "POST"
);

// ---- Cache media assets ----
registerRoute(
  ({ url }) => /\.(?:mp4|glb)$/.test(url.pathname),
  new CacheFirst({
    cacheName: "media-assets",
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          if (response && (response.status === 0 || response.status === 200)) {
            return response;
          }
          return null;
        },
      },
    ],
  })
);

// ---- Offline page fallback for navigations ----
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "pages",
    networkTimeoutSeconds: 3,
  })
);

setCatchHandler(async ({ event }) => {
  if (event.request.mode === "navigate") {
    return caches.match("/offline") || Response.error();
  }
  return Response.error();
});
