# Petromac Website

Next.js 16 (App Router) + React 19 + TypeScript website with public site, intranet, and trade-show kiosk.

## Quick Reference

- **Dev**: `pnpm run dev` (http://localhost:3000)
- **Lint**: `pnpm run lint`
- **Typecheck**: `pnpm run typecheck`
- **Build**: `pnpm run build` (also runs automatically on `git push` via husky)
- **E2E tests**: `pnpm run test:e2e` (needs local server running)
- **Data pipeline**: `pnpm run data` (rebuilds operations JSON + flipbooks)
- **HTML catalog**: `pnpm run data:catalog` (rebuilds `catalog.json` + web images from the InDesign IDML in `sources/catalog/` — see docs/ADMIN.md §2b)
- **Validate**: `pnpm run validate:flipbooks && pnpm run validate:successstories`

## Commit & Push

Git hooks (husky + lint-staged) gate commits and pushes. `pnpm install` activates them via the `prepare` script.

- **pre-commit** runs `lint-staged` on whatever's staged: prettier on every text file, plus `eslint --fix` on `.ts/.tsx/.js/.jsx/.mjs/.cjs`. Fast — a few seconds. Files that get autofixed are re-staged before the commit lands. Unfixable eslint errors abort the commit.
- **pre-push** runs `pnpm typecheck && pnpm lint && pnpm build` in that order — cheap checks first, ~30–60 s build last. Catches Next.js build-time issues that tsc/eslint miss (server/client component boundary mistakes, bad dynamic-import paths, route conflicts, production-only codepaths). The deploy build won't fail if pre-push passed.

Escape hatch when you really need it: `git commit --no-verify` or `git push --no-verify`. Use sparingly and only when you've verified separately — bypassing pre-push is how the deploy build catches you.

Workflow we use: stage with `git add`, commit, push. Don't run `pnpm build` manually before push — the hook does it. Don't run `prettier --write` manually on a whole tree before commit — lint-staged scopes it to changed files for you.

**For Claude:** when suggesting a commit or push, ALWAYS give the user one ready-to-paste shell command — full `git add <files> && git commit -m "..." && git push`, with the file list spelled out and the commit message inline. No placeholder fragments, no "then run git commit" prose split across paragraphs. Group everything in a single fenced block so it's one copy-paste action. When in doubt about which files to stage, prefer `git add -A` (or list every modified path explicitly) over leaving the user to figure it out.

**Lockfile reminder:** `package.json` and `pnpm-lock.yaml` ALWAYS change together. Any `pnpm add` / `pnpm remove` / `pnpm update` produces a diff in both. If `git status` shows one without the other, that's a deploy-build trap — `pnpm install --frozen-lockfile` will fail. Stage both in the same commit. The pre-push hook does NOT catch this; only the deploy build does.

## Architecture

- **Route groups**: `src/app/(public)/` for public site, `src/app/(kiosk)/` for kiosk shell
- **Intranet**: `/intranet/*` is the staff area; Microsoft sign-in can be enabled for staff identity
- **Shared components**: `src/components/shared/` (header, footer, flipbook)
- **Map components**: `src/components/geo/` — `DrilldownMapCore` is the shared map; the public `/track-record` page (map-as-hero, iterated Jul 2026) opens directly with the map card — no header band. The card's own header row holds the H1, the system filter chips (moved out of the in-map bottom bar via the core's `selectedSystems`/`hideSystemFilter` controlled-mode props; kiosk surfaces keep the built-in bar), a live deployments counter (SSR default "3,118+"; a filtered subset shows its exact count), and a quiet "Records & success stories ↓" anchor. Filter state lives once in `TrackRecordExperience` (client) and drives map + counter + the cumulative growth chart beneath the card — all three use `cumulativeDeploymentsByYear()` in `lib/map/process.ts` (the map's exact counting semantics), and the server page bakes the all-systems curve/counter at build so crawlers see real content. The crawler summary sentence (deployments/countries/years) lives as the chart's figcaption. The card is `isolate` so in-map overlay z-indexes (Top 5 panel, tooltip) can't paint over the sticky header; the color legend was removed by design (hover tooltip + Top 5/Show-all carry precise values). The data fetch is versioned with `operations_stats.json`'s `generatedAt` (see `fetchOperationsData`) so all surfaces describe the same dataset generation — kiosk callers keep the bare URL for stable SW cache keys. The kiosk dashboard uses `DrilldownMapKiosk` as a wrapper
- **Feature modules**: `src/features/` (success-stories filters/services, flipbooks, catalog config/specs)
- **Catalog (HTML, Jul 2026)**: `/catalog` is a native HTML catalog (replaced the pdf.js viewer — react-pdf and `/pdfjs/` are gone; `/catalogtest`, its refinement URL, 308-redirects to `/catalog`). Content model: `src/features/catalog/content/catalog.json` (generated from the InDesign IDML via `pnpm run data:catalog`; curation lives in `scripts/python/catalog_config.json` — NEVER hand-edit catalog.json). Four categories (Fixed Angle Guides merged into Guides & Holefinders as a group, per print-TOC simplification Jul 2026). UI: `CatalogBrowser` sidebar workspace (`?category=` synced via pushState; mobile chip bar), SSG product pages at `/catalog/<category>/<slug>` (all in the sitemap), card badges/spec tags derived from spec tables, search that jumps to and flashes the card. All four category panes are server-rendered (inactive ones carry `hidden`) so every product name/group/spec tag is in the initial HTML for crawlers; images in hidden panes stay lazy. PDF actions are first-class buttons (solid Download + outlined Email) in a sidebar card / mobile two-up row. Email PDF sends as the signed-in staff member (`/api/staff/send-pdf`) with `info@` fallback; the compressed catalog PDF remains the download/email artifact.
- **Shared UI primitives**: `src/components/ui/`
- **API routes**: `src/app/api/` (email, PDF generation). Operations and country-label data are read from static JSON in `/public/data/` directly, not via `/api/data/*` — the FastAPI backend is Hetzner-only and Vercel needs to keep working without it
- **Kiosk**: OH/CH split — `/intranet/kiosk` (splash with Open Hole / Cased Hole buttons + a bottom-right "Prime offline" pill that routes to `/intranet/kiosk/prime`). OH → `/intranet/kiosk/lane?lane=oh` is now a pure attractor: a fullscreen subtitled-video playlist (dice intro sting + three narrated product clips) with native browser controls on the narrated clips and a small prev/next + dot strip at the bottom-centre that auto-hides 4 s after the last tap. The old right-edge product button strip (Formation Testing / High Deviation / PathFinder → `OverlayExperience`) was dropped in May 2026, and `OverlayExperience.tsx` was deleted in the June 2026 cleanup. CH → `/intranet/kiosk/ch` lands in `HelixExperience`, which is now the CH lane orchestrator with three view tiers: (1) **video** — looping Helix attractor with native controls and two bottom-right corner badges (Helix, Rocker) + a top-right ✕; (2) **product** — image-based product page for whichever badge was tapped (`HelixProductScreen` shows three side-by-side panels for CX7/CX9/CX13; `RockerProductScreen` shows Rocker + Rocker Inline); (3) **mechanism / logs** — `MechanismScreen` slides or `LogsScreen` pager, configs picked from `deviceSpecs` based on the active product. Every screen from tier 2 onward carries the same persistent top-center pill: **Mechanism · Case Studies · Specifications** (Specs renders only when `config.specs` is set; tapping it opens `SpecsModal` on top of the current screen). All ✕ from a sub-view jump straight back to the looping video — no hierarchical step through the product screen on exit. The standalone `RockerExperience.tsx` was retired and deleted. The old CH lane attractor at `/lane?lane=ch` is gone too — the URL still redirects to `/ch` for bookmarks. The legacy `/productlines` tile grid (with `SystemModal` and `featuredSystems`) was removed entirely in July 2026. Kiosk videos resolve via `useKioskVideo` — prefers `public/videos/kiosk-hd/` (1080p), falls back to `public/videos/transcoded/` (540p). The default kiosk launch URL carries `?sd=1` so the runtime skips the HD upgrade probe (1080p is opt-in via `?sd=0`); the prime manifest moves `kiosk-hd/*` to its `optional` bucket too, so a routine prime stays at ~50 MB of SD video. Native `controls` are exposed on the lane attractor (narrated clips only — dice stays chrome-free) and the Helix video; mechanism clips inside `MechanismScreen` stay bare. Track Record + Success Stories live INSIDE `Case Studies` (first slide of the pager is the drill-down map, in-map link opens Success Stories as an inline takeover).
- **Homepage (v2, Jul 2026)**: hero with a typewriter headline (full text always in SSR HTML; animation is a hydration-time enhancement, reduced-motion-aware, runs once) over a seamless 13.2s background loop (`public/videos/hero/hero-loop.mp4` via `LazyVideo` — IO-gated so mobile/reduced-motion never download it); `ChallengeSelector` tabs; matched compact Hardware/Software bands; `ProofSection` stats from the build-time stats snapshot; contact section. `AthenaTerminal` (a simulated terminal that types six lines on first view, fully server-rendered) lives on `/simulation` inside `AthenaInAction` — moved off the homepage Jul 2026 to keep the software band a compact bar.
- **SEO (Jul 2026, launch prep)**: `src/lib/seo.ts` `pageMetadata()` builds every page's canonical + per-page OG/Twitter tags (App Router replaces, not merges, `openGraph` — always go through the helper). `src/lib/siteUrl.ts` `isProductionSite()` drives indexability: any site URL other than petromac.co.nz ships meta noindex + `X-Robots-Tag` + Disallow-all robots.txt; `next.config.ts` fails the build if `NEXT_PUBLIC_ENV=production` points at a non-production domain. robots/sitemap are `app/robots.ts` / `app/sitemap.ts`, env-derived. JSON-LD: Organization+contactPoint (home), Product+BreadcrumbList (product pages), ScholarlyArticle ItemList (publications). Titles are un-branded — the root template appends "| Petromac" once.
- **Styling**: Tailwind CSS 4. CRITICAL: `src/app/globals.css` must keep the `@config '../../tailwind.config.ts'` directive — v4 does not auto-load a JS/TS config, and without it every config-derived utility (brand palette, `font-heading`, `shadow-card`, type scale) silently compiles to nothing (this was broken until Jul 2026). Brand tokens (`brand`, `brandblack`, `brandgray`) live in `tailwind.config.ts`; homepage v2 components use the `slate-*` scale for body text — `brand` (#1E4A9A) remains the single brand color across the homepage and Track Record. Legacy `brandblack`/`brandgray` are still in use on error pages, the team page, and intranet surfaces. Fonts: Inter (body), IBM Plex Sans (headings). Scroll feel is CSS-only (globals.css): reduced-motion-aware smooth anchor scrolling, `.scroll-reveal` settle-in on home/simulation sections (scroll-driven animation, no snap anywhere by design), `.header-elevate` shadow, `:where(section[id])` scroll margins, `.caret-blink` for the typewriter carets.

## Data Organization

- `public/data/` — Published JSON/CSV served via CDN (fetch at runtime, never import). Operations data ships as three artifacts: `operations_data.json` (slim, 6 columns: Country / System / Subsystem / Year / Successful / PathFinder Run (Y/N) — what every map surface reads, ~600 KB), `operations_full.json` (all 33 columns from the source xlsx, ~3.5 MB, only fetched by the staff diagnostic at `/intranet/kiosk/datacheck`), and `operations_stats.json` (tiny headline numbers the homepage ProofSection and track-record page import at build time — the homepage never fetches the big file; the track-record page ALSO imports the slim file server-side at build for its cumulative growth chart, which ships as static SVG). Full schema is documented at the top of `src/types/JobRecord.ts`. Add a column to the slim file when a new filter or display needs it.
- `public/flipbooks/` — Generated document bundles. **success-stories** is an image flipbook (WebP q80 pages since Jul 2026; `Flipbook.tsx` loads a ±4 window around the current spread, so a first view fetches ~5 images; manifest imported at build time via `src/features/flipbooks/manifests.ts`). **catalog** holds only `petromac-product-catalog.pdf` — compressed to <4 MB on ingest (Ghostscript) and linearized (qpdf) — the download/email artifact; the browsing surface is the HTML catalog (see Architecture). The pdf.js viewer and its `search-index.json` were retired Jul 2026. Success-stories keeps its own compressed `email.pdf` (committed) since its source stays full-res for page rendering.
- `public/models/` + `public/draco/` — Draco-compressed GLBs (221 MB → 14 MB, Jul 2026) and the self-hosted decoder. `useGLTF(url, '/draco/')` everywhere — NEVER drop the second arg or drei falls back to a Google CDN and breaks the offline kiosk.
- `public/videos/` — `originals/` holds full-res masters (gitignored, too large for git); `transcoded/` holds the web-ready clips the site references (committed); `hero/` holds the homepage hero loop + its poster frame (committed; filenames are load-bearing — Hero.tsx references them directly); `kiosk-hd/` holds optional 1080p clips for the kiosk (committed — same filenames as `transcoded/`; the kiosk prefers these via `useKioskVideo`, see docs/ADMIN.md §7)
- `sources/` — Content-pipeline drop zone: drop a file into `sources/{operations,catalog,success-stories}/` and run `pnpm run data` (dropped files gitignored; see `sources/README.md`)
- `src/data/` — Small typed TS modules only (e.g. `team.ts`)

## Key Conventions

- Environment variables for all secrets (see `.env.example`)
- Content updates (operations xlsx, catalog/success-stories PDFs) are dropped into the `sources/` folders — no env vars, no renaming; run `pnpm run data` (see `sources/README.md`)
- Flipbook tags CSV is the single source of truth for success stories filtering
- Kiosk service worker (`public/kiosk-sw.js`) scoped to `/intranet/kiosk/` only
- Security: rate limiting, HTML escaping, origin validation (URL hostname parsing), email allowlists
- Security headers configured in `next.config.ts` (HSTS, X-Frame-Options, etc.)

## Documentation

All docs live in `docs/`:

- [docs/ADMIN.md](docs/ADMIN.md) — Recurring content updates (operations data, flipbooks, patents, publications, team)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Architecture overview
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — Development workflow & data conventions
- [docs/REPO_STRUCTURE.md](docs/REPO_STRUCTURE.md) — Full directory tree
- [docs/FLIPBOOKS.md](docs/FLIPBOOKS.md) — Flipbook build pipeline & troubleshooting
- [docs/KIOSK.md](docs/KIOSK.md) — Kiosk operations & offline caching
- [docs/TAILWIND_THEME.md](docs/TAILWIND_THEME.md) — Brand colors & typography
- [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md) — Email (Microsoft Graph) configuration

## Current Tasks

See [TODO.md](TODO.md) for outstanding work items.
