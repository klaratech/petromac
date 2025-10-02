# Architecture

This doc explains how the Petromac **public site**, **intranet**, and **kiosk** fit together, and how we reuse modules (Success Stories, Catalog).

---

## High-Level View

```
+-----------------------+        +----------------------+
|  Public Website (/)   |        |  Intranet (/intranet)|  Basic Auth + noindex
|  Next.js App Router   |        |  Tiles:              |---------------------> Athena (external)
|  Vercel + Analytics   |        |  - Athena (Prod/Test)|
+-----------+-----------+        |  - Kiosk             |-----> /intranet/kiosk
            |                    |  - Success Stories   |-----> /intranet/success-stories
            |                    |  - Catalog           |-----> /intranet/catalog
            v                    +----------------------+
     Shared Components
      (Panels, Inputs, PDF Builder)
```

- **Public site** is a marketing-facing surface.  
- **Intranet** is protected and hosts internal tools and links.  
- **Kiosk** is an internal app focused on dashboards & drilldowns.
- **Modules (Success Stories, Catalog)** can render as full pages or embedded panels in Kiosk.

---

## Reuse Strategy

- **Shared panels** live in `src/components/shared/panels/` and contain UI + state wiring for filters and lists.
- **Feature modules** live in `src/modules/*` where we group containers (page, widget), hooks, services, and types.
- **PDF builder** is a **single shared modal** in `src/components/shared/pdf/PDFBuilderModal.tsx` that receives an `onBuild` callback and exposes the built PDF URL for download.

This separation allows:
- Pages to **compose** panels + builder modal.
- Kiosk to **embed** widgets/panels without duplicating logic.
- Services to stay centralized per feature (data fetching, mapping).

---

## Data Flow

**Operations data**:
```
Private Excel (gitignored) → scripts/python/generate_json.py → public/data/operations_data.json → consumed by app (e.g., D3 map)
```

**Success Stories & Catalog PDFs**:
- Success Stories uses a **widget/modal** with filters, PDF viewer, and action buttons
- PDF generation handled by Vercel serverless functions (`/api/pdf/success-stories`)
- Email delivery via Nodemailer (`/api/email/send`)
- Filters map to specific pages using `public/successstories-summary.csv`

---

## Security

- **Basic Auth** for all `/intranet/*` routes via `middleware.ts`
- **SEO**: `X-Robots-Tag: noindex, nofollow` for intranet
- **Data privacy**: raw inputs in `data/private/*` (gitignored), sanitized outputs in `public/data/*`

---

## Global Components

### Footer

A global footer component (`src/components/shared/Footer.tsx`) is rendered on all pages (public, intranet, and legal pages) via the root layout and intranet layout. The footer includes:
- Petromac branding and description
- Links to Privacy Policy and Terms of Use
- Copyright notice with auto-updating year

### Contact Form

The contact page (`/contact`) features a full contact form with:
- Input fields: Full Name, Email, Message
- Anti-spam protection using honeypot technique and timing checks
- Server-side validation using Zod
- Email delivery via Nodemailer with SMTP
- Success/error state handling
- Offline support via Background Sync (queues when offline, sends when back online)

## Environments

- **Prod** on Vercel (custom domain)
- **Preview** deploys per branch (helpful for reviews)

**Env vars**:
- `INTRANET_USER`, `INTRANET_PASS` (Edge middleware)
- `NEXT_PUBLIC_BASE_URL` (base URL for API calls)
- `NEXT_PUBLIC_ATHENA_TEST_URL` (optional tile link)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (SMTP configuration for email)
- `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` (contact form & success stories email)
- Optional: `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`, `HCAPTCHA_SECRET` (if using hCaptcha)

---

## Success Stories Module Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User Interface (SuccessStoriesWidget)                       │
│ ┌─────────────────────┐  ┌───────────────────────────────┐ │
│ │ Filters Panel       │  │ PDF Viewer Pane               │ │
│ │ - Area              │  │ - Base PDF or Preview         │ │
│ │ - Country           │  │ - Embedded viewer             │ │
│ │ - WL Co             │  │ - Loading states              │ │
│ │ - Categories        │  └───────────────────────────────┘ │
│ │ - Device            │                                      │
│ │                     │  ┌───────────────────────────────┐ │
│ │ [Preview Button]    │  │ Action Buttons                │ │
│ │ [Download Button]   │  │ - Preview: Generate preview   │ │
│ │ [Email Button]      │  │ - Download: Get filtered PDF  │ │
│ └─────────────────────┘  │ - Email: Send PDF via email   │ │
│                          └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Client-Side Services                                        │
│ SuccessStoriesService.loadData() → Parse CSV                │
│ SuccessStoriesService.filterData() → Apply filters          │
│ SuccessStoriesService.getAvailableOptions() → Compute       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Serverless API Routes (Vercel Functions)                    │
│                                                              │
│ POST /api/pdf/success-stories                               │
│ 1. Load CSV data (server-side)                              │
│ 2. Filter data based on filters                             │
│ 3. Extract page numbers                                     │
│ 4. Load base PDF with pdf-lib                               │
│ 5. Create new PDF with filtered pages                       │
│ 6. Return as inline (preview) or attachment (download)      │
│                                                              │
│ POST /api/email/send                                        │
│ 1. Generate filtered PDF via internal API call              │
│ 2. Create Nodemailer transport                              │
│ 3. Build email with PDF attachment                          │
│ 4. Send via SMTP                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Data Sources                                                │
│ - public/successstories-summary.csv (filters → pages)       │
│ - public/successstories.pdf (base PDF document)             │
│ - src/constants/successStoriesOptions.ts (static options)   │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Modular Components**: Filters, viewer, and actions are separate components for reusability
2. **Server-Side PDF Generation**: Uses `pdf-lib` in serverless functions to avoid client bundle bloat
3. **CSV-Driven Filtering**: Page mappings stored in CSV for easy updates without code changes
4. **Dual Data Loading**: Client uses fetch(), server uses fs for same CSV file
5. **Email Integration**: Nodemailer with SMTP for flexible email provider support

---

## PWA Background Sync

The application implements **Workbox Background Sync** to queue email and PDF requests when offline, automatically replaying them when connectivity returns.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ User Action (Offline)                                   │
│ - Click Email button                                    │
│ - Click Build PDF (download)                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Service Worker (service-worker.js)                      │
│ - Intercepts POST requests                              │
│ - Detects network failure                               │
│ - Queues request in IndexedDB                           │
│   * queue-email: /api/email/send                        │
│   * queue-pdf: /api/pdf/success-stories                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ IndexedDB Storage                                       │
│ - Stores queued requests with 24h retention             │
│ - Maintains request order                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ (when online)
┌─────────────────────────────────────────────────────────┐
│ Background Sync                                         │
│ - Browser detects connectivity                          │
│ - Service worker replays queued requests                │
│ - Removes successful requests from queue                │
└─────────────────────────────────────────────────────────┘
```

### Key Features

1. **Automatic Queueing**: POSTs to `/api/email/send` and `/api/pdf/success-stories` are automatically queued when offline
2. **Transparent Replay**: Requests are replayed in order when connectivity returns
3. **No Code Changes**: Existing API calls work without modification
4. **User Feedback**: UI should provide optimistic feedback ("Queued, will send when online")
5. **24-Hour Retention**: Queued requests expire after 24 hours

### Configuration

The service worker is configured in `next.config.ts`:
- `swSrc: 'service-worker.js'` - Custom service worker with Background Sync
- Only enabled in production builds (`NODE_ENV === 'production'` and `PWA !== 'off'`)

### Testing

1. Build production: `npm run build && npm run start`
2. Open DevTools → Application → Service Workers (confirm active)
3. Set Network tab to **Offline**
4. Try Email/PDF actions → UI shows "Queued" message
5. Toggle back **Online** → Service worker replays requests
6. Check IndexedDB → Queues should drain to zero

### Security Considerations

- Only queue non-PII payloads
- For sensitive data, consider server-side outbox pattern instead
- Email/PDF requests are safe as they don't contain user credentials

---

## Analytics

- **Vercel Analytics** on public pages.  
- Exclude intranet by not rendering `<Analytics />` in `app/intranet/layout.tsx` (keep it only in root `app/layout.tsx` if needed).

---
