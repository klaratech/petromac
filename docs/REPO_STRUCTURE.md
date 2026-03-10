# Repository Structure

This document explains the organization and structure of the Petromac website and internal kiosk application.

## Overview

The repository contains:
1. **Public Website** - Public-facing marketing site at `/`
2. **Intranet Portal** - Protected internal portal at `/intranet`
3. **Kiosk Application** - Internal dashboard app at `/intranet/kiosk`
4. **Flipbook Module** - Interactive PDF flipbooks for product catalog and success stories

## Directory Structure

```
website/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (public)/                     # 🌐 Public shell routes
│   │   │   ├── page.tsx                  # Homepage
│   │   │   ├── about/                    # About pages
│   │   │   ├── catalog/                  # Catalog + flipbook
│   │   │   ├── track-record/             # Global deployment map
│   │   │   ├── contact/                  # Contact + server actions
│   │   │   ├── success-stories/flipbook/ # Success stories flipbook
│   │   │   └── intranet/                 # 🔒 Intranet homepage
│   │   ├── (kiosk)/                      # 🔒 Kiosk shell routes
│   │   │   └── intranet/kiosk/           # Kiosk application
│   │   │       ├── page.tsx              # Kiosk entry (video intro)
│   │   │       ├── dashboard/            # Operations dashboard (map)
│   │   │       ├── productlines/         # Product lines viewer
│   │   │       ├── datacheck/            # Data validation tools
│   │   │       └── successstories/       # Success stories flipbook
│   │   ├── api/                          # API routes
│   │   ├── layout.tsx                    # Root layout (global)
│   │   └── globals.css                   # Global styles
│   ├── features/                         # Feature modules (shared)
│   │   ├── success-stories/              # ✅ Single source of truth
│   │   │   ├── components/               # Filters + flipbook UI
│   │   │   ├── config/                   # Options + normalization
│   │   │   └── services/                 # CSV parsing/filtering
│   │   └── kiosk/                        # Kiosk shell components
│   ├── shared/
│   │   └── ui/                           # Shared UI primitives
│   ├── components/
│   │   ├── public/                       # Public website components
│   │   ├── shared/                       # Shared layout components
│   │   │   └── pdf/                      # Shared PDF components
│   │   ├── geo/                          # Shared map components
│   │   └── kiosk/                        # Kiosk-specific components
│   ├── hooks/                            # Custom React hooks
│   ├── lib/                              # Utility functions
│   │   └── map/                          # Map-specific utilities
│   ├── types/                            # TypeScript type definitions
│   ├── data/                             # Static data modules (small)
│   │   └── team.ts                       # Team member data
│   ├── config/                           # App configuration
│   └── constants/                        # Constants and enums
├── middleware.ts                         # 🔒 Basic Auth for /intranet/*
├── public/                               # Static assets served by Next.js
│   ├── kiosk-sw.js                       # 🔧 Kiosk-only service worker
│   ├── data/                             # Data files (JSON/CSV for maps, ops)
│   │   ├── world-110m.json               # Local topojson for offline map
│   │   └── *.json                        # Operations and map data
│   ├── flipbooks/                        # Generated flipbook bundles
│   │   ├── catalog/
│   │   └── success-stories/
│   ├── images/                           # Images and icons
│   ├── videos/                           # Video files
│   └── models/                           # 3D models (.glb files)
├── data/                                 # Data management (private sources only)
│   └── private/                          # 🚫 GITIGNORED - not deployed
│       ├── raw/                          # Raw Excel uploads (e.g., jobhistory.xlsx)
│       └── intermediate/                 # Python processing intermediates & diagnostics
├── scripts/
│   ├── python/                           # Python data processing
│   └── node/                             # Node.js utilities
├── .github/
│   └── workflows/
│       ├── data-build.yaml               # Automated data processing
│       └── pdf-flipbooks-build.yml       # Automated flipbook generation
├── .env.example                          # Environment variables template
├── package.json                          # Node.js dependencies
├── pnpm-lock.yaml                        # pnpm lockfile
├── tsconfig.json                         # TypeScript configuration
├── tailwind.config.mjs                   # Tailwind CSS config
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
    └── EMAIL_SETUP.md                    # Email configuration guide
```

## 📖 Flipbook Module

### Overview
The repository supports interactive flipbooks for **Product Catalog** and **Success Stories**. Source PDFs and tags xlsx are sourced from OneDrive (paths configured in `.env.dev`).

### File Locations
- **Source files**: Configured via `.env.dev` env vars (OneDrive paths)
  - `FLIPBOOK_CATALOG_SOURCE_PDF`
  - `FLIPBOOK_SUCCESS_STORIES_SOURCE_PDF`
  - `FLIPBOOK_SUCCESS_STORIES_TAGS_XLSX`

- **Generated Bundles**:
  - `public/flipbooks/catalog/`
  - `public/flipbooks/success-stories/`

- **Component**:
  - `src/components/shared/pdf/Flipbook.tsx`

- **Routes**:
  - `/catalog` → Product Catalog flipbook
  - `/success-stories/flipbook` → Success Stories flipbook

### Update Workflow
- Update source PDFs and/or the "Kiosk" sheet in `Success Stories_Summary.xlsx` (in OneDrive).
- Run `pnpm run data` (or `pnpm run build:flipbooks`) and commit `public/flipbooks/**`.

## 📁 Data Organization

### Three-Tier Data Structure

The repository uses a three-tier data organization to separate private sources, published artifacts, and TypeScript modules:

#### 1. `data/` - Private Sources & Intermediates (NEVER DEPLOYED)
- **Purpose**: Private data sources and processing intermediates
- **Git Status**: Entire directory is gitignored (except .gitkeep files)
- **Contents**:
  - `data/private/raw/` - Raw Excel uploads (e.g., `jobhistory.xlsx`)
  - `data/private/intermediate/` - Python processing outputs, diagnostics, and temporary files

#### 2. `public/data/` - Published Artifacts
- **Purpose**: Static data files served to clients
- **Git Status**: Tracked and deployed
- **URL Access**: Files are accessible at `/data/*` (e.g., `/data/operations_data.json`)
- **Contents**:
  - `operations_data.json` - Processed operations data (3MB+)
  - `country_labels.json` - Country name mappings for map
  - `world-110m.json` - TopoJSON for offline map rendering
  - Flipbook assets live under `public/flipbooks/` (see [FLIPBOOKS.md](FLIPBOOKS.md))

#### 3. `src/data/` - TypeScript Data Modules
- **Purpose**: Small, typed data consumed directly by UI components
- **Git Status**: Tracked
- **Usage**: Direct TypeScript imports (not fetched)
- **Contents**:
  - `team.ts` - Team member data with TypeScript interfaces
  - Other small, typed datasets

### Fetching Data in Components

For data in `public/data/`, use fetch calls instead of imports:

**Client Component Example:**
```tsx
"use client";
import { useEffect, useState } from "react";

export function useOperationsData() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch("/data/operations_data.json")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setData(d))
      .catch(e => console.error("Failed to load data:", e));
  }, []);
  
  return data;
}
```

**Server Component Example:**
```tsx
export default async function ServerPage() {
  const res = await fetch("https://yourdomain.com/data/operations_data.json", {
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  const data = await res.json();
  
  return <div>{/* use data */}</div>;
}
```

### Python Pipeline Output Targets

All Python scripts in `scripts/python/` follow these output conventions:
- **Final published JSON** → `public/data/operations_data.json`
- **Success Stories tags** → `public/flipbooks/success-stories/tags.csv`
- **Flipbook bundles** → `public/flipbooks/{catalog|success-stories}/`
- **Diagnostics & intermediates** → `data/private/intermediate/`
- **Never output to** `scripts/python/` directory (avoid duplication)

## 🔧 PWA & Service Worker

### Kiosk-Only PWA
The application uses a **scoped service worker** that only applies to kiosk routes:

- **Service Worker**: `public/kiosk-sw.js`
- **Scope**: `/intranet/kiosk/` only
- **Registration**: Handled by `src/app/intranet/kiosk/layout.tsx`
- **Public Site**: No service worker registered

### Cache Strategy
- **Media Files** (videos, 3D models, images, PDFs): Cache-first
- **Data Files** (JSON, CSV): Network-first with fallback to cache

### Testing Offline
1. Visit any `/intranet/kiosk/` route
2. Open DevTools → Application → Service Workers
3. Verify service worker is registered with scope `/intranet/kiosk/`
4. Enable "Offline" mode
5. Navigate kiosk pages - cached assets should load

### Adding Assets to Cache
To add new asset types to the kiosk cache, edit `public/kiosk-sw.js`:
```javascript
// Add to regex pattern for cache-first strategy
if (/\.(png|jpg|jpeg|webp|mp4|glb|gltf|pdf|YOUR_EXTENSION)$/i.test(url.pathname)) {
  // ... cache-first logic
}
```

## 🎯 Component Architecture

### Shared Components Philosophy
Components in `src/components/shared/` are used by both public and intranet sections:
- **Header.tsx**: Navigation header with public and intranet links
- **Footer.tsx**: Footer with links and copyright
- **Flipbook.tsx**: Reusable PDF flipbook viewer

### Map Components
Map components follow a core + wrapper pattern:
- **MapRenderer.tsx**: D3.js SVG rendering logic
- **DrilldownMapCore.tsx**: Core map state and interactions
- **DrilldownMapPublic.tsx**: Public-facing wrapper for `/track-record`
- **DrilldownMapKiosk.tsx**: Kiosk wrapper with additional features

### Success Stories Data Flow
1. **Source**: `public/flipbooks/success-stories/tags.csv` (single source of truth)
2. **Normalization**: Filter normalization in `src/features/success-stories/services/successStories.shared.ts`
3. **Services**: Tags parsing + filtering in `src/features/success-stories/services/successStories.shared.ts`
4. **API**: `/api/pdf/success-stories` for PDF generation
5. **UI**: Filters in `src/features/success-stories/components/SuccessStoriesFilters.tsx`
