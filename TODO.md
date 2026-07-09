# TODO

Open work only. History and rationale: [docs/DECISIONS.md](docs/DECISIONS.md) + git log.

## Go-live checklist

- [ ] Cloudflare: Browser Cache TTL → **"Respect Existing Headers"** (activates
      the cadence-based cache policy shipped in `next.config.ts`)
- [ ] Cloudflare: enable **Brotli** (Speed → Optimization) — free ~15–20% on JS/JSON/HTML
- [ ] Decide AI-crawler policy (Cloudflare currently blocks GPTBot/ClaudeBot/etc. —
      trade-off: content protection vs. AI assistants knowing Petromac products)
- [ ] Microsoft Entra app registration for staff sign-in
      ([docs/MS365_ENTRA_KIOSK_SETUP.md](docs/MS365_ENTRA_KIOSK_SETUP.md)) —
      works on localhost + petromac.klaratech.it now; add the production
      domain's callback URL when it exists
- [ ] SMTP env vars on the server (`.env-backend`) so contact form + PDF email
      work ([docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)) — currently NOT
      configured in production; email features are dead until then
- [ ] Production domain cutover: Cloudflare zone/tunnel hostname, then update
      `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_BASE_URL`, `ALLOWED_ORIGINS` (both env
      files), and add the new Entra callback URL
- [ ] Re-prime kiosk tablets after the next deploy (SW cache changed)

## Security / hardening

- [ ] Cloudflare Turnstile on the contact form (org standard; currently
      honeypot + timing only)
- [ ] PDF-email domain allowlist permits any address in an allowed domain —
      consider explicit recipient allowlist
- [ ] staffAuth unit tests (highest-logic auth code, thin coverage)

## Content & assets (designer-dependent)

- [ ] ChallengeSelector card thumbnails — `conveyance/ledges/orientation/
    sampling/sticking.jpg` are dev placeholders; three cards show them permanently
- [ ] Helix product image (homepage FeaturedProducts card uses the focus.png logo)
- [ ] Case Studies images: `helix-cbl-setup.png`, `rocker-logs-1.png`
- [ ] OH lane mechanism videos + case-study log images (Formation Testing /
      High Deviation / PathFinder)
- [ ] Corner-badge tool silhouettes (Helix/Rocker badges reuse focus.png)
- [ ] `kiosk-hd/WirelineExpress-subtitled.mp4` 1080p master
- [ ] Thor product video (card commented out until ready); Rocker GLB model
- [ ] Rocker mechanism force-section schematic (interim crop in place)

## Backlog

- [ ] Full SEO audit remainder (structured data / JSON-LD, performance scores)
- [ ] Kiosk CH lane "Other" experience (Coming-soon placeholder; build last)
- [ ] Longer term: job history off Excel into a database-backed source
- [ ] `data-build.yaml` workflow still references the old xlsx-URL secret
      mechanism — rework or disable (pipeline is drop-zone based now)
- [ ] `scripts/daily-operations-update.sh` cron is a no-op unless something is
      in `sources/operations/` — decide if it still has a purpose

## Notes

- Email sends via Microsoft 365 SMTP (`info@petromac.co.nz`) by deliberate
  choice — deviates from the org standard (Brevo). Revisit if it becomes a
  maintenance burden.
