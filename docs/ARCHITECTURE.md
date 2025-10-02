# Architecture

The Petromac platform combines a **public-facing website**, a **protected intranet portal**, and supporting **data processing pipelines**.

## Components

### Public Website
- Built with **Next.js 15.5+** (App Router) and **React 19**
- Styled with **Tailwind CSS 4** using Petromac brand theme
- Pages: Home, About, Catalog, Case Studies, Success Stories, Contact
- Flipbooks for **Catalog** and **Success Stories** provide interactive PDF viewing

### Intranet Portal
- Protected with **Basic Authentication**
- Homepage with tiles:
  - Athena (external portal)
  - Kiosk (internal dashboard app)
  - Catalog (flipbook)
  - Success Stories (flipbook + filters, reusing shared components)
- Kiosk app includes:
  - Operations dashboard with map visualization (D3.js)
  - Product lines explorer
  - Data validation tools

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
