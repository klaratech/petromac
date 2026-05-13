# Kiosk Operations

## Why this matters
The kiosk Service Worker is designed for trade‑show use where connectivity can be poor.
We pre-cache the kiosk shell and small data files, and runtime‑cache large media
(videos/models/flipbooks) with limits and expiry to keep storage bounded and reliable.

## Routes & flow

```
/intranet/kiosk                            splash (typed text → Touch to Begin)
   └─► /intranet/kiosk/lane                Open Hole / Cased Hole chooser
        └─► /intranet/kiosk/productlines?lane=oh|ch
             ├─► OH lane tiles: Wireline Express, PathFinder, Focus, Thor
             │     → SystemModal (video + Track Record + More Info)
             └─► CH lane tiles: Focus Centralizers, Other CH
                   → Focus Centralizers: dedicated experience
                       Helix video on loop + HUD (Track Record /
                       Success Stories / Mechanism / Logs) + Rocker
                       corner badge → RockerExperience.
                   → Other CH: "Coming soon" placeholder.

/intranet/kiosk/dashboard                  operations map (DrilldownMapKiosk)
/intranet/kiosk/successstories             flipbook with filters
/intranet/kiosk/3d-viewer                  3D model viewer
/intranet/kiosk/datacheck                  data validation tools
```

The OH/CH split was introduced when the product portfolio grew past
what a single carousel could comfortably show. Splash → chooser →
filtered productlines is now the canonical entry path; direct deep
links to `/intranet/kiosk/productlines` without a `lane` query still
work and fall back to showing every system.

## Service Worker Cache Versioning
The kiosk service worker lives at `public/kiosk-sw.js` and uses a version string:

```js
const VERSION = 'v5';
```

**When you need to refresh cached content** (e.g., new videos/flipbooks or data files):
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

## Notes
- Next.js image optimization outputs (`/_next/image`) are cached for kiosk use.
- Range requests for video are left to the network; offline playback still works
  if the full file was cached previously.
