# Flipbooks

This repo treats flipbooks as **versioned asset bundles** generated from source PDFs.
The public site and kiosk both read from the same bundle paths.

## Folder layout

Source inputs (configured via `.env.local`, typically OneDrive paths):

- `FLIPBOOK_CATALOG_SOURCE_PDF` - Catalog PDF
- `FLIPBOOK_SUCCESS_STORIES_SOURCE_PDF` - Success Stories PDF
- `FLIPBOOK_SUCCESS_STORIES_TAGS_XLSX` - Success Stories summary xlsx (sheet: "Kiosk")

Generated outputs (checked in):

- `public/flipbooks/<docKey>/`
  - `source.pdf`
  - `manifest.json`
  - `pages/0001.jpg` (or `.webp`)
  - `thumbs/0001.jpg` (optional)
  - `tags.csv` (success-stories only, auto-generated from xlsx)

Current doc keys:
- `success-stories`
- `catalog`

> Note: Source PDFs live outside the repo (OneDrive). The deployable source of truth is
> `public/flipbooks/**`, which must be committed.

## Prerequisites (local build)

- Python 3.11+
- Poppler (required by `pdf2image`)
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

1. Update source PDFs and/or the "Kiosk" sheet in `Success Stories_Summary.xlsx` (in OneDrive).
2. Ensure `.env.local` paths point to the correct files.
3. Regenerate flipbooks:

```bash
pnpm run data
```

Or build flipbooks only:

```bash
pnpm run build:flipbooks
```

4. Validate outputs:

```bash
pnpm run validate:flipbooks
pnpm run validate:successstories
```

5. Commit the updated `public/flipbooks/**` outputs (including `source.pdf`).

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
so caches refresh (see `KIOSK.md`).

## Troubleshooting

- `ModuleNotFoundError: pdf2image`:
  - Install Python deps: `pip install -r scripts/python/requirements.txt`
  - Ensure you run the build with the same Python/venv where deps are installed.
- `pdf2image` errors about Poppler / `pdftoppm`:
  - Install Poppler and ensure it is on your PATH.
