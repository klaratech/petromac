# Catalog & Success Stories — Build Pipeline

How the two documents are built and updated. Rationale: [DECISIONS.md](DECISIONS.md).

## Update workflow

1. Drop the new file(s) into the drop zone (any filename):
   - catalog PDF → `sources/catalog/`
   - success-stories PDF **and** its tags `.xlsx` ("Kiosk" sheet) → `sources/success-stories/`
2. `pnpm run data:flipbooks` (or `pnpm run data` for everything)
3. **If the success-stories PDF or its tags changed, also run
   `python3 scripts/python/build_case_studies.py`.** This is NOT part of
   `pnpm run data` — the public `/success-stories` pages (URL renamed from /case-studies, Aug 2026) are generated from
   `source.pdf` + `tags.csv`, so skipping it leaves 46 live pages describing the
   previous edition while the flipbook images show the new one. Check the
   regenerated `case-studies.json` diff before committing: slugs are FROZEN
   (21 carry WordPress-era 301s), and a new edition needs a `NEW_SLUG` entry in
   the script rather than a silently renamed URL.
4. Commit the changes under `public/` (plus `case-studies.json`) and push. A
   push deploys **TEST** only; production needs the "Promote to Production"
   workflow — see [../DEPLOY.md](../DEPLOY.md).

The pipeline picks the newest file per folder, builds, validates, re-syncs the
kiosk offline-asset list, and archives inputs to `sources/_archive/`.

## What gets built

**Catalog** → `public/flipbooks/catalog/`

- `petromac-product-catalog.pdf` — compressed to <4 MB (Ghostscript) +
  linearized (qpdf). This ONE file serves the Download button and email
  attachments. Descriptive filename on purpose: it's what users see when
  they download. (The browsing surface at `/catalog` is the HTML catalog,
  built separately — `pnpm run data:catalog`, see [ADMIN.md](ADMIN.md) §2b.
  The pdf.js viewer and its `search-index.json` were retired Jul 2026.)

**Success stories** → `public/flipbooks/success-stories/`

- `pages/NNNN.webp` — page images (WebP q80), rendered at 150 DPI
- `manifest.json` — page count/format (imported at build time by the app)
- `tags.csv` — filter data, **generated** from the xlsx "Kiosk" sheet. It is
  committed, so it is tempting to hand-edit — don't: the next flipbook build
  overwrites it from the xlsx. Category spellings feed the public case-studies
  badges and filters, so a typo there is user-visible. Fix the **xlsx** (in
  `sources/success-stories/`, which is gitignored and lives outside the repo)
  and rebuild. `filters.ts`'s `normalizeCategory()` is the safety net for
  whitespace slips that get through anyway.
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
