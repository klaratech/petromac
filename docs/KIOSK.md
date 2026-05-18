# Kiosk Operations

## Why this matters
The kiosk Service Worker is designed for trade‑show use where connectivity can be poor.
We pre-cache the kiosk shell and small data files, and runtime‑cache large media
(videos/flipbooks/images) with limits and expiry to keep storage bounded and reliable.

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
/intranet/kiosk/3d-viewer                  deferred 3D model viewer
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

## Display flags

The kiosk reads two opt-in URL flags once at boot and persists them to
`sessionStorage` so they survive in-kiosk navigation (see
`src/hooks/useKioskDisplay.ts`).

| Flag      | Effect |
|-----------|--------|
| `?tv=1`   | TV safe-area mode. Scales the kiosk content to 94% so TV overscan (Fire Stick, set-top boxes) can't crop chrome out of the picture. The kiosk shell's `bg-black` fills the ~3% gutter on each side. |
| `?sd=1`   | Skip the kiosk-hd 1080p upgrade. `useKioskVideo` stays on the 720p `transcoded/` clips. Use on Fire Stick or any device that stutters on 1080p H.264; also helpful when mirroring from a CPU-bound tablet, since the tablet's screen-capture encoder has less work to do per frame. |
| `?tv=0` / `?sd=0` | Explicit opt-out. Clears the persisted flag without needing to clear sessionStorage manually — useful when swapping a Fire Stick kiosk back to a tablet. |

Typical Fire Stick setup: navigate the kiosk browser once to
`/intranet/kiosk?tv=1&sd=1`. The flags stick for the rest of the
session; the query string can drop on subsequent navigations.

### Why mirroring stutters

If you're mirroring (Miracast / AirPlay / "Cast my screen") rather than
navigating to the kiosk URL on the Fire Stick directly, the **source
device** (the tablet) does all the rendering AND encodes its own screen
frames as an H.264 mirror stream. The Fire Stick is just a decoder /
display. Stutters in this mode usually mean the tablet is CPU/GPU-bound
between the kiosk render and the simultaneous mirror encode — `?sd=1`
helps here too, because there are fewer pixels per second for the
encoder to chew on.

## Service Worker Cache Versioning
The kiosk service worker lives at `public/kiosk-sw.js` and uses a version string:

```js
const VERSION = 'v10';
```

**When you need to refresh cached content** (e.g., new videos/flipbooks or data files):
1. Bump `VERSION` in `public/kiosk-sw.js`.
2. Deploy.
3. On the kiosk device, reload the kiosk once while online.

This forces the old caches to be evicted during SW `activate` and rebuilds fresh caches.

### Range request handling (video seeking / offline playback)
`<video>` elements send HTTP `Range` requests when buffering or seeking. The
SW serves Range requests for cached media by slicing the full cached
response into a `206 Partial Content`, so seeking and offline playback both
work after priming. Non-media Range requests still fall through to the
network. See `serveRangeFromCache()` in `public/kiosk-sw.js`.

## Offline Ready Checklist
1. Connect the kiosk device to a stable network.
2. Visit these routes once to prime caches:
   - `/intranet/kiosk`                           (splash)
   - `/intranet/kiosk/lane?lane=oh`              (let the OH attractor playlist loop once;
                                                  then tap each overlay button to prime
                                                  its experience video + Track Record + flipbook)
   - `/intranet/kiosk/lane?lane=ch`              (same — open Helix and Rocker experiences once)
   - `/intranet/kiosk/dashboard`
   - `/intranet/kiosk/successstories`
3. Wait for all videos and flipbooks to load at least once.
4. Toggle DevTools → Application → Service Workers → Offline and refresh.
5. Confirm:
   - Lane attractor loops play
   - Helix / Rocker / OH overlay experiences open with video
   - Map loads
   - Success Stories flipbook loads
   - Videos and flipbooks are cached

> The legacy `/intranet/kiosk/productlines` tile grid still works for direct
> links but is no longer in the main flow, so it isn't part of the priming
> routine.

If content appears stale, clear site data for the kiosk domain and repeat.

## Notes
- Next.js image optimization outputs (`/_next/image`) are cached for kiosk use.
- Video Range requests are served from the cached full file as `206 Partial
  Content` (see "Range request handling" above) — seeking and offline
  playback both work as long as the full clip was cached during priming.
