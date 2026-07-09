# Deployment

Production runs on **klaratech-1** (Hetzner) behind a **Cloudflare Tunnel**, with images published to **GHCR** by GitHub Actions. This matches the org-wide pattern in [Architecture & Standards](https://github.com/klaratech) — see `Architecture & Standards.md` and `Hetzner Server.md` in the Tech Standards vault.

## Topology

```
Browser → Cloudflare edge → cloudflared (klaratech-1) → 127.0.0.1:3015 (frontend)
                                                     ↘  127.0.0.1:8012 (backend, /api/*)
```

- Hostname: `petromac.klaratech.it`
- Frontend container port: `127.0.0.1:3015` on host, `3000` in container
- Backend container port: `127.0.0.1:8012` on host, `8000` in container
  - **Both bind to `127.0.0.1` only** — cloudflared connects over loopback, so
    nothing should be published on `0.0.0.0`. A server copy of the compose file
    once dropped the `127.0.0.1:` prefix and exposed both ports to the public
    internet (bypassing Cloudflare's WAF and the `CF-Connecting-IP` rate limit);
    fixed Jul 2026. If reconciling the live `/root/apps/petromac/docker-compose.yml`,
    keep the prefix.
- App folder on server: `/root/apps/petromac/`
- Images: `ghcr.io/klaratech/petromac-frontend:latest`, `ghcr.io/klaratech/petromac-backend:latest`
- DNS, TLS, and routing live in Cloudflare; the server has no public ports open beyond SSH.

## CI/CD

`.github/workflows/deploy-prod.yml`:

1. Builds frontend + backend images for `linux/amd64` only (no multi-arch — Hetzner is amd64).
2. Pushes `:latest` and `:sha-<short>` tags to GHCR.
3. SSHes into the server, logs Docker into GHCR with the workflow token, then runs `docker compose pull && docker compose up -d` from `/root/apps/petromac`.

## Required GitHub Actions secrets

| Secret           | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| `DEPLOY_HOST`    | Public IP of klaratech-1 (`46.225.75.202`)                   |
| `DEPLOY_USER`    | `root`                                                       |
| `DEPLOY_SSH_KEY` | Deploy SSH private key (added to server's `authorized_keys`) |

The image base name (`petromac`) and the deploy path (`/root/apps/petromac`) are hardcoded in the workflow file. To change them, edit `.github/workflows/deploy-prod.yml` directly — there's no GitHub-side variable to set.

## Server-side prerequisites

On `klaratech-1`:

1. `mkdir -p /root/apps/petromac /root/apps/petromac/data`
2. Copy `deploy/docker-compose.prod.yml` from this repo to `/root/apps/petromac/docker-compose.yml`.
3. Create the env files (use `.env.example` as the reference for which keys go where; never commit either):
   - `/root/apps/petromac/.env-frontend` — public-facing config (NEXT*PUBLIC*\* vars, API URLs)
   - `/root/apps/petromac/.env-backend` — backend secrets (SMTP creds, ENTRA_CLIENT_SECRET, STAFF_SESSION_SECRET, etc.)
     Splitting the env files keeps backend secrets out of the frontend container.
4. CI logs Docker into GHCR during each deploy before pulling images. For manual server-side pulls or rollbacks, run `docker login ghcr.io` first with a token that has `read:packages`.
5. Add the cloudflared ingress (already documented in Tech Standards `Hetzner Server.md`):
   ```yaml
   - hostname: petromac.klaratech.it
     path: /api/.*
     service: http://localhost:8012
   - hostname: petromac.klaratech.it
     service: http://localhost:3015
   ```
6. `systemctl restart cloudflared`.
7. Add a Cloudflare DNS CNAME for `petromac.klaratech.it` → tunnel ID, proxied.

## Cloudflare settings (klaratech.it zone)

Cloudflare settings are **per zone**, and `petromac.klaratech.it` shares the
`klaratech.it` zone with other apps — so petromac-specific behavior is done
with **Cache Rules** scoped to the hostname, not zone-wide toggles:

- **Browser TTL**: a Cache Rule matching `hostname eq petromac.klaratech.it`
  with Browser TTL = "Respect origin TTL". This activates the cadence-based
  Cache-Control headers set in `next.config.ts` (without it, Cloudflare's
  zone default of 4 h overrides them).
- Zone-wide settings that are fine to share: Brotli compression, bot
  protections (note: "Block AI bots" is a content-policy decision).

## Domain cutover: petromac.klaratech.it → petromac.co.nz

The plan when testing completes. The zone can be **pre-built in Cloudflare
while `petromac.co.nz` still serves the old site elsewhere** — nothing goes
live until the nameservers change at the registrar.

1. **Add the `petromac.co.nz` zone** in Cloudflare (free plan is fine). It sits
   in "pending nameserver update" — fully configurable, not yet serving.
2. **Replicate ALL existing DNS records** into the zone before flipping —
   ⚠️ especially **MX / SPF / DKIM / DMARC for Microsoft 365 mail**. Missing
   these breaks company email the moment nameservers move. Cloudflare's
   import scans the current DNS but verify against M365 admin's DNS page.
3. **Add the site records**: CNAME `petromac.co.nz` → `<tunnel-id>.cfargotunnel.com`
   (proxied) and CNAME `www` → same (or a redirect rule www → apex).
4. **cloudflared ingress** on klaratech-1: duplicate the two petromac ingress
   blocks for the new hostname (keep the old ones during transition);
   `systemctl restart cloudflared`.
5. **Zone settings**: Cache Rule (Browser TTL = respect origin), Brotli,
   bot policy, SSL/TLS mode **Full (strict)**.
6. **App config for the new domain**:
   - `/root/apps/petromac/.env-frontend`: `NEXT_PUBLIC_SITE_URL=https://petromac.co.nz`
     (+ legacy `NEXT_PUBLIC_BASE_URL`)
   - `/root/apps/petromac/.env-backend`: add the new origin to `ALLOWED_ORIGINS`
     (keep the klaratech.it origin during transition)
   - Entra app: add `https://petromac.co.nz/auth/microsoft/callback`
   - `docker compose up -d` to reload env
7. **Flip**: change the nameservers at the .co.nz registrar to the pair
   Cloudflare assigned. Propagation is minutes-to-48 h; the old site keeps
   serving until each resolver picks up the change.
8. **After cutover**: keep `petromac.klaratech.it` working for a while
   (bookmarks, emailed links), verify email flow (send/receive a test M365
   message), re-run the smoke tests against the new domain, and submit the
   new sitemap in Google Search Console.

## Rollback

```bash
ssh klaratech-1
cd /root/apps/petromac
# edit docker-compose.yml: change :latest to :sha-<short> for the affected service
docker compose pull && docker compose up -d
```

## Adding a new env var

Per `Architecture & Standards.md` "Adding a new env var (the loop)":

1. Add the key to `.env.example` with a placeholder/comment.
2. Add the real value to local `.env.dev`.
3. SSH to server, edit either `/root/apps/petromac/.env-frontend` or `.env-backend` depending on which container reads it.
4. `cd /root/apps/petromac && docker compose up -d`.
