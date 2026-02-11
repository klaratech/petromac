# Petromac Website & Intranet Site

A Next.js-based application featuring:
- Public-facing website for Petromac
- Protected intranet site (kiosk + tools)
- Interactive PDF flipbooks for catalog and success stories

## Architecture

### Tech Stack
- **Frontend**: Next.js 15.5+ (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4 with Petromac brand theme
- **Typography**: Inter (body), IBM Plex Sans (headings)
- **3D Visualization**: Three.js, React Three Fiber
- **Data Visualization**: D3.js
- **Data Processing**: Python 3.11+ (polars, openpyxl, pdf2image, pillow)
- **API Services**: Next.js API Routes
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions (including automated flipbook generation)
- **Analytics**: Vercel Analytics
- **PWA**: Kiosk-only service worker for offline functionality

> See [docs/REPO_STRUCTURE.md](docs/REPO_STRUCTURE.md) for file layout
> See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for architecture overview
> See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for development workflow
> See [docs/TAILWIND_THEME.md](docs/TAILWIND_THEME.md) for brand theme
> See [docs/VERCEL_EMAIL_SETUP.md](docs/VERCEL_EMAIL_SETUP.md) for email configuration
> See [docs/FLIPBOOKS.md](docs/FLIPBOOKS.md) for flipbook build pipeline
> See [docs/KIOSK.md](docs/KIOSK.md) for kiosk operations & offline caching

### Shared Components
- **Header/Footer**: Single implementations in `src/components/shared/` used across public and intranet
- **Map**: Unified map implementation in `src/components/geo/` with variants for public and kiosk use
- **Flipbook**: Reusable PDF flipbook component in `src/components/shared/pdf/`

## Application Structure

### Public Website (/)
- **Homepage** (`/`)
- **About** (`/about`)
- **Catalog** (`/catalog`) + `/catalog/flipbook` (interactive flipbook)
- **Track Record** (`/track-record`) - Interactive global deployment map (shared DrilldownMapCore)
- **Case Studies** (`/case-studies`)
- **Success Stories** (`/success-stories`) + `/success-stories/flipbook` (interactive flipbook)
- **Contact** (`/contact`)

### Intranet (/intranet/*)
Protected by Basic Auth. Includes:
- **Intranet Homepage** with Athena + Kiosk tiles
- **Kiosk Application** with dashboards, product lines, success stories manager, data check tools

### Flipbooks
- Source PDFs and tags xlsx sourced from OneDrive (paths in `.env.local`)
- Output bundle format under `public/flipbooks/<docKey>/` (manifest, pages, source.pdf, optional tags)
- Component: `src/components/shared/pdf/Flipbook.tsx`
- Automated regeneration with GitHub Actions workflow `.github/workflows/pdf-flipbooks-build.yml`

### Success Stories
- **Data Source**: Tags CSV at `public/flipbooks/success-stories/tags.csv` (auto-generated from `Success Stories_Summary.xlsx`)
- **Options**: Derived from tags + normalization logic in `src/features/success-stories/services/successStories.shared.ts`
- **Flipbook**: Interactive flipbook with filtering at `/success-stories/flipbook`

### PWA & Offline Functionality
- **Scope**: PWA functionality is limited to `/intranet/kiosk/*` only
- **Service Worker**: `public/kiosk-sw.js` registered only within kiosk routes
- **Cache Strategy**:
  - Cache-first for media (videos, 3D models, images, PDFs)
  - Network-first for data files (JSON, CSV)
- **Public Site**: No service worker registered; remains a standard web application

To test offline functionality:
1. Visit `/intranet/kiosk/` routes
2. Open DevTools → Application → Service Workers
3. Enable "Offline" mode and verify cached assets load

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- pnpm
- Git

### Local Development Setup

```bash
git clone https://github.com/Klaratech/petromac.git
cd petromac
pnpm install
cp .env.example .env.local
pnpm run dev
```

### Common Scripts
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run data` (unified operations + flipbooks rebuild using env-configured source paths)
- `pnpm run validate:successstories`
- `pnpm run build:flipbooks`
- `pnpm run validate:flipbooks`
- `pnpm run test:e2e` (run with a local server running)

## Kiosk
Kiosk routes live under `/intranet/kiosk`. Offline caching is implemented via a kiosk-scoped Service Worker.
See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for kiosk offline refresh steps and cache details.

### E2E tests
Install Playwright browsers once:
`pnpm exec playwright install`
Then run:
`pnpm run test:e2e`

For Python scripts:
```bash
cd scripts/python
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Data Processing & Flipbooks
- Preferred: run `pnpm run data` to rebuild operations JSON + flipbook assets in one command
- Source files can be configured via `.env.local` (raw sources do not need to be committed):
  - `OPERATIONS_SOURCE_XLSX`
  - `FLIPBOOK_CATALOG_SOURCE_PDF`
  - `FLIPBOOK_SUCCESS_STORIES_SOURCE_PDF`
  - `FLIPBOOK_SUCCESS_STORIES_TAGS_XLSX`
- Optional legacy commands:
  - `python scripts/python/generate_json.py`
  - `pnpm run build:flipbooks`
  - `python scripts/update_flipbooks.py`

### GitHub Actions
- `.github/workflows/data-build.yaml` - Operations data
- `.github/workflows/pdf-flipbooks-build.yml` - Flipbooks

## Security
- Basic Auth for `/intranet/*` (timing-safe credential comparison)
- `X-Robots-Tag: noindex, nofollow` for intranet
- Environment variables for intranet credentials
- Contact form: HTML escaping, rate limiting (3 req/min), honeypot + timing bot checks, input length limits
- Email APIs: recipient allowlists, origin validation, rate limiting (3 req/min)
- PDF generation API: rate limiting (5 req/min), sanitized error responses

## Resources
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vercel Docs](https://vercel.com/docs)
