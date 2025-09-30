# Architecture

This doc explains how the Petromac **public site**, **intranet**, and **kiosk** fit together, and how we reuse modules (Success Stories, Catalog).

---

## High-Level View

```
+-----------------------+        +----------------------+
|  Public Website (/)   |        |  Intranet (/intranet)|  Basic Auth + noindex
|  Next.js App Router   |        |  Tiles:              |---------------------> Athena (external)
|  Vercel + Analytics   |        |  - Athena (Prod/Test)|
+-----------+-----------+        |  - Kiosk             |-----> /intranet/kiosk
            |                    |  - Success Stories   |-----> /intranet/success-stories
            |                    |  - Catalog           |-----> /intranet/catalog
            v                    +----------------------+
     Shared Components
      (Panels, Inputs, PDF Builder)
```

- **Public site** is a marketing-facing surface.  
- **Intranet** is protected and hosts internal tools and links.  
- **Kiosk** is an internal app focused on dashboards & drilldowns.
- **Modules (Success Stories, Catalog)** can render as full pages or embedded panels in Kiosk.

---

## Reuse Strategy

- **Shared panels** live in `src/components/shared/panels/` and contain UI + state wiring for filters and lists.
- **Feature modules** live in `src/modules/*` where we group containers (page, widget), hooks, services, and types.
- **PDF builder** is a **single shared modal** in `src/components/shared/pdf/PDFBuilderModal.tsx` that receives an `onBuild` callback and exposes the built PDF URL for download.

This separation allows:
- Pages to **compose** panels + builder modal.
- Kiosk to **embed** widgets/panels without duplicating logic.
- Services to stay centralized per feature (data fetching, mapping).

---

## Data Flow

**Operations data**:
```
Private Excel (gitignored) → scripts/python/generate_json.py → public/data/operations_data.json → consumed by app (e.g., D3 map)
```

**Success Stories & Catalog PDFs**:
- Built via the shared **PDFBuilderModal** and server-side logic (API or scripts).
- The modal returns a **public URL** for the generated PDF (e.g., under `public/` or a CDN path).

> There is **no PDF viewer modal** in this repo. We only build and download/open PDFs.

---

## Security

- **Basic Auth** for all `/intranet/*` routes via `middleware.ts`
- **SEO**: `X-Robots-Tag: noindex, nofollow` for intranet
- **Data privacy**: raw inputs in `data/private/*` (gitignored), sanitized outputs in `public/data/*`

---

## Environments

- **Prod** on Vercel (custom domain)
- **Preview** deploys per branch (helpful for reviews)

**Env vars**:
- `INTRANET_USER`, `INTRANET_PASS` (Edge middleware)
- `NEXT_PUBLIC_ATHENA_TEST_URL` (optional tile link)

---

## Analytics

- **Vercel Analytics** on public pages.  
- Exclude intranet by not rendering `<Analytics />` in `app/intranet/layout.tsx` (keep it only in root `app/layout.tsx` if needed).

---
