# Repository Structure

This document explains the organization and structure of the Petromac website and internal kiosk application.

## Overview

The repository contains:
1. **Public Website** - Public-facing marketing site at `/`
2. **Intranet Portal** - Protected internal portal at `/intranet`
3. **Kiosk Application** - Internal dashboard app at `/intranet/kiosk`

## Directory Structure

```
petromac-kiosk/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── page.tsx                      # 🌐 Public homepage
│   │   ├── about/                        # 🌐 About page
│   │   ├── catalog/                      # 🌐 Product catalog page
│   │   ├── case-studies/                 # 🌐 Case studies page
│   │   ├── contact/                      # 🌐 Contact page
│   │   ├── layout.tsx                    # Root layout (global)
│   │   ├── globals.css                   # Global styles
│   │   └── intranet/                     # 🔒 Protected section
│   │       ├── page.tsx                  # Intranet homepage (Athena + Kiosk tiles)
│   │       └── kiosk/                    # 🔒 Kiosk application
│   │           ├── page.tsx              # Kiosk entry (video intro)
│   │           ├── api/                  # API routes
│   │           │   └── successstories/   # Success stories API
│   │           ├── catalog/              # Product catalog with 3D models
│   │           ├── dashboard/            # Operations dashboard (map)
│   │           ├── datacheck/            # Data validation tools
│   │           ├── productlines/         # Product lines viewer
│   │           └── successstories/       # Success stories manager
│   ├── components/
│   │   ├── public/                       # 🌐 Public website components
│   │   │   ├── Hero.tsx                  # Homepage hero section
│   │   │   ├── ProblemSection.tsx        # Problem areas grid
│   │   │   ├── ProductTeaser.tsx         # Product teaser section
│   │   │   └── Footer.tsx                # Site footer
│   │   └── *.tsx                         # 🔒 Kiosk components (shared)
│   ├── hooks/                            # Custom React hooks
│   ├── types/                            # TypeScript type definitions
│   ├── data/                             # Static data modules
│   ├── config/                           # App configuration
│   └── constants/                        # Constants and enums
├── lib/                                  # Shared utility functions
├── middleware.ts                         # 🔒 Basic Auth for /intranet/*
├── public/                               # Static assets (Vercel CDN)
│   ├── data/                             # Sanitized JSON data files
│   ├── images/                           # Images and icons
│   ├── videos/                           # Video files
│   └── models/                           # 3D models (.glb files)
├── data/                                 # Data management
│   ├── private/                          # 🚫 GITIGNORED - not public
│   │   ├── raw/                          # Raw Excel files
│   │   └── intermediate/                 # Processing outputs
│   └── schemas/                          # JSON schemas
├── scripts/
│   ├── python/                           # Python data processing
│   │   ├── generate_json.py              # Excel → JSON processor
│   │   ├── successstories.py             # PDF generation
│   │   └── requirements.txt              # Python dependencies
│   └── node/                             # Node.js utilities
├── .github/
│   └── workflows/
│       └── data-build.yaml               # Automated data processing
├── .env.example                          # Environment variables template
├── middleware.ts                         # Route protection
├── package.json                          # Node.js dependencies
├── tsconfig.json                         # TypeScript configuration
├── tailwind.config.mjs                   # Tailwind CSS config
├── next.config.ts                        # Next.js configuration
├── tailwind.config.ts                    # Tailwind CSS brand theme
├── README.md                             # Main documentation
├── TODO.md                               # Project backlog
├── REPO_STRUCTURE.md                     # This file
└── docs/
    ├── README-successstories.md          # Success stories guide
    └── TAILWIND_THEME.md                 # Brand theme specifications
```

## Route Structure

### Public Routes (Unrestricted)
```
/                    → Public homepage
/about               → About page
/catalog             → Product catalog page
/case-studies        → Case studies page
/contact             → Contact page
```

### Intranet Routes (Basic Auth Required)
```
/intranet            → Intranet homepage
  ├── Athena tile    → External link (env-configured)
  └── Kiosk tile     → /intranet/kiosk

/intranet/kiosk                      → Kiosk entry (video intro)
/intranet/kiosk/productlines         → Product lines browser
/intranet/kiosk/dashboard            → Operations map dashboard
/intranet/kiosk/catalog              → Interactive 3D catalog
/intranet/kiosk/successstories       → Success stories manager
/intranet/kiosk/datacheck            → Data validation tools

/intranet/kiosk/api/successstories   → API endpoint
```

## Authentication & Security

### Basic Authentication
- All `/intranet/*` routes require authentication
- Credentials: `INTRANET_USER` and `INTRANET_PASS` (env vars)
- Implemented in `middleware.ts`

### SEO Protection
- `X-Robots-Tag: noindex, nofollow` headers on intranet routes
- Prevents search engine indexing of internal content

### Data Privacy
- Raw data files in `data/private/` are gitignored
- Only sanitized JSON is public in `public/data/`

## Key Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Route protection (Basic Auth) |
| `.env.example` | Environment variables template |
| `tailwind.config.ts` | Tailwind CSS with Petromac brand theme |
| `src/app/layout.tsx` | Root layout with Inter + IBM Plex Sans fonts |
| `src/app/page.tsx` | Public homepage (brand theme applied) |
| `src/app/intranet/page.tsx` | Intranet homepage |
| `src/app/intranet/kiosk/page.tsx` | Kiosk entry point |
| `lib/mapUtils.ts` | Map data processing utilities |
| `lib/dataValidation.ts` | Data validation helpers |
| `docs/TAILWIND_THEME.md` | Brand theme specifications |
| `docs/README-successstories.md` | Success stories management guide |

## Data Flow

### Operations Data Pipeline
```
Excel File (Private)
  ↓
data/private/raw/jobhistory.xlsx
  ↓
scripts/python/generate_json.py
  ↓
public/data/operations_data.json
  ↓
Served by Vercel CDN
  ↓
Dashboard Map Visualization
```

### Success Stories Pipeline
```
PDF + CSV (Public)
  ↓
public/successstories.pdf
public/successstories-summary.csv
  ↓
API: /intranet/kiosk/api/successstories
  ↓
Success Stories Filter UI
```

## Environment Variables

### Required
```env
INTRANET_USER=username              # Basic auth username
INTRANET_PASS=password              # Basic auth password
```

### Optional
```env
NEXT_PUBLIC_ATHENA_URL=https://...  # Athena portal URL
OPTIONS_MODE=static                 # Success stories mode
```

## Component Organization

### Public Components (`src/components/public/`)
All components styled with Petromac brand theme (brand blue #1E4A9A, Inter/IBM Plex Sans fonts):

- `Hero.tsx` - Homepage hero with branded CTA buttons
- `ProblemSection.tsx` - 4-tile problem areas grid with brand colors
- `ProductTeaser.tsx` - Product teaser with brand button
- `Footer.tsx` - Site footer with slate neutrals

### Kiosk Components (`src/components/`)
- `DrilldownMap.tsx` - Interactive world map
- `MapRenderer.tsx` - D3.js map rendering
- `CountryChart.tsx` - Country statistics chart
- `YearlyStatsChart.tsx` - Yearly statistics
- `DeviceViewer.tsx` - 3D product viewer
- `CarouselView.tsx` - Image carousel
- `SystemModal.tsx` - System detail modal
- `DataTable.tsx` - Data table component
- `LoadingSpinner.tsx` - Loading indicator
- `ErrorBoundary.tsx` - Error handling
- `IdleRedirect.tsx` - Idle timeout handler

## Build Output

### Static Pages (○)
```
/                        Public homepage
/about                   About page
/catalog                 Catalog page  
/case-studies            Case studies page
/contact                 Contact page
/intranet                Intranet homepage
/intranet/kiosk/datacheck  Data check tool
```

### Dynamic Pages (ƒ)
```
/intranet/kiosk                     Kiosk entry (SSR)
/intranet/kiosk/dashboard           Operations dashboard (SSR)
/intranet/kiosk/catalog             3D catalog (SSR)
/intranet/kiosk/productlines        Product lines (SSR)
/intranet/kiosk/successstories      Success stories (SSR)
/intranet/kiosk/api/successstories  API endpoint (SSR)
```

## Development Workflow

### Local Development
```bash
npm run dev              # Start dev server (port 3000)
```

### Production Build
```bash
npm run build            # Build for production
npm run start            # Start production server
```

### Data Processing
```bash
cd scripts/python
python generate_json.py  # Process Excel → JSON
```

## Brand Theme

### Colors
- **Primary**: Brand Blue `#1E4A9A` (buttons, links, accents)
- **Black**: `#1D1D1B` (brandblack token)
- **Gray**: `#575756` (brandgray token)
- **Neutrals**: Tailwind `slate` for text/backgrounds

### Typography
- **Headings**: IBM Plex Sans (technical, industrial aesthetic)
- **Body**: Inter (clean, contemporary UI text)
- **Applied via**: CSS variables `--font-inter`, `--font-plex`

### Usage
- Public components use brand theme consistently
- Intranet/kiosk components maintain original styling
- All brand colors defined as Tailwind tokens (no scattered hex codes)

See `docs/TAILWIND_THEME.md` for complete specifications.

## Deployment

- **Platform**: Vercel
- **Production URL**: TBD
- **Branch**: `main` (auto-deploys to production)
- **Preview**: All branches get preview deployments

---

**Legend:**
- 🌐 = Public (no auth required)
- 🔒 = Protected (Basic Auth required)
- 🚫 = Private (gitignored, never deployed)
