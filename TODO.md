# TODO

## Pending content

> Recurring content updates (operations data, flipbooks, patents, publications,
> team) are documented in [docs/ADMIN.md](docs/ADMIN.md).

## Data pipeline

- [x] Drop-zone content pipeline (May 2026) — `sources/` drop zone +
      auto-detecting `scripts/node/data-pipeline.ts` for operations and flipbooks;
      consumed inputs archived to `sources/_archive/`. See `sources/README.md`.
- [ ] Longer term: move job history off Excel to a database-backed source of
      truth, with the site reading from an API or a generated export rather than a
      hand-maintained spreadsheet.
- [ ] `data-build.yaml` GitHub Action still references the old
      `OPERATIONS_SOURCE_XLSX_URL` secret mechanism — rework or disable it now that
      the pipeline is drop-zone based.
- [ ] `scripts/daily-operations-update.sh` cron still runs `pnpm data:operations`
      — now a no-op unless something is in `sources/operations/`. Decide if the
      daily automated job still has a purpose.

## Known issues

- [x] Track Record map: Bolivia renders oddly (May 2026) — root cause was
      natural-earth-110m's coarse generalization of Bolivia's Andean border
      (the polygon stitched correctly with 60 points, but the simplification
      produced a visible notch on the south-east edge). Fixed by swapping
      `world-110m.json` for `world-50m.json` from `world-atlas@2`: Bolivia goes
      from 64 raw arc points to 421, and every other country gets a smoother
      outline as a bonus. File size goes from ~106 KB to ~739 KB; precached by
      the kiosk service worker. Wired via `EXTERNAL_URLS.WORLD_MAP_DATA` in
      `src/constants/app.ts`; SW cache version bumped in `public/kiosk-sw.js`.
      `world-110m.json` was removed in the June 2026 cleanup.

## Phase 1 — Finalize Design & Assets

- [x] Finalize home page design (May 2026 — hero accent, eyebrows, unified CTAs, brand-tinted Athena band, reach sentence, sentence case)
- [x] Video library reorg (May 2026) — `public/videos/` split into `originals/` (gitignored masters) + `transcoded/` (committed web clips); WirelineExpress, helix, pf, differential-sticking all re-encoded from HD masters to 720p. The kiosk now plays the `-subtitled` variants which carry audio (narration + on-screen captions); the non-subtitled clips remain for the public homepage. `intro-loop2.mp4` (56 MB) still needs re-encoding.
- [x] `WirelineExpress-subtitled.mp4` master ingested (May 2026) — 88 MB 540p with audio dropped into `public/videos/originals/`, transcoded to 1280×720 / ~330 kbps + 128 kbps AAC at `public/videos/transcoded/WirelineExpress-subtitled.mp4` (8.7 MB). Wired into the OH lane attractor playlist and the High Deviation + Data Quality experience videos.
- [x] `dice.mp4` leading black frame trimmed (May 2026) — first 2.12 s of black removed; re-encoded from the 4K master with audio kept. Both 720p `transcoded/dice.mp4` (~970 KB) and 1080p `kiosk-hd/dice.mp4` (~2.4 MB) updated.
- [x] Kiosk audio (May 2026) — `muted` removed from the lane attractor and experience overlay `<video>` tags; relies on the kiosk Chrome running with `--autoplay-policy=no-user-gesture-required` for first-load attractor audio. Mechanism / "conventional-\*" short clips (helix-mechanism, rocker-mechanism, conventional-smallcasings) are still silent — they have no audio master.
- [ ] Update asset manifest with final design requirements
- [ ] Collect all optimized asset files from designers (images, videos, OG image)
  - [x] Add `petromac-og.png` (1200×630) for Open Graph share image
  - [x] Add email-optimized PDFs (`email.pdf`) for catalog and success stories — `build_flipbook.py` now generates them (Ghostscript, /ebook→/screen adaptive). `success-stories/email.pdf` is committed (~3 MB); run `pnpm run data:flipbooks` to generate `catalog/email.pdf`.
  - [x] Video cleanup (Jul 2026) — `intro-loop2.mp4` deleted (unreferenced; splash uses `dice.mp4`); `cp12/cp8-placeholder.mp4` were already gone.
  - [x] Draco compression applied to all GLB models (Jul 2026) — 221 MB → 14 MB via gltf-transform (draco + webp textures). Decoder self-hosted at `public/draco/` (offline kiosk); `useGLTF(url, '/draco/')` in DeviceViewer + CircularGallery.
  - [x] Flipbook pages now render as WebP (Jul 2026) — pipeline defaults to `--format webp` q80; catalog 15→5.2 MB, success-stories 17→7.5 MB. Flipbook.tsx loads pages in a ±4 window around the current spread (5 images on first load instead of the whole book).
  - [x] Large PNGs converted to WebP (Jul 2026) — tv-bg, thor, rocker/rocker-inline, all Helix/Rocker log slides + diagrams (14 MB → 3 MB).
  - [ ] Optimize favicon (currently 58 KB, target < 5 KB)
  - [ ] Helix product image (currently uses focus.png placeholder on the homepage FeaturedProducts card and as the kiosk "Focus Centralizers" tile logo)
  - [ ] ChallengeSelector card thumbnails — `public/images/conveyance.jpg`, `ledges.jpg`, `orientation.jpg`, `sampling.jpg`, `sticking.jpg` are all dev placeholders (black 800×480 canvas with the topic word stencilled in the top-left). Three cards (`Stuck Tools`, `Incomplete Operations`, `Cased Hole Centralization`) have a video that covers the poster after a brief flash; three cards (`Sticking Risk`, `Data Quality`, `High Deviations`) have no video so the placeholder is permanent. Hero already swapped to `hero-poster.jpg` (a frame from WirelineExpress.mp4, May 2026); apply the same treatment per card or replace with real photos.
  - [x] Helix mechanism slideshow renders (Jun 2026) — posters extracted as stills from the corresponding mechanism videos (bare renders, no annotations; they double as `<video poster>` so the slide isn't blank before autoplay).
    - `/public/images/helix-mechanism-conventional.png` — frame from `conventional-largecasings.mp4` (arms extended).
    - `/public/images/helix-mechanism-helix.png` — frame from `helix-mechanism.mp4` (arms deployed).
  - [x] Rocker mechanism slideshow renders (Jun 2026) — same treatment as Helix:
    - `/public/images/rocker-mechanism-conventional.png` — frame from `conventional-smallcasings.mp4` (shallow arm angle).
    - `/public/images/rocker-mechanism-rocker.png` — frame from `rocker-mechanism.mp4` (arms deployed around centreline pivot).
    - `/public/images/rocker-mechanism-conventional-detail.png` — INTERIM: close-up crop of the central pivot from the same frame. Spec calls for a force-section schematic with red/blue arrows baked in — replace when graphics produce it.
  - [ ] Case Studies images:
    - `/public/images/helix-cbl-setup.png` — Helix Case Studies single slide (Ultrasonic-CBL set-up illustration).
    - `/public/images/rocker-logs-1.png` — Rocker Case Studies single slide (log comparison).
  - [ ] OH overlay mechanism + Case Studies content (LaneClient OH configs):
    - Mechanism videos at `/public/videos/transcoded/conventional-formation-testing.mp4` + `formation-testing-mechanism.mp4` (Formation Testing), `conventional-high-deviation.mp4` + `high-deviation-mechanism.mp4` (High Deviation), `conventional-holefinding.mp4` + `pathfinder-mechanism.mp4` (Pathfinder).
    - Case-study log images at `/public/images/formation-testing-logs-1.png`, `high-deviation-logs-1.png`, `pathfinder-logs-1.png`.
  - [ ] Corner-badge silhouettes — `HelixExperience` and `RockerExperience` reuse `/images/focus.png` for the small Rocker / Helix badge in the bottom-right corner. Dedicated tool silhouettes (≈12×12 px usable) would read better than the recycled focus logo.
  - [ ] `kiosk-hd/WirelineExpress-subtitled.mp4` — the OH lane attractor swapped to the `-subtitled` variant in May 2026 but the kiosk-hd folder still only has the silent `WirelineExpress.mp4`. Drop a 1080p subtitled master so `useKioskVideo` picks it up for the trade-show display.
  - [ ] Thor product video (the FeaturedProducts Thor card is commented out until graphics + messaging are finalised)
  - [x] Rocker product images (May 2026) — `rocker.png` (Rocker, 1455×975) and `rocker-inline.png` (Rocker Inline, 1920×1756, resized down from a 3840px master) dropped into `public/images/` and wired into a side-by-side panel layout on the Rocker experience main view. Rocker GLB model still pending (`/public/models/rocker.glb`).
- [ ] Place delivered files in correct directories
- [x] Wire up email-optimized PDFs in send-pdf API route — backend now reads `email.pdf` (needs a backend redeploy to take effect)

## Phase 2 — Security Audit

- [ ] Full security audit (dependencies, headers, API routes, input validation, auth)
- [ ] Add Cloudflare Turnstile to the contact form (parked May 2026 — revisit when ready). Standards specify Turnstile; Petromac currently uses honeypot + timing only.

## Backlog (lower priority)

- [ ] Kiosk CH lane "Other" experience — the third CH overlay button currently
      opens a "Coming soon" placeholder (`src/app/(kiosk)/intranet/kiosk/lane/
LaneClient.tsx`, `ChOtherComingSoon`). Deprioritized May 2026 — build this
      out last, once Helix / Rocker content and assets are finalised.

## Service-provider follow-ups

- [ ] **Email**: Petromac sends transactional mail via Microsoft 365 SMTP (RMS account) by deliberate choice — the customer already has Microsoft mailboxes. This deviates from the org standard ([Service Providers.md](https://example.local) — Brevo for EU sites). Revisit if MS 365 SMTP becomes a maintenance burden.

## Phase 3 — SEO Audit

- [ ] Full SEO audit (metadata, structured data, performance, accessibility, crawlability)

## Completed

- [x] Operations data refresh through 2026 — rebuilt `operations_data.json` from the new job-history master (3,214 → 3,366 records, 2013–2026, Tanzania added); added a "Cote D'Ivoire" country-normalization entry
- [x] Privacy & Terms — IP counsel amendments (analytics disclosure, sentence-case headings, clause edits) + slide-out drawer UX from the footer, standalone routes kept for direct links/SEO
- [x] Contact page rework — form-primary + info-sidebar layout on the light theme; `ContactForm` split into a form-only component
- [x] Team / About copy — replaced "regional managers in market" jargon with "across the major oil & gas basins"
- [x] Patents — self-hosted the final 9 granted-patent PDFs; all 44 patents now linked; fixed the About page count (35 patents / 8 families → 44 / 9 categories)
- [x] Kiosk OH / CH split workflow — lane chooser, HelixExperience (Helix video loop + HUD), Rocker corner badge, MechanismScreen + LogsScreen, per-lane background video sequence on productlines
- [x] Track Record page redesign — hero stats row, full-bleed map, brand-color intensity choropleth, legend, hover tooltips, right-side YearlyStats drawer (Esc-dismiss), Top-5 country chart, refined filter pills
- [x] Patents page rebuild — collapsible summary table, regional jurisdiction grouping, keyboard + ARIA-accessible rows
- [x] Cross-links between `/about/patents` and `/about/publications`
- [x] Homepage polish — unified gray scale, section eyebrows, primary/secondary CTA system, brand-tinted Athena platform band, sentence case across all headings, placeholder logo strip replaced with reach sentence
- [x] Frontend `/api/data/*` routing → static `/data/*.json` (Track Record works on Vercel without the FastAPI backend)
- [x] GitHub Actions Node 20 deprecation bump (checkout v6, setup-node v6, setup-python v6, upload-artifact v7, docker/setup-buildx v4, docker/login v4, docker/build-push v7); `fail-fast: false` on deploy matrix
- [x] ESLint: ignore `.claude/**` and nested `**/.next/**` so `pnpm lint` finishes on workspaces with worktrees
- [x] Consolidate docs: root README + move FLIPBOOKS/KIOSK into `docs/`
- [x] Upgrade Next.js 15.5.9 → 15.5.12 (fix audit vulnerabilities)
- [x] Fix origin validation: `startsWith()` → URL hostname parsing
- [x] Add security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- [x] Fix `<img>` lint warning in HeroV2 → `next/image`
- [x] Replace full d3 (~500KB) with d3-array, d3-fetch, d3-geo, d3-selection, d3-transition
- [x] Fix operations_data.json caching (remove `no-store`, add `force-cache`)
- [x] Add image optimization config (AVIF/WebP formats) to next.config.ts
- [x] Remove operations_data.json (3.2MB) from service worker precache
- [x] Remove dead CSS hero.jpg reference from globals.css
- [x] Add `/public/models/Step/` to .gitignore
- [x] Add metadata to all 11 public pages
- [x] Create sitemap.ts (12 URLs) and robots.ts
- [x] Add Open Graph & Twitter card metadata to root layout
- [x] Add title template (`%s | Petromac`) to root layout
- [x] Create not-found.tsx (404) and error.tsx (500) with brand styling
- [x] Remove dead code: Hero.tsx, ProblemSection.tsx, TeamCard.tsx, ProductTeaser.tsx
- [x] Create asset optimization manifest for designers (`docs/ASSET_MANIFEST.md`)
- [x] Accessibility: skip link, aria-current, aria-required, aria-live, keyboard nav
- [x] Add Zod validation to email send-pdf API route
- [x] Add CI workflow (typecheck + lint on push/PR)
- [x] Add Prettier with eslint-config-prettier
- [x] Increase flipbook base dimensions for better desktop display
