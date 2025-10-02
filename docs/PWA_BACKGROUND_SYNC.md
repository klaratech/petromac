# Task: Add Background Sync (Queue Email/PDF When Offline)

We want users to click **Email** / **Build PDF** while offline and have those actions **queued** and **replayed** automatically when connectivity returns.

We’ll use **Workbox Background Sync** via a **custom service worker** and keep `next-pwa` as our SW bundler.

---

## Overview

- Intercept **POST** requests to:
  - `/api/email/send`
  - `/api/pdf/success-stories` (with `mode: "download"` or any long-running build that can be replayed)
- If offline (or network fails), queue the request body in **IndexedDB**.
- When the browser is back online, Workbox replays the queued requests in order.
- Provide **optimistic UI**: show “Queued, will send when online” toast, disable duplicate clicks.

> Security note: only queue **non-PII** payloads. If the payload may include sensitive data, consider a **server-side outbox** instead.


---

## 1) Switch to a custom SW (extending PWA_TASK.md)

In `next.config.ts`, enable `swSrc`:

```ts
// next.config.ts
import type { NextConfig } from "next";
import withPWA from "next-pwa";
import runtimeCaching from "./workbox";

const isProd = process.env.NODE_ENV === "production" && process.env.PWA !== "off";

const pwa = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: !isProd,
  runtimeCaching,
  swSrc: "service-worker.js",  // <-- add this
});

const nextConfig: NextConfig = { /* ...keep current config... */ };
export default pwa(nextConfig);
```

---

## 2) Implement `service-worker.js` (custom)

Create **`service-worker.js`** in the project root (same folder as `next.config.ts`).

```js
/* eslint-disable no-undef */
// service-worker.js
import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate, NetworkOnly, NetworkFirst } from "workbox-strategies";
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
    return caches.match("/offline");
  }
  return Response.error();
});
```

> If you have other POST endpoints to queue later (e.g., catalog PDF/email), copy a `registerRoute` with a separate queue name.

---

## 3) Frontend UX: optimistic toasts & states

In the UI components that call the APIs (e.g., Success Stories modal actions):

- Detect offline (`navigator.onLine === false`) OR catch network errors.
- On submit:
  - Fire the `fetch()` normally (no special headers required).
  - If it throws (offline), **assume queued** by SW and show:
    - “Queued. Will send when you’re back online.”
    - Disable the button briefly to prevent spam.
- Optional: add an outbox indicator badge showing queued count (advanced: read IndexedDB via Workbox).

---

## 4) Testing

1. Build & run prod locally:
   ```bash
   npm run build
   npm run start
   ```
2. Open DevTools → Application → Service Workers (confirm active).
3. In Network tab, set **Offline**.
4. Try **Email** and **Build PDF (download)** actions → expect UI “Queued…” toast.
5. Toggle back **Online** → SW replays requests; verify server receives them.
6. Check **IndexedDB** → `queue-email` and `queue-pdf` stores should drain to zero after replay.

---

## 5) Docs updates

- **ARCHITECTURE.md**: mention Background Sync queues and which endpoints use them.
- **DEVELOPMENT.md**: explain how to test offline queue and caveats (payload should exclude secrets/PII).

---

## Acceptance Criteria

- When offline, POSTs to `/api/email/send` and `/api/pdf/success-stories` are **queued** and **replayed**.
- UI gives clear feedback (“Queued, will run when online”).
- Normal online flow remains unchanged.
- Docs updated accordingly.
