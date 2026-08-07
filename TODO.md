# TODO

Open work only. History and rationale: [docs/DECISIONS.md](docs/DECISIONS.md) + git log.

## Nav / About restructure (7 Aug 2026)

- [x] **About is a disclosure, not a destination.** Clicking it opens the
      menu and navigates nowhere (a `<button>`, not a `<Link>`), so `/about`
      has exactly one entry point again: **Origins**, back in the dropdown
      and named after the page's own H1. Menu is now Origins / Team /
      Patents. `isSubActive` regained its exact-match special case for
      `/about` — without it Origins prefix-matches `/about/patents` and two
      entries read as current at once (that special case was deleted when
      Origins was removed, and had to come back with it).
- [x] **Logo now returns you to the top.** Clicking it while already on the
      homepage was a same-URL navigation Next ignores, so nothing happened
      and you stayed mid-page. Measured on production: scrollY 2079 -> 2079,
      while the "Home" nav link beside it correctly went to 0. It now routes
      through `handleNavClick` like every other nav link. Cross-route
      navigation was already fine (verified: /catalog at 1289 -> home at 0),
      so this was the same-route gap left by `a99c756`, not a scroll bug.
- [x] **Where Publications belongs — DECIDED (7 Aug): the Success Stories
      page, and ultimately only there.** Out of the About dropdown and the
      `/about` sidebar; renders as `PublicationsCard` below the story grid.
      Route and sitemap entry unchanged.
- [x] **Download/Email counts turned ON (7 Aug)** after reviewing the page
      with faceted dropdowns live — `SHOW_FILTERED_COUNT_ON_ACTIONS = true`,
      so both buttons read "Download 16" / "Email 16" when filtered and
      "Download all" / "Email all" when not. One word to reverse.
- [ ] **Review the PublicationsCard placement** with the rest of the
      Success Stories page design. It is below the grid on the reasoning
      that the page should read "field record, then formal record", and that
      a card up top would compete with the filter panel — a guess, not a
      finding. The component takes no props, so above the browser or inside
      the header is a one-line move.
- [ ] **Retire the transitional Publications links** on `/about/patents`,
      `/track-record` and `/contact` once the card has settled. They are the
      only entry points besides the card, so remove them together with a
      check — all three gone and the page is reachable from the sitemap
      alone. Rajesh wants to rethink this properly; if it
      moves under success-stories, that is a URL migration needing a 301 and
      a sitemap update, so decide before touching the path.

## Martin's website review (6 Aug 2026) — remaining items

Martin Leonard's review email (5 Aug) was triaged item-by-item against the
code on 6 Aug; root causes below were VERIFIED, not guessed. Shipped same
day: 1080p re-transcodes of the four homepage lightbox videos (`fe15dd1`),
track-record chip label 'Wireline Express - FT' → 'Formation Testing'
(`a8043ff`), and the full Case Studies → Success Stories rename including
the URL, with one-hop 301s and GSC sitemap-resubmit + request-indexing done
(`d25a073`). Remaining, in suggested order:

- [x] **Contact drawer silently eats real messages — FIXED 6 Aug (`f43eac3`),
      live in prod.** Honeypot renamed `company` -> `_hp_check`, too-fast gate
      relaxed 3s -> 2s, and both silent drops now log email + IP so they are
      visible in `docker logs` instead of vanishing. Original diagnosis: Martin's
      "top banner email went nowhere": `/api/contact` returns `{ok:true}`
      while DISCARDING the message when (a) the hidden honeypot input named
      `company` is filled — browser autofill loves filling hidden
      organization/company fields even with autocomplete=off — or (b)
      `_timing` < 3s. Rename the honeypot to something autofill won't
      recognise (e.g. `_hp_field`), consider relaxing the 3s gate, and log
      dropped submissions server-side so drops are at least visible.
      Files: `src/components/public/ContactForm.tsx` (~line 128),
      `backend/app/main.py` `submit_contact` (~line 459).
- [x] **Action-button counts are now ONE SWITCH (7 Aug), currently OFF.**
      `SHOW_FILTERED_COUNT_ON_ACTIONS` + `actionButtonLabel()` in
      `features/case-studies/filters.ts` feed BOTH buttons on BOTH surfaces
      (live browser + `/case-studies-preview`), so Download and Email can
      never drift apart again — which is what Martin actually hit. Off:
      "Download all"/"Email all" unfiltered, "Download"/"Email" filtered. Flip
      the const to `true` for "Download 16"/"Email 16". Rajesh wants to live
      with the faceted dropdowns first and decide; if the team votes for the
      count, it is a one-word change. 25/25 unit tests pass in BOTH switch
      positions.
- [x] **Success-stories filter counts are now FACETED (7 Aug).**
      `buildFacetedCaseStudyOptions` counts each facet against the other
      active filters but NOT its own (so siblings stay reachable — count
      Region against the Region choice and every other region reads 0).
      Free text feeds the counts, so dropdowns agree with the cards. Options
      are never dropped or reordered: an empty combination renders `(0)` and
      disabled, and order comes from the unfiltered tally so entries hold
      position while numbers move. Verified with MENA: Challenges 21 -> 9,
      SLB 36 -> 16, Pathfinder 4 -> 0 (disabled). 22/22 unit tests pass.
- [ ] **NEXT UP → the catalog items below.** Rajesh's call (7 Aug): the
      success-stories page is done for now; catalog navigation is what a
      browsing visitor actually hits.
- [x] **Catalog prev/next is family-scoped (7 Aug).** `adjacentProducts` now
      walks the product's own category instead of the flat print-order list,
      so it stops at the family edges rather than linking into the next
      family. Verified against the real catalog: 3 cross-family links before
      (Pathfinder→TTB-IL6C, CP12→HF-B-WTS, RS7→CX9), 0 after.
- [x] **"Back to the full catalog" added (7 Aug)** at the bottom of family
      AND model pages, above-the-fold breadcrumb kept as-is.
- [ ] Device Finder: the Open hole / Cased hole toggle only relabels the
      size field — it does NOT filter (catalog data has no open/cased
      dimension), so an 8-1/2" open-hole search returns CRIL/CRU/CX9/RO17/
      TWT-28/TWS-30, all cased-hole/intervention tools (Martin's "Purpose
      listings" complaint). Add an environment field per slug in the
      CURATION table in `src/features/catalog/content/enrich.ts` (~30
      one-liners) and make the toggle a real filter. Also discuss with
      Martin whether the Purpose dropdown itself should stay.
- [ ] Catalog: merge the TTB-S75U/S85 page into TTB-S75/S85 with an
      "S75 can be modified to S75U (30 kpsi)" footnote — the two products
      share their description text verbatim (Martin: repetition; same
      pattern as the MDT-85 footnote). Enrichment-layer job; catalog.json
      is generated and must not be hand-edited.
- [x] **High Deviations video audio — RESOLVED 6 Aug** by switching the
      homepage to the full 250s master cut, which HAS narration: the
      subtitled 212.5s cut is silent at every generation INCLUDING its
      original (`originals/WirelineExpress-subtitled.mp4` is itself 540p
      with a -inf dB track — no fixable source exists). `transcoded/
      WirelineExpress.mp4` re-encoded 1080p from `originals/` WITH audio;
      ChallengeSelector now plays it (duration 4:10). Kiosk keeps the
      subtitled cut — burned subtitles do the narrating on a loud floor.
      If a subtitled master with sound ever surfaces, re-burn and revert.
- [x] **`kiosk-hd/` RETIRED (7 Aug).** One video folder now: the kiosk plays
      the same `transcoded/` 1080p files as the site. Removed the folder,
      `useKioskVideo`, the `?sd=1` flag and the manifest's 1080p optional
      entries; promoted the 1080p `dice.mp4` first (the only genuine
      difference). −170 MB from the repo and every image. **kiosk-sw VERSION
      v19 → v20, so the tablets need a re-prime while online**, and the kiosk
      could not be exercised from a Cowork session — verify the lane playlist,
      the CH Helix video and an offline prime on a real device.
- [x] ~~Back up `public/videos/originals/` to SharePoint~~ — NOT NEEDED
      (Rajesh, 7 Aug): copies exist elsewhere.
- [ ] CX7 / CX13 have no catalog pages: they are ABSENT from the 2026 IDML
      source (verified — zero hits in the IDML stories; CX9 has six), so
      this is catalog CONTENT, not extraction. Either add them to the
      InDesign catalog and regenerate, or grow a supplemental-products
      mechanism in the enrichment layer. The kiosk already has CX7/CX13
      images + size ranges (`HelixProductScreen.tsx`) to build from.
      Also fixes Martin's "FOCUS Centralizers missing CX7/CX13".
- [ ] SWHF guides for Baker Hughes / Halliburton (Martin: their vendor
      sections look lonely — SLB 11 / HAL 2 / BHI 1 / universal 2).
      ENGINEERING QUESTION first: do SWHF configurations for BHI/HAL tools
      exist as buildable products? Ask the team; note "SWHF configuration
      figures currently filed under AHFC" in the HTML-catalog section below.
- [ ] Reply to Martin (draft ready to write from this section): thank him —
      three of his items shipped 6 Aug (videos, Formation Testing label,
      Success Stories rename); ask which browser he used (confirms the
      Edge/Enhance and autofill-honeypot theories) and whether SWHF for
      BHI/HAL actually exists.
- [ ] Videos: Martin says categorisation is fine; blur fixed via 1080p
      re-transcode (CRF 22, 2.5 Mbps cap, +faststart) from kiosk-hd
      masters. If sharper sources ever land in `sources/`/SharePoint,
      re-encode from those instead of the second-generation kiosk-hd files.

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
  1. Google Search Console — **DONE 29 Jul.** It turned out a property
     already existed and was live: URL-prefix `https://www.petromac.co.nz/`
     under **rthatha@gmail.com**, with real history (240 clicks / 1.7K
     impressions / CTR 14.1% / avg position 7.3 over 3 months). Personal
     account is fine and stays — Petromac is on Microsoft 365, so there is no
     company Google Workspace account to prefer, and Search Console ownership
     is proved by DNS, not by who owns the domain. What was done:
     - Submitted `https://www.petromac.co.nz/sitemap.xml` → **Success**, 94
       pages discovered.
     - Added a **Domain** property `sc-domain:petromac.co.nz` (covers apex +
       www + every subdomain + http/https) and verified it by DNS TXT.
     - The www property was verified ONLY by **HTML file** — a WP-era
       `google*.html` the Next.js site no longer serves. Google hadn't
       re-checked yet, but it would have unverified the property and silently
       stopped reporting. Both properties now also carry "Domain name
       provider" (DNS) verification, so that can't happen.
     - ONE additive Cloudflare TXT record on the apex:
       `google-site-verification=m10EeI5HB9Fett6Js7GL60fuhOhJ4UKx-OXA36Xw2Zg`
       (record count 29 → 30, nothing else touched). Both properties issue the
       SAME token, so one record covers both. **Don't delete it** — it is what
       keeps verification alive.
     - Declined Google's one-click Cloudflare flow: it works by granting
       Google OAuth **write access to the whole DNS account**, which is not a
       trade worth making for one TXT record on this account.
     - Second Owner DONE (29 Jul): **rv2020nz@gmail.com** (Rolando), Owner on
       both properties. Worth knowing how we got there, because the first
       attempt was a near miss. Adding `rolando@petromac.co.nz` did NOT add
       that address — Petromac is on M365, so a petromac.co.nz address is not a
       Google login, and Google silently resolved it to whichever Google
       account carries it as an alternate, granting THAT account Owner (which
       can add and remove other users). It was removed until Rajesh confirmed
       the account with Rolando directly, then re-added using the Gmail address
       itself. Rule: ask the person for their actual Google account address;
       never type a petromac.co.nz address into a Google user field and trust
       the mapping. Adding or removing on the Domain property propagates to the
       www property — one action covers both.
     - 15 unread Search Console notifications were left unread.
     - Indexing as at 29 Jul: **36 indexed, 33 not** — 30 "Crawled – currently
       not indexed" (normal for the 46 case-study + catalog URLs that only just
       appeared; the sitemap submission is the fix), 1 "Page with redirect"
       (benign), and 2 genuine 404s, now fixed: WordPress served the patent PDFs
       from `/pdf/<file>` and the rebuild moved them to `/patent_pdfs/<file>`
       with identical filenames, so Google was still requesting the old paths
       (`/pdf/MY-169945 B.pdf`, `/pdf/CN108104751B.pdf`, last crawled 26 Jan).
       SUPERSEDED 30 Jul: this was first done as a 308 in `next.config.ts`, but
       the whole redirect table has since moved to `src/lib/redirects.ts` (see
       the SEO & URL migration section) and `/pdf/:file*` is now a literal
       **301**. The four filenames carrying spaces/commas were also renamed, so
       `/pdf/<old name>` folds both moves into a single hop. Verified 200
       `application/pdf` either way.
  2. Rich Results test — **effectively DONE 30 Jul**, and it found two things,
     both since fixed in code: case-study `Article.about` was `Product`
     (→ `Thing`, `98766f5`) and product pages were flagged for a missing
     `offers` field (`37de8ba` — **but see the open decision item in the SEO &
     URL migration section: the fix that shipped claims a $0.00 price and
     should probably be backed out**). Worth ONE re-run of the test on /,
     a product page and /about/publications to confirm clean.
  3. Quick browse of the live site — homepage, catalog, track record,
     case studies, contact form (submit once to see Turnstile). STILL OPEN,
     and now more worth doing than it was: the redirect layer, every page
     title and the CI deploy path all changed on 30 Jul.
  4. NEW — spot-check the six recovered WP URLs on production, with and
     without the trailing slash, and confirm each is a single 301 hop:
     `/contacts/`, `/patents/`, `/origins/`, `/publications/`,
     `/privacy-policy/`, `/terms-of-use/`. The unit test proves the mapping
     table; it does not prove the deployed edge behaves.
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

- [x] **Next 16.2.4 → 16.2.12 + `pnpm audit` in CI (31 Jul).** Prompted by
      Rajesh asking whether the WordPress malware/link-injection experience can
      repeat here. It can't, and the reason is structural, worth writing down:
      there is **no database**, **nothing writes to disk at runtime** (the only
      "write" in the backend is an `io.BytesIO()` buffer for PDF assembly), the
      container is **immutable and rebuilt from git**, and there is no admin UI,
      plugin installer or upload directory. WordPress was injectable because it
      had mutable server-side state that became page content, plus a writable
      directory that was executable. Neither exists here.
      The risk therefore moves to the **supply chain** — hostile code reaches
      production by riding in through a dependency at BUILD time. The audit was
      27 vulnerabilities (14 high); the Next bump took it to **5 (3 high)**.
      All 5 remaining are transitive through `next` itself (postcss, sharp,
      @babel/core) and cannot be fixed here until Next bumps its own ranges —
      which is why the CI gate fires on **critical only**, with a second
      informational step that prints the full count. Gating on `high` would fail
      every run forever and train everyone to ignore a red X.
      Verified after the upgrade: typecheck, lint, 55 unit tests, production
      build, and the full e2e suite incl. the WordPress-migration redirects
      through the real middleware.
- [ ] **Branch protection on `main` + audit who has write access to the
      klaratech org.** Now the highest-value credential by some distance: a
      commit to main auto-deploys TEST, and one button deploys PRODUCTION, so
      repo write access _is_ website write access. Needs Rajesh (GitHub
      settings). Confirm 2FA is enforced org-wide while in there.
- [ ] Optional, bigger job: **nonce-based CSP to drop `'unsafe-inline'`** from
      `script-src`. App Router's inline bootstrap requires it today, which means
      CSP is not a reliable XSS backstop. Low exposure — the site renders no
      user-generated content — but it is the one genuinely soft spot in the
      header set. `src/proxy.ts` already exists, which is where a nonce would go.

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

## SEO & URL migration (30–31 Jul) — the Search Console audit block

All of this is LIVE on production (promoted 31 Jul 05:43 UTC, run 30607605926).
Reasoning for the redirect architecture is in docs/DECISIONS.md; the title
standards are in docs/VOCABULARY_MAP.md.

- [x] **WordPress-migration redirects FIXED (P0, `ac75d14` via PR #2).** The
      30 Jul Search Console audit found six previously-indexed WP pages 404ing,
      `/contacts/` among them at **59 clicks / 1,045 impressions** over six
      months — the site's second-biggest traffic source. Root cause: WordPress
      served every URL with a trailing slash and those are the indexed forms,
      but Next normalises the slash BEFORE consulting `next.config.ts`
      `redirects()`, so `/contacts/` became `/contacts` and only then looked for
      a rule — chaining 308→301 where a rule existed and 404ing where it didn't.
      Fix: `skipTrailingSlashRedirect: true`, `redirects()` deleted from
      next.config, and the whole table moved to `src/lib/redirects.ts` (pure,
      unit-tested) applied by `src/proxy.ts`, which now also owns the ordinary
      `/page/` → `/page` 308. Added 301s for `/contacts`, `/patents`,
      `/origins`, `/publications`, `/privacy-policy`, `/terms-of-use`,
      `/download`, `/category/orientation`, `/author/adm_petromac` — each a
      SINGLE hop with and without the slash. Dead WP feed URLs → 410. Four
      patent PDFs with spaces/commas in their filenames renamed with 301s.
      `redirects.test.ts` asserts no destination is itself redirected.
      **Do not put a redirect back in `next.config.ts`** — that is the trap
      this fixed. CLAUDE.md and DECISIONS.md both record it.
- [x] **Query-string handling narrowed (`f85e997`).** The first cut 404'd
      anything off an allowlist; it now 404s only VALUELESS params. Google had
      crawled `/?11667727895.html` and siblings as separate 200 pages.
      `utm_*`/`gclid`/`fbclid` stay allowed. **A page that starts reading
      `searchParams` without registering it in `ROUTE_QUERY_PARAMS` will 404** —
      that is the live footgun this leaves behind.
- [x] **Vocabulary map applied to every page title** (`ee7f0d6`, `a9f4b1f`,
      `4f3997e`, `7d25c46`, `504e766`, `7419abf`). 14 core/category routes plus
      all 32 product models, all ≤60 SERP chars including the ` | Petromac`
      suffix. Product titles live in `PRODUCT_TITLES` in `enrich.ts` — an
      SEO-ONLY map, so **no visible H1 or product name changed**. The -iser /
      -izer split is now a written policy in the map (§1), not folklore.
- [x] Case-study `Article.about` changed `Product` → `Thing` (`98766f5`) —
      Search Console validation error. Correct: a case study is about a tool,
      it does not offer one.
- [x] **Fake `$0.00` `offers` block REMOVED (31 Jul).** Added in `37de8ba` to
      clear a Search Console structured-data complaint. The 31 Jul audit showed
      it fixed nothing: the Product-snippets report held **Invalid 2 / Valid 0**,
      and both invalid items were **/case-studies pages** (item name "Wireline
      Express"), flagged because `Article.about` was typed as `Product` with no
      offers. NO catalog page was ever in that report. The real fix was
      `about` → `Thing` (`98766f5`, three minutes later) — verified live, that
      page now emits `Thing` and no `Product` node at all, so those 2 invalid
      items are stale and clear on recrawl.
      Meanwhile the block did active harm: a Product carrying a price becomes a
      **merchant listing** to Google, and the Rich Results Test had duly started
      reporting CX9 as one and asking for `shippingDetails` /
      `hasMerchantReturnPolicy` — while publishing "USD 0.00" and "InStock" for
      made-to-order equipment with neither. `offers` is RECOMMENDED, not
      required, for Product snippets; the warning is accepted on purpose. A
      long comment in `catalog/[category]/[slug]/page.tsx` records this so the
      block doesn't get re-added by the next person reading a warning as an
      error. See [[structured-data-warnings-not-errors]] in memory.
- [ ] Vocabulary map §2 is only HALF applied. The six high-yield queries
      (`hrsct`, `bowspring`, `tlc logging`, `holefinder`, `oriented core`,
      `wireline malaysia`) each call for the term in **titles AND copy**. Titles
      are done; the body-copy and H1 pass is not started. That is where the
      remaining ranking upside is — a title alone rarely moves position 23 →
      page 1.
- [ ] Meta DESCRIPTIONS were never in scope of the map (it is a title
      proposal). Worth a follow-up pass now that the titles set the vocabulary.
- [ ] **`/case-studies-preview` is an orphan design-proposal route awaiting
      Rajesh's call** (`c2bfad3`, refined `b4f7afd`/`7419abf`). Nothing links to
      it, it is out of the sitemap, and it carries an explicit
      `robots: index:false` because none of that makes a public URL private.
      It duplicates `CaseStudiesBrowser` as `CaseStudiesBrowserPreview` (297
      lines, dark theme). Decide: promote the design to `/success-stories` and
      delete the preview, or delete the preview. Do not leave a second copy of
      the browser drifting — the two will diverge. (7 Aug: they briefly did.
      Faceted counts landed in the live browser only; the preview was brought
      back in line the same day and both now share `actionButtonLabel` +
      `buildFacetedCaseStudyOptions`. That is the second time this route has
      cost real work — it argues for deleting it.)

## CI, build & repo hygiene (30 Jul)

- [x] **E2E suite actually runs in CI now** (`9f6eea0` + `a18ce15`). The smoke
      suite was rewritten against the current site (it had drifted), Playwright
      manages its own `next start`, and it runs as its own `e2e` job. Point it
      at a deployed env with `PLAYWRIGHT_BASE_URL=https://test.petromac.co.nz`.
- [x] **Patent PDFs shrunk 206 MB → 130 MB** (`88d89a1` via PR #4), via
      `scripts/python/compress_patent_pdfs.py` / `pnpm run data:patents`
      (dry-run by default, `--apply` to write). NOTE this is deliberately NOT
      the `/ebook` recipe the catalog uses — that recipe makes these scans
      BIGGER. Documented in docs/ADMIN.md §3.
- [x] **Docker pull race fixed** (`d6867c2`, `f1b764a`). Parallel image pulls
      hit containerd layer-ingestion races (`commit failed: rename … /ingest/…`);
      both deploy workflows now pull sequentially and `docker logout ghcr.io`
      afterwards so ephemeral tokens don't sit in `/root/.docker/config.json`.
      DEPLOY.md carries the fix plus the disk-reclaim command for klaratech-1.
- [x] Docs sweep (`105630c`) — verified claims against code and live headers
      rather than against each other. Fixed three docs that still said "push to
      main deploys production" (it deploys TEST). AGENTS.md was a forgotten
      stale copy of CLAUDE.md, now a pointer. Gap found and documented in three
      places: `build_case_studies.py` is NOT part of `pnpm run data`, so a
      success-stories update that skips it leaves 46 live pages on the old
      edition.

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
- [x] **Two beacons — RESOLVED, option (a) was taken** (confirmed in the
      Cloudflare dashboard 31 Jul 2026). The RUM setting for petromac.co.nz
      reads "**Enable with JS Snippet installation**", so Cloudflare no longer
      auto-injects and the app's own `WebAnalytics.tsx` beacon is the only one.
      Confirming signal: EU visitors now appear in the country breakdown
      (Italy, Ireland), which auto-injection with EU-exclusion could never have
      produced. No double counting.
      Worth knowing for next time: this could NOT be settled by curling
      production from Italy — an EU request sees no injected beacon under
      EITHER setting, so the HTML looks identical whichever mode is active.
      The dashboard (or a non-EU vantage point) is the only way to tell. The
      zone API token can't read it either: Web Analytics is an ACCOUNT-level
      resource and that token is zone-scoped.
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
- [x] Zone **Browser Cache TTL** — RESOLVED (verified 29 Jul). This entry and
      docs/DECISIONS.md contradicted each other (14400 vs "now 0 = Respect
      Existing Headers"); the live response headers settle it in DECISIONS'
      favour. A hashed chunk under `/_next/static/` returns
      `max-age=31536000, immutable` and `/data/operations_stats.json` returns
      `max-age=86400, stale-while-revalidate=604800` — both the origin's own
      values, reaching the browser intact. On a 4 h zone override they would
      read `max-age=14400`. `/_next/static/` is covered by neither Cache Rule
      (they scope to `/data/*.json` and `/_next/image`), so the zone setting
      itself must be respecting headers. Leave it alone: raising it re-breaks
      the cadence policy in `next.config.ts` for every path without a rule.

## Lighthouse lab scores are NOISY here — read before optimising (29 Jul)

**Three runs of IDENTICAL code on test scored 84, 85 and 97, with LCP 4.1s,
4.1s and 2.5s.** A 13-point / 1.6-second spread with nothing changed. Measured
from Italy over the public internet against a Cloudflare edge, so LCP (the hero
poster fetch) swings with network conditions.

Consequences, learned the hard way in this session:

- **Do not draw conclusions from single runs, or from comparing N runs to 1.**
  I declared the Phase 2 code-splitting "consistently worse, not variance" by
  comparing its three runs (88/84/87) against ONE Phase 1 run of 93. That was
  unsound; the difference was probably noise. The revert that followed is
  harmless but was NOT evidence-driven, whatever the commit message implies.
- **Trust STRUCTURAL measurements instead** — they're deterministic and
  verifiable: bytes on the wire (`curl -w %{size_download}`), what's in the
  served HTML (`curl | grep -c`), request counts and `cf-cache-status` from
  response headers, bundle sizes from `ANALYZE=true pnpm run build`. Every real
  win today was confirmed this way, not by a score: the favicon (59.7KB → 8.3KB),
  the privacy text off every page (document → 12KB), Turnstile's ~128KB gone from
  page load (0 third-party requests), the `.anim-prehide` cap (3s → 0.4s in the
  shipped CSS).
- **For actual user-perceived performance, use FIELD data** — but NOT from
  Search Console. **Checked 31 Jul: CWV reports "Not enough usage data in the
  last 90 days" for BOTH mobile and desktop, and probably always will.** CrUX
  needs a far bigger sample than this site's traffic (246 clicks / 1.71K
  impressions per quarter, ~56 visits/day). Waiting for it is a dead end.
  **Use Cloudflare Web Analytics instead — it already has RUM data**, from our
  own beacon, on real visitors. First read (31 Jul, last 24 h):
  **LCP P75 3,176 ms** (P50 2,148 / P90 4,288), split 56% good / 33% needs
  improvement / 11% poor; **INP 100% good**; page load 2,835 ms. So LCP sits in
  "needs improvement", not "poor" — worth work, not a crisis, and now measured
  on real visitors rather than one machine in Milan.
  CAVEAT before leaning on those numbers: 38 of 65 visits in that window came
  from China, which looks like scraper traffic surviving the bot filter and
  could skew the distribution. Re-read over 7-30 days before deciding anything.
- If a lab comparison is genuinely needed, run it LOCALLY against `pnpm start`
  (5+ runs, take the median) so the network is out of the equation. Note the dev
  server is NOT comparable — that mistake was also made today.

## Lighthouse pass (29 Jul) — favicon done, JS chunk open

Measured on TEST (production-mode build), homepage mobile. Baseline after the
Turnstile warm-up fix was perf 83 / LCP 4.3s / FCP 1.1s.

- [x] **Favicon was a 500x500 PNG renamed to .ico** — 59,755 bytes, the
      second-heaviest asset on the homepage, larger than either webfont, on every
      page, for a 16px icon. Converted to a real MS Windows icon resource with
      16/32/48 embedded: **8,298 bytes, -86%**. Measured effect: perf 83 → 86,
      LCP 4.3s → 3.9s, TBT 50ms → 30ms. Best value-per-effort of the whole pass.
- [x] Tried a modern `browserslist` (chrome/edge 92, firefox 90, safari 15.4) to
      kill the `legacy-javascript` polyfills — `Array.prototype.at`, `.flat`,
      `.flatMap`, `Object.fromEntries`. **It did nothing and was REVERTED.**
      Next.js does not drive its polyfill bundle from browserslist; it injects a
      fixed core-js set for its own baseline. legacy-javascript stayed at exactly
      150ms/13KB and the main chunk at 70KB. Don't retry this approach — the
      lever is elsewhere (Next config / upgrade), not browserslist.
- [ ] **`unused-javascript`: 25KB unused of a 69KB chunk (36%), ~200-330ms.**
      Both this and legacy-javascript live in the SAME main chunk. Needs real
      analysis rather than a config tweak: run `@next/bundle-analyzer` (already a
      dependency) to see what's in it, then decide what can be dynamically
      imported off the homepage's critical path. Worth ~5 points; more effort
      than the favicon by an order of magnitude.
- [ ] **Fonts — where the remaining LCP time actually is.** PAUSED at Rajesh's
      request, and it's the biggest remaining item. NOW HAS REAL FIELD DATA to
      judge against (31 Jul): Cloudflare RUM puts **LCP P75 at 3,176 ms** with
      11% of visits "poor" — needs improvement, not critical. Search Console
      CWV will never answer this; see the Lighthouse-noise section above.
      LCP is now ~62% RENDER DELAY,
      not download: the hero poster fetches in ~1.2s then the browser waits
      ~2.7s before painting. Two webfonts at 48KB and 40KB are the prime
      suspects, since text and layout block on font loading. Check whether both
      weights are needed above the fold and whether preloading helps. CAUTION:
      fonts are load-bearing for CLS — a careless preload can improve one metric
      while making layout shift worse, so measure CLS alongside LCP.

## Performance regression (28 Jul) — FIXED 29 Jul

- [x] **FIXED (`3dd100a`, 29 Jul): Turnstile is now warmed on FIRST
      INTERACTION, not on mount.** `TurnstileWidget` takes a `warmRef` that the
      form calls on first focus/keystroke; the token is banked and consumed on
      submit (fast path), with `getToken()`'s execute-and-await still there as
      the slow path, and `expired-callback` re-warming — so the single-use /
      ~5-min-expiry hazard called out below is handled. Page-load cost is gone
      for the ~everyone who never touches a form. The 29 Jul Lighthouse pass
      measured the post-fix baseline at perf 83 / LCP 4.3s, and the favicon work
      then took it to 86 / 3.9s. **Read the Lighthouse-noise section above
      before reading anything into those numbers.** This item sat unchecked
      through the 30 Jul docs sweep; closing it now.
      ONE PIECE NOT DONE: the prescribed `strategy="lazyOnload"` on the
      analytics beacon — `WebAnalytics.tsx:28` is still `afterInteractive`. It's
      an 11 KB script, so this is a rounding error next to the ~128 KB that was
      actually the problem. Change it only if a future pass shows it mattering.
      VERIFY step from the original spec was NOT re-run end-to-end after the
      fix (two contact submits + one PDF email). Worth doing on the next pass —
      this path has broken sends twice.

      Original diagnosis, kept because it is the record of what went wrong —
      **Homepage perf 89 → 68, LCP 3.8s → 6.6s, FCP 1.1s → 3.0s** (mobile,
      production, reproducible across 3 runs — not variance). Cause is MINE:
      the on-submit Turnstile rework dropped the IntersectionObserver gate on
      the reasoning that "nothing is deferred when mounting is free". Mounting
      is NOT free — the challenge doesn't run, but the script still DOWNLOADS.
      Network records for the homepage now show ~128 KB of Turnstile at page
      load (`api.js` + a 26 KB inner script + a 102 KB challenge-platform
      bundle) on a page where most visitors never touch the contact form, plus
      11 KB for the analytics beacon. LCP is 89% RENDER DELAY — the main thread
      is parsing third-party JS instead of painting.
      FIX (refined 28 Jul, Rajesh's suggestion — it solves BOTH symptoms):
      warm the whole thing up on FIRST INTERACTION with the form — on first
      focus or keystroke, load the script AND run the challenge in the
      background, so the token is already in hand by the time they finish
      typing. That kills the page-load cost (nothing happens until someone
      engages) AND the send latency Rajesh reported, where Send waits for
      script-download + challenge before the POST starts.
      MUST HANDLE: tokens are single-use and expire (~5 min), so a long message
      can outlive its token. Re-arm on `expired-callback`, and keep
      `getToken()`'s execute-and-await path as the fallback for when no fresh
      token exists — otherwise a slow send becomes a failed one.
      Do NOT load on mount. The challenge only runs
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

## Contact drawer

- [x] Contact form short-message copy fixed (28 Jul). The friendly sentence was
      unreachable: the textarea's `minLength={10}` made Chrome block submission
      first with its own "Please lengthen this text to 10 characters or more" —
      the exact robotic phrasing we were removing. Now validated in the submit
      handler with the same wording the backend returns.
- [x] **DONE 28 Jul** (`0e0611f`) — `ContactDrawer.tsx` ships, wired into
      `Header.tsx:396` from both the desktop and mobile mail icons, and the
      catalog's "Contact our regional managers" CTA was dropped in the same
      commit. The spec below was followed as written, including the
      conditional-render mounting (the item sat unchecked through the 30 Jul
      docs sweep; closing it now).
      Original spec, kept for the Turnstile constraint it records:
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
- [ ] `kiosk-hd/WirelineExpress-subtitled.mp4` 1080p master — NOTE (6 Aug):
      the real problem is the missing AUDIO, tracked in "Martin's website
      review" at the top of this file
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
- [x] **Case study badges updated (29 Jul):** replaced year badge (`2016`, `2018`)
      with the primary application/challenge category tag (`Sensor Orientation`,
      `Sticking Prevention`, etc.) on `CaseStudiesBrowser` cards and detail pages.
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
- [x] `tags.csv` category typo FIXED (29 Jul): the 4 "Well Access:Deviation"
      rows now read "Well Access: Deviation", and `case-studies.json` was
      regenerated — verified the regeneration changed exactly those 4 category
      values, same 46 slugs, every other field byte-identical.
- [ ] **Carry the same fix into the tags XLSX.** `public/flipbooks/success-stories/tags.csv`
      is GENERATED from the xlsx in `sources/success-stories/` (gitignored, not
      in the repo), so the CSV fix above survives only until the next flipbook
      rebuild re-derives it. If the xlsx still says "Well Access:Deviation", the
      typo comes back. `normalizeCategory()` keeps the UI correct either way,
      which is why this is tidiness rather than a live bug — but the fix is not
      truly "at source" until the xlsx is corrected.
- [ ] Decide whether the dropped `trailing` text (captions/refs) should be
      emitted into a captions field for SEO + screen readers.

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
