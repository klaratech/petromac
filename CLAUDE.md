# Petromac Website

Next.js 15 (App Router) + React 19 + TypeScript website with public site, intranet, and trade-show kiosk.

## Quick Reference

- **Dev**: `pnpm run dev` (http://localhost:3000)
- **Lint**: `pnpm run lint`
- **Typecheck**: `pnpm run typecheck`
- **Build**: `pnpm run build` (also runs automatically on `git push` via husky)
- **E2E tests**: `pnpm run test:e2e` (needs local server running)
- **Data pipeline**: `pnpm run data` (rebuilds operations JSON + flipbooks)
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
- **Map components**: `src/components/geo/` — `DrilldownMapCore` is the shared map; the public `/track-record` page imports it directly via `next/dynamic`, the kiosk dashboard uses `DrilldownMapKiosk` as a wrapper
- **Feature modules**: `src/features/` (success-stories filters/services, flipbooks, catalog config/specs)
- **Shared UI primitives**: `src/components/ui/`
- **API routes**: `src/app/api/` (email, PDF generation). Operations and country-label data are read from static JSON in `/public/data/` directly, not via `/api/data/*` — the FastAPI backend is Hetzner-only and Vercel needs to keep working without it
- **Kiosk**: OH/CH split — `/intranet/kiosk` (splash with Open Hole / Cased Hole buttons + a bottom-right "Prime offline" pill that routes to `/intranet/kiosk/prime`). OH → `/intranet/kiosk/lane?lane=oh` is now a pure attractor: a fullscreen subtitled-video playlist (dice intro sting + three narrated product clips) with native browser controls on the narrated clips and a small prev/next + dot strip at the bottom-centre that auto-hides 4 s after the last tap. The old right-edge product button strip (Formation Testing / High Deviation / PathFinder → `OverlayExperience`) was dropped in May 2026, and `OverlayExperience.tsx` was deleted in the June 2026 cleanup. CH → `/intranet/kiosk/ch` lands in `HelixExperience`, which is now the CH lane orchestrator with three view tiers: (1) **video** — looping Helix attractor with native controls and two bottom-right corner badges (Helix, Rocker) + a top-right ✕; (2) **product** — image-based product page for whichever badge was tapped (`HelixProductScreen` shows three side-by-side panels for CX7/CX9/CX13; `RockerProductScreen` shows Rocker + Rocker Inline); (3) **mechanism / logs** — `MechanismScreen` slides or `LogsScreen` pager, configs picked from `deviceSpecs` based on the active product. Every screen from tier 2 onward carries the same persistent top-center pill: **Mechanism · Case Studies · Specifications** (Specs renders only when `config.specs` is set; tapping it opens `SpecsModal` on top of the current screen). All ✕ from a sub-view jump straight back to the looping video — no hierarchical step through the product screen on exit. The standalone `RockerExperience.tsx` was retired and deleted. The old CH lane attractor at `/lane?lane=ch` is gone too — the URL still redirects to `/ch` for bookmarks. The legacy `/productlines` tile grid (with `SystemModal` and `featuredSystems`) was removed entirely in July 2026. Kiosk videos resolve via `useKioskVideo` — prefers `public/videos/kiosk-hd/` (1080p), falls back to `public/videos/transcoded/` (540p). The default kiosk launch URL carries `?sd=1` so the runtime skips the HD upgrade probe (1080p is opt-in via `?sd=0`); the prime manifest moves `kiosk-hd/*` to its `optional` bucket too, so a routine prime stays at ~50 MB of SD video. Native `controls` are exposed on the lane attractor (narrated clips only — dice stays chrome-free) and the Helix video; mechanism clips inside `MechanismScreen` stay bare. Track Record + Success Stories live INSIDE `Case Studies` (first slide of the pager is the drill-down map, in-map link opens Success Stories as an inline takeover).
- **Styling**: Tailwind CSS 4. Brand tokens (`brand`, `brandblack`, `brandgray`) still exist in `tailwind.config.ts` but the homepage v2 components have migrated to the `slate-*` scale for body text and dark headings — `brand` (#1E4A9A) remains the single brand color across the homepage and Track Record. Legacy `brandblack`/`brandgray` are still in use on error pages, the team page, and intranet surfaces. Fonts: Inter (body), IBM Plex Sans (headings).

## Data Organization

- `public/data/` — Published JSON/CSV served via CDN (fetch at runtime, never import). Operations data ships as three artifacts: `operations_data.json` (slim, 6 columns: Country / System / Subsystem / Year / Successful / PathFinder Run (Y/N) — what every map surface reads, ~600 KB), `operations_full.json` (all 33 columns from the source xlsx, ~3.5 MB, only fetched by the staff diagnostic at `/intranet/kiosk/datacheck`), and `operations_stats.json` (tiny headline numbers the homepage ProofSection imports at build time — the homepage never fetches the big file). Full schema is documented at the top of `src/types/JobRecord.ts`. Add a column to the slim file when a new filter or display needs it.
- `public/flipbooks/` — Generated document bundles. **success-stories** is an image flipbook (WebP q80 pages since Jul 2026; `Flipbook.tsx` loads a ±4 window around the current spread, so a first view fetches ~5 images; manifest imported at build time via `src/features/flipbooks/manifests.ts`). **catalog** moved to an in-browser pdf.js viewer in Jul 2026 — it ships the linearized `source.pdf`, a compressed `email.pdf`, and `search-index.json` (per-page text for the viewer's search box); no page images, no manifest. Both include `email.pdf` (committed).
- `public/models/` + `public/draco/` — Draco-compressed GLBs (221 MB → 14 MB, Jul 2026) and the self-hosted decoder. `useGLTF(url, '/draco/')` everywhere — NEVER drop the second arg or drei falls back to a Google CDN and breaks the offline kiosk.
- `public/videos/` — `originals/` holds full-res masters (gitignored, too large for git); `transcoded/` holds the web-ready clips the site references (committed); `kiosk-hd/` holds optional 1080p clips for the kiosk (committed — same filenames as `transcoded/`; the kiosk prefers these via `useKioskVideo`, see docs/ADMIN.md §7)
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
- [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md) — Email/SMTP configuration

## Current Tasks

See [TODO.md](TODO.md) for outstanding work items.
