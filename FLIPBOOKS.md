# Flipbooks

This repo treats flipbooks as **versioned asset bundles** generated from source PDFs.
The public site and kiosk both read from the same bundle paths.

## Folder layout

Source inputs (local only, not checked in by default):

- `assets/source-pdfs/`
  - `success-stories.pdf`
  - `catalog.pdf`
- `assets/tags/`
  - `success-stories.csv` (page tags)

Generated outputs (checked in):

- `public/flipbooks/<docKey>/`
  - `source.pdf`
  - `manifest.json`
  - `pages/0001.jpg` (or `.webp`)
  - `thumbs/0001.jpg` (optional)
  - `tags.csv` (success-stories only)

Current doc keys:
- `success-stories`
- `catalog`

## Update workflow (deterministic)

1. Replace source PDFs in `assets/source-pdfs/`.
2. Update tags (success stories only) in `assets/tags/success-stories.csv`.
3. Regenerate flipbooks:

```bash
pnpm run build:flipbooks
```

Or use the local helper:

```bash
python scripts/update_flipbooks.py
```

4. Validate outputs:

```bash
pnpm run validate:flipbooks
pnpm run validate:successstories
```

5. Commit the updated `public/flipbooks/**` outputs (including `source.pdf`).

> Note: `assets/source-pdfs/` is gitignored. The deployable source of truth is
> `public/flipbooks/**`, which must be committed.

## CI automation

The GitHub Action `.github/workflows/pdf-flipbooks-build.yml` runs when files in
`assets/tags/**` or flipbook tooling change. It:

- Generates flipbook assets if source PDFs are present
- Validates manifests/tags
- Commits updated outputs

## Success Stories tags format

`public/flipbooks/success-stories/tags.csv` is the single source of truth for
filtering and page mapping. Required columns:

- `Page`
- `Area`
- `WL Co`
- `Device`

Optional columns:
- `Year`, `Country`, `Category 1`, `Category 2`

Notes:
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
