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

## Contact Form

The contact form (`/contact`) uses Nodemailer with SMTP for email delivery.

### Setup

Configure in `.env.local`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
CONTACT_FROM_EMAIL=your-email@gmail.com
CONTACT_TO_EMAIL=recipient@example.com
```

### Features

- Input validation with Zod
- Anti-spam protection (honeypot + timing checks)
- Offline support via Background Sync
- Server action (`submitContact`) handles email sending

### Testing

1. Fill out contact form at `/contact`
2. Check email inbox at `CONTACT_TO_EMAIL`
3. For offline testing, see PWA Background Sync section below

---

## PWA Background Sync

The application uses Workbox Background Sync to queue email and PDF requests when offline.

### How It Works

When offline or network fails:
1. POST requests to `/api/email/send` and `/api/pdf/success-stories` are intercepted
2. Service worker queues the request in IndexedDB
3. When connectivity returns, requests are automatically replayed in order
4. Queued requests expire after 24 hours

### Testing Offline Queue

1. Build production version:
   ```bash
   npm run build
   npm run start
   ```

2. Open browser DevTools:
   - **Application** tab → **Service Workers** → Confirm "activated and running"
   - **Network** tab → Set to **Offline** mode

3. Test queueing:
   - Try sending email from contact form → Should show "queued" message
   - Try emailing PDF from Success Stories → Should queue request
   - Try downloading PDF → Should queue request

4. Check IndexedDB:
   - **Application** tab → **IndexedDB** → Look for `workbox-background-sync`
   - Should see `queue-email` and `queue-pdf` stores with pending requests

5. Test replay:
   - **Network** tab → Set to **Online**
   - Watch **Console** for sync events
   - Check IndexedDB → Queues should drain to zero
   - Verify emails/PDFs were sent/generated

### Important Notes

- Background Sync only works in **production builds** (`NODE_ENV=production`)
- Service worker is disabled in development mode
- To disable PWA entirely, set `PWA=off` environment variable
- Only non-sensitive payloads should be queued (no credentials/PII)

### Troubleshooting

- **SW not activating?** Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5) or clear site data
- **Queue not replaying?** Check browser console for errors
- **IndexedDB issues?** Clear application storage and rebuild
- **Build errors?** Ensure `service-worker.js` is in project root

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
