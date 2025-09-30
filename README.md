# Petromac – Website & Intranet

A Next.js application with a **public website** and a **protected intranet** for tools and internal links (Athena, Kiosk, etc.).  
Deployed on **Vercel**, with optional **Vercel Analytics** enabled for the public-facing site.

> **Renamed:** This repo was formerly `petromac-kiosk`.  

---

## 🏗 Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS (brand theme in `tailwind.config.ts`)
- **Typography:** Inter (body), IBM Plex Sans (headings)
- **Data Viz:** D3.js
- **3D:** Three.js, React Three Fiber (where needed)
- **Python scripts:** pandas, openpyxl (run locally or via GitHub Actions)
- **Deployment:** Vercel
- **Analytics:** Vercel Analytics (automatic on public site)
- **CI/CD:** GitHub Actions

Docs:
- **Theme:** `docs/TAILWIND_THEME.md`
- **Prompts/Playbooks:** `docs/DEV_PROMPT.md`
- **Backlog:** `docs/TODO.md`

---

## 🌐 App Structure

### Public site (`/`)
- **Home** – hero, problem areas, product teaser (replica of current site)
- **About** (`/about`) – company info (stub)
- **Catalog** (`/catalog`) – product list (stub)
- **Case Studies** (`/case-studies`) – success stories (stub)
- **Contact** (`/contact`) – simple contact entry (stub)

### Intranet (`/intranet/*`) — **protected**
- **Intranet Home** (`/intranet`) – tiles:
  - **Athena** – external portal link
  - **Kiosk** – internal kiosk app routes
- **Kiosk** (`/intranet/kiosk/*`) – ops dashboard, product lines, success stories, data check, etc.

**Security & SEO**
- `/intranet/*` protected by **Basic Auth** (Edge Middleware)
- `X-Robots-Tag: noindex, nofollow` on intranet routes

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

# Athena link for intranet tile (optional; can hardcode instead)
NEXT_PUBLIC_ATHENA_URL=https://athena.petromac.co.nz/
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

**Goal:** Convert a private Excel into sanitized JSON served from `/public/data` for the site to consume.

```
data/private/raw/jobhistory.xlsx   (gitignored)
           │
           ▼  (local or GitHub Actions)
scripts/python/generate_json.py
           │
           ▼
public/data/operations_data.json   (CDN served by Vercel)
```

Run locally:
```bash
cd scripts/python
source venv/bin/activate
python generate_json.py
```

GitHub Actions (manual or scheduled):
- Workflow: `.github/workflows/data-build.yaml`
- Commits the JSON to `public/data/`

---

## 🌈 Brand Theme & UX

- **Colors:** Brand blue `#1E4A9A`, black `#1D1D1B`, grey `#575756`, white `#FFFFFF`  
- **Typography:** IBM Plex Sans (headings via `font-heading`), Inter (body)  
- **Components:** Public site components live in `components/public/*`  
- See **`docs/TAILWIND_THEME.md`** for usage and tokens.

---

## 📈 Analytics

The public site integrates **Vercel Analytics** for performance and usage metrics.

Install:
```bash
npm i @vercel/analytics
```

Add once in `app/layout.tsx`:
```tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Exclude intranet:** create `app/intranet/layout.tsx` **without** `<Analytics />`, so only public routes are tracked.

---

## 🔐 Environment Variables

- `INTRANET_USER`, `INTRANET_PASS` – Basic Auth for intranet
- `NEXT_PUBLIC_ATHENA_URL` – URL for the Athena tile (client-visible)

Set in Vercel Project → **Settings → Environment Variables**.  
Use the `NEXT_PUBLIC_` prefix for values needed in client components.

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

```
app/
  page.tsx                   # public home
  about/  catalog/  case-studies/  contact/
  intranet/
    page.tsx                 # intranet home (Athena + Kiosk)
    kiosk/                   # all kiosk routes & APIs
components/
  public/                    # public-facing UI components
public/
  data/                      # sanitized JSON (CDN)
  images/                    # assets
scripts/
  python/                    # data pipeline scripts
docs/
  DEV_PROMPT.md
  TAILWIND_THEME.md
  TODO.md
middleware.ts                # basic auth + noindex for intranet
```

---

## 🔧 Troubleshooting

**Can’t access /intranet**  
- Ensure `INTRANET_USER`/`INTRANET_PASS` are set; 401/403 usually means missing/incorrect creds.

**Build fails**  
- Clear cache: `rm -rf .next`  
- Reinstall: `rm -rf node_modules && npm install`  
- Type checks: `npm run lint`

**Vercel preview not updating**  
- Check build logs and linked repo after the rename; re-link if needed.

---

## 🤝 Contributing

1. `git checkout -b feat/your-change`
2. Make changes + tests
3. Conventional commit message
4. PR to `main`

**License:** Proprietary – Petromac / Klaratech  
**Maintainers:** Klaratech Development Team  
**Last Updated:** 2025-09
