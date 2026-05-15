# Kiosk Operations

## Why this matters
The kiosk Service Worker is designed for trade‑show use where connectivity can be poor.
We pre-cache the kiosk shell and small data files, and runtime‑cache large media
(videos/models/flipbooks) with limits and expiry to keep storage bounded and reliable.

## Routes & flow

```
/intranet/kiosk                            splash (typed text → Open Hole / Cased Hole buttons)
   └─► /intranet/kiosk/lane?lane=oh|ch      per-lane looping video screen + right-side overlay
        ├─► OH overlay: Formation Testing, High Deviation, Data Quality, Pathfinder
        │     → OverlayExperience (looping video + HUD; Helix-pattern scaffold)
        └─► CH overlay: Helix, Rocker, Other
              → Helix  → FocusCentralizersExperience (Helix video loop + HUD
                          + Rocker corner badge)
              → Rocker → RockerExperience
              → Other  → "Coming soon" placeholder

/intranet/kiosk/productlines?lane=oh|ch     legacy tile grid (still works; no longer
                                            in the main flow)
/intranet/kiosk/dashboard                  operations map (DrilldownMapKiosk)
/intranet/kiosk/successstories             flipbook with filters
/intranet/kiosk/3d-viewer                  3D model viewer
/intranet/kiosk/datacheck                  data validation tools
```

The splash picks a lane directly (Open Hole / Cased Hole). Each lane lands
on `/intranet/kiosk/lane?lane=…`, which loops that lane's attractor videos
fullscreen with a persistent overlay button strip on the right — the same
buttons regardless of which clip is playing. Tapping an overlay button opens
that product's experience. The old `/lane` card chooser was retired and the
`/productlines` tile grid is no longer in the funnel, though the route still
works for direct links.

### Video sources

Lane loops and `OverlayExperience` resolve their clips through
`useKioskVideo` — it prefers a 1080p master in `public/videos/kiosk-hd/`
when one exists (matched by filename) and otherwise falls back to the
committed `public/videos/transcoded/` clip. See [ADMIN.md](ADMIN.md) §7.

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
