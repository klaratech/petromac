# Development

This guide covers setup, environment, workflows, and scripts used in this repo.

---

## Requirements
- Node.js 20+
- Python 3.11+
- Git

---

## Setup

```bash
git clone https://github.com/Klaratech/petromac.git
cd petromac
npm install
cp .env.example .env.local
```

Edit `.env.local`:
```env
INTRANET_USER=your-username
INTRANET_PASS=your-password
# Optional Athena test link for intranet tile
NEXT_PUBLIC_ATHENA_TEST_URL=https://test.athena.example.com/
```

(Optional) Python virtualenv:
```bash
cd scripts/python
python -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

Run dev server:
```bash
npm run dev
# open http://localhost:3000
```

---

## Project Layout (essentials)

- `src/app` — Next.js routes (public + intranet + kiosk)
- `src/components/public` — public site components
- `src/components/shared` — **reusable inputs, panels, PDF builder**
- `src/modules/{feature}` — feature-specific containers, hooks, services, types
- `src/lib` — utilities (e.g., `mapUtils`, `dataValidation`, `pdf` helpers)
- `public/` — assets, generated data, models, videos
- `scripts/python/` — Python tools for data processing

See `REPO_STRUCTURE.md` for the live snapshot.

---

## PDF Builder (no viewer)

- Use `src/components/shared/pdf/PDFBuilderModal.tsx` to **build** PDFs.  
- Pass an async `onBuild(options)` that returns a **public URL** to the generated PDF.  
- On success, provide a **Download** / **Open in new tab** link.

> There is **no PDF viewer modal** in this repo.

---

## Data Pipeline (Python)

Convert Excel → sanitized JSON for the app.

Run locally:
```bash
cd scripts/python
source venv/bin/activate
python generate_json.py
```

Outputs:
- `public/data/operations_data.json` (consumed by D3 maps & other UI)

Troubleshooting:
- See `scripts/python/README.md`
- Check generated `scripts/generate_json.log`

---

## Vercel & Analytics

- Deploy via Vercel (Next.js preset).  
- **Vercel Analytics** on public pages:
  - Add once in `app/layout.tsx`:
    ```tsx
    import { Analytics } from "@vercel/analytics/react";
    // ...
    <Analytics />
    ```
  - To exclude intranet, do **not** include `<Analytics />` in `app/intranet/layout.tsx`.

---

## Scripts

```bash
npm run dev       # local dev
npm run build     # production build
npm run start     # run production build
npm run lint      # eslint
```

---

## Conventions

- React components use **PascalCase** filenames
- No raw brand hex in components — use Tailwind tokens (see `docs/TAILWIND_THEME.md`)
- Use `NEXT_PUBLIC_` prefix for envs needed in client components
- Conventional commits:
  - `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`, `refactor: ...`, `style: ...`, `test: ...`

---
