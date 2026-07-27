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
- [x] Email go-live DONE (27 Jul 2026): Graph application `Mail.Send` added + admin consent; `.env-backend` updated (Entra creds copied server-side
      from the frontend env + MAIL_SENDER/CONTACT_TO_EMAIL/
      ALLOWED_EMAIL_DOMAINS); end-to-end verified — live contact-form test
      returned ok and delivered via Graph as info@. Backup:
      `.env-backend.bak-*` on the server.
- [ ] Production domain cutover: Cloudflare zone/tunnel hostname, then update
      `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_BASE_URL`, `ALLOWED_ORIGINS` (both env
      files), and add the new Entra callback URL.
      **Indexability (Jul 2026):** staging ships noindex + Disallow-all
      robots.txt automatically; the production deploy must set
      `NEXT_PUBLIC_SITE_URL=https://www.petromac.co.nz` AND
      `NEXT_PUBLIC_ENV=production` (the build fails if the pair is
      inconsistent — see `src/lib/siteUrl.ts`). After cutover: verify
      robots.txt/sitemap on the live domain, then submit the sitemap in
      Google Search Console and run the Rich Results test on /, a product
      page, and /about/publications
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

- [ ] Helix product image (kiosk surfaces reuse the focus.png logo; see
      ASSET_MANIFEST §1.4)
- [ ] Case Studies images: `helix-cbl-setup.png`, `rocker-logs-1.png`
- [ ] OH lane mechanism videos + case-study log images (Formation Testing /
      High Deviation / PathFinder)
- [ ] Corner-badge tool silhouettes (Helix/Rocker badges reuse focus.png)
- [ ] `kiosk-hd/WirelineExpress-subtitled.mp4` 1080p master
- [ ] Thor product video (card commented out until ready); Rocker GLB model
- [ ] Rocker mechanism force-section schematic (interim crop in place)

## HTML catalog (live at /catalog since Jul 2026)

The HTML catalog built from the IDML source replaced the pdf.js viewer;
restructured into a three-level drill-down (overview → family pages →
model pages) with the Device Finder in late Jul 2026 — see
docs/DECISIONS.md. Pipeline is `pnpm run data:catalog` + the enrichment
layer (docs/ADMIN.md §2b). `/catalogtest` redirects to `/catalog`. Removed with the swap: `CatalogViewer.tsx`,
`react-pdf`, `public/pdfjs/`, `search-index.json` + its pipeline step and
cache rule. Remaining:

- [ ] Content polish pass with design/product (summaries, image picks,
      SWHF configuration figures currently filed under AHFC)
- [ ] Generate the download/email PDF from `catalog.json` via an HTML print
      template (≤4 MB, tagged text, TOC) instead of shipping the print PDF

## Backlog

- [ ] Rebuild the 21 WordPress case studies as individual server-rendered
      pages under `/case-studies/<slug>` (currently only 301-redirected).
      They target long-tail queries (tool + country + deviation) that the
      success-stories flipbook cannot rank for. Source content: WordPress
      backup / petromac.co.nz case-studies pages. Add Article JSON-LD and
      include them in the sitemap when built.
- [ ] MapRenderer: split base path generation from style updates so filter
      clicks restyle instead of rebuilding all ~244 paths (from the Jul 2026
      audit; deferred — delicate component, clicks already debounced)
- [ ] SEO audit remainder: performance scores (Lighthouse/CWV pass). The
      structured-data half landed Jul 2026 (canonicals, per-page OG, JSON-LD
      for Organization/Product/Breadcrumb/ScholarlyArticle, env-derived
      robots+sitemap, staging noindex + launch guard)
- [ ] Athena terminal (/simulation) shows illustrative values — confirm
      `MRIL-XL`, `--taxis 4`, and "est. rig time saved: 8.2 hrs" with the
      product team or swap in real simulation numbers
- [ ] Kiosk CH lane "Other" experience (Coming-soon placeholder; build last)
- [ ] Longer term: job history off Excel into a database-backed source
- [ ] `data-build.yaml` workflow still references the old xlsx-URL secret
      mechanism — rework or disable (pipeline is drop-zone based now)
- [ ] `scripts/daily-operations-update.sh` cron is a no-op unless something is
      in `sources/operations/` — decide if it still has a purpose

## Notes

- Email sends via Microsoft Graph app-only `Mail.Send` as the `info@`
  shared mailbox (not SMTP, not Brevo — org-standard deviation; see
  docs/DECISIONS.md). Revisit if it becomes a maintenance burden.
