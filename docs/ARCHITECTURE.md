# Architecture

The Petromac platform combines a **public-facing website**, a **protected intranet portal**, a **kiosk shell**, and supporting **data processing pipelines**.

## Components

### Public Website (Route Group: `(public)`)
- Built with **Next.js 15.5+** (App Router) and **React 19**
- Styled with **Tailwind CSS 4** using Petromac brand theme
- Pages: Home, About, Catalog, Track Record, Case Studies, Success Stories, Contact
- **Track Record** (`/track-record`) - Interactive global deployment map using shared DrilldownMapCore
- Flipbooks for **Catalog** and **Success Stories** provide interactive PDF viewing

### Intranet Portal
- Protected with **Basic Authentication**
- Homepage with tiles:
  - Athena (external portal)
  - Kiosk (internal dashboard app)
  - Catalog (flipbook)
  - Success Stories (flipbook + filters, reusing shared components)
- Kiosk app includes:
  - Operations dashboard with map visualization (shared DrilldownMapCore)
  - Product lines explorer
  - Data validation tools

### Kiosk Shell (Route Group: `(kiosk)`)
- Kiosk-only layout provides fullscreen UX, dedicated service worker registration, and kiosk manifest/viewport metadata
- All kiosk routes live under `/intranet/kiosk/*` but are isolated by the kiosk route group shell

### Shared Map Components
- **DrilldownMapCore** (`src/components/geo/DrilldownMapCore.tsx`) - Reusable map logic for both public and kiosk
- **DrilldownMapPublic** (`src/components/geo/DrilldownMapPublic.tsx`) - Public wrapper for `/track-record`
- **DrilldownMapKiosk** (`src/components/geo/DrilldownMapKiosk.tsx`) - Kiosk wrapper for dashboard
- **Map Data Utilities** (`src/lib/map/data.ts`) - Typed fetchers for `/data/*.json` files
  - `fetchOperationsData()` - Fetches operations data
  - Handles data loading with proper error handling and caching hints

### Flipbook Module
- Replaces the old PDF viewer/builder modals
- Source PDFs:
  - `public/data/product-catalog.pdf`
  - `public/data/successstories.pdf`
- Converted into images with Python (`pdf_to_images.py` using pdf2image + pillow)
- Interactive flipbooks built with **page-flip**
- Routes:
  - `/catalog/flipbook`
  - `/success-stories/flipbook`

#### Success Stories Filters Architecture (Single Source of Truth)
Success Stories are implemented as a **single feature module**:

**Options + Normalization** (`src/features/success-stories/config/options.ts`):
- Three hard-coded multi-select filters: Area, Service Company, Technology
- Options are **static TypeScript constants** - NOT auto-generated from CSV
- Normalization functions map CSV values to canonical options

**CSV Parsing + Filtering** (`src/features/success-stories/services/successStories.shared.ts`):
- Loads `public/data/successstories-summary.csv`
- Parses CSV with PapaParse
- Applies normalization and derives filtered page numbers
- Produces a validation report for unmapped/invalid values

**Key Design Decision**: Options are hard-coded to prevent the UI from changing unpredictably when CSV data updates. The CSV is used only for page mapping, maintaining stable, predictable filter behavior.

### Data Pipeline
- Python scripts process Excel data into JSON
- Private sources stored in `data/private/` (gitignored, never deployed)
- Published data artifacts stored in `public/data/` and served via Vercel CDN
- Operations data, map data, and other static JSON files accessible at `/data/*` URLs

### Deployment
- Hosted on **Vercel**
- Static assets delivered via Vercel CDN
- Flipbooks generated automatically by **GitHub Actions** workflow `.github/workflows/pdf-flipbook-build.yml`
- Operations data pipeline also automated via GitHub Actions

## Data Architecture

### Three-Tier Data Organization

#### Private Sources (`data/private/`)
- **Never deployed or committed** (fully gitignored)
- Contains raw Excel files (`jobhistory.xlsx`) and processing intermediates
- Used by Python scripts during data generation
- Diagnostics and temporary files stored in `data/private/intermediate/`

#### Published Artifacts (`public/data/`)
- **Deployed to Vercel CDN** and publicly accessible
- Contains all data files consumed by the application
- Files accessible at `/data/*` URLs (e.g., `/data/operations_data.json`)
- Includes:
  - Large JSON datasets (operations_data.json ~3MB)
  - Map data (country_labels.json, region_coords.json, region_data.json)
  - World map topojson (`world-110m.json`) for offline map rendering
  - CSV files (Product_and_Device_Line_Growth.csv)
  - Source PDFs for flipbooks (product-catalog.pdf, successstories.pdf)

#### TypeScript Modules (`src/data/`)
- **Small, typed data modules** imported directly by components
- Contains TypeScript files with interfaces and typed data
- Example: `team.ts` with team member information
- **Do not store large JSON files here** - use `public/data/` instead

### Data Access Patterns

#### For Published Data (public/data/)
Components should fetch data at runtime rather than importing:

```tsx
// Client component
const response = await fetch("/data/operations_data.json");
const data = await response.json();

// Server component with caching
const res = await fetch("https://domain.com/data/operations_data.json", {
  next: { revalidate: 3600 }
});
```

#### For TypeScript Modules (src/data/)
Import directly for small, typed datasets:

```tsx
import { regionalManagers, hqTeam } from "@/data/team";
```
