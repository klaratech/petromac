# Development Workflow

This document describes how to develop, test, and deploy features for the Petromac website and intranet.

## Local Development

### Setup
```bash
git clone https://github.com/Klaratech/petromac.git
cd petromac
npm install
cp .env.example .env.local
npm run dev
```

- Python scripts: set up virtualenv in `scripts/python`, install from `requirements.txt`

### Running Locally
- Public site: http://localhost:3000
- Intranet: http://localhost:3000/intranet (requires Basic Auth)

### Flipbooks
- PDFs in `public/data/` (`product-catalog.pdf`, `successstories.pdf`)
- Generate images manually if needed:
  ```bash
  cd scripts/python
  python pdf_to_images.py
  ```
- Images stored in `public/flipbooks/*`
- View flipbooks:
  - http://localhost:3000/catalog/flipbook
  - http://localhost:3000/success-stories/flipbook

## Code Organization

- `src/app/` → Next.js App Router pages
- `src/components/public/` → Public site components
- `src/components/shared/pdf/Flipbook.tsx` → Shared flipbook component
- `src/app/intranet/` → Intranet pages
- `src/app/intranet/kiosk/` → Kiosk app

## GitHub Actions

- `.github/workflows/data-build.yaml` → Excel → JSON pipeline
- `.github/workflows/pdf-flipbook-build.yml` → Flipbook generation

## Testing

- Run lint/typecheck before commits (`npm run lint`, `npx tsc --noEmit`)
- Husky + lint-staged ensure quality at commit
- Preview builds deployed automatically for PRs

## Notes

- The old PDF viewer/builder modals are **deprecated** and replaced by the Flipbook module.
- Always keep PDF filenames stable (`product-catalog.pdf`, `successstories.pdf`).
- Archive older versions if needed, but pipeline depends on stable names.

