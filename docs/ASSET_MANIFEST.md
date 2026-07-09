# Asset Optimization Manifest

> **For graphic designers / media team.** This document lists every image, video, and 3D model used on the Petromac website with the optimal format, dimensions, and target size for each.

---

## How to Use This Document

1. Prepare each asset at the **Deliver As** specs listed below.
2. Keep the same file names and folder structure.
3. Drop replacements into `public/` — the code already references these paths.
4. For images: Next.js auto-generates AVIF/WebP variants at runtime, so deliver originals in JPG or PNG as noted. For backgrounds and large photos, JPG is preferred. For logos and icons with transparency, PNG or WebP.

---

## 1. Images

### 1.1 Logo & App Icons

| File                             | Current      | Deliver As                                            | Display Size | Used In                         |
| -------------------------------- | ------------ | ----------------------------------------------------- | ------------ | ------------------------------- |
| `/images/Petromac-Logo.png.webp` | 7.7 KB, WebP | **WebP, 360 x 108 px** (2x of 180x54 display)         | 180 x 54 px  | Header on all pages             |
| `/icons/icon-192x192.png`        | 7 KB, PNG    | **PNG, 192 x 192 px**                                 | 192 x 192 px | Apple touch icon + PWA manifest |
| `/icons/icon-512x512.png`        | 22 KB, PNG   | **PNG, 512 x 512 px**                                 | 512 x 512 px | PWA manifest (splash/install)   |
| `src/app/favicon.ico`            | 58 KB, ICO   | **ICO, 32 x 32 px** (multi-size: 16+32) target <10 KB | 16-32 px     | Browser tab favicon             |

> Logo already optimized. App icons must stay PNG per PWA spec. Favicon at 58 KB is oversized — regenerate as a lean multi-size ICO (16x16 + 32x32). Re-export all if branding changes.

---

### 1.2 Hero / Background

| File                   | Current | Deliver As                          | Display Size                    | Used In                                 |
| ---------------------- | ------- | ----------------------------------- | ------------------------------- | --------------------------------------- |
| `/images/sampling.jpg` | 6.9 KB  | **JPG, 1920 x 1080 px, quality 80** | Full viewport (90vh, min 600px) | Homepage hero background + video poster |

> This is the fallback image behind the hero video. Needs to be high quality at 1920x1080 since it covers the full viewport on desktop. Current 6.9 KB file is likely too small/low-res.

---

### 1.3 Challenge Selector Cards (Homepage)

These display as responsive cards with a gradient overlay. Deliver as landscape photos.

| File                      | Current | Deliver As                        | Display Size                                  | Context                                |
| ------------------------- | ------- | --------------------------------- | --------------------------------------------- | -------------------------------------- |
| `/images/conveyance.jpg`  | 7.0 KB  | **JPG, 800 x 600 px, quality 80** | ~320px wide (mobile) to ~256px (desktop grid) | "Open Hole" card                       |
| `/images/sticking.jpg`    | 6.9 KB  | **JPG, 800 x 600 px, quality 80** | Same                                          | "Cased Hole" card                      |
| `/images/orientation.jpg` | 7.0 KB  | **JPG, 800 x 600 px, quality 80** | Same                                          | "Formation Testing" card               |
| `/images/sampling.jpg`    | 6.9 KB  | **JPG, 800 x 600 px, quality 80** | Same                                          | "Data Quality" card (shared with hero) |
| `/images/ledges.jpg`      | 6.8 KB  | **JPG, 800 x 600 px, quality 80** | Same                                          | Used in kiosk carousel modal           |

> These are currently very small files (~7 KB). If they look blurry on screen, re-export at 800x600. They're shown behind a dark gradient overlay, so moderate compression is fine.

---

### 1.4 Product Images (Homepage + Kiosk)

Product images display on transparent/white backgrounds. Deliver as PNG with transparency.

| File                          | Current | Deliver As                                         | Display Size      | Context                   |
| ----------------------------- | ------- | -------------------------------------------------- | ----------------- | ------------------------- |
| `/images/thor.webp`           | 480 KB  | **WebP with alpha, 512 x 512 px** (target <100 KB) | 180-208 px square | Product card + kiosk icon |
| `/images/pathfinder.png`      | 122 KB  | **WebP with alpha, 512 x 512 px** (target <80 KB)  | 180-208 px square | Product card + kiosk icon |
| `/images/focus.png`           | 33 KB   | **WebP with alpha, 512 x 512 px** (target <60 KB)  | 180-208 px square | Product card + kiosk icon |
| `/images/wirelineexpress.png` | 32 KB   | **WebP with alpha, 512 x 512 px** (target <60 KB)  | 180 px square     | Kiosk product icon        |

> `thor.webp` at 480 KB is oversized. Re-export all four at 512x512 in WebP for consistency.
> **Note:** Helix product currently has no image — please provide one at the same specs.

---

### 1.5 Kiosk Background

| File                 | Current | Deliver As                                | Display Size               | Used In                                                           |
| -------------------- | ------- | ----------------------------------------- | -------------------------- | ----------------------------------------------------------------- |
| `/images/tv-bg.webp` | 731 KB  | **WebP, 1920 x 1080 px** (target <150 KB) | Fullscreen (kiosk display) | Background for 3D viewer, carousel, product lines (4 kiosk pages) |

> This is the single biggest image. Converting from PNG to WebP at 1920x1080 should reduce it from 731 KB to ~100-150 KB.

---

### 1.6 Athena Logos

| File                           | Current | Deliver As                                        | Display Size    | Used In                                 |
| ------------------------------ | ------- | ------------------------------------------------- | --------------- | --------------------------------------- |
| `/images/athena_logo.png`      | 60 KB   | **WebP with alpha, 128 x 128 px** (target <20 KB) | 48-64 px square | Intranet page tile + software highlight |
| `/images/athena_logo_beta.png` | 60 KB   | **WebP with alpha, 128 x 128 px** (target <20 KB) | 64 px square    | Intranet page tile                      |

---

### 1.7 Other UI Images

| File                      | Current | Deliver As                             | Display Size             | Used In              |
| ------------------------- | ------- | -------------------------------------- | ------------------------ | -------------------- |
| `/images/catalog.png`     | 204 KB  | **WebP, 800 x 600 px** (target <80 KB) | Modal view (max 800x600) | Kiosk carousel modal |
| `/images/trackrecord.png` | 27 KB   | **WebP, 800 x 600 px**                 | Modal view               | Kiosk carousel modal |

---

### 1.8 Team Photos

Team photos display in **128 x 128 px circles** (rounded). Deliver as square portraits.

| File                                 | Current    | Deliver As             | Target Size |
| ------------------------------------ | ---------- | ---------------------- | ----------- |
| `/images/team/gabriel-tschikof.png`  | 13 KB      | **WebP, 256 x 256 px** | <20 KB      |
| `/images/team/bernardo-espinola.png` | 13 KB      | Same                   | <20 KB      |
| `/images/team/solomon-kadiri.png`    | 13 KB      | Same                   | <20 KB      |
| `/images/team/galal-eldaw.png`       | 7.7 KB     | Same                   | <20 KB      |
| `/images/team/jee-kwan-ng.png`       | 13 KB      | Same                   | <20 KB      |
| `/images/team/javier-peyriere.png`   | **292 KB** | Same                   | <20 KB      |
| `/images/team/stephen-mccormick.png` | 33 KB      | Same                   | <20 KB      |
| `/images/team/martin-leonard.png`    | 12 KB      | Same                   | <20 KB      |
| `/images/team/rajesh-thatha.png`     | 35 KB      | Same                   | <20 KB      |
| `/images/team/rolando-velasco.png`   | 13 KB      | Same                   | <20 KB      |
| `/images/team/craig-rothwell.png`    | 13 KB      | Same                   | <20 KB      |
| `/images/team/bruce-forrest.png`     | 14 KB      | Same                   | <20 KB      |
| `/images/team/mike-bird.png`         | 32 KB      | Same                   | <20 KB      |

**Founder (About page — displayed larger):**

| File                     | Current | Deliver As                        | Display Size             |
| ------------------------ | ------- | --------------------------------- | ------------------------ |
| `/images/team/Steve.jpg` | 54 KB   | **JPG, 600 x 800 px, quality 80** | 300 x 400 px (2x retina) |

> `javier-peyriere.png` at 292 KB is 20x larger than the others. Please re-export at 256x256 like the rest.

---

## 2. Videos

All videos play at **fullscreen** resolution. Deliver as H.264 MP4 with these encoding settings:

**Encoding spec:**

- Codec: H.264 (AAC audio where applicable)
- Resolution: **1920 x 1080** (1080p)
- Frame rate: 30 fps (or match original)
- Bitrate: **Variable (VBR), target 2-4 Mbps** for live-action, 1-2 Mbps for animation/graphics
- Audio: AAC 128 kbps stereo (or strip audio if muted in code — noted below)

**Folder layout (May 2026):** full-res masters live in `public/videos/originals/`
(gitignored, never deployed); the web-ready clips the site references live in
`public/videos/transcoded/` (committed). Every `<video>` on the site is
`autoplay muted loop` — so transcoded clips carry **no audio track**.

| File                                                                           | Size         | Status                                            | Context                                                        |
| ------------------------------------------------------------------------------ | ------------ | ------------------------------------------------- | -------------------------------------------------------------- |
| `transcoded/WirelineExpress.mp4`                                               | ~15 MB       | Re-encoded from HD master (May 2026), 720p, muted | Homepage hero + kiosk carousel + system demo                   |
| `transcoded/helix.mp4`                                                         | ~8 MB        | Re-encoded from HD master (May 2026), 720p, muted | System demo + kiosk carousel + Challenge selector              |
| `transcoded/pf.mp4`                                                            | ~6 MB        | Re-encoded from HD master (May 2026), 720p, muted | System demo (PathFinder) + kiosk carousel + Challenge selector |
| `transcoded/differential-sticking.mp4`                                         | ~8 MB        | Re-encoded from HD master (May 2026), 720p, muted | Homepage Challenge selector ("Stuck Tools")                    |
| `transcoded/dice.mp4`                                                          | 4.1 MB       | OK — light compression only                       | Kiosk carousel rotation                                        |
| `transcoded/helix-mechanism.mp4`, `rocker-mechanism.mp4`, `conventional-*.mp4` | <0.5 MB each | OK                                                | Kiosk CH-lane mechanism screen                                 |

---

## 3. 3D Models (GLB)

Models display in a fullscreen 3D viewer (kiosk only). All committed GLBs are **Draco-compressed** (Jul 2026); the decoder is self-hosted at `public/draco/` so the offline kiosk never hits a CDN. If you receive a new/updated model, compress it before committing.

**Compression command (using gltf-transform):**

```bash
npx @gltf-transform/cli optimize input.glb output.glb --compress draco
```

| File                       | Size (Draco) | Was   | System           |
| -------------------------- | ------------ | ----- | ---------------- |
| `/models/pathfinderht.glb` | 5.9 MB       | 87 MB | PathFinder       |
| `/models/cp12.glb`         | 4.2 MB       | 73 MB | Focus            |
| `/models/cp8.glb`          | 2.0 MB       | 33 MB | Focus            |
| `/models/helix.glb`        | 1.4 MB       | 22 MB | Focus            |
| `/models/thor.glb`         | 0.7 MB       | 8 MB  | Thor             |
| `/models/ttbs75.glb`       | 0.7 MB       | 8 MB  | Wireline Express |

> Total: 14 MB (was 221 MB). Loaded via `useGLTF(url, '/draco/')` — keep the
> second argument, or drei falls back to a Google-CDN decoder and the offline
> kiosk breaks.

---

## 4. Email-Optimized PDFs

No designer action needed: the pipeline compresses PDFs automatically on
ingest (catalog → one <4 MB file for viewer/download/email; success stories →
a compressed `email.pdf` alongside the full-res source). Just deliver the
full-quality PDF with real text and working hyperlinks — do NOT flatten pages
to images, that's what makes the catalog searchable and its links clickable.

---

## 5. Document pages

**Catalog** is served as the PDF itself through the pdf.js viewer (Jul 2026) — no
page images. The pipeline ships one `source.pdf` (compressed <4 MB + linearized) and
`search-index.json`. Keep the source PDF's real text + links (don't flatten to
images) so search and links work.

**Success Stories** is still an image flipbook, auto-generated from the source PDF
by the pipeline via `pnpm run data`.

| Flipbook        | Pages | Dimensions     | Avg Size | Total  | Format |
| --------------- | ----- | -------------- | -------- | ------ | ------ |
| Success Stories | 50    | 1241 x 1754 px | ~150 KB  | 7.5 MB | WebP   |

**Display sizes:**

- Success Stories: renders at 600 x 800 px (portrait spread); mobile single page ~240-320 px wide

> If updating source PDFs, ensure they're print-quality. The build pipeline handles image extraction and sizing.

---

## Summary: Expected Savings

| Category               | Current     | Target      | Savings  |
| ---------------------- | ----------- | ----------- | -------- |
| Images                 | ~2.3 MB     | ~0.8 MB     | ~65%     |
| Videos (active)        | 157 MB      | ~49 MB      | ~69%     |
| Videos (delete unused) | 156 MB      | 0           | 100%     |
| 3D Models              | 221 MB      | ~80 MB      | ~64%     |
| **Total**              | **~536 MB** | **~130 MB** | **~76%** |
