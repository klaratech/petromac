# Petromac Website

Next.js 15 (App Router) + React 19 + TypeScript website with public site, intranet, and trade-show kiosk.

## Quick Reference

- **Dev**: `pnpm run dev` (http://localhost:3000)
- **Lint**: `pnpm run lint`
- **Typecheck**: `pnpm run typecheck`
- **E2E tests**: `pnpm run test:e2e` (needs local server running)
- **Data pipeline**: `pnpm run data` (rebuilds operations JSON + flipbooks)
- **Validate**: `pnpm run validate:flipbooks && pnpm run validate:successstories`

## Architecture

- **Route groups**: `src/app/(public)/` for public site, `src/app/(kiosk)/` for kiosk shell
- **Intranet**: `/intranet/*` is the staff area; Microsoft sign-in can be enabled for staff identity
- **Shared components**: `src/components/shared/` (header, footer, flipbook)
- **Map components**: `src/components/geo/` — `DrilldownMapCore` is the shared map; the public `/track-record` page imports it directly via `next/dynamic`, the kiosk dashboard uses `DrilldownMapKiosk` as a wrapper
- **Feature modules**: `src/features/` (success-stories filters/services, kiosk shell)
- **Shared UI primitives**: `src/shared/ui/`
- **API routes**: `src/app/api/` (email, PDF generation). Operations and country-label data are read from static JSON in `/public/data/` directly, not via `/api/data/*` — the FastAPI backend is Hetzner-only and Vercel needs to keep working without it
- **Kiosk**: OH/CH split — `/intranet/kiosk` (splash with Open Hole / Cased Hole buttons). OH → `/intranet/kiosk/lane?lane=oh` (looping video screen with a right-side overlay button strip; the three OH buttons open `OverlayExperience`, a config-driven Helix-pattern scaffold). CH → `/intranet/kiosk/ch` lands directly in `FocusCentralizersExperience` (helix-subtitled video loop + HUD + Rocker corner badge — Rocker via `RockerExperience` as a sub-view). The old CH lane attractor was retired in May 2026 because it was a near-identical preview of the Helix video that the experience itself already plays; `?lane=ch` still works as a redirect to `/ch` for bookmarks. `/productlines?lane=oh|ch` (the `SystemModal` tile grid) is still around for direct links but is no longer in the main flow. Kiosk videos resolve via `useKioskVideo` — prefers `public/videos/kiosk-hd/` (1080p), falls back to `public/videos/transcoded/`. Each experience HUD = `Track Record · Mechanism · Case Studies`; `MechanismScreen` is a single-slide pager (annotated diagrams / video / comparison) with a `Specifications` button that opens a spec-sheet modal sourced from `deviceSpecs.ts`.
- **Styling**: Tailwind CSS 4. Brand tokens (`brand`, `brandblack`, `brandgray`) still exist in `tailwind.config.ts` but the homepage v2 components have migrated to the `slate-*` scale for body text and dark headings — `brand` (#1E4A9A) remains the single brand color across the homepage and Track Record. Legacy `brandblack`/`brandgray` are still in use on error pages, the team page, and intranet surfaces. Fonts: Inter (body), IBM Plex Sans (headings).

## Data Organization

- `public/data/` — Published JSON/CSV served via CDN (fetch at runtime, never import). Operations data ships as two artifacts: `operations_data.json` (slim, 6 columns: Country / System / Subsystem / Year / Successful / PathFinder Run (Y/N) — what every map surface reads, ~600 KB) and `operations_full.json` (all 33 columns from the source xlsx, ~3.5 MB, only fetched by the staff diagnostic at `/intranet/kiosk/datacheck`). Full schema is documented at the top of `src/types/JobRecord.ts`. Add a column to the slim file when a new filter or display needs it.
- `public/flipbooks/` — Generated flipbook bundles, incl. `email.pdf` (committed)
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
