# TODO

Open work only. History and rationale: [docs/DECISIONS.md](docs/DECISIONS.md) + git log.

## Go-live checklist

- [x] Cloudflare: Cache Rule scoped to the petromac hostname with Browser TTL
      "Respect origin TTL" (done Jul 2026 — cadence cache policy active; HTML
      kept out of edge cache)
- [x] Cloudflare: Brotli confirmed on (Jul 2026)
- [x] AI-crawler policy DECIDED + APPLIED (28 Jul): allow. Dashboard
      agent set "Block AI bots" → do-not-block and disabled the managed
      robots.txt; API confirms the zone is on the new policy model
      (using_latest_model true) with ai/crawler/training/search/user
      protections ALL disabled — incl. mixed-purpose crawlers, so the
      legacy panel's "Sept 15" radio is moot. robots.txt verified clean
      on the live domain. The API token now also carries Zone → Bot
      Management, so this is API-manageable from klaratech-1.
- [x] Microsoft Entra staff sign-in LIVE (Jul 2026) — app "Petromac Intranet",
      /intranet server-gated, sign-out lands on the homepage. Secret in
      1Password ("Petromac Entra Client Secret", renew ~Jul 2028).
      28 Jul: the production callback had been pre-registered WITHOUT
      www → AADSTS50011 on the live domain; Rajesh added
      https://www.petromac.co.nz/auth/microsoft/callback (URIs match
      character-for-character). Verified working.
- [x] Email go-live DONE (27 Jul 2026): Graph application `Mail.Send` added + admin consent; `.env-backend` updated (Entra creds copied server-side
      from the frontend env + MAIL_SENDER/CONTACT_TO_EMAIL/
      ALLOWED_EMAIL_DOMAINS); end-to-end verified — live contact-form test
      returned ok and delivered via Graph as info@. Backup:
      `.env-backend.bak-*` on the server.
- [x] Production domain cutover DONE (27 Jul 2026, ~20:30 UTC): NS swapped
      at Crazy Domains → carol/harley.ns.cloudflare.com, zone active,
      Universal SSL issued (Google Trust Services, apex+wildcard).
      Post-cutover sweep ALL GREEN from the server: homepage 200 with
      index,follow + production canonical, robots.txt + sitemap on the new
      domain, apex→www 301, http→https 301, catalog/track-record/intranet
      routes OK, contact form POST from the new origin returned ok (Graph
      delivery as info@). Old Crazy Domains DNS records left in place
      (inert — rollback snapshot). Staging petromac.klaratech.it unaffected.
- [ ] **TOMORROW MORNING (28 Jul) — Rajesh's human tasks, in order:**
  1. AI-bots toggle (decision = allow, so AI assistants can learn
     Petromac products): Cloudflare dash → petromac.co.nz → Security →
     Bots → set "AI Scrapers and Crawlers" to Do-not-block AND toggle
     OFF "Manage AI bots with robots.txt". NOT doable via the current
     API token (Bot Management is a separate permission — add Zone →
     Bot Management → Edit to the token if preferred, then Claude can
     flip it). Side effect when done: Lighthouse SEO 92 → ~100
     site-wide (the managed robots.txt's Content-Signal directive is
     what fails the robots.txt audit).
  2. Google Search Console: add/verify www.petromac.co.nz property,
     submit https://www.petromac.co.nz/sitemap.xml
  3. Rich Results test (search.google.com/test/rich-results) on /,
     one product page, /about/publications
  4. Quick browse of the live site from your own machine (DNS caches
     will have expired overnight) — homepage, catalog, track record,
     contact form
  - Days after activation: SPF trim to M365-only include, DMARC watch,
    then -all; drop default.\_domainkey + link CNAME. CAUTION (28 Jul):
    the SPF currently ALSO authorises the ChemiCloud server + mailchannels
    relay — scanners/printers and legacy mailboxes still send through
    mail.petromac.co.nz. Do NOT trim those from SPF until that mail is
    migrated to M365.
  - SSL Full (strict) once ChemiCloud hosting is retired
  - Revoke the old all-zones Cloudflare user token
  - (Optional hardening) enable DNSSEC: Cloudflare generates the DS,
    paste it at Crazy Domains
- [x] Post-cutover DNS incident FIXED (28 Jul 2026): the DNS agent's zone
      cleanup had deleted 13 live records → athena.petromac.co.nz, server
      email (mail/webmail on the ChemiCloud box 172.232.197.9) and
      scanner/printer relaying broke once caches expired. Restored from
      the old authoritative zone (ns1.serverhostgroup.com still answered)
      via the API: A athena→52.64.209.109; A mail/webmail/cpanel/
      cpcalendars/cpcontacts/webdisk/whm/ftp→172.232.197.9; CNAME
      lyncdiscover/sip; SRV \_sip.\_tls + \_sipfederationtls.\_tcp — all
      DNS-only, TTL 300. Verified: athena 200, SMTP 587/465 + IMAP 993
      open. Governance decided: Cloudflare is the SINGLE DNS home
      (nameserver authority is all-or-nothing); the Crazy Domains panel
      is an inert reference (it had drifted — portal/autoconfig/localhost
      existed only in the panel, not the live zone); the other admin's
      DNS changes route through Rajesh (or later: invite with a DNS-only
      scoped role).
- [ ] DO NOT CANCEL ChemiCloud until legacy mail is migrated: the box at
      172.232.197.9 still hosts mail./webmail./cpanel mailboxes and the
      scanner/printer SMTP relay (+ its IPs sit in the SPF). Cancelling
      kills those. Sequence: migrate legacy mailboxes + device relay to
      M365 → then cancel → then SPF trim + SSL Full (strict).
- [x] DNS incident round 2 (28 Jul): SMTP2GO turned out to be in use for
      scan-to-email (Steve's home scanner) — its em588925 +
      s588925.\_domainkey CNAMEs had also been deleted; restored, scanner
      recovered. Office printers/scanners confirmed working after round 1.
      Full annotated zone + history now in docs/DNS.md.
- [x] Contact form on production 400'd for blank-name submissions
      (28 Jul): the July copy pass made Name optional on the form but the
      backend still required it — backend now requires only email+message,
      falls back to "Website visitor". Verified live post-deploy.
- [ ] Sanity-check + clean up the Crazy Domains DNS panel against the
      now-canonical Cloudflare zone (with the other admin), so the inert
      panel doesn't mislead anyone again. Open verification questions
      (also in docs/DNS.md): office scanners' SMTP server; SPF IPs
      172.232.206.251 + 161.65.142.140; Skype/Lync records still needed?
- [ ] Re-prime kiosk tablets after the next deploy (SW cache changed)

## Security / hardening

- [ ] (Future) Send kiosk emails as the signed-in staff member — needs the
      staff member's delegated Graph token persisted + refreshed server-side.
      App already reserved Mail.Send delegated. Default stays info@.

- [x] Cloudflare Turnstile LIVE on the contact form (28 Jul): lazy-loaded
      managed widget (site key baked via repo variable
      NEXT_PUBLIC_TURNSTILE_SITE_KEY → Docker build-arg), backend
      siteverify enforcement (TURNSTILE_SECRET_KEY in .env-backend,
      added by Rajesh over SSH with hidden input; fails open on
      Cloudflare outages, honeypot + timing + rate limits still apply),
      CSP allows challenges.cloudflare.com. Widget "petromac" on the
      Cloudflare account covers petromac.co.nz + klaratech.it +
      localhost; local dev uses the official always-pass TEST keys in
      .env.local. Optional hardening: drop "localhost" from the widget's
      hostname list (dev never uses the real key).
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

- [x] Case studies rebuilt (27 Jul 2026): 21 pages live under
      `/case-studies/<slug>` (SSG, Article+Breadcrumb JSON-LD, sitemap,
      old root-level WP slugs 301-redirected, "Case Studies" in the main
      nav). Canonical content: `src/features/case-studies/content/
case-studies.json` (hand-editable — WordPress is gone; raw HTML
      mirror archived in `Website_Archive/oldsite-case-studies/`).
      Optional polish: per-study dates, more cross-links from product
      pages.
- [x] Success-stories → case-study pages DONE (28 Jul): all 46 flipbook
      stories now render as /case-studies pages (median ~240 words +
      C/S/R + the published page image). The 21 WP-duplicates keep their
      old slugs (zero redirect churn); 25 new slugs added, incl. CCS,
      geothermal, Helix/Rocker stories. Old WP-era content + its 28
      images deleted per Rajesh. Regeneration:
      `scripts/python/build_case_studies.py` (new edition → add NEW_SLUG
      entries, review TITLE_OVERRIDE).
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
