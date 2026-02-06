# Development Workflow

This document describes how to develop, test, and deploy features for the Petromac website and intranet.

## Local Development

### Setup
```bash
git clone https://github.com/Klaratech/petromac.git
cd petromac
pnpm install
cp .env.example .env.local
pnpm run dev
```

- Python scripts: set up virtualenv in `scripts/python`, install from `requirements.txt`

### Running Locally
- Public site: http://localhost:3000
- Intranet: http://localhost:3000/intranet (requires Basic Auth)
- Track Record (map): http://localhost:3000/track-record

### Flipbooks
- Source PDFs and tags xlsx live in OneDrive (paths configured in `.env.local`)
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
1. Edit the "Kiosk" sheet in `Success Stories_Summary.xlsx` (OneDrive)
2. Run `pnpm run data`
3. Commit generated outputs

## Code Organization

- `src/app/(public)` → Public shell routes
- `src/app/(kiosk)` → Kiosk shell routes
- `src/components/public/` → Public site components
- `src/components/shared/pdf/Flipbook.tsx` → Shared flipbook component
- `src/components/geo/` → Shared map components
  - `DrilldownMapCore.tsx` → Core map logic (reusable)
  - `DrilldownMapPublic.tsx` → Public wrapper for `/track-record`
  - `DrilldownMapKiosk.tsx` → Kiosk wrapper for dashboard
- `src/lib/map/data.ts` → Map data fetchers for `/data/*.json`
- `src/features/success-stories/` → Success Stories feature (filters, parsing, services)
- `src/shared/ui/` → Shared UI primitives

## GitHub Actions

- `.github/workflows/data-build.yaml` → unified data pipeline (`pnpm run data`)
- `.github/workflows/pdf-flipbooks-build.yml` → Flipbook generation

## Unified Data Pipeline (`pnpm run data`)

This repository supports an env-driven source workflow so raw files can stay outside git (e.g., OneDrive-synced local paths).

Configure these in `.env.local`:

```bash
OPERATIONS_SOURCE_XLSX=/absolute/path/to/jobhistory.xlsx
FLIPBOOK_CATALOG_SOURCE_PDF=/absolute/path/to/catalog.pdf
FLIPBOOK_SUCCESS_STORIES_SOURCE_PDF=/absolute/path/to/success-stories.pdf
FLIPBOOK_SUCCESS_STORIES_TAGS_XLSX=/absolute/path/to/Success Stories_Summary.xlsx
DATA_PIPELINE_STRICT=true
```

Then run:

```bash
pnpm run data
```

This will:
1. build `public/data/operations_data.json`
2. rebuild `public/flipbooks/*`
3. run flipbook/success-stories validators

For cron-style usage, schedule `pnpm run data` periodically and commit updated outputs only.

## Testing

- Run lint/typecheck before commits (`pnpm run lint`, `pnpm exec tsc --noEmit`)
- Run data validation (`pnpm run validate:successstories`)
- Run smoke tests (`pnpm run test:e2e`) with a local server running
- Preview builds deployed automatically for PRs

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

#### 1. Private Data (`data/private/`)
- **Never commit large Excel files or raw data**
- Store in `data/private/raw/` (gitignored)
- Python processing intermediates go in `data/private/intermediate/`
- These files are never deployed

#### 2. Published Data (`public/data/`)
- All JSON/CSV/PDF files served to clients
- Accessible via `/data/*` URLs (e.g., `/data/operations_data.json`)
- Use for:
  - Large datasets (operations_data.json ~3MB)
  - Map data (country_labels.json, world-110m.json)
- **Fetch at runtime** - do not import JSON files from here

Flipbook assets (PDFs + images) live under `public/flipbooks/` and are accessed via `/flipbooks/*` URLs.

#### 3. TypeScript Modules (`src/data/`)
- Small, typed data only (e.g., `team.ts`)
- Import directly: `import { data } from "@/data/module"`
- **Do not store large JSON here** - use `public/data/` instead

### Fetching Data

For data in `public/data/`, always use fetch:

```tsx
// ✅ Client Component
"use client";
const [data, setData] = useState(null);

useEffect(() => {
  fetch("/data/operations_data.json")
    .then(r => r.json())
    .then(setData);
}, []);

// ✅ Server Component
const res = await fetch("https://yourdomain.com/data/file.json", {
  next: { revalidate: 3600 }
});
const data = await res.json();

// ❌ WRONG - Don't import large JSON
import data from "@/data/operations_data.json"; // NO!
```

### Python Script Output Targets

When creating or modifying Python scripts:
- ✅ Write published data to: `public/data/`
- ✅ Write diagnostics to: `data/private/intermediate/`
- ✅ Write flipbook images to: `public/flipbooks/`
- ❌ **Never** write to `scripts/python/` (creates duplicates)

Example:
```python
# Correct paths
EXCEL_PATH = "data/private/raw/jobhistory.xlsx"
OUTPUT_JSON = "public/data/operations_data.json"
DIAGNOSTICS = "data/private/intermediate/validation.txt"
```

### Verifying Data Fetches

After making changes, verify all data fetches work:

```bash
pnpm run dev
# Open http://localhost:3000
# Open DevTools → Network tab → Filter by "data/"
# Verify all /data/*.json requests return 200 OK (no 404s)
```

Check these pages:
- Public Track Record (map): http://localhost:3000/track-record
- Kiosk Dashboard (map): http://localhost:3000/intranet/kiosk/dashboard
- Product lines: http://localhost:3000/intranet/kiosk/productlines
- Data validation: http://localhost:3000/intranet/kiosk/datacheck

## Notes

- The old PDF viewer/builder modals are **deprecated** and replaced by the Flipbook module.
- Source PDFs and tags xlsx are sourced from OneDrive via `.env.local` paths.
- **Data organization is critical** - follow the three-tier structure to avoid deployment issues.
