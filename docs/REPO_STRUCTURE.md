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
│   │   ├── page.tsx                      # 🌐 Public homepage
│   │   ├── about/                        # 🌐 About page
│   │   ├── catalog/                      # 🌐 Product catalog page
│   │   │   └── flipbook/                 # 🌐 Product catalog flipbook page
│   │   ├── track-record/                 # 🌐 Track record page (global deployment map)
│   │   ├── case-studies/                 # 🌐 Case studies page
│   │   ├── contact/                      # 🌐 Contact page
│   │   ├── success-stories/              # 🌐 Success stories page
│   │   │   └── flipbook/                 # 🌐 Success stories flipbook page
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
│   │   ├── shared/                       # Shared components
│   │   │   └── pdf/                      # Shared PDF components (flipbook)
│   │   ├── geo/                          # 🗺️ Geospatial map components (shared)
│   │   │   ├── DrilldownMapCore.tsx      # Core map logic (reusable)
│   │   │   ├── DrilldownMapPublic.tsx    # Public wrapper for /track-record
│   │   │   └── DrilldownMapKiosk.tsx     # Kiosk wrapper for dashboard
│   │   └── kiosk/                        # 🔒 Kiosk-specific components
│   ├── components/
│   │   ├── public/                       # 🌐 Public website components
│   │   ├── shared/                       # Shared components
│   │   │   └── pdf/                      # Shared PDF components (flipbook)
│   │   ├── geo/                          # �️ Geospatial map components (shared)
│   │   │   ├── DrilldownMapCore.tsx      # Core map logic (reusable)
│   │   │   ├── DrilldownMapPublic.tsx    # Public wrapper for /track-record
│   │   │   └── DrilldownMapKiosk.tsx     # Kiosk wrapper for dashboard
│   │   └── kiosk/                        # 🔒 Kiosk-specific components
│   ├── hooks/                            # Custom React hooks
│   ├── lib/                              # Utility functions
│   │   └── map/                          # Map-specific utilities
│   │       └── data.ts                   # Data fetchers for /data/*.json
│   ├── types/                            # TypeScript type definitions
│   ├── data/                             # Static data modules
│   ├── config/                           # App configuration
│   └── constants/                        # Constants and enums
├── middleware.ts                         # 🔒 Basic Auth for /intranet/*
├── public/                               # Static assets (Vercel CDN)
│   ├── data/                             # Source PDFs (product-catalog.pdf, successstories.pdf)
│   ├── flipbooks/                        # Generated images for flipbooks
│   │   ├── productcatalog/
│   │   └── successstories/
│   ├── images/                           # Images and icons
│   ├── videos/                           # Video files
│   └── models/                           # 3D models (.glb files)
├── data/                                 # Data management (private sources only)
│   └── private/                          # 🚫 GITIGNORED - not deployed
│       ├── raw/                          # Raw Excel uploads (e.g., jobhistory.xlsx)
│       └── intermediate/                 # Python processing intermediates & diagnostics
├── scripts/
│   ├── python/                           # Python data processing
│   │   ├── generate_json.py              # Excel → JSON processor
│   │   ├── pdf_to_images.py              # PDF → images processor (flipbooks)
│   │   ├── successstories.py             # PDF generation
│   │   └── requirements.txt              # Python dependencies
│   └── node/                             # Node.js utilities
├── .github/
│   └── workflows/
│       ├── data-build.yaml               # Automated data processing
│       └── pdf-flipbook-build.yml        # Automated flipbook generation
├── .env.example                          # Environment variables template
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
    ├── TAILWIND_THEME.md                 # Brand theme specifications
    ├── ARCHITECTURE.md                   # Architecture overview
    └── DEVELOPMENT.md                    # Development workflow
```

## 📖 Flipbook Module

### Overview
The repository supports interactive flipbooks for **Product Catalog** and **Success Stories**. These are generated from PDFs in `public/data/`.

### File Locations
- **Source PDFs**:  
  - `public/data/product-catalog.pdf`  
  - `public/data/successstories.pdf`

- **Generated Images**:  
  - `public/flipbooks/productcatalog/`  
  - `public/flipbooks/successstories/`

- **Component**:  
  - `src/components/shared/pdf/Flipbook.tsx`

- **Routes**:  
  - `/catalog/flipbook` → Product Catalog flipbook  
  - `/success-stories/flipbook` → Success Stories flipbook  

### Update Workflow
- Replace the PDF in `public/data/` **with the same filename**.  
- Push changes to `main`.  
- GitHub Actions workflow `.github/workflows/pdf-flipbook-build.yml` regenerates JPGs and commits them automatically.

> ⚠️ Keep filenames stable. Archive old PDFs in `data/archive/` if versioning is needed.

## 📁 Data Organization

### Three-Tier Data Structure

The repository uses a three-tier data organization to separate private sources, published artifacts, and TypeScript modules:

#### 1. `data/` - Private Sources & Intermediates (NEVER DEPLOYED)
- **Purpose**: Private data sources and processing intermediates
- **Git Status**: Entire directory is gitignored (except .gitkeep files)
- **Contents**:
  - `data/private/raw/` - Raw Excel uploads (e.g., `jobhistory.xlsx`)
  - `data/private/intermediate/` - Python processing outputs, diagnostics, and temporary files

#### 2. `public/data/` - Published Artifacts (VERCEL CDN)
- **Purpose**: Static data files served to clients
- **Git Status**: Tracked and deployed
- **URL Access**: Files are accessible at `/data/*` (e.g., `/data/operations_data.json`)
- **Contents**:
  - `operations_data.json` - Processed operations data (3MB+)
  - `country_labels.json` - Country name mappings for map
  - `region_coords.json` - Region coordinate data for map
  - `region_data.json` - Additional region metadata
  - `Product_and_Device_Line_Growth.csv` - Product growth metrics
  - `product-catalog.pdf` - Source PDF for product catalog flipbook
  - `successstories.pdf` - Source PDF for success stories flipbook

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
- **Flipbook images** → `public/flipbooks/{productcatalog|successstories}/page-XXX.jpg`
- **Diagnostics & intermediates** → `data/private/intermediate/`
- **Never output to** `scripts/python/` directory (avoid duplication)
