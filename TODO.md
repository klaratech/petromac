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
- [ ] **Rajesh's remaining human tasks** (AI-bots toggle done 28 Jul —
      see the AI-crawler item above):
  1. Google Search Console: add/verify www.petromac.co.nz property,
     submit https://www.petromac.co.nz/sitemap.xml
  2. Rich Results test (search.google.com/test/rich-results) on /,
     one product page, /about/publications
  3. Quick browse of the live site — homepage, catalog, track record,
     case studies, contact form (submit once to see Turnstile)
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
- [x] Vercel retirement (28 Jul): code side fully scrubbed (docs,
      .gitignore; only the historical note in CLAUDE.md remains, on
      purpose; no vercel.json/workflow/deps ever existed). Dashboard
      agent disabled builds + disconnected the git repo; the project's
      three env vars are all reconstructible (NEXT*PUBLIC*\*, recorded
      in .env.example). LAST TWO CLICKS (Rajesh): 1) Vercel → petromac
      → Settings → General → bottom → Delete Project (petromac.vercel.app
      goes offline — intended); 2) GitHub → klaratech org → Settings →
      GitHub Apps → uninstall Vercel if nothing else uses it.
- [ ] Sanity-check + clean up the Crazy Domains DNS panel against the
      now-canonical Cloudflare zone (with the other admin), so the inert
      panel doesn't mislead anyone again. Open verification questions
      (also in docs/DNS.md): office scanners' SMTP server; SPF IPs
      172.232.206.251 + 161.65.142.140; Skype/Lync records still needed?
- [ ] Re-prime kiosk tablets after the next deploy (SW cache changed) —
      AND move them to the production domain while at it: set the launch
      URL to https://www.petromac.co.nz/intranet/kiosk?sd=1, sign in,
      re-prime, verify offline.
- [x] petromac.klaratech.it RETIRED (28 Jul 2026): repo scrubbed
      (docs/.env.example → www.petromac.co.nz; siteUrl.ts default →
      localhost); Entra redirect URI + Turnstile hostname removed
      (Rajesh); server sweep done — three klaratech.it ingress rules
      removed from /etc/cloudflared/config.yml (validated, restarted;
      backup config.yml.bak-retire-_), ALLOWED_ORIGINS trimmed to the
      production pair in both env files (backups .env-_.bak-retire),
      petromac CNAME deleted from the klaratech.it zone. Verified:
      www 200 / apex 301 / Turnstile enforcing / old hostname dead /
      sibling klaratech apps unaffected. Tech Standards vault updated
      (Infrastructure Inventory, Domains & Registrars, Service
      Providers). REMINDER: kiosk tablets must be re-primed on
      https://www.petromac.co.nz/intranet/kiosk?sd=1 — the old primed
      origin no longer resolves (see re-prime item above).

- [x] Test/staging environment LIVE (28 Jul): https://test.petromac.co.nz
      — public but noindex (staging identity build). Two stacks on
      klaratech-1 (prod :3015/:8012 tag :prod; test :3016/:8013 tag
      :staging), tunnel ingress + DNS added, all 29 zone records now
      carry descriptive Cloudflare comments. CI: every push deploys TEST
      only (deploy-staging.yml); production changes ONLY via the
      "Promote to Production" workflow (deploy-prod.yml,
      workflow_dispatch — the go-live button). Also fixed latent gap:
      API_BASE_URL now absolute (docker-network URL) in both frontend
      env files. REMAINING (Rajesh): add
      https://test.petromac.co.nz/auth/microsoft/callback to the Entra
      app so intranet sign-in works on the test site.

## Security / hardening

- [x] Send-as-staff now survives the whole 12 h session (28 Jul): the ~1 h
      delegated Graph token had no refresh path, so "email as me" silently
      fell back to info@ an hour after sign-in (Rajesh hit this on the
      success-stories send). Now: refresh token kept in an IN-MEMORY
      server store keyed by a random tokenRef in the session cookie (the
      token itself never fits the ~4 KB cookie), /api/staff/send-pdf
      refreshes on demand + rotates, /api/staff/session reports
      refreshability, and EmailPdfButton shows "sends from X" so a
      fallback is never silent. Known limit BY DESIGN: a deploy/restart
      empties the store → sends fall back to info@ (visibly) until next
      sign-in. Also fixed: PDF emails linked www.petromac.com → .co.nz.

- [x] Cloudflare Turnstile LIVE on the contact form (28 Jul): lazy-loaded
      managed widget (site key baked via repo variable
      NEXT_PUBLIC_TURNSTILE_SITE_KEY → Docker build-arg), backend
      siteverify enforcement (TURNSTILE_SECRET_KEY in .env-backend,
      added by Rajesh over SSH with hidden input; fails open on
      Cloudflare outages, honeypot + timing + rate limits still apply),
      CSP allows challenges.cloudflare.com. Widget "petromac" on the
      28 Jul follow-up: Rajesh's live submit 403'd (stale pre-Turnstile
      page or send-before-token race — the secret itself verified
      valid); fix shipped: submit gated until the widget issues a token
      (12 s fail-open grace, backend still enforces) + a specific
      "verification didn't complete" message on 403.
      Cloudflare account covers petromac.co.nz + klaratech.it +
      localhost; local dev uses the official always-pass TEST keys in
      .env.local. Optional hardening: drop "localhost" from the widget's
      hostname list (dev never uses the real key).
- [ ] PDF-email domain allowlist permits any address in an allowed domain —
      consider explicit recipient allowlist
- [x] staffAuth unit tests DONE (28 Jul): 19 tests — session cookie
      round-trip/expiry/tamper/wrong-secret, OAuth state TTL + nonce,
      timing-safe compare, Graph-token skew, config detection, cookie
      attributes. Wired `pnpm test:unit` (node:test via tsx) into CI and
      the pre-push hook — unit tests previously existed but NEVER ran
      anywhere (one had silently drifted from the implementation).

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
- [x] Stale automation retired (28 Jul): `data-build.yaml` workflow
      deleted (weekly scheduled no-op tied to the pre-drop-zone xlsx-URL
      secrets) and `scripts/daily-operations-update.sh` + its Mac
      LaunchAgent `com.petromac.data-update` removed (unloaded; backups
      of both in `Website_Archive/retired-automation/`). Content updates
      are drop-zone + manual runs per docs/ADMIN.md.
- [ ] `pdf-flipbooks-build.yml` workflow: triggers when pipeline scripts
      change, but CI has no `sources/` inputs (gitignored) — likely a
      no-op that just validates + commits nothing. Review whether it
      still earns its keep; low priority, harmless.

## Notes

- Email sends via Microsoft Graph app-only `Mail.Send` as the `info@`
  shared mailbox (not SMTP, not Brevo — org-standard deviation; see
  docs/DECISIONS.md). Revisit if it becomes a maintenance burden.
