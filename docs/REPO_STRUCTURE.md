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
│   │   └── *.tsx                         # 🔒 Kiosk components (shared)
│   ├── hooks/                            # Custom React hooks
│   ├── types/                            # TypeScript type definitions
│   ├── data/                             # Static data modules
│   ├── config/                           # App configuration
│   └── constants/                        # Constants and enums
├── lib/                                  # Shared utility functions
├── middleware.ts                         # 🔒 Basic Auth for /intranet/*
├── public/                               # Static assets (Vercel CDN)
│   ├── data/                             # Source PDFs (product-catalog.pdf, successstories.pdf)
│   ├── flipbooks/                        # Generated images for flipbooks
│   │   ├── productcatalog/
│   │   └── successstories/
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

