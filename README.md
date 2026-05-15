# Petromac Website & Intranet

Next.js 16 + React 19 website for Petromac's public site, protected intranet, trade-show kiosk, flipbooks, and supporting FastAPI backend services.

## Stack

- **Frontend**: Next.js 16 App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4 with Petromac brand tokens
- **Typography**: Inter for body text, IBM Plex Sans for headings
- **Maps and data visualization**: D3.js with static public data artifacts
- **3D visualization**: Three.js and React Three Fiber
- **Backend**: FastAPI for contact email, PDF generation, email logs/config, and data passthrough endpoints
- **Data pipeline**: Python 3.11+ and Node scripts for operations JSON and flipbook generation
- **Deployment**: Hetzner (`klaratech-1`) through Cloudflare Tunnel, container images on GHCR
- **CI/CD**: GitHub Actions for builds, deploys, data, and flipbooks
- **PWA**: Kiosk-scoped service worker only

## Routes

### Public Site

- `/` - Homepage
- `/about` - Company overview
- `/about/patents` - Patents
- `/about/publications` - Publications
- `/team` - Team
- `/catalog` - Product catalog flipbook
- `/track-record` - Interactive global deployment map
- `/success-stories/flipbook` - Success Stories flipbook with filters
- `/simulation` - Athena planning and simulation page
- `/contact` - Contact form
- `/privacy` and `/terms` - Legal pages

### Intranet and Kiosk

- `/intranet` - Staff entry point with Athena and kiosk links
- `/intranet/email-log` - Staff email log/config view
- `/intranet/kiosk` - Trade-show kiosk shell
- `/intranet/kiosk/dashboard` - Operations dashboard
- `/intranet/kiosk/productlines` - Product line explorer
- `/intranet/kiosk/datacheck` - Data validation view
- `/intranet/kiosk/successstories` - Kiosk success stories flipbook
- `/intranet/kiosk/3d-viewer` and `/intranet/kiosk/lane` - Kiosk product/experience views

## Local Development

```bash
pnpm install
cp .env.example .env.local
cp .env.example .env.dev
pnpm run dev
```

- `pnpm run dev` serves the frontend at http://localhost:3000.
- `docker compose up --build` runs the frontend and backend together.
- `.env.local` is for local Next.js development.
- `.env.dev` is loaded by Docker Compose and the data pipeline.

## Common Scripts

- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run data` - rebuild operations JSON and flipbook assets from env-configured source paths
- `pnpm run validate:flipbooks`
- `pnpm run validate:successstories`
- `pnpm run test:e2e` - requires a local server

## Data and Flipbooks

- Runtime map data is published under `public/data/` and fetched directly from `/data/*`.
- Content updates go through the `sources/` drop zone — drop the job-history `.xlsx`, catalog `.pdf`, or success-stories `.pdf` + tags `.xlsx` into the matching `sources/` subfolder (any filename) and run `pnpm run data`. No env vars needed. See [sources/README.md](sources/README.md).
- Generated flipbook bundles live under `public/flipbooks/<docKey>/` (pages, `source.pdf`, and a compressed `email.pdf`).
- Product catalog is served at `/catalog`.
- Success Stories is served at `/success-stories/flipbook`.

## Services

- The browser calls `NEXT_PUBLIC_API_BASE_URL` for backend routes when needed.
- Server-side frontend code uses `API_BASE_URL`.
- Canonical URLs, Open Graph metadata, robots, and sitemap use `NEXT_PUBLIC_SITE_URL` first, with `NEXT_PUBLIC_BASE_URL` kept as a legacy alias.
- Contact form and PDF email delivery are handled by the FastAPI backend under `/api/*`.
- Microsoft Entra sign-in routes live in the Next.js app under `/auth/microsoft/*`.

## Production Deploy

- Server: `klaratech-1` (Hetzner)
- App folder: `/root/apps/petromac/`
- Frontend: `ghcr.io/klaratech/petromac-frontend`, host port `3015` to container `3000`
- Backend: `ghcr.io/klaratech/petromac-backend`, host port `8012` to container `8000`
- Public hostname: `petromac.klaratech.it`
- Production env files: `/root/apps/petromac/.env-frontend` and `/root/apps/petromac/.env-backend`

See [DEPLOY.md](DEPLOY.md) for the full pipeline and rollback flow.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture overview
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - Development workflow and data conventions
- [docs/REPO_STRUCTURE.md](docs/REPO_STRUCTURE.md) - Repository structure
- [docs/ADMIN.md](docs/ADMIN.md) - Recurring content updates
- [docs/FLIPBOOKS.md](docs/FLIPBOOKS.md) - Flipbook build pipeline
- [docs/KIOSK.md](docs/KIOSK.md) - Kiosk operations and offline caching
- [docs/TAILWIND_THEME.md](docs/TAILWIND_THEME.md) - Brand theme notes
- [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md) - Email/SMTP configuration
- [docs/MS365_ENTRA_KIOSK_SETUP.md](docs/MS365_ENTRA_KIOSK_SETUP.md) - Microsoft staff sign-in setup

## Security Notes

- Secrets are configured through environment variables only.
- The contact form uses honeypot, timing, length validation, escaping, origin checks, and backend rate limiting.
- PDF/email endpoints use recipient allowlists and backend rate limiting.
- Security headers are configured in `next.config.ts`.
- The kiosk service worker is scoped to `/intranet/kiosk/`; the public site does not register a service worker.
