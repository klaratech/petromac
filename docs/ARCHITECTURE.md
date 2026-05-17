# Architecture

The Petromac platform combines a **public-facing website**, an **intranet portal**, a **kiosk shell**, and supporting **data processing pipelines**.

## Components

### Public Website (Route Group: `(public)`)
- Built with **Next.js 16** (App Router) and **React 19**
- Styled with **Tailwind CSS 4** using Petromac brand theme
- Pages: Home, About, Team, Catalog, Track Record, Simulation, Contact, Privacy, and Terms
- **Track Record** (`/track-record`) - Interactive global deployment map using shared DrilldownMapCore
- Flipbooks for **Catalog** and **Success Stories** provide interactive PDF viewing

### Intranet Portal
- Homepage with tiles:
  - Athena (external portal)
  - Kiosk (internal dashboard app)
  - Catalog (flipbook)
  - Success Stories (flipbook + filters, reusing shared components)
- Optional **Microsoft Entra staff sign-in** establishes a staff identity that carries into kiosk mode
- Kiosk app includes:
  - Operations dashboard with map visualization (shared DrilldownMapCore)
  - Product lines explorer
  - Data validation tools

### Kiosk Shell (Route Group: `(kiosk)`)
- Kiosk-only layout provides fullscreen UX, dedicated service worker registration, and kiosk manifest/viewport metadata
- All kiosk routes live under `/intranet/kiosk/*` but are isolated by the kiosk route group shell

### Shared Map Components
- **DrilldownMapCore** (`src/components/geo/DrilldownMapCore.tsx`) - Reusable map logic for both public and kiosk surfaces. The public `/track-record` page now imports it directly via `next/dynamic` (lazy-loaded), and computes its own hero stats from the same dataset.
- **DrilldownMapKiosk** (`src/components/geo/DrilldownMapKiosk.tsx`) - Kiosk wrapper for the operations dashboard.
- **Map Data Utilities** (`src/lib/map/data.ts`) - Typed fetchers that read the published JSON directly from `/data/operations_data.json` and `/data/country_labels.json`. Backend `/api/data/*` routes still exist as passthroughs, but the frontend should use the static `/data/*` paths for map data.

### Flipbook Module
- Replaces the old PDF viewer/builder modals
- Source PDFs and tags xlsx dropped into `sources/catalog/` and `sources/success-stories/` (see `sources/README.md`)
- Generated bundles in `public/flipbooks/<docKey>/` (manifest, pages, `source.pdf`, compressed `email.pdf`, optional tags)
- Converted into images with Python (`scripts/build_flipbook.py` using pdf2image + pillow)
- Interactive flipbooks built with **page-flip**
- Routes:
  - `/catalog`
  - `/success-stories/flipbook`

#### Success Stories Filters Architecture (Single Source of Truth)
Success Stories are implemented as a **single feature module**:

**CSV Parsing + Filtering** (`src/features/success-stories/services/successStories.shared.ts`):
- Loads `public/flipbooks/success-stories/tags.csv`
- Parses CSV with PapaParse
- Applies normalization and derives filtered page numbers
- Produces a validation report for unmapped/invalid values

**Key Design Decision**: Tags CSV is the single source of truth for filtering, with normalization rules applied for stable, predictable filter values.

### Data Pipeline
- `scripts/node/data-pipeline.ts` scans the `sources/` drop zone, builds the published artifacts, and archives consumed inputs to `sources/_archive/`
- Python scripts process Excel data into JSON; `scripts/build_flipbook.py` renders flipbook bundles
- Pipeline inputs are dropped into `sources/` (gitignored, never deployed)
- Published data artifacts stored in `public/data/`
- The frontend fetches published operations and country-label data directly from `/data/*`

### Email & Security
- SMTP, PDF generation, recipient allowlists, origin validation, and email log state live in the backend service
- Frontend calls the backend over env-configured API base URLs
- Contact form: HTML escaping, honeypot, timing check, input length limits enforced by the backend
- Microsoft staff identity uses Entra OAuth routes and an encrypted session cookie

### Deployment
- Frontend and backend run as Docker containers on **`klaratech-1`** (Hetzner) under `/root/apps/petromac/`
- Public traffic routed through a **Cloudflare Tunnel** (`klaratech-1` tunnel) to localhost ports `3015` (frontend) and `8012` (backend `/api/*`)
- No public ports open on the server — cloudflared connects outbound; SSH is via Tailscale or the deploy key
- Container images published to **GHCR** by GitHub Actions: `ghcr.io/klaratech/petromac-frontend` and `petromac-backend`, both `linux/amd64` only
- Flipbooks generated automatically by `.github/workflows/pdf-flipbooks-build.yml`
- Operations data pipeline automated via `.github/workflows/data-build.yaml`
- See [DEPLOY.md](../DEPLOY.md) for the full pipeline and rollback flow

## Data Architecture

### Three-Tier Data Organization

#### Pipeline Inputs (`sources/`)
- **Never deployed or committed** — dropped files are gitignored; only the folder structure + `sources/README.md` are tracked
- `sources/operations/` (job-history `.xlsx`), `sources/catalog/` and `sources/success-stories/` (PDFs + tags `.xlsx`)
- `pnpm run data` consumes the newest file in each folder and moves it to `sources/_archive/`

#### Published Artifacts (`public/data/`)
- **Bundled with the frontend image** and served by Next.js
- Contains all data files consumed by the application
- The backend can read the same operations and country-label JSON for passthrough/debug endpoints, but frontend map surfaces should read `/data/*` directly
- Includes:
  - Large JSON datasets (operations_data.json ~3MB)
  - Map data (country_labels.json, world-50m.json)
  - Flipbook assets live under `public/flipbooks/`

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
const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/data/operations_data.json`, {
  next: { revalidate: 3600 }
});
```

#### For TypeScript Modules (src/data/)
Import directly for small, typed datasets:

```tsx
import { regionalManagers, hqTeam } from "@/data/team";
```
