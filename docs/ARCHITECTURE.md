# Architecture

Current-state overview. For _why_ it's built this way, see [DECISIONS.md](DECISIONS.md).

## Components

- **Public site** — Next.js 16 App Router route group `(public)`, Tailwind 4.
  Notable pages: `/track-record` (d3 drill-down map, lazy-loaded; Success
  Stories opens as an overlay via `?stories=1`) and the HTML catalog below.
- **HTML catalog** — `/catalog`, built from a committed content model
  (`src/features/catalog/content/catalog.json`, generated from the InDesign
  IDML — see [ADMIN.md](ADMIN.md) §2b). Landing is a client-side workspace
  (`CatalogBrowser`): sticky category sidebar with counts (mobile:
  horizontal chip bar), active category synced to `?category=` via
  pushState/popstate, instant search that switches tab + scrolls to and
  flashes the card. Four categories — Fixed Angle Guides lives inside
  Guides & Holefinders as a group. Product pages are SSG at
  `/catalog/<category>/<slug>` (all in the sitemap) with real HTML spec
  tables (merged cells + footnotes preserved). Card badges/spec tags derive
  automatically from each product's spec tables. "Email PDF" sends as the
  signed-in staff member (Graph `/me/sendMail` via `/api/staff/send-pdf`)
  or falls back to the `info@` sender. Replaced the pdf.js viewer Jul 2026
  (react-pdf + `public/pdfjs/` removed); `/catalogtest/*` 308-redirects
  here.
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
  published artifacts into `public/`, archives inputs. The HTML catalog has
  its own command: `pnpm run data:catalog` (IDML package →
  `catalog.json` + web images). See [ADMIN.md](ADMIN.md).

## Documents

- **Catalog (PDF)**: ONE compressed (<4 MB) + linearized
  `petromac-product-catalog.pdf` — the download/email artifact only.
- **Catalog (HTML content model)**: `src/features/catalog/content/catalog.json`
  (32 products, 76 spec tables — build-time import, typed via `types.ts`) +
  `public/images/catalog/` WebP/SVG derivatives. Generated from the InDesign
  IDML by `scripts/python/{extract_catalog_idml,build_catalog_content,update_catalog}.py`
  with the curated mapping in `scripts/python/catalog_config.json`. The deploy
  build never needs the InDesign source.
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
- Self-hosted decoders — Draco at `public/draco/`. Never let it fall back
  to a CDN (offline kiosk + CSP).

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
