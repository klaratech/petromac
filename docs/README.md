# Petromac Website & Intranet Site

A Next.js-based application featuring:
- Public-facing website for Petromac
- Protected intranet site (kiosk + tools)
- Interactive PDF flipbooks for catalog and success stories

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.5+ (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4 with Petromac brand theme
- **Typography**: Inter (body), IBM Plex Sans (headings)
- **3D Visualization**: Three.js, React Three Fiber
- **Data Visualization**: D3.js
- **Data Processing**: Python 3.11+ (polars, openpyxl, pdf2image, pillow)
- **API Services**: Next.js API Routes, FastAPI (Python)
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions (including automated flipbook generation)
- **Analytics**: Vercel Analytics
- **PWA**: Kiosk-only service worker for offline functionality

> 📁 See [REPO_STRUCTURE.md](REPO_STRUCTURE.md) for structure  
> 🎨 See [docs/TAILWIND_THEME.md](docs/TAILWIND_THEME.md) for brand theme  
> 📖 See Flipbook module docs in REPO_STRUCTURE.md

### Shared Components
- **Header/Footer**: Single implementations in `src/components/shared/` used across public and intranet
- **Map**: Unified map implementation in `src/components/geo/` with variants for public and kiosk use
- **Flipbook**: Reusable PDF flipbook component in `src/components/shared/pdf/`

## 🌐 Application Structure

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
- Flipbooks generated from PDFs:  
  - `public/data/product-catalog.pdf`  
  - `public/data/successstories.pdf`
- Images stored under `public/flipbooks/*`
- Component: `src/components/shared/pdf/Flipbook.tsx`
- Automated regeneration with GitHub Actions workflow `.github/workflows/pdf-flipbook-build.yml`

### Success Stories
- **Data Source**: Single CSV file at `public/data/successstories-summary.csv`
- **Options**: Hard-coded filters in `src/data/successStoriesOptions.ts` (Area, Service Company, Technology)
- **Flipbook**: Interactive flipbook with filtering at `/success-stories/flipbook`

To modify filter options:
1. Edit `src/data/successStoriesOptions.ts`
2. Update normalization logic if needed
3. Deploy

The CSV is used for page mapping only, not for generating filter options.

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

## 🚀 Getting Started

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

For Python scripts:
```bash
cd scripts/python
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Data Processing & Flipbooks
- Run `python scripts/python/generate_json.py` for operations data
- Run `python scripts/python/pdf_to_images.py` for flipbooks (optional, normally handled by Actions)

### GitHub Actions
- `.github/workflows/data-build.yaml` → Operations data
- `.github/workflows/pdf-flipbook-build.yml` → Flipbooks

## 🔐 Security
- Basic Auth for `/intranet/*`
- `X-Robots-Tag: noindex, nofollow` for intranet
- Environment variables for intranet credentials

## 📚 Resources
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vercel Docs](https://vercel.com/docs)
