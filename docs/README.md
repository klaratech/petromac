# Petromac – Website & Intranet

A Next.js application with a **public website** and a **protected intranet** for tools and internal links (Athena, Kiosk, Success Stories, Catalog).  
Deployed on **Vercel**, with **Vercel Analytics** enabled on the public site.

> This repo used to be `petromac-kiosk`.

---

## 🏗 Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS (brand theme in `tailwind.config.ts`)
- **Typography:** Inter (body), IBM Plex Sans (headings)
- **Data Viz:** D3.js
- **3D:** Three.js, React Three Fiber
- **Python scripts:** pandas, openpyxl (in `scripts/python`)
- **Deployment:** Vercel
- **Analytics:** Vercel Analytics (public pages only)
- **CI/CD:** GitHub Actions

Docs:
- **Theme:** `docs/TAILWIND_THEME.md`
- **Structure:** `REPO_STRUCTURE.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Development:** `docs/DEVELOPMENT.md`
- **Intranet reorg plan:** `docs/INTRANET_MODULES_REORG.md`
- **Prompt for maintainers:** `dev_prompt.md`

---

## 🌐 App Structure

### Public site (`/`)
- **Home** – hero, problem areas, product teaser
- **About** (`/about`)
- **Catalog** (`/catalog`)
- **Case Studies** (`/case-studies`)
- **Contact** (`/contact`)

### Intranet (`/intranet/*`) — **protected by Basic Auth**
Tiles on the intranet homepage:
- **Athena (Prod)** → `https://athena.petromac.co.nz/`
- **Athena (Test)** → `NEXT_PUBLIC_ATHENA_TEST_URL` (optional)
- **Kiosk** → `/intranet/kiosk`
- **Success Stories** → `/intranet/success-stories`
- **Catalog** → `/intranet/catalog`

> Kiosk focuses on dashboard & drilldowns. Success Stories & Catalog are **standalone intranet pages** and can also be embedded inside Kiosk via widgets.

**Security & SEO**
- `/intranet/*` protected by **Basic Auth** (Edge Middleware)
- `X-Robots-Tag: noindex, nofollow` on intranet routes

---

## 📈 Analytics

Public pages integrate **Vercel Analytics**.  
Place `<Analytics />` **once** in `app/layout.tsx`.  
If you want to exclude intranet routes, create an `app/intranet/layout.tsx` **without** `<Analytics />`.

---

## 🚀 Getting Started

### Requirements
- Node.js 20+
- Python 3.11+
- Git

### 1) Clone
```bash
git clone https://github.com/Klaratech/petromac.git
cd petromac
```

### 2) Install dependencies
```bash
npm install
```

### 3) Env vars
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
# Intranet auth (required for /intranet/*)
INTRANET_USER=your-username
INTRANET_PASS=your-password

# Athena test link for intranet tile (optional)
NEXT_PUBLIC_ATHENA_TEST_URL=https://test.athena.example.com/
```

### 4) (Optional) Python venv for data scripts
```bash
cd scripts/python
python -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

### 5) Local dev
```bash
npm run dev
# open http://localhost:3000
```

---

## 📊 Data Pipeline

Convert private Excel into sanitized JSON in `/public/data` for the app to consume.

```
data/private/raw/jobhistory.xlsx  (gitignored)
         │
         ▼
scripts/python/generate_json.py   (local or CI)
         │
         ▼
public/data/operations_data.json  (served via Vercel CDN)
```

Run locally:
```bash
cd scripts/python
source venv/bin/activate
python generate_json.py
```

---

## ♻️ Reuse & Modules

- **Shared Panels:** `src/components/shared/panels/`
  - `SuccessStoriesPanel.tsx`
  - `CatalogPanel.tsx`
- **Shared Inputs:** `src/components/shared/inputs/`
  - `MultiSelect.tsx`
- **Shared PDF:** `src/components/shared/pdf/PDFBuilderModal.tsx` (builder-only; **no viewer modal**)
- **Feature modules:** `src/modules/success-stories/*`, `src/modules/catalog/*`

Success Stories & Catalog:
- Expose a **Page** (full screen) and a **Widget** (embeddable in Kiosk).
- Panels raise `onRequestBuildPdf` and pages call the shared **PDFBuilderModal**.

---

## 🔐 Environment Variables

- `INTRANET_USER`, `INTRANET_PASS` – Basic Auth for intranet
- `NEXT_PUBLIC_ATHENA_TEST_URL` – Test Athena URL for the intranet tile (client-visible)

Set in Vercel Project → **Settings → Environment Variables**.  
Use `NEXT_PUBLIC_` prefix for values needed in client code.

---

## 🧰 Scripts

```bash
npm run dev       # local dev
npm run build     # production build
npm run start     # run production build
npm run lint      # eslint
```

---

## 🧭 Repo Layout (high level)

See `REPO_STRUCTURE.md` for a live snapshot. Highlights:

```
src/
  app/ (routes: public + intranet + kiosk)
  components/
    public/ ...
    shared/
      inputs/ panels/ pdf/
  lib/ (helpers)
  modules/
    catalog/ success-stories/
  data/ constants/ config/ hooks/ types/
scripts/
  python/ (data pipeline tools)
public/  (assets, data, models, videos)
docs/    (architecture, theme, prompts, etc.)
```

---

## 🤝 Contributing

1. `git checkout -b feat/your-change`
2. Make changes + tests
3. Conventional commit message
4. PR to `main`

**License:** Proprietary – Petromac / Klaratech  
**Maintainers:** Klaratech Development Team  
**Last Updated:** 2025-09
