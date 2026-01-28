# Kiosk Operations

## Service Worker Cache Versioning
The kiosk service worker lives at `public/kiosk-sw.js` and uses a version string:

```js
const VERSION = 'v4';
```

**When you need to refresh cached content** (e.g., new videos/flipbooks):
1. Bump `VERSION` in `public/kiosk-sw.js`.
2. Deploy.
3. On the kiosk device, reload the kiosk once while online.

This forces the old caches to be evicted during SW `activate` and rebuilds fresh caches.

## Offline Ready Checklist
1. Connect the kiosk device to a stable network.
2. Visit these routes once to prime caches:
   - `/intranet/kiosk`
   - `/intranet/kiosk/dashboard`
   - `/intranet/kiosk/productlines`
   - `/intranet/kiosk/successstories`
3. Wait for all videos/models/flipbooks to load at least once.
4. Toggle DevTools → Application → Service Workers → Offline and refresh.
5. Confirm:
   - Map loads
   - Success Stories flipbook loads
   - Videos/models are cached

If content appears stale, clear site data for the kiosk domain and repeat.
