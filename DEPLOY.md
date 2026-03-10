# Deployment

## Standard Production Model

- Local development via `.env.dev`
- GitHub Actions chain: `CI` -> `Build and Push Container` -> `Deploy to EC2`
- EC2 docker compose stack at `/opt/petromac-web`
- Caddy reverse proxy on shared Docker network `web`
- Optional Cloudflare proxy in front of origin

## EC2 setup

1. `sudo mkdir -p /opt/petromac-web`
2. Create `/opt/petromac-web/.env.prod` from `.env.prod.example`
3. Ensure Caddy is attached to external Docker network `web`
4. Add Caddy site block to proxy `petromac-web:3000`

## Required GitHub Secrets

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `EC2_PORT` (optional)
- `GHCR_PULL_USER`
- `GHCR_PULL_TOKEN`
