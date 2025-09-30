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
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Intranet credentials
INTRANET_USER=your-username
INTRANET_PASS=your-password

# Optional Athena test link for intranet tile
NEXT_PUBLIC_ATHENA_TEST_URL=https://test.athena.example.com/

# SMTP Configuration for Success Stories email feature
# Use App Password for Gmail/Outlook (not regular password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
CONTACT_FROM_EMAIL=your-email@gmail.com
CONTACT_TO_EMAIL=recipient@example.com
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

## Success Stories Module

The Success Stories module provides filtering, PDF preview, download, and email functionality.

### Features

- **Filters Panel**: Multi-select filters for area, country, WL Co, categories, and devices
- **PDF Viewer**: Live preview of base or filtered PDF
- **Preview**: Generate filtered PDF and view inline
- **Download**: Download filtered PDF to local machine
- **Email**: Send filtered PDF as email attachment

### Routes

- `/intranet/success-stories` — Full page with filters and viewer
- `/intranet/kiosk/successstories-embed` — Embedded widget for kiosk displays

### Testing Locally

1. Ensure `.env.local` has SMTP credentials configured
2. Start dev server: `npm run dev`
3. Navigate to `/intranet/success-stories`
4. Apply filters and test:
   - **Preview** — Generates filtered PDF and displays inline
   - **Download** — Downloads filtered PDF
   - **Email** — Sends PDF to specified email (requires valid SMTP config)

### API Endpoints

- `POST /api/pdf/success-stories` — Generate filtered PDF
  - Body: `{ filters, mode: 'preview' | 'download' }`
  - Returns: PDF blob or inline response
  
- `POST /api/email/send` — Send email with PDF attachment
  - Body: `{ to, subject, filters }`
  - Requires SMTP configuration in environment variables

### Data Source

- Filter options: `src/constants/successStoriesOptions.ts` (static, generated)
- Page mappings: `public/successstories-summary.csv` (CSV with filters → page numbers)
- Base PDF: `public/successstories.pdf`

### SMTP Setup

For Gmail:
1. Enable 2-factor authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password in `SMTP_PASS` (not your regular password)

For Outlook:
1. Enable 2-factor authentication
2. Generate App Password in account settings
3. Use `smtp-mail.outlook.com` with port 587

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
