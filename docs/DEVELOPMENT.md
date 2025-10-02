# Development Workflow

This document describes how to develop, test, and deploy features for the Petromac website and intranet.

## Local Development

### Setup
```bash
git clone https://github.com/Klaratech/petromac.git
cd petromac
npm install
cp .env.example .env.local
npm run dev
```

- Python scripts: set up virtualenv in `scripts/python`, install from `requirements.txt`

### Running Locally
- Public site: http://localhost:3000
- Intranet: http://localhost:3000/intranet (requires Basic Auth)
- Track Record (map): http://localhost:3000/track-record

### Flipbooks
- PDFs in `public/data/` (`product-catalog.pdf`, `successstories.pdf`)
- Generate images manually if needed:
  ```bash
  cd scripts/python
  python pdf_to_images.py
  ```
- Images stored in `public/flipbooks/*`
- View flipbooks:
  - http://localhost:3000/catalog/flipbook
  - http://localhost:3000/success-stories/flipbook

## Code Organization

- `src/app/` → Next.js App Router pages
- `src/components/public/` → Public site components
- `src/components/shared/pdf/Flipbook.tsx` → Shared flipbook component
- `src/components/geo/` → Shared map components
  - `DrilldownMapCore.tsx` → Core map logic (reusable)
  - `DrilldownMapPublic.tsx` → Public wrapper for `/track-record`
  - `DrilldownMapKiosk.tsx` → Kiosk wrapper for dashboard
- `src/lib/map/data.ts` → Map data fetchers for `/data/*.json`
- `src/app/intranet/` → Intranet pages
- `src/app/intranet/kiosk/` → Kiosk app

## GitHub Actions

- `.github/workflows/data-build.yaml` → Excel → JSON pipeline
- `.github/workflows/pdf-flipbook-build.yml` → Flipbook generation

## Testing

- Run lint/typecheck before commits (`npm run lint`, `npx tsc --noEmit`)
- Husky + lint-staged ensure quality at commit
- Preview builds deployed automatically for PRs

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
  - Map data (country_labels.json, region_coords.json, region_data.json)
  - PDFs for flipbooks
  - CSV files
- **Fetch at runtime** - do not import JSON files from here

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
npm run dev
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
- Always keep PDF filenames stable (`product-catalog.pdf`, `successstories.pdf`).
- Archive older versions if needed, but pipeline depends on stable names.
- **Data organization is critical** - follow the three-tier structure to avoid deployment issues.
