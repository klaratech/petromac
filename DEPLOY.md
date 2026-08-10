# Deployment

Production runs on **klaratech-1** (Hetzner, `46.225.75.202`) behind a
**Cloudflare Tunnel** in the company Cloudflare account `it@petromac.co.nz`,
with images published to **GHCR** by GitHub Actions. This matches the org-wide pattern in [Architecture & Standards](https://github.com/klaratech) — see `Architecture & Standards.md` and `Hetzner Server.md` in the Tech Standards vault.

## Topology

```
Browser → Cloudflare edge → cloudflared (klaratech-1) → 127.0.0.1:3015 (frontend)
                                                     ↘  127.0.0.1:8012 (backend, /api/*)
```

- Hostnames: `www.petromac.co.nz` + `petromac.co.nz` (apex 301s to www at
  the edge) = PRODUCTION; `test.petromac.co.nz` = TEST/staging (public but
  noindex — its build has no production identity, so every page carries
  noindex + a Disallow-all robots.txt automatically). The pre-launch
  staging hostname `petromac.klaratech.it` was retired post-cutover
  (Jul 2026).
- Production containers: frontend `127.0.0.1:3015`, backend `127.0.0.1:8012`
- Test containers: frontend `127.0.0.1:3016`, backend `127.0.0.1:8013`
  - **Both bind to `127.0.0.1` only** — cloudflared connects over loopback, so
    nothing should be published on `0.0.0.0`. A server copy of the compose file
    once dropped the `127.0.0.1:` prefix and exposed both ports to the public
    internet (bypassing Cloudflare's WAF and the `CF-Connecting-IP` rate limit);
    fixed Jul 2026. If reconciling the live `/root/apps/petromac/docker-compose.yml`,
    keep the prefix.
- App folder on server: `/root/apps/petromac/`
- Images: `ghcr.io/klaratech/petromac-frontend:latest`, `ghcr.io/klaratech/petromac-backend:latest`
- DNS, TLS, and routing live in Cloudflare; the server has no public ports open beyond SSH.

## CI/CD — test-first with a promote button (Jul 2026)

Two workflows, one rule: **pushes never touch production.**

- `.github/workflows/deploy-staging.yml` — every push to main builds the
  images with the TEST identity (`NEXT_PUBLIC_SITE_URL=https://test.petromac.co.nz`,
  no `NEXT_PUBLIC_ENV` → noindex) as `:staging` + `:staging-<sha>` and
  redeploys ONLY the `frontend-test` / `backend-test` services. Iterate,
  check https://test.petromac.co.nz, share it for feedback.
- `.github/workflows/deploy-prod.yml` ("Promote to Production") — the
  go-live button, three equivalent triggers: tell Claude "go live";
  GitHub → Actions → Promote to Production → Run workflow; or
  `gh workflow run deploy-prod.yml` (add `-f ref=<sha>` to promote a
  specific commit — also how you roll back). It rebuilds that ref with
  the PRODUCTION identity (repo variables), tags `:prod` + `:sha-<short>`,
  and redeploys ONLY the prod services. Nothing reaches
  www.petromac.co.nz any other way. NOTE: prod containers restart only on
  promote — server env-file edits need a promote or a manual
  `docker compose up -d <services>` to take effect.

Because the site identity is baked at build time, test and prod are
separate image builds of the same commit — the promote rebuilds rather
than retags, and `next.config.ts` refuses inconsistent production builds.

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
   - `/root/apps/petromac/.env-backend` — backend secrets (ENTRA\_\* for Graph email + staff auth, MAIL_SENDER, STAFF_SESSION_SECRET, etc.)
     Splitting the env files keeps backend secrets out of the frontend container.
4. CI logs Docker into GHCR during each deploy before pulling images. For manual server-side pulls or rollbacks, run `docker login ghcr.io` first with a token that has `read:packages`.
5. Add the cloudflared ingress (already documented in Tech Standards `Hetzner Server.md`):

   ```yaml
   # Next.js staff-session route lives in the FRONTEND — must match before /api/.*
   # Duplicate all three blocks per served hostname (www + apex).
   - hostname: www.petromac.co.nz
     path: /api/staff/.*
     service: http://localhost:3015
   - hostname: www.petromac.co.nz
     path: /api/.*
     service: http://localhost:8012
   - hostname: www.petromac.co.nz
     service: http://localhost:3015
   ```

   Ingress rules are first-match-wins: without the `/api/staff/.*` exception,
   the backend answers 404 for the Next.js session route and the intranet
   sign-in card can't detect that auth is configured.

6. `systemctl restart cloudflared-petromac` (NOT `cloudflared` — see below).
7. Cloudflare DNS (petromac.co.nz zone): CNAME apex + `www` →
   `<tunnel-id>.cfargotunnel.com`, **proxied**. Proxied is not cosmetic: a
   `cfargotunnel.com` hostname has no public A record, so a DNS-only tunnel
   record takes the site down completely.

## Two cloudflared services on klaratech-1 (10 Aug 2026)

Since the Cloudflare account migration there are **two** cloudflared units on
that box, and confusing them is the easiest way to cause an outage:

| Unit                             | Tunnel                         | Serves                                                                                                                           | Config                                                          |
| -------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `cloudflared.service` (original) | `fcb4d36c-…`, personal account | n8n.thatha.online, antra.group, trailandtide.it, klaratech.it (+lynx, klaratax) — **and** stale Petromac routes kept as rollback | `/etc/cloudflared/config.yml`                                   |
| `cloudflared-petromac.service`   | `d2265986-…`, company account  | petromac.co.nz, www, test                                                                                                        | **none** — remotely managed, all 9 routes live in the dashboard |

- The original unit **must keep running**; four other domains depend on it.
- **Never run `cloudflared service install` on this box.** It overwrites
  `/etc/systemd/system/cloudflared.service` and takes those domains down.
- The new unit takes its token from `/etc/cloudflared/petromac-token.env`
  (`600 root:root`) via `EnvironmentFile`, deliberately not from `ExecStart` —
  unit files are world-readable and `--token` would also show in `ps`.
- It runs `--metrics 127.0.0.1:20242`; the original holds `:20241`. Omit that
  flag on a second instance and it collides with the first.

## Cloudflare settings (petromac.co.nz zone)

The zone also carries the company's non-web DNS (M365 mail, Athena,
legacy mail server, SMTP2GO — see [docs/DNS.md](docs/DNS.md)); zone-wide
web settings only affect the proxied site records:

- **Browser TTL**: a Cache Rule with Browser TTL = "Respect origin TTL".
  This activates the cadence-based Cache-Control headers set in
  `next.config.ts` (without it, Cloudflare's zone default of 4 h
  overrides them).
- Brotli on; AI crawlers allowed (content-policy decision, Jul 2026);
  SSL/TLS **Full** (→ Full (strict) once ChemiCloud is retired — cleared
  to cancel as of 7 Aug 2026, pending the office-scanner SMTP check; see
  TODO.md);
  Always Use HTTPS on; Turnstile widget for the contact form.

The domain cutover from the klaratech.it staging hostname happened
27 Jul 2026 — history and the incident postmortem live in
[docs/DNS.md](docs/DNS.md) and TODO.md.

## Server access, logs & debugging

- `ssh klaratech-1` from Rajesh's Mac — **direct to the public IP; Tailscale
  is NOT required** (port 22 is open there, same path the GitHub Actions
  deploy uses). Until 28 Jul 2026 the alias carried `ProxyJump hetzner`,
  and `hetzner` is a Tailscale address, so admin SSH silently died whenever
  Tailscale was stopped — with the misleading `Connection timed out during
banner exchange`, which looks like a server fault but is purely local.
  Fallback alias `klaratech-1-via-hetzner` still has the jump.
  The key lives in the **1Password SSH agent**, so
  `sign_and_send_pubkey: signing failed ... communication with agent failed`
  means 1Password must authorise the signature — Rajesh approves the prompt
  (note `ssh-add -l` still lists the keys in that state, so a good listing
  does NOT mean SSH will work). Tailscale plays no role in serving the site.
- Logs: `docker logs petromac-backend --since 1h` (same for the other
  three containers) — the backend logs every request with status codes,
  the first stop for "the form doesn't work" reports.
- **Image Pulls & Containerd Hygiene**: CI workflows pull images sequentially (`docker compose pull frontend-test` then `backend-test`) rather than in parallel to avoid `containerd` layer extraction race conditions (`commit failed: rename ... /ingest/...`). Workflows execute `docker logout ghcr.io` post-deploy to scrub ephemeral login tokens from `/root/.docker/config.json` (resolving Docker's standard unencrypted credentials warning).
- **Server Prune**: Reclaim disk space on `klaratech-1` via `docker image prune -a -f && docker builder prune -a -f`.
- Debugging ladder: DNS (`dig @1.1.1.1`) → edge (`curl -I`, look for
  `server: cloudflare` + CF-RAY) → tunnel (`systemctl status cloudflared`)
  → containers (`docker ps`) → app logs. Local machines can lie — macOS
  DNS caches have repeatedly resolved petromac.co.nz to the dead
  ChemiCloud server; verify via `curl --resolve` against the edge IP
  before trusting a local repro. Cloudflare zone specifics + DNS incident
  history: [docs/DNS.md](docs/DNS.md). The API token at
  `/root/.cloudflare-token` was reissued in the company account on 10 Aug 2026
  and is IP-locked to this box's IPv4 **and** IPv6 — it will not work from a
  laptop (error 9109).
  Two more false-alarm sources seen during that migration: a stale local DNS
  cache, and Tailscale MagicDNS (`100.100.100.100`) returning a synthetic
  IPv6 ULA. Both produced convincing "site is down" readings while the site
  was fine. Check `dig @mina.ns.cloudflare.com <host> A` before believing a
  local `curl`.

## Credentials index

| Secret                                                        | Where it lives                                                                                                                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entra client secret (sign-in + Graph mail)                    | 1Password "Petromac Entra Client Secret" + server env files (renew ~Jul 2028)                                                                         |
| `STAFF_SESSION_SECRET`, Turnstile secret                      | server env files (Turnstile secret also retrievable in the Cloudflare dashboard)                                                                      |
| Turnstile site key, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ENV` | GitHub repo Actions **variables**                                                                                                                     |
| Deploy SSH key, `DEPLOY_HOST/USER`                            | GitHub Actions **secrets**                                                                                                                            |
| Cloudflare API token (DNS/settings/cache/bots)                | `/root/.cloudflare-token` on klaratech-1 + 1Password "Petromac Cloudflare API Credentials". Account-owned, zone-scoped, IP-locked to this box (v4+v6) |
| Cloudflare Tunnel token (Petromac, company account)           | `/etc/cloudflared/petromac-token.env` on klaratech-1 (`600 root:root`)                                                                                |

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
