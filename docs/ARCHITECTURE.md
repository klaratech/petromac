# Architecture

Current-state overview. For _why_ it's built this way, see [DECISIONS.md](DECISIONS.md).

## Components

- **Public site** — Next.js 16 App Router route group `(public)`, Tailwind 4.
  Notable pages: `/track-record` (d3 drill-down map, lazy-loaded; Success
  Stories opens as an overlay via `?stories=1`) and `/catalog` (pdf.js viewer:
  book-style two-page spreads on wide screens, self-contained scroll area
  with an always-visible toolbar, selectable text, links, and a
  full-document search box).
- **Intranet** — `/intranet` is server-gated behind Microsoft Entra sign-in
  (`/auth/microsoft/*`; AES-GCM session cookie, 12 h TTL; unauthenticated
  visitors 307 straight to Microsoft). Links to Athena and the kiosk.
  Unconfigured environments (no Entra env vars) skip the gate for dev.
- **Kiosk** — route group `(kiosk)` under `/intranet/kiosk/*`: splash → Open
  Hole video attractor (`/lane?lane=oh`) or Cased Hole `HelixExperience`
  (`/ch`), plus dashboard, 3d-viewer, successstories, datacheck, and the
  offline-prime utility. Scoped service worker (`public/kiosk-sw.js`) caches
  everything for offline trade-show use. See [KIOSK.md](KIOSK.md).
- **Backend** — single-file FastAPI (`backend/app/main.py`): contact form,
  PDF email sends, filtered success-stories PDF builder, data passthroughs.
  Rate-limited (keyed on `CF-Connecting-IP`), origin-validated, recipient
  allowlists. See [EMAIL_SETUP.md](EMAIL_SETUP.md).
- **Data pipeline** — `pnpm run data` scans the `sources/` drop zone, builds
  published artifacts into `public/`, archives inputs. See [ADMIN.md](ADMIN.md).

## Documents

- **Catalog**: ONE compressed (<4 MB) + linearized `petromac-product-catalog.pdf` + a
  `search-index.json` (per-page text). Serves the viewer, downloads, and email.
- **Success stories**: WebP page images (rendered from a full-res
  `source.pdf`) + manifest + `tags.csv` (single source of truth for filters)
  - compressed `email.pdf`. Flipbook (page-flip) loads a ±4-page window.

## Data tiers

1. **`sources/`** — pipeline inputs; gitignored, archived after each run.
2. **`public/data/`** — published JSON, fetched at runtime from `/data/*`
   (never imported), so map surfaces work without the backend. Two deliberate
   build-time-import exceptions: `operations_stats.json` (homepage numbers)
   and the flipbook manifests.
3. **`src/data/`** — small typed TS modules only (e.g. `team.ts`).

Operations artifacts: `operations_data.json` (slim, all map surfaces),
`operations_full.json` (staff datacheck only), `operations_stats.json`
(homepage). Schema: `src/types/JobRecord.ts`.

## Shared components

- `src/components/geo/DrilldownMapCore.tsx` — one map for public + kiosk
  (`DrilldownMapKiosk` wraps it for the dashboard).
- `src/features/` — success-stories filtering/services, flipbooks, catalog.
- Self-hosted decoders — Draco at `public/draco/`, pdf.js worker at
  `public/pdfjs/`. Never let these fall back to a CDN (offline kiosk + CSP).

## Deployment

```
Browser → Cloudflare edge → cloudflared tunnel (klaratech-1)
                              ├→ 127.0.0.1:3015  frontend (Next standalone)
                              └→ 127.0.0.1:8012  backend  (/api/*)
```

GitHub Actions builds both images to GHCR on push to `main` and SSH-redeploys.
Containers MUST bind `127.0.0.1:` only. Security headers incl. CSP in
`next.config.ts`; cache policy is cadence-based (quarterly assets / weekly
data) and requires Cloudflare "Respect Existing Headers". Details:
[DEPLOY.md](../DEPLOY.md).
