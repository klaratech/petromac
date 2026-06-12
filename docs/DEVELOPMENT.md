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

### Flipbooks

- Source PDFs and the tags xlsx are dropped into `sources/catalog/` and `sources/success-stories/` (see `sources/README.md`)
- Generated bundles live in `public/flipbooks/<docKey>/`
- Preferred unified pipeline (operations + flipbooks):
  ```bash
  pnpm run data
  ```
- View flipbooks:
  - http://localhost:3000/catalog
  - http://localhost:3000/success-stories/flipbook

### Success Stories Filters

Filters are derived from the tags file at `public/flipbooks/success-stories/tags.csv`.
This CSV is auto-generated from the `Success Stories_Summary.xlsx` file (sheet: "Kiosk") during the build pipeline.
Normalization rules live in `src/features/success-stories/services/successStories.shared.ts`.

To update filters:

1. Edit the "Kiosk" sheet in the success-stories summary `.xlsx` and drop it into `sources/success-stories/`
2. Run `pnpm run data` (or `pnpm run data:flipbooks`)
3. Commit generated outputs

## Code Organization

- `src/app/(public)` → Public shell routes
- `src/app/(kiosk)` → Kiosk shell routes
- `backend/app` → FastAPI backend service
- `src/app/auth/microsoft/*` → Entra login/callback/logout routes
- `src/components/public/` → Public site components
- `src/components/shared/pdf/Flipbook.tsx` → Shared flipbook component
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
2. rebuild `public/flipbooks/*` (pages + `email.pdf`) from the newest `sources/catalog/` and `sources/success-stories/` files
3. run flipbook/success-stories validators
4. move consumed inputs into `sources/_archive/` (date-stamped)

An empty `sources/` subfolder is simply skipped. See [sources/README.md](../../sources/README.md).

## Testing

- Run lint/typecheck before commits (`pnpm run lint`, `pnpm run typecheck`)
- Syntax check backend Python (`python3 -m compileall backend`)
- Run data validation (`pnpm run validate:successstories`)
- Run smoke tests (`pnpm run test:e2e`) with a local server running
- Production deploys build in GitHub Actions and run on Hetzner (`klaratech-1`) via Docker Compose — see [DEPLOY.md](../DEPLOY.md)
- If you are testing Microsoft staff sign-in locally, add the localhost callback URL to the Entra app and populate the Entra env vars in `.env.dev`

## Kiosk Offline Refresh (Trade Shows)

To refresh kiosk content before going offline:

1. Connect the kiosk device to a stable network.
2. Visit key kiosk routes at least once:
   - `/intranet/kiosk`
   - `/intranet/kiosk/dashboard`
   - `/intranet/kiosk/productlines`
   - `/intranet/kiosk/successstories`
3. Wait for videos/models/flipbooks to finish loading (first load caches assets).
4. If a new release ships, hard refresh once while online to update caches.

If assets appear stale, clear site data for the kiosk domain in the browser settings.

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
  - Large datasets (operations_data.json ~3MB)
  - Map data (country_labels.json, world-50m.json)
- **Fetch at runtime from `/data/*`** - do not import large JSON files from here

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
- Product lines: http://localhost:3000/intranet/kiosk/productlines
- Data validation: http://localhost:3000/intranet/kiosk/datacheck

## Notes

- The old PDF viewer/builder modals are **deprecated** and replaced by the Flipbook module.
- Source PDFs and tags xlsx are dropped into the `sources/` drop zone (see `sources/README.md`).
- **Data organization is critical** - follow the three-tier structure to avoid deployment issues.
