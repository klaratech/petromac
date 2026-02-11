# Petromac Website

Next.js 15 (App Router) + React 19 + TypeScript website with public site, protected intranet, and trade-show kiosk.

## Quick Reference

- **Dev**: `pnpm run dev` (http://localhost:3000)
- **Lint**: `pnpm run lint`
- **Typecheck**: `pnpm run typecheck`
- **E2E tests**: `pnpm run test:e2e` (needs local server running)
- **Data pipeline**: `pnpm run data` (rebuilds operations JSON + flipbooks)
- **Validate**: `pnpm run validate:flipbooks && pnpm run validate:successstories`

## Architecture

- **Route groups**: `src/app/(public)/` for public site, `src/app/(kiosk)/` for kiosk shell
- **Intranet**: All `/intranet/*` routes protected by Basic Auth in `middleware.ts`
- **Shared components**: `src/components/shared/` (header, footer, flipbook)
- **Map components**: `src/components/geo/` (DrilldownMapCore + Public/Kiosk wrappers)
- **Feature modules**: `src/features/` (success-stories filters/services, kiosk shell)
- **Shared UI primitives**: `src/shared/ui/`
- **API routes**: `src/app/api/` (email, PDF generation)
- **Styling**: Tailwind CSS 4 with brand tokens (`brand`, `brandblack`, `brandgray`), fonts: Inter (body), IBM Plex Sans (headings)

## Data Organization

- `public/data/` — Published JSON/CSV served via CDN (fetch at runtime, never import)
- `public/flipbooks/` — Generated flipbook bundles (committed)
- `data/private/` — Raw sources & intermediates (gitignored, never deployed)
- `src/data/` — Small typed TS modules only (e.g. `team.ts`)

## Key Conventions

- Environment variables for all secrets (see `.env.example`)
- Source PDFs/xlsx come from OneDrive paths configured in `.env.local`
- Flipbook tags CSV is the single source of truth for success stories filtering
- Kiosk service worker (`public/kiosk-sw.js`) scoped to `/intranet/kiosk/` only
- Security: rate limiting, HTML escaping, origin validation (URL hostname parsing), email allowlists
- Security headers configured in `next.config.ts` (HSTS, X-Frame-Options, etc.)

## Documentation

All docs live in `docs/`:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Architecture overview
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — Development workflow & data conventions
- [docs/REPO_STRUCTURE.md](docs/REPO_STRUCTURE.md) — Full directory tree
- [docs/FLIPBOOKS.md](docs/FLIPBOOKS.md) — Flipbook build pipeline & troubleshooting
- [docs/KIOSK.md](docs/KIOSK.md) — Kiosk operations & offline caching
- [docs/TAILWIND_THEME.md](docs/TAILWIND_THEME.md) — Brand colors & typography
- [docs/VERCEL_EMAIL_SETUP.md](docs/VERCEL_EMAIL_SETUP.md) — Email/SMTP configuration

## Current Tasks

See [TODO.md](TODO.md) for outstanding work items.
