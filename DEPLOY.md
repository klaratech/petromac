# Deployment

## Standard Production Model

- Local development via `.env.dev`
- GitHub Actions chain: `CI` -> `Build and Push Container` -> `Deploy to EC2`
- EC2 docker compose stack at `/opt/petromac`
- Frontend image: `ghcr.io/klaratech/petromac-frontend`
- Backend image: `ghcr.io/klaratech/petromac-backend`
- Caddy reverse proxy on shared Docker network `web`
- Optional Cloudflare proxy in front of origin

## EC2 setup

1. `sudo mkdir -p /opt/petromac`
2. Create `/opt/petromac/.env.prod`
3. Ensure Caddy is attached to external Docker network `web`
4. Add Caddy routes for:
   - `petromac-frontend:3000` on `/`
   - `petromac-backend:8000` on `/api/*`

## Required GitHub Secrets

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `EC2_PORT` (optional)
- `GHCR_PULL_USER`
- `GHCR_PULL_TOKEN`
