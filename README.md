# Petromac Website & Intranet

Next.js 16 + React 19 site: public marketing site, staff intranet, trade-show
kiosk, and a FastAPI backend for email/PDF endpoints. Deployed on Hetzner
(`klaratech-1`) behind a Cloudflare Tunnel at **petromac.klaratech.it**.

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm run dev          # http://localhost:3000
```

| Command                            | What                                                 |
| ---------------------------------- | ---------------------------------------------------- |
| `pnpm run dev` / `build` / `start` | develop / production build / serve                   |
| `pnpm run lint` / `typecheck`      | checks (also run by the pre-push hook, with `build`) |
| `pnpm run test:e2e`                | Playwright smoke tests (needs a local server)        |
| `pnpm run data`                    | rebuild content from the `sources/` drop zone        |
| `docker compose up --build`        | frontend + backend together                          |

## Routes

**Public:** `/` · `/about` (+`/patents`, `/publications`) · `/team` ·
`/catalog` (searchable PDF viewer) · `/track-record` (deployment map; Success
Stories opens as an overlay) · `/success-stories/flipbook` · `/simulation` ·
`/contact` · `/privacy` · `/terms`

**Staff:** `/intranet` (gated behind Microsoft sign-in when Entra is configured; 12 h sessions) · `/intranet/kiosk/*`
(trade-show kiosk: dashboard, 3d-viewer, lane, ch, successstories, datacheck,
prime)

## Content updates

Drop the new file into `sources/{operations,catalog,success-stories}/` (any
filename), run `pnpm run data`, commit the changes under `public/`. See
[docs/ADMIN.md](docs/ADMIN.md).

## Documentation

| Doc                                                                | What                                     |
| ------------------------------------------------------------------ | ---------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                       | System overview                          |
| [docs/DECISIONS.md](docs/DECISIONS.md)                             | Decision log — why things are this way   |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)                         | Dev workflow + data conventions          |
| [docs/ADMIN.md](docs/ADMIN.md)                                     | Recurring content updates                |
| [docs/FLIPBOOKS.md](docs/FLIPBOOKS.md)                             | Catalog + success-stories build pipeline |
| [docs/KIOSK.md](docs/KIOSK.md)                                     | Kiosk operations + offline priming       |
| [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)                         | Email (Microsoft Graph) configuration    |
| [docs/MS365_ENTRA_KIOSK_SETUP.md](docs/MS365_ENTRA_KIOSK_SETUP.md) | Microsoft staff sign-in setup            |
| [DEPLOY.md](DEPLOY.md)                                             | Production deploy + rollback             |
| [docs/REPO_STRUCTURE.md](docs/REPO_STRUCTURE.md)                   | Directory tree                           |
| [docs/TAILWIND_THEME.md](docs/TAILWIND_THEME.md)                   | Brand theme                              |
| [docs/ASSET_MANIFEST.md](docs/ASSET_MANIFEST.md)                   | Asset specs for designers                |
| [TODO.md](TODO.md)                                                 | Open work items                          |
