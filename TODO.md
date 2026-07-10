# TODO

Open work only. History and rationale: [docs/DECISIONS.md](docs/DECISIONS.md) + git log.

## Go-live checklist

- [x] Cloudflare: Cache Rule scoped to the petromac hostname with Browser TTL
      "Respect origin TTL" (done Jul 2026 — cadence cache policy active; HTML
      kept out of edge cache)
- [x] Cloudflare: Brotli confirmed on (Jul 2026)
- [ ] Decide AI-crawler policy (Cloudflare currently blocks GPTBot/ClaudeBot/etc. —
      trade-off: content protection vs. AI assistants knowing Petromac products)
- [x] Microsoft Entra staff sign-in LIVE (Jul 2026) — app "Petromac Intranet",
      all three redirect URIs incl. petromac.co.nz pre-registered, /intranet
      server-gated, sign-out lands on the homepage. Secret in 1Password
      ("Petromac Entra Client Secret", renew ~Jul 2028).
- [ ] Email go-live ([docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)): add Graph
      **application** `Mail.Send` permission + admin consent to the Entra app,
      then set ENTRA*\* / MAIL_SENDER / CONTACT_TO_EMAIL / ALLOWED_EMAIL*\* in
      `.env-backend`. Email features are dead in prod until then. (Code is
      done — app-only Graph sender.)
- [ ] Production domain cutover: Cloudflare zone/tunnel hostname, then update
      `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_BASE_URL`, `ALLOWED_ORIGINS` (both env
      files), and add the new Entra callback URL
- [ ] Re-prime kiosk tablets after the next deploy (SW cache changed)

## Security / hardening

- [ ] (Future) Send kiosk emails as the signed-in staff member — needs the
      staff member's delegated Graph token persisted + refreshed server-side.
      App already reserved Mail.Send delegated. Default stays info@.

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

## HTML catalog swap (refining at /catalogtest — Jul 2026)

New HTML catalog built from the IDML source lives at `/catalogtest`
(noindexed); pipeline is `pnpm run data:catalog` (docs/ADMIN.md §2b).
Once refined, to swap it in:

- [ ] Content polish pass with design/product (summaries, image picks,
      SWHF configuration figures currently filed under AHFC)
- [ ] Generate the download/email PDF from `catalog.json` via an HTML print
      template (≤4 MB, tagged text, TOC) instead of shipping the print PDF
- [ ] Move `/catalogtest` → `/catalog` (keep slugs; redirect old URL params),
      drop the `robots: noindex`, update sitemap
- [ ] Remove orphans: pdf.js viewer (`CatalogViewer.tsx`), `react-pdf` dep,
      `public/pdfjs/`, catalog compress/linearize steps in the flipbooks
      pipeline, `search-index.json`, the `/pdfjs/` cache rule in
      next.config.ts, and the catalog-viewer a11y backlog item below
- [ ] Full docs pass (CLAUDE.md, ARCHITECTURE, FLIPBOOKS, REPO_STRUCTURE)

## Backlog

- [ ] MapRenderer: split base path generation from style updates so filter
      clicks restyle instead of rebuilding all ~244 paths (from the Jul 2026
      audit; deferred — delicate component, clicks already debounced)
- [ ] Catalog viewer a11y: move keyboard focus to the target page when
      jumping between search matches (screen-reader users currently only get
      the visual scroll) — from the Jul 2026 catalog audit

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
