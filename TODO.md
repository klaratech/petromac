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
  1. Google Search Console — STILL OUTSTANDING (28 Jul). Sign in with a
     PETROMAC Google account, not a personal one; add a **Domain** property
     for petromac.co.nz (DNS TXT verification covers www + apex + subdomains
     in one go — send me the TXT value and I'll add it to Cloudflare), then
     submit https://www.petromac.co.nz/sitemap.xml (94 URLs). Not required for
     indexing; what it buys is confirmation Google can index us, the search
     queries people actually arrive on, deindexing alerts, re-index requests
     (useful now that /success-stories/flipbook retired and 46 case-study URLs
     appeared), and Core Web Vitals FIELD data — the right next step for perf
     instead of chasing lab numbers.
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
      Providers). Kiosk consequence (tablets were primed against the retired
      hostname) is tracked in the Kiosk review section, not here.

- [x] Test/staging environment LIVE (28 Jul): https://test.petromac.co.nz
      — public but noindex (staging identity build). Two stacks on
      klaratech-1 (prod :3015/:8012 tag :prod; test :3016/:8013 tag
      :staging), tunnel ingress + DNS added, all 29 zone records now
      carry descriptive Cloudflare comments. CI: every push deploys TEST
      only (deploy-staging.yml); production changes ONLY via the
      "Promote to Production" workflow (deploy-prod.yml,
      workflow_dispatch — the go-live button). Also fixed latent gap:
      API_BASE_URL now absolute (docker-network URL) in both frontend
      env files. Entra redirect URI
      https://test.petromac.co.nz/auth/microsoft/callback ADDED by Rajesh
      (28 Jul) — intranet sign-in works on the test site, nothing
      outstanding. First-day gotcha worth remembering: the new subdomain
      appeared dead locally for ~an hour because the ISP resolver had
      cached the pre-existence NXDOMAIN; the site was serving fine all
      along (confirmed by pinning the Cloudflare IP with `curl --resolve`)
      and a local `dscacheutil -flushcache` cannot clear an upstream
      negative cache. Fixed by pointing Wi-Fi DNS at 1.1.1.1.

## Security / hardening

- [x] Send-as-staff now survives the whole 12 h session INCLUDING deploys
      (28 Jul, two rounds): the ~1 h delegated Graph token had no refresh
      path, so "email as me" silently fell back to info@ an hour after
      sign-in (Rajesh hit this on the success-stories send). Round 1 added
      on-demand refresh + rotation in /api/staff/send-pdf, a
      refreshability flag on /api/staff/session, and "sends from X" on
      EmailPdfButton so a fallback is never silent — but parked the
      refresh token in an IN-MEMORY server store, so every deploy emptied
      it and the bug came straight back (Rajesh hit it again the same
      morning, after three deploys). Round 2 moved the refresh token into
      its own encrypted httpOnly cookie (`petromac_staff_rt`,
      AES-256-GCM under STAFF_SESSION_SECRET, same size guard + expiry as
      the session cookie; cleared on sign-out and on a revoked-token
      refresh failure) and DELETED `lib/auth/tokenStore.ts` entirely — no
      server-side state, so restarts/deploys/multi-replica are all fine.
      3 unit tests cover the new cookie (round-trip, expiry, garbage +
      wrong-payload rejection). Note: sessions created before round 2
      have no refresh cookie — one fresh sign-in per user is needed.
      Also fixed: PDF emails linked www.petromac.com → .co.nz.

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
      .env.local.
- [ ] Turnstile hardening: drop "localhost" from the widget's hostname list
      (dev never uses the real key — it uses Cloudflare's always-pass TEST
      keys, so localhost is dead weight in the live widget's allowed
      hostnames). BLOCKED FOR CLAUDE, needs Rajesh: the API token on
      klaratech-1 (`/root/.cloudflare-token`) can read the zone but returns
      `Authentication error` (code 10000) on
      `/accounts/{acct}/challenges/widgets` — it has no Turnstile scope.
      Either add **Turnstile: Edit** to that token (then it's API-doable from
      the server), or do it in the dashboard: Turnstile → widget "petromac"
      (sitekey `0x4AAAAAAD_qL5ZoaGRaXC4U`, account
      `c6daece9c636efbd35ceea6353f48553`) → Hostname Management → remove
      `localhost`. Keep `petromac.co.nz` — Turnstile matches subdomains, so
      that one entry covers www + test. `klaratech.it` should already be gone
      (removed at retirement); worth confirming while in there.
- [x] Turnstile REARCHITECTED to challenge on submit (28 Jul, Rajesh's call —
      "start the verification loop once they hit send instead of before").
      The verify-on-mount design was wrong twice over and produced
      "Verifying…" forever then "verification didn't complete": 1. `empty:hidden` on the container was a DEADLOCK — Turnstile cannot run
      a challenge inside a `display:none` element, so it never injected
      anything, so the `:empty` rule stayed applied, so it stayed hidden.
      Never hide the container. This is the bug that broke sends outright. 2. Even without that, gating a submit button on a pre-fetched token is
      fragile: the 12 s fail-open grace LATCHED, so the gate only worked
      for the first submit and every later send went out tokenless; and an
      invisible widget can't explain why Send is disabled.
      Now: `execution: 'execute'` + `appearance: 'interaction-only'`, so
      mounting costs nothing (no challenge, no token, nothing drawn) and the
      parent awaits `getTokenRef.current()` on submit, which resets then
      executes and resolves with a FRESH single-use token (30 s timeout, '' if
      unavailable — callers still POST, since the backend judges and no-ops
      when its secret is unset for dev). All gating state deleted from
      ContactForm / EmailPdfAction / EmailPdfButton: no verified/grace/arm
      flags, no "Verifying…" hold. ContactForm sets
      `cf-turnstile-response` on the FormData explicitly, since in execute
      mode the hidden input isn't populated when FormData is snapshotted.
      Also dropped the IntersectionObserver gate (the script must be ready
      before submit, and with no challenge on mount there's nothing to defer).
      VERIFIED in a real browser: script loads on mount, execute() minted a
      token in ~900 ms with no interaction and no visible widget, and three
      consecutive reset→execute rounds each produced a fresh token — the
      repeat-send case that was failing.
- [x] Turnstile widget made INVISIBLE site-wide (28 Jul): after the
      PDF-email surfaces, the CONTACT form got the same
      `appearance="interaction-only"` treatment on Rajesh's go-ahead, so
      verification is invisible for visitors who pass silently and only
      appears if Cloudflare demands interaction. Theme stays dark there to
      match the panel for that case; `empty:hidden` keeps the collapsed
      container from eating a `space-y-5` gap. Submit still shows
      "Verifying…" while held, so the wait is never unexplained, and the 12 s
      fail-open grace + backend enforcement are unchanged. NOTE: this relies
      on the widget being in Cloudflare's **Managed** mode (it is) — under
      Managed, Turnstile still runs silently and fires the token callback
      without drawing anything.
- [x] PDF-email: public sends FIXED + hardened (28 Jul). The original note
      ("consider explicit recipient allowlist") was the wrong remedy —
      `/api/email/send-pdf` backs the PUBLIC catalog action
      (`EmailPdfAction`, placeholder `name@company.com`), so prospects type
      arbitrary addresses and a recipient allowlist would break the feature
      by design. What was actually wrong, read off the server:
      `ALLOWED_EMAIL_DOMAINS=petromac.co.nz,petromac.com` (recipients list
      unset) meant `is_recipient_allowed()` permitted ONLY petromac
      addresses, so **every real prospect got a 403** shown as the generic
      "Couldn't send." Staff sends were unaffected — `/api/staff/send-pdf`
      (Next.js → Graph `/me/sendMail`) never consults that allowlist — which
      is exactly why it went unnoticed in testing.
      Shipped, both halves together (widening alone would have opened an
      abuse vector): - `is_recipient_allowed()` now accepts `*` in `ALLOWED_EMAIL_DOMAINS`
      = any domain, and the server env is set to `*`. Unset behaviour
      (default recipient only) and explicit narrow lists still work. - Turnstile now enforced on `/api/email/send-pdf`: `turnstileToken` on
      `SendPdfRequest`, verified via the existing `verify_turnstile()`
      BEFORE the PDF build/Graph send. Same semantics as the contact form
      — fails CLOSED on a missing/bad token, OPEN on a siteverify outage,
      no-op when `TURNSTILE_SECRET_KEY` is unset (dev/staging keep
      working). Needed no new secret; it was already set server-side. - `TurnstileWidget` gained an `onToken` prop, because these endpoints
      are JSON — unlike the contact form, which posts FormData and gets
      the hidden `cf-turnstile-response` input for free. - Widget added to `EmailPdfAction` + `EmailPdfButton`, but ONLY on the
      public path (`!canSendAsStaff`), so the kiosk never sees a CAPTCHA —
      a staff session is the stronger check. `forcePublic` covers a staff
      token lapsing mid-session: the send 401s, we fall back to public, and
      the widget appears so the retry can carry a token. 12 s fail-open
      grace + single-use token reset + a specific "verification didn't
      complete" message on 403, matching the contact form.
      Verified: allowlist exercised across wildcard / narrow / unset (narrow
      reproduces the original bug), and the Turnstile gate confirmed to fail
      closed with a secret set and open with none. Live end-to-end confirmed
      by Rajesh on prod — both info@ and signed-in-as-staff sends work.
      DEPLOY ORDERING LESSON: the env value and the code must land together.
      Rajesh ran the test + prod env commands back-to-back before promoting,
      which left prod on OLD code reading `ALLOWED_EMAIL_DOMAINS=*` — the old
      `is_recipient_allowed()` has no wildcard branch, so it treated `*` as a
      literal domain and rejected EVERY address (petromac ones included).
      Contact form was unaffected (`is_recipient_allowed` is called from
      `send_pdf` only). Fixed by promoting. Next time make the code accept
      BOTH old and new config shapes in the same deploy so ordering cannot
      matter, rather than relying on a documented sequence.
      Follow-up (28 Jul): widget made INVISIBLE on the PDF-email surfaces —
      Rajesh reported it looked out of place, which it was: hardcoded
      `theme: 'dark'` + `appearance: 'always'` on WHITE cards. TurnstileWidget
      now takes `theme` / `appearance` / `className` props; the two PDF
      widgets pass `theme="light"` + `appearance="interaction-only"` (renders
      nothing unless Cloudflare actually demands interaction, so a challenged
      visitor still has a way through) + `empty:hidden` so an invisible widget
      contributes no layout. Defaults stay `dark`/`always`, so the CONTACT
      form is deliberately unchanged — its dark panel already matches, and it
      is the validated primary lead path. Switch it only on purpose.
- [x] staffAuth unit tests DONE (28 Jul): 19 tests — session cookie
      round-trip/expiry/tamper/wrong-secret, OAuth state TTL + nonce,
      timing-safe compare, Graph-token skew, config detection, cookie
      attributes. Wired `pnpm test:unit` (node:test via tsx) into CI and
      the pre-push hook — unit tests previously existed but NEVER ran
      anywhere (one had silently drifted from the implementation).

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

## Track record

- [x] French Guiana was highlighted although no work happened there (28 Jul,
      reported by a reviewer). The jobs are in metropolitan FRANCE and in
      GUYANA; nothing in French Guiana. It lit up only because world-50m has a
      single France feature whose MultiPolygon includes the overseas
      departments, so shading France shaded French Guiana too — and the
      tooltip over that territory read "France: 16 deployments".
      Fix is geometry-only: split poly 9 (lon -54.6..-51.7, lat 2.1..5.8,
      identified by decoding every polygon's bbox) out of France into its own
      `French Guiana` Polygon feature, id 254. France keeps Corsica, the
      mainland, Mayotte, Réunion, Martinique and Guadeloupe — verified none of
      its remaining polygons fall in the Guiana box. French Guiana now has no
      data, so it renders unshaded like any other country with no jobs.
      The DATA is unchanged and correct: France = 16 deployments, Guyana = 58.
      (I first mis-read the report and renamed the France rows to French
      Guiana — reverted. `COUNTRY_NORMALIZATION` now carries an explicit note
      NOT to alias France, so nobody repeats it.)
      Verified via the map's own `calculateCountryStats`: France 16, French
      Guiana absent, Guyana 58 unchanged.

## Analytics & legal

- [x] Cloudflare Web Analytics wired in (28 Jul): `WebAnalytics.tsx` in the root
      layout, gated on `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` **and**
      `isProductionSite()`, so test.petromac traffic never lands in the numbers
      and an unset token ships no script at all. CSP updated —
      `static.cloudflareinsights.com` in script-src, `cloudflareinsights.com` in
      connect-src (the beacon would otherwise be silently blocked).
      Chose it over GA4 deliberately: cookieless, no fingerprinting, no
      cross-site tracking, therefore **no consent banner needed** — which the
      site doesn't have. GA4 sets cookies, so with EU visitors it would need a
      consent mechanism and a privacy rewrite: a much bigger job than the
      analytics itself.
- [x] Token wired end to end (28 Jul). Repo variable
      `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` added. IMPORTANT gap found afterwards:
      a repo variable alone does nothing — `NEXT_PUBLIC_*` values only reach a
      Next build through Docker **build-args**, and this one was never plumbed.
      Added `ARG`/`ENV` in the Dockerfile and the build-arg in
      deploy-prod.yml. Verified locally: a production-identity build with the
      token inlines `beacon.min.js` + the token into the HTML; without it, no
      script ships at all. Deliberately NOT passed in deploy-staging.yml —
      `WebAnalytics` already gates on `isProductionSite()` (verified false for
      the test URL), and withholding the token is a second, unconditional
      guard so our own testing can never reach the production numbers.
- [ ] **DECISION NEEDED — two beacons.** Cloudflare's Web Analytics site is set
      to "Enable, excluding visitor data in the EU", which AUTO-INJECTS the
      beacon into proxied HTML. The app now ships its own beacon too, so
      non-EU pageviews will be counted twice. Pick one:
      (a) switch Cloudflare to "Enable with JS Snippet installation" and keep
      the app's — RECOMMENDED, because it captures EU visitors too (Norway,
      France, and EU prospects matter here) and excludes test.petromac; or
      (b) delete `WebAnalytics.tsx` and rely on auto-injection — simpler, but
      loses all EU data and counts test traffic.
      Symptom to watch meanwhile: pageviews roughly double for non-EU regions.
      (Note: a curl from Italy shows NO beacon on production, which is
      consistent with the EU-exclusion setting rather than a fault.)
- [x] Cookie audit (28 Jul): **no cookies on public pages** — verified with
      zero `Set-Cookie` headers on / and /catalog in production. The only
      cookies in the codebase are the three staff-auth ones
      (`petromac_staff_session`, `petromac_staff_rt`,
      `petromac_staff_oauth_state`), set only after an intranet sign-in and
      strictly necessary for it. Cloudflare may add a short-lived bot-detection
      cookie. Conclusion: no consent banner required, and none should be added
      unless something cookie-setting is introduced later.
- [x] Privacy policy cookies/analytics section corrected (28 Jul). It claimed
      "We use Google Analytics" — inherited verbatim from the WordPress site,
      where GA really did run. It was never true of this site: no analytics of
      any kind existed until Cloudflare Web Analytics went in the same day. So
      this was stale migration copy, NOT a departure from counsel's drafting,
      and needs no sign-off (confirmed with Rajesh). Rewritten to match the
      code, bumped to Version 2.4 / 28 July 2026. The cookieless claim is what
      justifies having no consent banner, so if anything cookie-setting is ever
      added (GA4, ad pixels, cookie-setting embeds) this section and the banner
      question both have to be revisited. Terms of Use needed NO change — it
      only cross-references the privacy policy.
      Contact address stays `info@petromac.co.nz` for privacy and terms
      (confirmed — it's monitored).

## Cloudflare edge caching

- [x] `/data/*.json` and `/_next/image` now edge-cached (28 Jul). Both returned
      `cf-cache-status: DYNAMIC`, so every visitor hit the Hetzner origin —
      Cloudflare doesn't cache `.json` by default, and doesn't cache
      query-string URLs like `/_next/image?url=…&w=…&q=…` without a rule. Found
      by reading response headers; Lighthouse cannot see this.
      Two Cache Rules created (zone `petromac.co.nz`, Caching → Cache Rules):
      `Edge cache data JSON` — path starts with `/data/` and ends with `.json`;
      `Edge cache Next image optimizer` — path equals `/_next/image`. Both
      Eligible for cache, Edge TTL "use cache-control header if present, bypass
      if not" (= `edge_ttl.mode: respect_origin`; there is NO option literally
      labelled "Respect origin TTL" on Edge TTL, unlike Browser TTL which does
      have one and defaults to **Bypass cache** — so leaving Browser TTL
      untouched would have set browser bypass). Cache Key left at default,
      which matters for `/_next/image`: the query string must stay in the key.
      Verified independently: operations_data.json HIT, country_labels.json HIT
      (so the rule covers all `/data/*.json`), and `w=256` HIT while `w=640`
      MISS — proving the query string is in the cache key. Untouched classes
      unchanged: `/_next/static/*` still HIT, homepage HTML still DYNAMIC by
      design. The API token on klaratech-1 CANNOT write Cache Rules
      ("request is not authorized") — it has DNS/settings/bots but not Cache
      Rules; this was done via the dashboard.
      Also closed two unknowns while in there: **zero Page Rules** exist (so
      nothing legacy overrides these), and the zone-owned redirect ruleset from
      27 Jul is just "Apex to www (canonical)" — a 301 from the cutover.
- [ ] Zone **Browser Cache TTL is 14400 (4 h)**, but docs/DECISIONS say it
      should be "Respect Existing Headers" — otherwise Cloudflare overrides the
      cadence-based `max-age` values set in `next.config.ts` for browsers.
      Confirmed unchanged at 14400 twice. Worth deciding: either set it to
      Respect Existing Headers, or update the docs to match reality. Note the
      new Cache Rules set Browser TTL to respect-origin for their own paths, so
      this now only affects everything else.

## Performance regression — FIX FIRST (28 Jul)

- [ ] **Homepage perf 89 → 68, LCP 3.8s → 6.6s, FCP 1.1s → 3.0s** (mobile,
      production, reproducible across 3 runs — not variance). Cause is MINE:
      the on-submit Turnstile rework dropped the IntersectionObserver gate on
      the reasoning that "nothing is deferred when mounting is free". Mounting
      is NOT free — the challenge doesn't run, but the script still DOWNLOADS.
      Network records for the homepage now show ~128 KB of Turnstile at page
      load (`api.js` + a 26 KB inner script + a 102 KB challenge-platform
      bundle) on a page where most visitors never touch the contact form, plus
      11 KB for the analytics beacon. LCP is 89% RENDER DELAY — the main thread
      is parsing third-party JS instead of painting.
      FIX: load the Turnstile script on FIRST INTERACTION with the form (focus
      or first keystroke on any field), not on mount. The challenge only runs
      at submit, so first-focus gives ample lead time at zero page-load cost,
      and it cannot reintroduce the hidden-container deadlock because the
      container is visible by then. `getTokenRef()` already awaits readiness,
      so it also covers a submit that somehow beats the load.
      Also set the analytics beacon to `strategy="lazyOnload"`.
      VERIFY: Lighthouse mobile on / back to ~89 and LCP under 4s, THEN a real
      contact-form submit twice in a row, plus one PDF email — this is the third
      change to the Turnstile path in a day and the previous two both broke
      sends.
      /track-record also went 92 → 69 with TBT 310ms → 420ms; re-measure after
      this fix before investigating separately, since the same two scripts load
      there and `trimWorld` client work may also contribute.

## Contact drawer (next up)

- [x] Contact form short-message copy fixed (28 Jul). The friendly sentence was
      unreachable: the textarea's `minLength={10}` made Chrome block submission
      first with its own "Please lengthen this text to 10 characters or more" —
      the exact robotic phrasing we were removing. Now validated in the submit
      handler with the same wording the backend returns.
- [ ] **Email icon in the header → contact form in a slide-out drawer**, so a
      visitor can send a message without leaving the page they're browsing.
      Design settled, one constraint verified the hard way: - Reuse the `LegalDrawer` LOOK (same slide-out, backdrop, Escape-to-close,
      focus handling) but NOT its mounting strategy. LegalDrawer stays in the
      DOM permanently and hides via `aria-hidden`/`inert`. **Turnstile cannot
      run a challenge inside a hidden container** — that is precisely the
      deadlock that broke all email sends on 28 Jul. The contact drawer must
      CONDITIONALLY RENDER `ContactForm` on open and unmount on close, so the
      widget mounts into a visible container each time. - `ContactForm` is already self-contained and theme-dark, and `/contact`
      must stay as a real route for direct links and SEO — same split as
      privacy/terms (shared content component, two surfaces). - Header has TWO icon sites to update: desktop (~Header.tsx:195) and the
      mobile menu (~:322). - Leave `/catalog`'s "Contact our regional managers" pointing at the full
      PAGE. Different intent: someone at the bottom of the catalog has
      finished browsing, so a page is fine; the header icon serves people
      mid-browse who don't want to lose their place. - VERIFY after building: submit a real message from the drawer, twice in
      a row (the repeat-send case that exposed the Turnstile grace-flag bug),
      and confirm the widget mounts on each open.

## Kiosk review (full pass) — OPEN, keep adding here

Standing home for ALL kiosk work. There is a lot to do on the trade-show
surfaces, so new kiosk findings go in this list rather than getting scattered
across the go-live checklist, backlog and content sections. Nothing here is
scheduled; it is a review backlog to work through as a block.

### Code / behaviour

- [ ] Phase 2 of the flipbook retirement — get the kiosk off
      `SuccessStoriesFlipbook`. Two consumers: the thin
      `/intranet/kiosk/successstories` wrapper, and the real work,
      `LogsScreen.tsx`'s CH-lane **Case Studies** takeover with per-product
      preset filters (tap Helix/Rocker → that product's stories). Rebuild on
      the case-studies data, reusing `src/features/case-studies/filters.ts`
      (already pure + unit-tested for exactly this). Detail in the
      flipbook-retirement section below.
- [ ] Offline prime budget — CHECK BEFORE building phase 2. The flipbook is 1
      route + 52 images; per-story case-studies routes would be 46, and the
      manifest holds only ~11 route entries today against
      `MAX_STATIC_ENTRIES = 80`, shared with the JS chunks. Either raise the
      cap or give the kiosk ONE filtered list view instead of 46 routes — the
      single view is probably better kiosk UX regardless, since nobody
      deep-links on a tablet mid-conversation.
- [ ] CH lane "Other" experience — still a Coming-soon placeholder.
- [ ] Move the tablets to the production origin: launch URL
      `https://www.petromac.co.nz/intranet/kiosk?sd=1`, sign in, prime, verify
      offline. Keep the `?sd=1` (skips the HD probe, so a prime stays ~50 MB of
      SD video). Driver is the ORIGIN move, not a cache version — SW caches are
      origin-scoped and the tablets were primed against the retired
      petromac.klaratech.it, so those caches are unreachable rather than stale.
      A routine code deploy needs neither a re-prime nor a version bump:
      navigations are `networkFirst`, `/_next/static/` is content-hashed, and
      `kiosk-offline-assets.json` lists only stable paths. SW `VERSION` was
      bumped v18 → v19 on 28 Jul deliberately ahead of this, so the first prime
      lands on the final version. See docs/KIOSK.md.

### Content / assets (designer-dependent)

- [ ] Helix product image — kiosk surfaces currently reuse the focus.png logo
      (see ASSET_MANIFEST §1.4)
- [ ] Corner-badge tool silhouettes — Helix/Rocker badges reuse focus.png
- [ ] Case Studies images: `helix-cbl-setup.png`, `rocker-logs-1.png`
- [ ] OH lane mechanism videos + case-study log images (Formation Testing /
      High Deviation / PathFinder)
- [ ] `kiosk-hd/WirelineExpress-subtitled.mp4` 1080p master
- [ ] Thor product video (card commented out until ready); Rocker GLB model
- [ ] Rocker mechanism force-section schematic (interim crop in place)

## Flipbook retirement (phased, Jul 2026)

Decided after checking whether the flipbook still earned its keep: the same 46
stories render twice from one source, and `/case-studies` wins on everything
public (per-story URLs, real text, JSON-LD, sitemap). The measured gap is ~9%
of the PDF's text — figure captions, chart axis labels, subtitles, SPE refs —
which the extractor collects as `trailing` and never emits; all of it is still
visible in each story's published-page image. The INGEST pipeline is NOT
retired and never can be: `/case-studies` uses the generated page webps as its
visuals, so `source.pdf` + `pnpm run data` stay.

- [x] **Phase 1 — public flipbook retired (Jul 2026).**
      `/success-stories/flipbook` + `/success-stories` 308 → `/case-studies`,
      route deleted, dropped from the sitemap, and all 8 internal links
      repointed (contact, case-studies index + slug, track-record ×4,
      DrilldownMapCore, homepage ChallengeSelector — the map's `<a>` became a
      `next/link` to satisfy the lint rule). `/track-record?stories=1` now
      lands on `/case-studies` too. New `CaseStudiesBrowser` client island:
      free-text search + region/challenge/product filters, result count,
      Clear, and the filtered set as a PDF (download + email) — every story
      carries its flipbook `page`, which is what the PDF endpoints take, so
      nothing was lost. Filter logic is pure in
      `src/features/case-studies/filters.ts` with 10 unit tests, ready for
      phase 2 to reuse. All 46 cards remain in the SSR HTML for crawlers/no-JS.
      Fixed in passing: white-on-emerald-600 in `EmailPdfButton` was 3.65:1,
      under the 4.5:1 AA floor — now emerald-700, so a11y is 100 (this was
      pre-existing on the flipbook page, just newly visible).
- [ ] **Phase 2 — kiosk off the flipbook.** Tracked in the **Kiosk review**
      section above (with the prime-budget check it depends on), since it's
      kiosk work and all of that now lives in one place.
- [ ] **Phase 3 — delete the viewer.** Only after phase 2: `Flipbook.tsx`,
      `SuccessStoriesFlipbook.tsx`, `FlipbookErrorBoundary.tsx`,
      `SuccessStoriesFilters` and the success-stories feature services. KEEP
      the ingest pipeline and `public/flipbooks/success-stories/pages/*.webp`.
- [x] Success-stories PDF keeps its cover + back page (28 Jul): a filtered
      extract was just the story pages, so it lost the cover and — more
      importantly — the back page carrying the regional-manager contacts,
      which is the point of a PDF you email a prospect. `build_success_stories_pdf`
      now wraps any page selection in the publication's first and last page,
      derived from the file rather than hardcoded so a new edition with a
      different page count still works, and de-duped in case a selection
      already contains them. Pages 2-3 are editorial front matter and stay OUT
      of extracts, so a two-story PDF isn't mostly preamble. Unfiltered now
      sends NO page list at all, so it returns the source untouched — the whole
      50-page publication including that front matter. Verified: unfiltered 50,
      3 stories → 5, 1 story → 3, all 46 → 48, cover first and contacts last
      in every case.
- [ ] Fix the `tags.csv` category typo at source: "Well Access:Deviation" (4
      rows) → "Well Access: Deviation" (17 rows) — same category, missing
      space. `filters.ts` normalizes it so the UI shows one merged option
      (21), but the data should be clean. Also worth deciding whether the
      dropped `trailing` text (captions/refs) should be emitted into a
      captions field for SEO + screen readers.

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
- [x] SEO audit remainder DONE (28 Jul) — Lighthouse/CWV pass run against
      PRODUCTION (mobile, post-promote build). Baseline:
      | page | perf | a11y | BP | SEO | LCP | TBT | CLS |
      | / | 89 | 97 | 100 | 100 | 3.8 s | 10 ms | 0.015 |
      | /catalog | 84 | 100 | 100 | 100 | 4.3 s | 20 ms | 0 |
      | /track-record | 92 | 100 | 100 | 100 | 2.1 s | 310 ms | 0.046 |
      **SEO + best-practices are 100 everywhere** — the structured-data half
      (canonicals, per-page OG, JSON-LD, env-derived robots/sitemap, staging
      noindex + launch guard) is confirmed clean on the live domain.
      Findings on the two LCP outliers, both investigated and NOT worth
      chasing: assets are already near their floor — the hero poster is
      served as an 18 KB AVIF (next/image `formats: [avif, webp]` +
      `priority`), the two woff2 faces are 40/48 KB in <45 ms, TBT ≤310 ms
      and CLS ≤0.046 are inside "good". Home LCP is 81% "Load Time" on the
      hero AVIF and /catalog LCP is 89% "Render Delay" on a TEXT node with
      ZERO load time — i.e. both are artifacts of Lighthouse's SIMULATED
      throttling, not real bytes. Correct next step is FIELD data (Search
      Console → Core Web Vitals / CrUX) once there's traffic, rather than
      optimising against lab numbers. Reports kept out of git.
- [ ] Homepage a11y: `color-contrast` is the ONLY remaining audit failure
      (a11y 97) and it is a FALSE POSITIVE — do not "fix" the colors. axe
      samples text mid-`.scroll-reveal`, whose keyframe animates
      `opacity: 0 → 1`, so it reads near-white foregrounds (#f5f7fb,
      #f6f7f8 …) against white and reports 1.07. The real values pass
      comfortably (`text-brand` #1E4A9A on white ≈ 7.4:1, AAA). Every
      flagged node sits in a below-the-fold `.scroll-reveal` section. Only
      worth acting on if an external accessibility scan needs a clean
      sheet — then gate the reveal on a `prefers-reduced-motion`-style
      static fallback rather than changing the palette.
- [ ] Athena terminal (/simulation) shows illustrative values — confirm
      `MRIL-XL`, `--taxis 4`, and "est. rig time saved: 8.2 hrs" with the
      product team or swap in real simulation numbers
- [ ] Longer term: job history off Excel into a database-backed source
- [x] Stale automation retired (28 Jul): `data-build.yaml` workflow
      deleted (weekly scheduled no-op tied to the pre-drop-zone xlsx-URL
      secrets) and `scripts/daily-operations-update.sh` + its Mac
      LaunchAgent `com.petromac.data-update` removed (unloaded; backups
      of both in `Website_Archive/retired-automation/`). Content updates
      are drop-zone + manual runs per docs/ADMIN.md.
- [x] `pdf-flipbooks-build.yml` RETIRED (28 Jul): reviewed — despite the
      name it built nothing (no pipeline script was ever invoked) and its
      commit-and-push step could never produce a diff, since `sources/` is
      gitignored so CI has no inputs. It did, however, hold the ONLY run of
      `validate:flipbooks` + `validate:successstories` anywhere in CI, and
      only fired when one of three pipeline scripts changed. Fix: added
      `pnpm run data:check` (both validators) to ci.yml so the committed
      flipbook assets + tags CSV are guarded on EVERY push, then deleted
      the workflow — which also drops a pointless poppler/python install
      and a bot push-to-main. Validators are pure Node; both pass.
      Archived at `Website_Archive/retired-automation/`.

## Notes

- Email sends via Microsoft Graph app-only `Mail.Send` as the `info@`
  shared mailbox (not SMTP, not Brevo — org-standard deviation; see
  docs/DECISIONS.md). Revisit if it becomes a maintenance burden.
