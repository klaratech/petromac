# Repository Structure

This document explains the organization and structure of the **Petromac website** and **internal intranet (including kiosk application)**.

## Overview

The repository contains:
1. **Public Website** – Public-facing marketing site at `/`
2. **Intranet Portal** – Protected internal portal at `/intranet`  
   - Provides useful links and internal tools (Athena, Kiosk, etc.)
3. **Kiosk Application** – Interactive internal dashboard at `/intranet/kiosk`

## Directory Structure

```
app/                                   # Next.js App Router
├── page.tsx                           # 🌐 Public homepage
├── about/                             # 🌐 About page
├── catalog/                           # 🌐 Product catalog page
├── case-studies/                      # 🌐 Case studies page
├── contact/                           # 🌐 Contact page
├── layout.tsx                         # Root layout (global)
├── globals.css                        # Global styles
└── intranet/                          # 🔒 Protected intranet
    ├── page.tsx                       # Intranet homepage (Athena + Kiosk tiles)
    └── kiosk/                         # 🔒 Kiosk application
        ├── page.tsx                   # Kiosk entry point
        ├── api/                       # API routes
        │   └── successstories/        # Success stories API
        ├── catalog/                   # Product catalog (3D models)
        ├── dashboard/                 # Operations dashboard (map)
        ├── datacheck/                 # Data validation tools
        ├── productlines/              # Product lines viewer
        └── successstories/            # Success stories manager

components/
├── public/                            # 🌐 Public-facing components
│   ├── Hero.tsx                       # Homepage hero section
│   ├── ProblemSection.tsx             # Problem areas grid
│   ├── ProductTeaser.tsx              # Product teaser section
│   └── Footer.tsx                     # Footer
└── *.tsx                              # 🔒 Shared kiosk/intranet components

hooks/                                 # Custom React hooks
types/                                 # TypeScript type definitions
lib/                                   # Shared utility functions
data/
├── private/                           # 🚫 Gitignored (never public)
│   ├── raw/                           # Raw Excel files
│   └── intermediate/                  # Intermediate processing
└── schemas/                           # JSON schemas

public/                                # Static assets (served via Vercel CDN)
├── data/                              # Sanitized JSON (public outputs)
├── images/                            # Images, logos
├── videos/                            # Videos
└── models/                            # 3D models (.glb)

scripts/
├── python/                            # Data processing scripts
│   ├── generate_json.py               # Excel → JSON pipeline
│   ├── successstories.py              # PDF/CSV utilities
│   └── requirements.txt               # Python dependencies
└── node/                              # Node.js utilities

docs/                                  # Documentation
├── DEV_PROMPT.md                      # Agent development instructions
├── README-successstories.md           # Success stories guide
├── TAILWIND_THEME.md                  # Brand theme specs
└── TODO.md                            # Backlog / follow-ups

.github/
└── workflows/
    └── data-build.yaml                # Automated data pipeline (GitHub Actions)

.env.example                           # Example env vars
middleware.ts                          # 🔒 Auth & SEO protection for intranet
package.json                           # Node.js dependencies
tsconfig.json                          # TypeScript config
tailwind.config.ts                     # Tailwind theme config
next.config.ts                         # Next.js config
README.md                              # Main documentation
REPO_STRUCTURE.md                      # This file
```

---

## Route Structure

### Public (unrestricted)
```
/                    → Public homepage
/about               → About page
/catalog             → Product catalog
/case-studies        → Case studies
/contact             → Contact
```

### Intranet (🔒 Basic Auth)
```
/intranet            → Intranet homepage
  ├── Athena tile    → External Athena link
  └── Kiosk tile     → /intranet/kiosk

/intranet/kiosk                      → Kiosk entry
/intranet/kiosk/dashboard            → Ops dashboard
/intranet/kiosk/productlines         → Product lines
/intranet/kiosk/catalog              → 3D catalog
/intranet/kiosk/successstories       → Success stories
/intranet/kiosk/datacheck            → Data tools
/intranet/kiosk/api/successstories   → API endpoint
```

---

## Authentication & Security

- **Basic Auth**: All `/intranet/*` routes  
  - Credentials: `INTRANET_USER` + `INTRANET_PASS`
  - Implemented in `middleware.ts`
- **SEO Protection**: `X-Robots-Tag: noindex, nofollow` headers on intranet
- **Data Privacy**:  
  - `data/private/` never committed  
  - Only sanitized JSON in `public/data/` is public

---

## Data Flow

### Operations Pipeline
```
Excel (private)
  ↓
data/private/raw/jobhistory.xlsx
  ↓
scripts/python/generate_json.py
  ↓
public/data/operations_data.json
  ↓
Vercel CDN
  ↓
Kiosk dashboard (D3 map)
```

### Success Stories
```
PDF/CSV inputs
  ↓
scripts/python/successstories.py
  ↓
API → /intranet/kiosk/api/successstories
  ↓
UI → Success stories manager
```

---

## Key Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Basic Auth + SEO protection |
| `.env.example` | Environment variable template |
| `tailwind.config.ts` | Brand colors + fonts |
| `app/layout.tsx` | Root layout (fonts, Analytics) |
| `app/page.tsx` | Public homepage |
| `app/intranet/page.tsx` | Intranet homepage |
| `app/intranet/kiosk/page.tsx` | Kiosk entry |
| `scripts/python/generate_json.py` | Excel → JSON pipeline |
| `docs/TAILWIND_THEME.md` | Brand theme guidelines |

---

## Brand Theme

- **Colors**:  
  - Blue `#1E4A9A`  
  - Black `#1D1D1B`  
  - Grey `#575756`  
  - White `#FFFFFF`  
- **Fonts**:  
  - IBM Plex Sans → headings  
  - Inter → body text  
- **Usage**:  
  - Defined in Tailwind config  
  - No raw hex codes in components

---

## Deployment

- **Platform**: Vercel (Next.js preset)
- **Analytics**: Vercel Analytics (public site only)
- **Production URL**: https://petromac.co.nz
- **Preview Deploys**: For all feature branches

---

🔑 Legend:  
- 🌐 = Public  
- 🔒 = Protected  
- 🚫 = Private (never committed)
