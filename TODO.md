# TODO

Open work only. History and rationale: [docs/DECISIONS.md](docs/DECISIONS.md) + git log.

## Status (14 Oct 2026)

- **www last promoted 1 Oct 2026** — git tag `production` = `b9dcb1a`
  (nightly data, 3,196 deployments / 52 countries). Earlier promotes on
  29 and 30 Sep carried the IDML-rebuilt success-story pages, the story-page
  links into the index and the track-record advanced filters live, so
  nothing from Aug/Sep is "on test only" any more.
- **Pending for the next promote** (everything between `production` and
  `main`):
  1. `3e9e6ea` — catalog edition **14.09.2026** from the SharePoint content
     refresh (1 Oct). Eyeball `/catalog` + a few model pages on test before
     promoting; a new edition can surface new SKUs with default curation
     (the build warns — see the catalog section).
  2. The 14 Oct 2026 review commit — weekly housekeeping workflow,
     content-refresh hardening, **Next 16.3.4 → 16.3.8** (critical advisory
     in `next/og` + image optimizer SSRF), Node 22, `nodownload` + "Request
     the file" on the homepage player, send-pdf rate limit + Origin check,
     Turnstile fail-closed, OAuth error codes, and the hold-notification
     issue from `data-refresh.yml`. Check on test: play a homepage video
     (no Download item in the player menu; "Request the file" opens the
     contact drawer prefilled), and send one catalog PDF from the kiosk
     sign-in path.
  3. Nightly data 7 / 8 / 11 / 13 Oct — now **3,224 deployments, 53
     countries** (`dfcf407`).
- **Auto-promote is HOLDING** on purpose: the nightly job promotes only when
  operations data is the sole diff since `production`, and items 1–2 are
  code/content. Until a human runs `gh workflow run deploy-prod.yml`, www
  stays on 1 Oct data. Kill switch for the automation:
  `gh variable set AUTO_PROMOTE_DATA -b false`.
- **When auto-promote is held for ≥3 days, `data-refresh.yml` now opens (and
  updates daily) a GitHub issue labelled `auto-promote-hold`, and closes it
  after the next promote** — the Oct 2026 catalog refresh held www for two
  weeks with only a run-summary warning to show for it.
- Automation now in place (Sep–Oct 2026, docs/DECISIONS.md): nightly
  `data-refresh.yml` (Graph → Jobs History Master → operations JSON),
  monthly/on-demand `content-refresh.yml` (SharePoint `Designs` library →
  catalog + success-stories IDML, registry in `sources/sources.json`), and
  Sunday `housekeeping.yml` (docker + GHCR prune). The tags xlsx is the one
  content input that is still manual.

## From the 14 Oct 2026 code review

Other findings from the same review were fixed in the same commit; these are
the ones left open.

- [ ] **Self-host Inter + IBM Plex Sans via `next/font/local`.**
      `src/app/layout.tsx` still imports both from `next/font/google`, so
      every build fetches fonts.googleapis.com at build time — a Google hiccup
      fails a deploy, and the Cowork container cannot build at all for this
      reason. Recipe: add `@fontsource-variable/inter` +
      `@fontsource/ibm-plex-sans`, copy the woff2 files out of `node_modules`
      into `src/app/fonts/`, swap the two imports for `localFont({...})` with
      the same CSS-variable names, and check `font-heading` (tailwind.config)
      still resolves. Visual check on test before promote — fonts are
      load-bearing for CLS, so compare LCP AND CLS. This also subsumes the
      "Fonts" item in the Performance section below.
- [ ] **Watch the "Request the file" flow for a few weeks.** Shipped 14 Oct:
      the contact drawer posts `media_asset`, `/api/contact` mails a signed
      7-day link (`/api/media/download/<asset>?t=…`) and info@ gets the lead.
      Check `docker logs petromac-backend | grep media:` for issued/downloaded
      counts; if nobody downloads, drop the link mail and keep the lead. Set
      `MEDIA_LINK_SECRET` in `.env-backend` at some point (optional — see
      `.env.example`).
- [ ] **`/intranet/kiosk/*` is reachable unauthenticated.** Only
      `src/app/(public)/intranet/page.tsx` reads the staff session; the
      `(kiosk)` route group has no gate (`robots: noindex` only). The kiosk
      SW + offline prime may well DEPEND on that (an expired session on a
      tablet mid-show must not blank the screen). Decide, then either document
      the intent in docs/KIOSK.md or gate it (a long-lived kiosk cookie, or
      gate only `/prime` + `/datacheck`).
- [ ] **One source for Python pins.** `scripts/python/requirements.txt`
      (pypdf==5.1.0, pillow==10.4.0, fastapi==0.118.0) vs
      `backend/pyproject.toml` (pypdf>=5.4,<6, fastapi>=0.116). The two
      pipelines share `pypdf` code paths through the success-stories PDF
      endpoint. Either make the scripts a uv project too or have
      requirements.txt generated from one lock.
- [ ] **Catalog PDF is over its budget.** `petromac-product-catalog.pdf` from
      the 14.09.2026 edition is 5.98 MB; `CATALOG_PDF_BUDGET` in
      `scripts/python/build_flipbook.py` is 4 MB and the DPI ladder bottoms
      out at 120 dpi, so the build shipped it oversized (by design — it
      warns rather than blur further). 79 pages / 185 images. Decide: raise
      the budget to 6 MB (still fine for the email attachment) or ask design
      to export the catalog PDF with compressed images.
- [ ] **Delete `REVIEW.html` from your working copy after pulling.** The
      figure review sheet is now gitignored + dockerignored (it was committed
      and publicly served at `/flipbooks/success-stories/figures/REVIEW.html`,
      1.5 MB). `git am` of the 14 Oct patch removes the tracked copy;
      `pnpm run data:stories` regenerates it locally, and the content-refresh
      workflow uploads it as a run artifact.
- [ ] **TODO.md stays open-work-only.** This refresh moved the Jul–Aug
      history out (DECISIONS.md + git log have it). When an item ships, mark it
      `[x]` with a one-line DONE note and delete it at the next tidy — don't
      let the narrative grow back.

## Success-story pages (IDML rebuild) — LIVE since 29 Sep 2026

The Aug 2026 rebuild from the InDesign package shipped to production with the
29 Sep promote. Rationale and the figure-grouping rules: docs/DECISIONS.md
(Aug 2026 entries) and docs/SUCCESS_STORY_REVIEW.md.

- [x] Rebuild from the IDML — DONE 13 Aug. Figures composed of decor, welds,
      fold-backs, same-size pair merges, inline bold — DONE 20 Aug (five
      commits). Print-vs-live review of all 46 pages — DONE 20 Aug: 44 rows
      approved/tuned, every judgment call resolved with Rajesh, all per-page
      escape hatches (`CAPTION_OVERRIDE` / `DROP_FIGURE` / `SPLIT_GROUP`) still
      EMPTY.
- [x] Continent graphics — SUPERSEDED 20 Aug. The six region world-maps are
      exported from the IDML into `figures/maps/` and the story sidebar renders
      the page's own one (`regionMap`). Bespoke continent artwork is no longer
      needed.
- [x] Captions inlined in the narrative / dropped `trailing` text — RETIRED
      with the PDF route. Captions now come off the `Pie de Foto` paragraph
      style and print under their figure (or stay in the pixels by rule), so
      there is nothing left to "emit into a captions field".
- [ ] Review-tracker rows 27 and 28 (`supercombo-on-wireline…`,
      `tractor-assist-of-super-combos…`) are still `☐` in
      docs/SUCCESS_STORY_REVIEW.md — the only two of 46 without a sign-off
      note. Two-minute eyeball against pages 27–28 of the print, then tick
      them.
- [ ] **Carry the "Well Access:Deviation" fix into the tags XLSX.**
      `tags.csv` is clean today (0 hits), but it is derived from the xlsx in
      `sources/success-stories/` (gitignored), and the content-refresh workflow
      does NOT sync the xlsx (docs/ADMIN.md). `normalizeCategory()` keeps the
      UI right either way; this is at-source tidiness.

## Catalog

Three-level HTML catalog live since Jul 2026; edition 14.09.2026 ingested
1 Oct (pending promote, see Status). Pipeline: `pnpm run data:catalog` +
`enrich.ts` (docs/ADMIN.md §2b).

- [ ] **Check the 14.09.2026 edition on test before promoting.** Look for
      build-time "add a curation row" warnings in the deploy log (new SKUs get
      safe defaults), confirm TTB-S75U is still merged (`MERGED_INTO`), and
      check whether the `4-5/6”` wheel-diameter typo (S75U; S75 reads `6”`,
      almost certainly 4-5/8") was fixed in the InDesign source. Not
      user-visible while the S75U table is merged away, but it is a source
      bug for the designer.
- [ ] **Device Finder: make Open hole / Cased hole a real filter.** The toggle
      only relabels the size field — the catalog data has no open/cased
      dimension — so an 8-1/2" open-hole search still returns
      CRIL/CRU/CX9/RO17/TWT-28/TWS-30 (Martin's "Purpose listings" complaint).
      Add an environment field per slug to the CURATION table in
      `src/features/catalog/content/enrich.ts` (~30 one-liners; verified
      14 Oct: no such field exists yet) and filter on it. Also decide with
      Martin whether the Purpose dropdown stays.
- [ ] **Confirm the "can be modified" claim** for the TTB-S75U note.
      `MERGE_NOTES` in `features/catalog/content/index.ts` describes the bore
      difference only; if Petromac retrofits S75 → S75U, add one sentence.
- [ ] **CX7 / CX13 have no catalog pages** — ABSENT from the IDML (zero hits;
      CX9 has six), so it is catalog CONTENT. Either add them to the InDesign
      catalog (then the monthly refresh picks them up) or grow a
      supplemental-products mechanism in the enrichment layer. The kiosk already
      has CX7/CX13 images + size ranges (`HelixProductScreen.tsx`,
      `deviceSpecs.ts`). Also closes Martin's "FOCUS Centralizers missing
      CX7/CX13". Re-check the 14.09.2026 edition first — it may already carry
      them.
- [ ] **SWHF guides for Baker Hughes / Halliburton** (vendor sections read
      SLB 11 / HAL 2 / BHI 1 / universal 2). Engineering question first: do
      SWHF configurations for BHI/HAL tools exist as buildable products? Ask
      the team. Related: SWHF configuration figures are currently filed under
      AHFC.
- [ ] Content polish pass with design/product (family summaries, image picks).
- [ ] Generate the download/email PDF from `catalog.json` via an HTML print
      template (≤4 MB, tagged text, TOC) instead of shipping the compressed
      print PDF.
- [ ] **Reply to Martin.** Thank him — videos (1080p), the Formation Testing
      label, the Success Stories rename, family-scoped prev/next and the
      contact-form honeypot all shipped in Aug; ask which browser he used
      (confirms the autofill-honeypot theory) and whether SWHF for BHI/HAL
      exists.
- [ ] Videos: if sharper masters than the kiosk-hd second-generation files
      ever land in SharePoint, re-encode the four homepage lightbox clips from
      those (CRF 22, 2.5 Mbps cap, +faststart).

## SEO

Shipped and live: WP-era redirect table (`src/lib/redirects.ts`, Jul),
vocabulary-map titles (Jul), story cross-linking + real sitemap `lastmod`
(Aug), and the verified subset of the 20 Aug external GSC audit (`18c8b9d`):
46 curated story titles in `seo-titles.ts` (unit-tested ≤60 chars), patent-PDF
caching, `dateModified` + `publisher.logo` on Articles, ItemList on
`/success-stories`, WebSite entity on the homepage, `/xmlrpc.php` +
`/wp-login.php` → 410. Everything declined and why: docs/DECISIONS.md "External
GSC audit".

Standing rules (do not re-derive):

- **Product snippets "1 invalid item" on every product page is EXPECTED and
  permanent.** `offers` is recommended, not required; a `$0.00` block turns a
  Product into a merchant listing (tried 30 Jul, made it worse). Reasoning
  above `productSchema` in `catalog/[category]/[slug]/page.tsx`. Only open
  question: drop the `Product` node to keep the report clean so a REAL error
  can't hide behind a known-invalid item (Rajesh's call, knowingly).
- **GSC "Not found (404)" validation FAILS BY DESIGN** on the dead WP URLs —
  they return 410, which GSC classes as not-found. Don't press Validate fix
  again, don't redirect them (docs/DECISIONS.md, Sep 2026).
- **Do NOT rename nav anchors to chase sitelinks** — Google picks them, labels
  come from our anchor text, internal linking is the only lever.
- No `datePublished` on Articles — no real per-story dates exist; the job year
  is not one.

Open:

- [ ] **Re-check brand-query sitelinks** (last looked 10 Aug: only Contact +
      Origins). `/catalog` and `/success-stories` were confirmed indexed and
      eligible on 11 Aug; the cross-linking + lastmod work should have moved
      this. Pure observation, no code. Also on that SERP: `petromac.com` (a
      different, robots-blocked domain) ranks second and the AI Overview
      conflates Petromac with "Global Petromac" (Abu Dhabi) — Organization
      JSON-LD `sameAs` is the lever if it persists.
- [ ] **Vocabulary map §2 is half applied.** Titles carry the six high-yield
      queries (`hrsct`, `bowspring`, `tlc logging`, `holefinder`,
      `oriented core`, `wireline malaysia`); the BODY-COPY / H1 pass is not
      started (14 Oct grep: `tlc logging`, `oriented core`, `wireline
  malaysia` appear in zero components). That is where the ranking upside
      is — a title alone rarely moves position 23 → page 1.
- [ ] **Meta descriptions pass** on the pages the vocabulary map didn't cover
      (it was a title proposal). The 20 Aug audit fixed only the two
      sub-70-char story outliers and the family-page map.
- [ ] **Thin pages**: `/catalog/well-intervention` (84 words), `/contact`
      (75), `/catalog/focus-centralisers` (148). Sub-200-word pages are what
      Google parks in "Crawled – currently not indexed".
- [ ] **Near-duplicate catalog product pages**: `hf9-acrt` vs `hf9j` scored
      0.71 on 4-gram Jaccard. Above ~0.5 Google tends to index one of a pair.
      The spec tables are legitimately similar; a per-model line of
      application copy is what would separate them. (The other pair,
      TTB-S75U/S85, was MERGED instead — docs/DECISIONS.md.)
- [ ] **`/track-record` is the one evidence page without a `SeeAlso` card**
      (verified 14 Oct: `SeeAlso` renders on success-stories, publications,
      patents only). It links success stories (CTA) and publications (records
      strip) but not patents, and has no conventional header to hang the card
      on (map-as-hero) — a design call, not a one-liner. Decide whether the
      cluster should be fully mutual.
- [ ] **Retire the transitional Publications links** on `/track-record`
      (`page.tsx:73`) and `/contact` (`page.tsx:34`, "Conference papers")
      once the SeeAlso card has settled — remove them together with a check
      that Publications stays reachable (the card + sitemap). If Publications
      ever moves under success-stories, that is a URL migration needing a 301 + sitemap update; decide before touching the path.
- [ ] **`/case-studies-preview` is still an orphan design-proposal route**
      (`src/app/(public)/case-studies-preview`, `CaseStudiesBrowserPreview.tsx`
      — verified present 14 Oct). Not linked, not in the sitemap, `noindex`.
      It has cost real work twice when the live browser and the preview
      drifted. Decide: promote the dark design to `/success-stories`, or delete
      the preview. Deleting is the safe default.
- [ ] Low value: `WebPage`/`CollectionPage` JSON-LD on the bare pages
      (`/about`, `/team`, `/catalog`, `/track-record`, `/simulation`,
      `/contact`, `/privacy`, `/terms`, `/about/patents`). Home and
      `/success-stories` got theirs on 20 Aug.

## Kiosk review — OPEN, keep adding here

Standing home for ALL kiosk work; a review backlog to work through as a block.
Verified 14 Oct: `kiosk-hd/`, `useKioskVideo` and the `?sd=1` probe are gone
(the launch URLs in `public/kiosk-sw.js` still carry `?sd=1&tv=0`, which is
inert); native `controls` + `controlsList="nodownload noremoteplayback"` are
on the lane attractor and the Helix video; SW `VERSION` is `v20`.

### Code / behaviour

- [ ] **Phase 2 of the flipbook retirement — get the kiosk off
      `SuccessStoriesFlipbook`.** Still two consumers (verified 14 Oct): the
      thin `/intranet/kiosk/successstories` wrapper and `LogsScreen.tsx`'s
      CH-lane **Case Studies** takeover with per-product preset filters (tap
      Helix/Rocker → that product's stories). Rebuild on the case-studies data
      reusing `src/features/case-studies/filters.ts` (pure, unit-tested for
      exactly this). The per-story FIGURES now exist too
      (`public/flipbooks/success-stories/figures/`), so the kiosk card can show
      real figures rather than a page scan.
- [ ] **Offline prime budget — CHECK BEFORE building phase 2.** The flipbook
      is 1 route + 52 images; 46 per-story routes would blow past
      `MAX_STATIC_ENTRIES = 80` (shared with the JS chunks, ~11 route entries
      today). Either raise the cap or give the kiosk ONE filtered list view —
      probably better kiosk UX anyway, nobody deep-links on a tablet
      mid-conversation.
- [ ] CH lane "Other" experience — still a Coming-soon placeholder.
- [ ] **Move the tablets to the production origin + re-prime** (unverified as
      of 14 Oct — check). Launch URL `https://www.petromac.co.nz/intranet/kiosk`
      (no `?sd=1` needed any more), sign in, prime, verify offline. Driver is
      the ORIGIN move: SW caches are origin-scoped and the tablets were primed
      against the retired petromac.klaratech.it, so those caches are
      unreachable rather than stale. SW went v19 → v20 with the kiosk-hd
      retirement, so a re-prime while online is required regardless. The
      kiosk could not be exercised from a Cowork session — verify the lane
      playlist, the CH Helix video and an offline prime on a real device.
      See docs/KIOSK.md.
- [ ] Authentication intent for `/intranet/kiosk/*` — see the 14 Oct review
      section.

### Content / assets (designer-dependent)

- [ ] Helix product image — kiosk surfaces still reuse `focus.png`
      (`HelixExperience.tsx:257`, `deviceSpecs.ts`; ASSET_MANIFEST §1.4).
- [ ] Corner-badge tool silhouettes — Helix/Rocker badges reuse `focus.png`.
- [ ] Case Studies images: `helix-cbl-setup.png`, `rocker-logs-1.png`.
- [ ] OH lane mechanism videos + case-study log images (Formation Testing /
      High Deviation / PathFinder).
- [ ] Thor product video (card commented out until ready); Rocker GLB model.
- [ ] Rocker mechanism force-section schematic (interim crop in place).

## Flipbook retirement (phased)

Phase 1 (public flipbook → `/success-stories` pages) shipped Jul 2026; the
ingest pipeline stays forever because the story pages use its page webps
and figures. Rationale: docs/DECISIONS.md.

- [x] Phase 1 — DONE Jul 2026.
- [ ] Phase 2 — kiosk off the flipbook. Tracked in **Kiosk review** above
      (with the prime-budget check it depends on).
- [ ] Phase 3 — delete the viewer, only after phase 2: `Flipbook.tsx`,
      `SuccessStoriesFlipbook.tsx`, `FlipbookErrorBoundary.tsx`,
      `SuccessStoriesFilters` and the success-stories feature services. KEEP
      the ingest pipeline and `public/flipbooks/success-stories/pages/*.webp`.

## Track record & data

Advanced filters v2 + country panel v3 shipped 11–12 Sep and are live.
Myanmar stays withheld (`EXCLUDED_COUNTRIES`). Nightly refresh via Graph is
running (53 countries as of 13 Oct). docs/DECISIONS.md Sep 2026.

- [ ] MapRenderer: split base path generation from style updates so filter
      clicks restyle instead of rebuilding all ~244 paths (Jul 2026 audit;
      deferred — delicate component, clicks already debounced). The Sep
      advanced filters pre-filter the records array, so the map core was
      untouched and this is unchanged.
- [ ] Longer term: job history off Excel into a database-backed source. The
      nightly Graph pull has removed the manual copy step, which lowers the
      urgency.

## Infrastructure, DNS & security

Cloudflare migration to the company account (10–11 Aug) is fully done,
including the old-zone deletion and the original tunnel's route strip —
docs/DNS.md, DEPLOY.md, docs/DECISIONS.md. Remaining items all need Rajesh or
a dashboard; none is verifiable from the repo, so all are "(unverified as of
14 Oct — check)".

- [ ] **Send one test scan from an HQ printer** — a confirmation, not a gate:
      the SPF trim already shipped (`v=spf1 +mx +ip4:161.65.142.140
  include:spf.protection.outlook.com ~all`). If a scan fails, revert SPF
      from the snapshot at `/root/dns-backups/` — one edit, live in minutes.
- [ ] **CANCEL ChemiCloud** — cleared 7 Aug (no mailboxes ever existed there;
      the WordPress content is archived). One check first: read the SMTP host
      configured in the office scanners/printers; if it is
      `mail.petromac.co.nz`, repoint to SMTP2GO or M365 before cancelling. Take
      a full cPanel backup anyway. Then: cancel → confirm the 8 cPanel A
      records + `default._domainkey` are gone (the 10 Aug zone clean already
      removed them) → SSL **Full (strict)**.
- [ ] **Zone housekeeping** next time in the Cloudflare dashboard: 1. add a Cloudflare comment to the apex `google-site-verification=…` TXT
      saying DO NOT DELETE (Search Console verification for both
      properties); 2. add a CAA record (none today, any CA may issue); 3. DNSSEC is off (no DS at the .nz registry) — optional hardening,
      Cloudflare generates the DS, paste it at Crazy Domains.
- [ ] **Clean up the Crazy Domains DNS panel** against the canonical
      Cloudflare zone (with the other admin) so the inert panel doesn't mislead
      anyone again. Cloudflare is the single DNS home.
- [ ] **Revoke the old all-zones Cloudflare user token** from the personal
      account (the zone-scoped, IP-locked token at `/root/.cloudflare-token` is
      the live one).
- [ ] **Branch protection on `main` + audit who has write access to the
      klaratech org; confirm 2FA is enforced.** A commit to main auto-deploys
      TEST, one button deploys PRODUCTION, and the nightly bot pushes to main —
      repo write access _is_ website write access. Needs Rajesh (GitHub
      settings). Note the bot push must stay allowed (or use a bypass rule for
      the Actions identity).
- [ ] **Turnstile hardening: drop `localhost` from the widget's hostname
      list** (dev uses Cloudflare's always-pass TEST keys). The server token
      lacks the Turnstile scope — either add **Turnstile: Edit** to it or do
      it in the dashboard: Turnstile → widget "petromac" (sitekey
      `0x4AAAAAAD_qL5ZoaGRaXC4U`) → Hostname Management. Keep `petromac.co.nz`
      (covers www + test); confirm `klaratech.it` is gone.
- [ ] **Vercel: last two clicks** — delete the project (petromac.vercel.app
      goes offline, intended) and uninstall the Vercel GitHub App from the
      klaratech org if nothing else uses it.
- [ ] Optional, bigger job: **nonce-based CSP to drop `'unsafe-inline'`** from
      `script-src`. App Router's inline bootstrap requires it today, so CSP is
      not a reliable XSS backstop. Low exposure (no user-generated content);
      `src/proxy.ts` is where a nonce would go.
- [ ] Rich Results test — one re-run on `/`, a product page and
      `/about/publications` to confirm clean after the 20 Aug JSON-LD changes
      (WebSite entity, `dateModified`, `publisher.logo`, ItemList).
- [ ] Spot-check the six recovered WP URLs on production with AND without the
      trailing slash, each a single 301: `/contacts/`, `/patents/`,
      `/origins/`, `/publications/`, `/privacy-policy/`, `/terms-of-use/`. The
      unit test proves the table, not the deployed edge. (The 20 Aug audit
      spot-checked 20 paths as 301 — this may already be answered; tick it if
      that list covered these.)

## Performance

Lab Lighthouse scores on this site are NOISY (identical code scored 84/85/97
in three runs from Italy) — trust structural measurements (bytes on the wire,
`cf-cache-status`, bundle analyzer) and Cloudflare Web Analytics RUM, never a
single run; Search Console CWV will never have enough traffic. Last RUM read
(31 Jul): LCP P75 3,176 ms, INP 100% good. Details: docs/DECISIONS.md
"Performance architecture".

- [ ] **`unused-javascript`: ~25 KB unused of the 69 KB main chunk (36%),
      ~200–330 ms.** Needs real analysis, not a config tweak: run
      `ANALYZE=true pnpm run build` (`@next/bundle-analyzer` is a dependency)
      and decide what can be dynamically imported off the homepage's critical
      path. Do NOT retry `browserslist` — Next ignores it for its polyfill set
      (tried and reverted 29 Jul).
- [ ] **Fonts — where the remaining LCP render delay is.** Paused at Rajesh's
      request. LCP is ~62% render delay: the hero poster arrives in ~1.2 s
      then the browser waits ~2.7 s, and the two woff2 faces (48 KB + 40 KB)
      block text. Check whether both weights are needed above the fold and
      whether preloading helps; measure CLS alongside LCP. **Do this together
      with the `next/font/local` item** in the 14 Oct review section — self-
      hosting changes the loading path anyway. Re-read RUM over 7–30 days
      first (the 31 Jul window was 58% China scraper traffic).
- [ ] `WebAnalytics.tsx:28` is still `strategy="afterInteractive"`; the
      prescribed `lazyOnload` was never applied. 11 KB script — a rounding
      error, change only if a pass shows it mattering.
- [ ] Re-run the Turnstile end-to-end VERIFY that was never done after the
      first-interaction warm-up fix (`3dd100a`): two contact submits in a row + one PDF email. This path has broken sends twice.

## Backlog

- [ ] Homepage a11y: `color-contrast` is the ONLY remaining audit failure and
      it is a FALSE POSITIVE — do not "fix" the colors. axe samples text
      mid-`.scroll-reveal` (opacity 0 → 1) and reads near-white foregrounds;
      the real values pass AAA (`text-brand` on white ≈ 7.4:1). Only act if an
      external scan needs a clean sheet — then gate the reveal on a static
      fallback rather than changing the palette.
- [ ] Athena terminal (`/simulation`) shows illustrative values — confirm
      `MRIL-XL`, `--taxis 4` and "est. rig time saved: 8.2 hrs" with the
      product team or swap in real simulation numbers
      (`AthenaTerminal.tsx:26,40`).
- [ ] Quick browse of the live site after the next promote — homepage,
      catalog (new edition), track record filters, a success story, contact
      form (submit once to see Turnstile).

## Notes

- Email sends via Microsoft Graph app-only `Mail.Send` as the `info@`
  shared mailbox (not SMTP, not Brevo — org-standard deviation; see
  docs/DECISIONS.md). Revisit if it becomes a maintenance burden.
- Pushes go to TEST; production needs `gh workflow run deploy-prod.yml` —
  except nightly data, which auto-promotes when it is the only pending
  change. DEPLOY.md.
