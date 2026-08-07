# Kiosk Operations

## Why this matters

The kiosk Service Worker is designed for trade‑show use where connectivity can be poor.
We pre-cache the kiosk shell and small data files, and runtime‑cache large media
(videos/flipbook pages/images) with limits and expiry to keep storage bounded and reliable. (The public catalog PDF viewer is not part of the kiosk.)

## Routes & flow

```
/intranet/kiosk                            splash (typed text → Open Hole / Cased Hole
                                            + bottom-right "Prime offline" pill)
   ├─► /intranet/kiosk/lane?lane=oh         OH attractor — fullscreen subtitled-video
   │                                        playlist (dice intro + 3 narrated clips),
   │                                        native play/pause/scrub controls on the
   │                                        narrated clips, prev/next + dot strip at
   │                                        bottom-centre. No more side button strip.
   │
   ├─► /intranet/kiosk/ch                   CH orchestrator (HelixExperience). Three
   │                                        view tiers:
   │     1. video    looping Helix attractor + two bottom-right corner badges
   │                 (Helix, Rocker) + top-right ✕
   │     2. product  HelixProductScreen (CX7/CX9/CX13 panels) or
   │                 RockerProductScreen (Rocker + Rocker Inline). Persistent
   │                 top pill: Mechanism · Case Studies · Specifications.
   │     3. m/cs     MechanismScreen / LogsScreen, same pill, ✕ → video.
   │
   └─► /intranet/kiosk/prime                staff utility: warm SW cache for
                                            offline use (see Trade-show setup below)

/intranet/kiosk/dashboard                  operations map (DrilldownMapKiosk)
/intranet/kiosk/successstories             flipbook with filters
/intranet/kiosk/3d-viewer                  deferred 3D model viewer
/intranet/kiosk/datacheck                  data validation tools
```

Specifications is a modal: tapping the pill button opens `SpecsModal` on top of whichever screen is below. Track Record + Success Stories live INSIDE Case Studies — the drill-down map is the first slide of the pager, and the in-map link opens Success Stories as an inline takeover. The old CH lane attractor at `/lane?lane=ch` redirects to `/ch` for bookmarks. The standalone `RockerExperience.tsx` was retired in May 2026.

### Video sources

Lane loops and CH experiences resolve their clips through `useKioskVideo` —
when one exists (matched by filename) and otherwise falls back to the
committed `public/videos/transcoded/` clip. See [ADMIN.md](ADMIN.md) §7.

## Display flags

The kiosk reads two opt-in URL flags once at boot and persists them to
`sessionStorage` so they survive in-kiosk navigation (see
`src/hooks/useKioskDisplay.ts`).

| Flag              | Effect                                                                                                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `?tv=1`           | TV safe-area mode. Scales the kiosk content to 94% so TV overscan (Fire Stick, set-top boxes) can't crop chrome out of the picture. The kiosk shell's `bg-black` fills the ~3% gutter on each side.                                                                                 |
| `?tv=0` / `?sd=0` | Explicit opt-out. Clears the persisted flag without needing to clear sessionStorage manually — useful when swapping a Fire Stick kiosk back to a tablet.                                                                                                                            |

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
const VERSION = 'v19'; // v19: 28 Jul 2026, ahead of the production-origin re-prime
```

**When you need to refresh cached content** (e.g., new videos/flipbooks or data files):

1. Bump `VERSION` in `public/kiosk-sw.js`.
2. Deploy.
3. On the kiosk device, reload the kiosk once while online, then re-prime via the splash's "Prime offline" pill.

This forces the old caches to be evicted during SW `activate` and rebuilds fresh caches.

**A routine code deploy does NOT need a bump.** Kiosk navigations are
`networkFirst`, so an online tablet always gets fresh HTML, and `/_next/static/`
is content-hashed, so a new build yields new URLs rather than stale hits. The
offline manifest lists only stable paths (routes, videos, flipbooks, models,
icons) — no hashed build output — so it doesn't rot between deploys either.
Bump only when you want to _evict_ accumulated caches: many deploys in a day
leave dead `/_next/static/` entries competing for `MAX_STATIC_ENTRIES` (80),
which can LRU-evict entries a tablet still needs offline.

**Caches are ORIGIN-scoped.** Moving a tablet to a different hostname (as in the
Jul 2026 `petromac.klaratech.it` → `www.petromac.co.nz` move) gives it an empty
cache on the new origin — nothing to evict, so no bump is required for that.
Corollary worth remembering: bump BEFORE a planned re-prime, never after, or
the device primes on the old version and has to download everything twice.

### Range request handling (video seeking / offline playback)

`<video>` elements send HTTP `Range` requests when buffering or seeking. The
SW serves Range requests for cached media by slicing the full cached
response into a `206 Partial Content`, so seeking and offline playback both
work after priming. Non-media Range requests still fall through to the
network. See `serveRangeFromCache()` in `public/kiosk-sw.js`.

## Trade-show kiosk setup

End-to-end walkthrough for a fresh Android tablet + Amazon Fire Stick on a TV. Each step takes a minute or two. Do them in order — a couple of them depend on the previous one.

### 1. Install the kiosk on the tablet

1. On the Android tablet, open **Chrome** and go to the deployed kiosk URL.
2. Chrome menu (⋮ top right) → **Install app** (or **Add to Home screen** on older Chrome).
3. Find the "Petromac" icon on the home screen and tap to launch. The PWA runs fullscreen with no browser chrome.
4. Confirm the splash renders ("Petromac · Disruptive Conveyance Solutions" with Open Hole and Cased Hole buttons).

### 2. Prime the offline cache

1. On the splash, tap the small **Prime offline** pill at the bottom-right.
2. On the prime screen, tap **Start priming**.
3. Wait for every row to reach **OK** — usually 1–2 minutes on decent Wi-Fi. Total payload is roughly 50–80 MB of video, plus images and flipbooks.
4. The top status card should read **Ready for offline** when the run finishes.
5. Tap **Open kiosk** (top-right of the prime screen) to return to the splash.

> Want the sharper 1080p videos cached too? Tick **Include 1080p videos + 3D models** before starting. Skip it for mirrored Fire Stick setups — the SD set is what plays in mirroring mode anyway. The 3D models are Draco-compressed (14 MB total) and the decoder at `/draco/` is part of the required prime set, so the 3D viewer works fully offline.

> The flipbook page entries in the prime list are auto-synced by `pnpm run data` from the flipbook manifests — after a flipbook update, commit + deploy and re-prime; no manual list editing.

### 3. Connect the Fire Stick and the tablet to the same Wi-Fi

1. **Fire Stick:** Settings → **Network** → join the show's Wi-Fi network.
2. **Tablet:** Settings → **Wi-Fi** → join the same network.
3. Both devices must be on the same Wi-Fi (and same subnet, if the show network has multiple). Mirroring discovery won't work otherwise.

### 4. Put the Fire Stick into Mirroring mode

1. On the Fire Stick remote, **press and hold the Home button** for ~3 seconds.
2. The quick menu pops up. Pick **Mirroring**.
3. The TV now shows a "Ready to connect" screen with the Fire Stick's device name (e.g. "Petromac-FireTV").

### 5. Cast from the tablet (Smart View)

1. On the tablet, open the **Quick Settings** panel (swipe down twice from the top).
2. Tap **Smart View** (Samsung) — or **Cast** / **Screen mirroring** on other Android brands.
3. Tap the Fire Stick from the device list. Accept any pairing prompt on the TV.
4. The TV should now mirror whatever is on the tablet screen, including the kiosk PWA.

### 6. Get a full-screen image on the TV

If the kiosk renders with letterbox bars, looks small in a corner, or has its chrome cropped by overscan, tune in this order:

1. **Tablet rotation** — make sure the tablet is locked in **landscape**. Smart View mirrors whatever the tablet is doing; if the tablet is portrait the TV gets pillarboxes either side.
2. **Smart View aspect** — open the Smart View notification on the tablet → **⋮** menu → **Aspect ratio** (or **Phone aspect ratio** vs **Full screen on TV**). Pick **Full screen on TV**.
3. **TV picture size** — on the TV remote, open Picture Settings → set **Picture Size / Aspect Ratio** to **Screen Fit** or **Just Scan** (avoid 4:3 or "Auto Wide").
4. **Overscan safety** — if a sliver of the kiosk's top-right ✕ or bottom-right badges is being clipped by the TV bezel, navigate the kiosk once to `/intranet/kiosk?tv=1` to enable a 3% safe-area scale. The flag sticks via sessionStorage; you only need to do it once per session.

### 7. If the video stutters

Mirroring uses the **tablet** as the renderer + encoder, so it's the tablet's CPU getting taxed. If the kiosk video looks janky on the TV:

- Navigate the kiosk once to `/intranet/kiosk?sd=1` — the flag is sticky and forces 540p playback, cutting the mirror encoder's per-frame work. The Helix / lane attractor videos still look fine at SD on a 1080p TV when viewed from across a booth.
- If a deeper view is open (Mechanism / Case Studies), close back to the looping video — fewer overlays = less compositing.

### Verifying offline-readiness

Once you've primed and confirmed the TV is happy, sanity-check that the kiosk really survives losing Wi-Fi:

1. On the tablet, toggle **Wi-Fi off** (or put the tablet in Airplane Mode and turn Wi-Fi back on if needed for mirroring — Fire Stick will keep the local Miracast link).
2. Walk through the kiosk: Open Hole lane attractor loops, Cased Hole lands on the Helix video, both product pages render with images, Mechanism slides and Case Studies pager work, the map and Success Stories flipbook load.
3. Anything stale or missing → return to the splash, tap **Prime offline**, then **Retry priming**. Failed rows re-fetch on retry; "ok" rows skip.

## Notes

- Next.js image optimization outputs (`/_next/image`) are cached for kiosk use.
- Video Range requests are served from the cached full file as `206 Partial
Content` (see "Range request handling" above) — seeking and offline
  playback both work as long as the full clip was cached during priming.
