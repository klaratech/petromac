# Development Workflow

This document describes how to develop, test, and deploy features for the Petromac website and intranet.

## Local Development

### Setup

```bash
git clone https://github.com/Klaratech/petromac.git
cd petromac
pnpm install
cp .env.example .env.local
cp .env.example .env.dev
pnpm run dev
```

- Python scripts: set up virtualenv in `scripts/python`, install from `requirements.txt`
- Use `docker compose up --build` when you need the frontend and FastAPI backend together.
- `.env.local` is loaded by Next.js local development; `.env.dev` is loaded by Docker Compose and `pnpm run data`.

### Running Locally

- Public site: http://localhost:3000
- Backend API: http://localhost:8000
- Intranet: http://localhost:3000/intranet
- Track Record (map): http://localhost:3000/track-record

### Documents (catalog + success stories)

See [FLIPBOOKS.md](FLIPBOOKS.md) for the build pipeline and
[ADMIN.md](ADMIN.md) for update recipes.

## Code Organization

- `src/app/(public)` → Public shell routes
- `src/app/(kiosk)` → Kiosk shell routes
- `backend/app` → FastAPI backend service
- `src/app/auth/microsoft/*` → Entra login/callback/logout routes
- `src/components/public/` → Public site components
- `src/components/shared/flipbook/Flipbook.tsx` → Shared flipbook component
- `src/components/geo/` → Shared map components
  - `DrilldownMapCore.tsx` → Core map logic (reusable). The public
    `/track-record` page imports it directly via `next/dynamic`; the
    kiosk dashboard uses `DrilldownMapKiosk` as a wrapper for fullscreen
    chrome and additional kiosk-only controls.
  - `DrilldownMapKiosk.tsx` → Kiosk wrapper for the operations dashboard.
- `src/lib/map/data.ts` → Static data fetchers (`/data/operations_data.json`,
  `/data/country_labels.json`). Backend `/api/data/*` routes remain as
  passthrough/debug endpoints, but frontend map surfaces should fetch the
  published JSON directly.
- `src/features/success-stories/` → Success Stories feature (filters, parsing, services)
- `src/components/ui/` → Shared UI primitives

## GitHub Actions

- `.github/workflows/data-build.yaml` → unified data pipeline (`pnpm run data`)
- `.github/workflows/pdf-flipbooks-build.yml` → Flipbook generation

## Unified Data Pipeline (`pnpm run data`)

The pipeline reads from the `sources/` drop zone — no env vars, no renaming. Drop
a file into the matching folder (any filename) and run the pipeline:

| Drop into                  | Contents                              | Build                      |
| -------------------------- | ------------------------------------- | -------------------------- |
| `sources/operations/`      | job-history `.xlsx`                   | `pnpm run data:operations` |
| `sources/catalog/`         | catalog `.pdf`                        | `pnpm run data:flipbooks`  |
| `sources/success-stories/` | success-stories `.pdf` + tags `.xlsx` | `pnpm run data:flipbooks`  |

Or run everything at once:

```bash
pnpm run data
```

This will:

1. build `public/data/operations_data.json` from the newest `sources/operations/` file
2. rebuild `public/flipbooks/*` from the newest `sources/catalog/` (one compressed PDF — the pdf.js viewer and its search index were retired Jul 2026) and `sources/success-stories/` (WebP pages + `tags.csv` + `email.pdf`) files
3. run flipbook/success-stories validators
4. move consumed inputs into `sources/_archive/` (date-stamped)

It does NOT rebuild the public case-studies pages. If the success-stories PDF or
tags changed, run `python3 scripts/python/build_case_studies.py` as well — see
[FLIPBOOKS.md](FLIPBOOKS.md).

An empty `sources/` subfolder is simply skipped. See [sources/README.md](../sources/README.md).

## Testing

- Run lint/typecheck before commits (`pnpm run lint`, `pnpm run typecheck`)
- Syntax check backend Python (`python3 -m compileall backend`)
- Run data validation (`pnpm run validate:successstories`)
- Run smoke tests (`pnpm run test:e2e`) with a local server running
- Production deploys build in GitHub Actions and run on Hetzner (`klaratech-1`) via Docker Compose — see [DEPLOY.md](../DEPLOY.md)
- If you are testing Microsoft staff sign-in locally, add the localhost callback URL to the Entra app and populate the Entra env vars in `.env.dev`

## Kiosk offline refresh

See [KIOSK.md](KIOSK.md) — bump the SW `VERSION` + re-prime devices.

## Data Conventions

### Three-Tier Data Organization

Follow these conventions when working with data:

#### 1. Pipeline Inputs (`sources/`)

- **Never commit large Excel files or raw PDFs** — dropped files are gitignored
- Drop into `sources/{operations,catalog,success-stories}/` (any filename)
- Consumed inputs are auto-moved to `sources/_archive/`
- These files are never deployed

#### 2. Published Data (`public/data/`)

- JSON/CSV/PDF artifacts generated for frontend and backend use
- Frontend map surfaces fetch JSON directly from `/data/*`
- Use for:
  - Large datasets (operations_data.json ~600 KB slim / operations_full.json ~3.5 MB)
  - Map data (country_labels.json, world-50m.json)
- **Fetch at runtime from `/data/*`** - do not import large JSON files from here
- Deliberate exceptions — tiny generated artifacts imported at build time so
  pages skip a runtime fetch: `operations_stats.json` (homepage ProofSection)
  and the flipbook `manifest.json` files (`src/features/flipbooks/manifests.ts`).
  Changes to these ship with the next deploy, not on CDN refresh.

Flipbook assets (PDFs + images) live under `public/flipbooks/` and are accessed via `/flipbooks/*` URLs.

#### 3. TypeScript Modules (`src/data/`)

- Small, typed data only (e.g., `team.ts`)
- Import directly: `import { data } from "@/data/module"`
- **Do not store large JSON here** - use `public/data/` instead

### Fetching Data

For data in `public/data/`, always use fetch:

```tsx
// ✅ Client Component
'use client';
const [data, setData] = useState(null);

useEffect(() => {
  fetch('/data/operations_data.json')
    .then((r) => r.json())
    .then(setData);
}, []);

// ✅ Server Component
const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/data/operations_data.json`, {
  next: { revalidate: 3600 },
});
const data = await res.json();

// ❌ WRONG - Don't import large JSON
import data from '@/data/operations_data.json'; // NO!
```

### Python Script Output Targets

When creating or modifying Python scripts:

- ✅ Read pipeline inputs from: `sources/` (e.g. `sources/operations/`)
- ✅ Write published data to: `public/data/`
- ✅ Write flipbook images to: `public/flipbooks/`
- ❌ **Never** write to `scripts/python/` (creates duplicates)

Example:

```python
# Correct paths
EXCEL_PATH = "sources/operations/jobhistory.xlsx"
OUTPUT_JSON = "public/data/operations_data.json"
```

### Verifying Data Fetches

After making changes, verify all data fetches work:

```bash
docker compose up --build
# Open http://localhost:3000
# Open DevTools → Network tab → Filter by "/data/"
# Verify published data requests return 200 OK (no 404s)
```

Check these pages:

- Public Track Record (map): http://localhost:3000/track-record
- Kiosk Dashboard (map): http://localhost:3000/intranet/kiosk/dashboard
- Data validation: http://localhost:3000/intranet/kiosk/datacheck

## Notes

- The old PDF viewer/builder modals are **deprecated** and replaced by the Flipbook module.
- Source PDFs and tags xlsx are dropped into the `sources/` drop zone (see `sources/README.md`).
- **Data organization is critical** - follow the three-tier structure to avoid deployment issues.
