# TODO

## Pending content

> Recurring content updates (operations data, flipbooks, patents, publications,
> team) are documented in [docs/ADMIN.md](docs/ADMIN.md).

## Data pipeline

- [ ] Revisit the job-history update workflow. Today it's a manual Excel drop
  (`data/private/raw/jobhistory.xlsx` → `pnpm run data` / `generate_json.py` →
  commit `operations_data.json`). Friction points: `OPERATIONS_SOURCE_XLSX` is
  not set in `.env.dev`, so `pnpm run data` skips operations unless run by hand;
  source-spreadsheet formatting drift triggers fuzzy-match misses (e.g.
  "Cote D'Ivoire"); and the published JSON is a large committed artifact.
- [ ] Longer term: move job history off Excel to a database-backed source of
  truth, with the site reading from an API or a generated export rather than a
  hand-maintained spreadsheet.

## Phase 1 — Finalize Design & Assets

- [x] Finalize home page design (May 2026 — hero accent, eyebrows, unified CTAs, brand-tinted Athena band, reach sentence, sentence case)
- [x] Re-encode WirelineExpress.mp4 (50 MB → 3.7 MB, in-place transcode May 2026)
- [x] Transcode DifferentialSticking source → differential-sticking.mp4 (257 MB → 3.6 MB)
- [ ] Update asset manifest with final design requirements
- [ ] Collect all optimized asset files from designers (images, videos, OG image)
  - [ ] Add `petromac-og.png` (1200×630) for Open Graph share image
  - [ ] Add email-optimized PDFs (`email.pdf`, <3 MB each) for catalog and success stories
  - [ ] Re-encode remaining videos with H.264 VBR — `intro-loop2.mp4` (56 MB), `helix.mp4` (25 MB), `pf.mp4` (24 MB). `cp12-placeholder.mp4` + `cp8-placeholder.mp4` (~156 MB) are unused and can be deleted outright.
  - [ ] Apply Draco compression to GLB models (213 MB total, 30-50% reduction)
  - [ ] Compress flipbook page JPGs and consider WebP variants (58 MB total)
  - [ ] Convert large PNGs (tv-bg.png, thor.png) to WebP
  - [ ] Optimize favicon (currently 58 KB, target < 5 KB)
  - [ ] Helix product image (currently uses focus.png placeholder on the homepage FeaturedProducts card and as the kiosk "Focus Centralizers" tile logo)
  - [ ] Thor product video (the FeaturedProducts Thor card is commented out until graphics + messaging are finalised)
  - [ ] Rocker product image + GLB model (kiosk CH lane Rocker experience uses placeholder hero image and has no 3D model)
- [ ] Place delivered files in correct directories
- [ ] Wire up email-optimized PDFs in send-pdf API route (use `email.pdf` instead of `source.pdf`)

## Phase 2 — Security Audit

- [ ] Full security audit (dependencies, headers, API routes, input validation, auth)
- [ ] Add Cloudflare Turnstile to the contact form (parked May 2026 — revisit when ready). Standards specify Turnstile; Petromac currently uses honeypot + timing only.

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
- [x] Kiosk OH / CH split workflow — lane chooser, FocusCentralizersExperience (Helix video loop + HUD), Rocker corner badge, MechanismScreen + LogsScreen, per-lane background video sequence on productlines
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
