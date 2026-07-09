# Flipbooks

This repo treats flipbooks as **versioned asset bundles** generated from source PDFs.
The public site and kiosk both read from the same bundle paths.

## Folder layout

Source inputs — dropped into the `sources/` drop zone (any filename):

- `sources/catalog/` - Catalog PDF (served via the pdf.js viewer, not an image flipbook)
- `sources/success-stories/` - Success Stories PDF + the summary xlsx (sheet: "Kiosk")

Generated outputs (checked in):

- `public/flipbooks/<docKey>/`
  - `source.pdf`
  - `email.pdf` (success-stories only — compressed copy for the Email-PDF
    feature. The catalog needs no separate copy: its `source.pdf` is already
    compressed to <4 MB on ingest and is used for viewer/download/email alike.)
  - `manifest.json`
  - `pages/0001.webp` (WebP q80 is the pipeline default since Jul 2026; `.jpg` supported for legacy bundles)
  - `thumbs/0001.webp` (optional)
  - `tags.csv` (success-stories only, auto-generated from xlsx)

Current doc keys:

- `success-stories`
- `catalog`

> Note: Source PDFs dropped into `sources/` are gitignored and get archived to
> `sources/_archive/` after a build. The deployable source of truth is
> `public/flipbooks/**`, which must be committed.

## Prerequisites (local build)

- Python 3.11+
- Poppler (required by `pdf2image`)
- Ghostscript (`brew install ghostscript`) — compresses the catalog PDF and
  generates the success-stories `email.pdf`; the
  build warns and skips it if missing
- Python deps from `scripts/python/requirements.txt`

Example setup (macOS/Linux):

```bash
cd scripts/python
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# macOS
brew install poppler
```

## Update workflow (deterministic)

1. Drop the new files into the drop zone — any filename works:
   - catalog PDF → `sources/catalog/`
   - success-stories PDF + the "Kiosk"-sheet summary `.xlsx` → `sources/success-stories/`
2. Regenerate flipbooks (builds whichever has a new PDF, validates the bundles,
   and archives the inputs to `sources/_archive/`):

```bash
pnpm run data:flipbooks
```

`pnpm run data` does flipbooks and operations together. Both variants also
re-sync the flipbook page entries in `public/data/kiosk-offline-assets.json`
from the manifests, so the kiosk prime list follows page-count/format changes
automatically.

Note: manifests are imported into the JS bundle at build time
(`src/features/flipbooks/manifests.ts`), so a regenerated bundle shows up
after the next commit + deploy — there is no runtime manifest fetch.

3. Commit the updated `public/flipbooks/**` outputs (including `source.pdf`).

> There is no watch script in this repo; flipbooks are generated manually via the
> commands above.

## CI automation

The GitHub Action `.github/workflows/pdf-flipbooks-build.yml` runs when flipbook
tooling changes. It validates manifests/tags and commits updated outputs.

The unified data pipeline `.github/workflows/data-build.yaml` also rebuilds flipbooks
as part of the weekly scheduled run.

## Success Stories tags format

`public/flipbooks/success-stories/tags.csv` is auto-generated from the xlsx and serves
as the single source of truth for filtering and page mapping. Required columns:

- `Page`
- `Area`
- `WL Co`
- `Device`

Optional columns:

- `Year`, `Country`, `Category 1`, `Category 2`

Notes:

- The xlsx "Kiosk" sheet column `Kiosk v1` is mapped to the CSV `Device` column.
- Multi-value cells may be comma-separated.
- Normalization (Area/Company/Technology) happens in
  `src/features/success-stories/services/successStories.shared.ts`.

## Kiosk offline expectations

The kiosk service worker caches `/flipbooks/**` via runtime cache.
To validate offline readiness:

1. Visit kiosk route (e.g., `/intranet/kiosk/successstories`).
2. Browse several flipbook pages to warm the cache.
3. Toggle DevTools → Network → Offline and refresh.

If you change flipbook assets, bump the kiosk SW version in `public/kiosk-sw.js`
so caches refresh (see [KIOSK.md](KIOSK.md)).

## Troubleshooting

- `ModuleNotFoundError: pdf2image`:
  - Install Python deps: `pip install -r scripts/python/requirements.txt`
  - Ensure you run the build with the same Python/venv where deps are installed.
- `pdf2image` errors about Poppler / `pdftoppm`:
  - Install Poppler and ensure it is on your PATH.
