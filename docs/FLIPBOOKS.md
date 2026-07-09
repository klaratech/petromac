# Catalog & Success Stories — Build Pipeline

How the two documents are built and updated. Rationale: [DECISIONS.md](DECISIONS.md).

## Update workflow

1. Drop the new file(s) into the drop zone (any filename):
   - catalog PDF → `sources/catalog/`
   - success-stories PDF **and** its tags `.xlsx` ("Kiosk" sheet) → `sources/success-stories/`
2. `pnpm run data:flipbooks` (or `pnpm run data` for everything)
3. Commit the changes under `public/` and push. Deploy is automatic.

The pipeline picks the newest file per folder, builds, validates, re-syncs the
kiosk offline-asset list, and archives inputs to `sources/_archive/`.

## What gets built

**Catalog** → `public/flipbooks/catalog/`

- `petromac-product-catalog.pdf` — compressed to <4 MB (Ghostscript) +
  linearized (qpdf). This ONE file serves the pdf.js viewer, the Download
  button, and email. Descriptive filename on purpose: it's what users see
  when they download.
- `search-index.json` — per-page text for the viewer's search box.

**Success stories** → `public/flipbooks/success-stories/`

- `pages/NNNN.webp` — page images (WebP q80), rendered at 150 DPI
- `manifest.json` — page count/format (imported at build time by the app)
- `tags.csv` — filter data, generated from the xlsx "Kiosk" sheet
- `source.pdf` (full-res master) + `email.pdf` (compressed, for the email feature)

## Prerequisites (local build)

- Python 3.11+ with deps from `scripts/python/requirements.txt`
- Poppler (`brew install poppler`) — page rendering
- Ghostscript (`brew install ghostscript`) — PDF compression
- qpdf (`brew install qpdf`) — linearization

The build warns and degrades gracefully if gs/qpdf are missing.

## Validation & troubleshooting

- `pnpm run validate:flipbooks` — artifacts present and consistent
- `pnpm run validate:successstories` — tags.csv ↔ manifest page mapping
- Tags xlsx must have a "Kiosk" sheet with columns: Year, Area, Country,
  WL Co, Category 1, Category 2, Kiosk v1, Page. Rows without a valid Page
  number are dropped (summary/formula rows are fine to leave in).
- If a success-stories PDF is updated WITHOUT a new tags xlsx, filters run on
  the old tags — pages may mismatch. Always drop both together.
- App reads manifests at build time: content changes appear after the next
  commit + deploy, not on a CDN refresh.
