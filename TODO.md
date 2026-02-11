# TODO

## Phase 1 — Finalize Design & Assets

- [ ] Finalize home page design
- [ ] Update asset manifest with final design requirements
- [ ] Collect all optimized asset files from designers (images, videos, OG image)
  - [ ] Add `petromac-og.png` (1200×630) for Open Graph share image
  - [ ] Add email-optimized PDFs (`email.pdf`, <3 MB each) for catalog and success stories
  - [ ] Re-encode videos with H.264 VBR (309 MB total, 50-70% reduction possible)
  - [ ] Apply Draco compression to GLB models (213 MB total, 30-50% reduction)
  - [ ] Compress flipbook page JPGs and consider WebP variants (58 MB total)
  - [ ] Convert large PNGs (tv-bg.png, thor.png) to WebP
  - [ ] Optimize favicon (currently 58 KB, target < 5 KB)
- [ ] Place delivered files in correct directories
- [x] Wire up email-optimized PDFs in send-pdf API route (use `email.pdf` instead of `source.pdf`)

## Phase 2 — Security Audit

- [ ] Full security audit (dependencies, headers, API routes, input validation, auth)

## Phase 3 — SEO Audit

- [ ] Full SEO audit (metadata, structured data, performance, accessibility, crawlability)

## Completed

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
