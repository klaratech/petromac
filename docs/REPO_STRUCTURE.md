# Repository Structure

This document explains the organization and structure of the Petromac website and internal kiosk application.

## Overview

The repository contains:

1. **Public Website** - Public-facing marketing site at `/`
2. **Intranet Portal** - Internal portal at `/intranet`
3. **Kiosk Application** - Internal dashboard app at `/intranet/kiosk`
4. **Documents** - HTML catalog at `/catalog` (generated from the InDesign source); case studies at `/case-studies` (46 pages generated from the success-stories publication). The interactive image flipbook is KIOSK-ONLY since Jul 2026 — the public `/success-stories` routes 308 to `/case-studies`.
5. **Backend Service** - FastAPI service for contact email, PDFs, and data passthrough endpoints

## Directory Structure

```
website/
├── backend/
│   ├── app/                              # FastAPI application
│   ├── Dockerfile                        # Backend image
│   └── pyproject.toml                    # Backend Python package config
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (public)/                     # 🌐 Public shell routes
│   │   │   ├── page.tsx                  # Homepage
│   │   │   ├── about/                    # About pages
│   │   │   ├── catalog/                  # HTML catalog (three-level drill-down)
│   │   │   │   └── [category]/           # SSG family pages
│   │   │   │       └── [slug]/           # SSG product pages
│   │   │   ├── track-record/             # Global deployment map
│   │   │   ├── simulation/               # Athena planning/simulation page
│   │   │   ├── contact/                  # Contact page (submits to backend API)
│   │   │   ├── case-studies/             # 46 story pages + filterable index
│   │   │   ├── case-studies-preview/     # Design-proposal route (noindex, unlinked)
│   │   │   ├── team/                     # Team page
│   │   │   ├── privacy/                  # Privacy policy
│   │   │   ├── terms/                    # Terms of use
│   │   │   └── intranet/                 # Intranet homepage
│   │   ├── (kiosk)/                      # Kiosk shell routes
│   │   │   └── intranet/kiosk/           # Kiosk application
│   │   │       ├── page.tsx              # Kiosk entry (video intro)
│   │   │       ├── dashboard/            # Operations dashboard (map)
│   │   │       ├── datacheck/            # Data validation tools
│   │   │       └── successstories/       # Success stories flipbook
│   │   ├── api/staff/session/            # Staff session API
│   │   ├── api/staff/send-pdf/           # Emails a PDF AS the signed-in staffer (Graph /me/sendMail)
│   │   ├── auth/microsoft/               # Entra login/callback/logout routes
│   │   ├── layout.tsx                    # Root layout (global)
│   │   └── globals.css                   # Global styles
│   ├── features/                         # Feature modules (shared)
│   │   ├── case-studies/                 # Public source of truth: content + pure filters (+ tests)
│   │   ├── success-stories/              # KIOSK ONLY since Jul 2026 (public flipbook retired)
│   │   │   ├── components/               # Filters + flipbook UI
│   │   │   └── services/                 # CSV parsing/filtering
│   │   ├── flipbooks/                    # Flipbook manifest/services
│   │   └── catalog/                      # Product catalog
│   │       ├── content/                  # HTML catalog content model (catalog.json + types + accessors)
│   │       └── deviceSpecs.ts            # Kiosk CH device specs
│   ├── components/
│   │   ├── public/                       # Public website components
│   │   │   ├── home/                     # Homepage sections
│   │   │   └── catalog/                  # HTML catalog UI (finder, family tables, search, spec tables)
│   │   ├── shared/                       # Shared layout components
│   │   │   └── pdf/                      # Shared PDF components
│   │   ├── ui/                           # Shared UI primitives
│   │   ├── geo/                          # Shared map components
│   │   └── kiosk/                        # Kiosk-specific components (incl. KioskShell)
│   ├── hooks/                            # Custom React hooks
│   ├── lib/                              # Utility functions
│   │   ├── map/                          # Map data fetching + processing
│   │   ├── seo.ts                        # pageMetadata() — canonical + per-page OG builder
│   │   └── siteUrl.ts                    # Site URL + isProductionSite() (staging noindex)
│   ├── types/                            # TypeScript type definitions
│   ├── data/                             # Static data modules (small)
│   │   └── team.ts                       # Team member data
│   └── constants/                        # Constants and enums
├── public/                               # Static assets served by Next.js
│   ├── kiosk-sw.js                       # 🔧 Kiosk-only service worker
│   ├── data/                             # Data files (JSON/CSV for maps, ops)
│   │   ├── world-50m.json                # Local topojson for offline map (natural-earth 50m)
│   │   └── *.json                        # Operations and map data
│   ├── flipbooks/                        # Generated flipbook bundles
│   │   ├── catalog/
│   │   └── success-stories/
│   ├── images/                           # Images and icons
│   │   └── catalog/                      # Generated HTML-catalog product images (WebP/SVG)
│   ├── videos/                           # Video files
│   │   ├── hero/                         # Homepage hero loop + poster (committed)
│   │   ├── transcoded/                   # Web-ready clips (committed)
│   │   ├── kiosk-hd/                     # Optional 1080p kiosk clips (committed)
│   │   └── originals/                    # Full-res masters (gitignored)
│   └── models/                           # 3D models (.glb files)
├── sources/                              # 🚫 GITIGNORED content drop zone
│   ├── operations/                       # Incoming job-history spreadsheets
│   ├── catalog/                          # Incoming catalog: PDF and/or InDesign package (.idml + Links/)
│   ├── success-stories/                  # Incoming PDF + tags workbook
│   └── _archive/                         # Consumed inputs, date-stamped
├── scripts/
│   ├── python/                           # Python data processing
│   │   ├── extract_catalog_idml.py       # HTML catalog: IDML → raw spread dump
│   │   ├── build_catalog_content.py      # HTML catalog: raw + config → catalog.json + images
│   │   ├── update_catalog.py             # HTML catalog: one-command wrapper (pnpm run data:catalog)
│   │   ├── catalog_config.json           # Curated product↔spread mapping + text fixes
│   │   ├── update_flipbooks.py           # Flipbooks: PDF + tags xlsx → pages/manifest/tags.csv
│   │   └── build_case_studies.py         # /case-studies content — MANUAL, not part of `pnpm run data`
│   └── node/                             # Node.js utilities
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Lint/typecheck/build validation
│       ├── deploy-staging.yml            # TEST deploy — every push to main
│       └── deploy-prod.yml               # Production — workflow_dispatch ONLY (manual promote)
├── .env.example                          # Environment variables template
├── package.json                          # Node.js dependencies
├── pnpm-lock.yaml                        # pnpm lockfile
├── tsconfig.json                         # TypeScript configuration
├── next.config.ts                        # Next.js configuration
├── tailwind.config.ts                    # Tailwind CSS brand theme
├── README.md                             # Main project README
└── docs/
    ├── README.md                         # Documentation index
    ├── REPO_STRUCTURE.md                 # This file
    ├── ARCHITECTURE.md                   # Architecture overview
    ├── DEVELOPMENT.md                    # Development workflow
    ├── FLIPBOOKS.md                      # Flipbook build pipeline
    ├── KIOSK.md                          # Kiosk operations & offline caching
    ├── TAILWIND_THEME.md                 # Brand theme specifications
    ├── EMAIL_SETUP.md                    # Email configuration guide
    ├── ADMIN.md                          # Recurring content updates
    └── MS365_ENTRA_KIOSK_SETUP.md        # Microsoft admin setup for staff sign-in
```

## Where things are documented

- Catalog & success-stories build → [FLIPBOOKS.md](FLIPBOOKS.md)
- HTML catalog pipeline (IDML → catalog.json) → [ADMIN.md](ADMIN.md) §2b
- Data conventions (three tiers, fetching rules) → [DEVELOPMENT.md](DEVELOPMENT.md)
- Kiosk service worker & offline priming → [KIOSK.md](KIOSK.md)
- Content update recipes → [ADMIN.md](ADMIN.md)
