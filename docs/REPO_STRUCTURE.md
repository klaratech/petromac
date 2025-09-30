# Repository Structure

This document explains the organization and structure of the **Petromac website** and **internal intranet (including kiosk application)**.

## Overview

The repository contains:
1. **Public Website** – Public-facing marketing site at `/`
2. **Intranet Portal** – Protected internal portal at `/intranet` (Athena links, Success Stories, Catalog, Kiosk)
3. **Kiosk Application** – Dashboard & drilldowns at `/intranet/kiosk` (can embed modules/widgets)

## Directory Structure (high level)

```
src/
  app/                                   # Next.js App Router
  ├─ page.tsx                            # 🌐 Public homepage
  ├─ about/  catalog/  case-studies/  contact/
  ├─ intranet/                           # 🔒 Protected intranet
  │  ├─ page.tsx                         # Intranet home (tiles)
  │  ├─ success-stories/                 # Full page (uses shared panel + builder)
  │  ├─ catalog/                         # Full page (uses shared panel + builder)
  │  └─ kiosk/                           # Kiosk application
  │     ├─ page.tsx                      # Kiosk entry
  │     ├─ dashboard/  productlines/  catalog/  datacheck/  successstories/
  │     └─ api/
  ├─ layout.tsx  globals.css  favicon.ico

  components/
  ├─ public/                             # 🌐 Public site UI
  ├─ shared/
  │  ├─ inputs/                          # Reusable inputs
  │  │  ├─ MultiSelect.tsx
  │  │  └─ index.ts
  │  ├─ panels/                          # Reusable panels (embed into pages/kiosk)
  │  │  ├─ SuccessStoriesPanel.tsx
  │  │  ├─ CatalogPanel.tsx
  │  │  └─ index.ts
  │  └─ pdf/
  │     ├─ PDFBuilderModal.tsx           # Shared builder-only modal
  │     └─ index.ts

  config/                                # App config (e.g., featured systems)
  constants/                             # Enums, option lists, thresholds
  data/                                  # Domain datasets (no secrets)
  hooks/                                 # Custom hooks
  lib/                                   # Helpers (map utils, validation, pdf helpers)
  modules/
  ├─ success-stories/
  │  ├─ containers/                      # Page + Widget
  │  │  ├─ SuccessStoriesPage.tsx
  │  │  └─ SuccessStoriesWidget.tsx
  │  ├─ hooks/  services/  types/  index.ts
  └─ catalog/
     ├─ containers/
     │  └─ CatalogPage.tsx
     ├─ hooks/  services/  types/  index.ts
```

Other top-level dirs:
```
public/            # CDN assets (images, models, videos, data)
scripts/python/    # Data pipeline tools (generate_json.py, validate_data.py, successstories.py)
docs/              # Architecture, theme, prompts, how-tos
```

---

## Route Structure

### Public (unrestricted)
```
/                    → Public homepage
/about               → About
/catalog             → Catalog
/case-studies        → Case studies
/contact             → Contact
```

### Intranet (🔒 Basic Auth)
```
/intranet            → Intranet homepage (tiles)
  ├── Athena (Prod)  → External link
  ├── Athena (Test)  → NEXT_PUBLIC_ATHENA_TEST_URL (optional)
  ├── Kiosk          → /intranet/kiosk
  ├── Success Stories→ /intranet/success-stories
  └── Catalog        → /intranet/catalog

/intranet/kiosk                      → Kiosk entry
/intranet/kiosk/dashboard            → Ops dashboard
/intranet/kiosk/productlines         → Product lines
/intranet/kiosk/catalog              → 3D catalog
/intranet/kiosk/successstories       → Legacy kiosk success stories
/intranet/kiosk/datacheck            → Data tools
```

---

## Authentication & SEO

- **Basic Auth**: All `/intranet/*` routes (`INTRANET_USER`/`INTRANET_PASS`), implemented in `middleware.ts`
- **Robots**: `X-Robots-Tag: noindex, nofollow` on intranet
- **Data privacy**: `data/private/` is gitignored. Sanitized JSON lives in `public/data/`

---

## Shared Modules (Reuse)

- **Panels**: `src/components/shared/panels/*` are embeddable in pages and kiosk
- **Inputs**: `src/components/shared/inputs/*` provides reusable controls (e.g., MultiSelect)
- **PDF Builder**: `src/components/shared/pdf/PDFBuilderModal.tsx` — **no PDF viewer modal** in this repo

---

## Notes & Conventions

- Use **PascalCase** for React component filenames
- Keep feature logic inside `src/modules/*`, UI/UX in `src/components/*`
- Keep raw data and secrets out of the repo (`data/private/*` is gitignored)
- Use `NEXT_PUBLIC_` prefix for variables needed in client code

---
