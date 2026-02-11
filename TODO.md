# TODO

## Open

- [ ] Re-encode videos with H.264 VBR (309MB total, 50-70% reduction possible)
- [ ] Apply Draco compression to GLB models (213MB total, 30-50% reduction)
- [ ] Compress flipbook page JPGs and consider WebP variants (58MB total)
- [ ] Convert large PNGs (tv-bg.png, thor.png) to WebP
- [ ] Remove unused `Hero.tsx` component (replaced by `HeroV2.tsx`)

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
