# Decision Log

Why things are the way they are. Newest first. The other docs describe the
_current state_ and _how to operate it_; the reasoning lives here.

---

## Aug 2026 — PDF compression: explicit recipe, not Ghostscript presets

**Decision:** `compress_pdf()` downsamples raster images on a declared ladder
(`200 → 150 → 120` dpi at JPEG q85), stops at the first rung inside the
document's budget, and **prints which rung it used**. The Ghostscript named
presets `/ebook` and `/screen` are gone.

**The bug it fixes.** The old code ran `/ebook`, then re-ran at `/screen` "if
the result is still heavy" — threshold 4 MB. On the success-stories book
`/ebook` produces ~10.8 MB. It could never fit. So the fallback was not a
fallback: **every build since the pipeline was written shipped `/screen`, which
downsamples images to 72 dpi**, from source art at ~290 dpi. On an A4 page that
is a 595x843 px image doing the job of 2480x3508. Every success-stories PDF
anyone downloaded or was emailed was soft, and no build output ever said so.

**Why an explicit recipe beats the presets even ignoring the bug.** `/ebook`
spent ~10.8 MB to deliver ~158 dpi, because its autofilter picks a conservative
JPEG quality. Pinning `-dJPEGQ=85` with `-dColorImageResolution=200` and
`-dColorImageDownsampleThreshold=1.0` delivers a true 200 dpi in ~6.2 MB —
better resolution at 60% of the size. The threshold matters: gs's default
allows 1.5x slack before resampling, so "150 dpi" without it is not 150 dpi.

**Second-order win.** The backend cuts filtered extracts out of `email.pdf`
(`build_success_stories_pdf`). Under the old scheme someone who picked three
stories got pages crushed to fit 46 others into a budget they never used. The
recipe change fixes extracts for free — a 5-page extract is now ~0.8 MB at
200 dpi, still far smaller than the whole-book file used to be.

**Budgets:** catalog 4 MB (it ships ONE artifact serving download + email, so
the ceiling is real), success stories 12 MB (mostly photography, and it is the
source for extracts). Landing at ~6 MB leaves headroom under every common mail
limit.

**The rule this encodes:** a size check may lower quality, but it may never do
it quietly. The ladder degrades in visible steps; the bottom rung ships
oversized with a loud warning rather than degrading further. Ghostscript's
stderr is captured and shown only on failure, because this source set emits
~340 harmless JPEG2000 warnings per pass and a quality notice buried in log
noise is the same as no notice at all.

## Aug 2026 — ChemiCloud cleared for cancellation; zone audited

**Decision:** the "DO NOT CANCEL ChemiCloud" blocker that stood from 28 Jul to
7 Aug 2026 is withdrawn. The subscription can be cancelled once one check
passes: what SMTP host the office scanners are configured with.

**Why the blocker was wrong.** It claimed the box at 172.232.197.9 "still hosts
mail./webmail./cpanel mailboxes and the scanner/printer SMTP relay". Nobody ever
verified that. It was inferred from one line in the 28 Jul incident writeup —
_"Verified: athena 200, SMTP 587/465 + IMAP 993 open"_ — which proves the ports
answer, not that anything uses them. **cPanel answers on those ports on every
account, occupied or not.** Confirmed 7 Aug 2026: no cPanel email account was
ever created, company mail has always been Microsoft 365, and the WordPress
content the box hosted is archived. The MX corroborates it — it has only ever
pointed at Microsoft, so no inbound mail could ever have reached that box.

The tell was sitting in the same document the whole time: the blocker's own
open question was _"Office scanners: which SMTP server is configured in them?"_
A do-not-touch note and an admission that nothing had been traced, ten days
side by side, and the contradiction went unread because the note was written in
the voice of a finding.

**Rule going forward:** a retirement blocker must name the **falsifiable check**
that would lift it. "Do not cancel until we're sure" has no exit condition and
becomes permanent cost. "Do not cancel until a scanner's SMTP host is read" does.

**Consequence for SPF:** the trim to `v=spf1 +mx include:spf.protection.outlook.com ~all`
is safe. The old caution assumed SMTP2GO needed an include — it does not. It
sends with its own return-path (`em588925` → return.smtp2go.net) and is
DKIM-signed, so scan-to-email is unaffected by dropping the ChemiCloud terms.

### Zone audit, 7 Aug 2026

Swept 156 candidate subdomains against the live zone plus every record type on
the apex. Four findings:

1. **`lyncdiscover` and `sip` are dangling CNAMEs.** Their targets
   `webdir.online.lync.com` and `sipdir.online.lync.com` both return NXDOMAIN —
   Skype for Business Online is gone. `_sip._tls` points at the same dead
   `sipdir` host. Only `_sipfederationtls._tcp` → `sipfed.online.lync.com` still
   resolves, and with no Skype/SfB deployment it does nothing. **This answers
   the long-standing open question: yes, safe to delete, all four.** Takeover
   risk is nil (Microsoft owns lync.com), but they are dead weight that makes
   the zone read as more load-bearing than it is.
2. **An undocumented record was in the zone**: the apex TXT
   `google-site-verification=m10EeI5HB9Fett6Js7GL60fuhOhJ4UKx-OXA36Xw2Zg`. It is
   legitimate — it is the Search Console DNS verification, and the Tech Standards
   note on Search Console says explicitly not to delete it because it **is** the
   verification. It was simply missing from the zone inventory in docs/DNS.md,
   which is exactly the shape of the 27 Jul incident: a live record nobody
   documented, deleted by a cleanup that took it for junk. Now recorded.
3. **No CAA record.** Any CA in the world may currently issue for petromac.co.nz.
   Cheap hardening, not urgent — see TODO.
4. **The WordPress-era drift is confirmed absent from the live zone.** `portal`,
   `autoconfig` and `localhost` do not resolve, which corroborates that they
   only ever existed in the inert Crazy Domains panel. One less thing to fear
   during the Crazy Domains cleanup.

Everything else matched docs/DNS.md, and every other CNAME resolves — no
takeover exposure. Note the sweep was DNS-based; Certificate Transparency was
not searchable from this environment, so a hostname that exists in the zone but
matches none of the 156 probed names would not have been caught. The Cloudflare
dashboard remains the authoritative list.

## Aug 2026 — kiosk-hd retired: one video folder, not two

**Decision:** `public/videos/kiosk-hd/` is deleted. The kiosk plays the same
`public/videos/transcoded/` files as the public site. Gone with it:
`src/hooks/useKioskVideo.ts` (probe cache + HEAD requests + sticky
resolution), the `?sd=1` flag, and the 1080p entries in the prime manifest's
`optional` bucket.

**Why it existed and why it stopped making sense:** it was a QUALITY TIER, not
a caching mechanism — a common misreading, since the kiosk is an offline-primed
SPA. `transcoded/` used to be 540p (right for the web, soft on a 60" screen),
so `kiosk-hd/` held 1080p copies under identical filenames and the hook probed
for them at runtime. The service worker caches whatever URLs are requested; it
never needed its own folder. Once the Aug 2026 re-transcode made `transcoded/`
1080p, the two folders held the same thing: ~170 MB duplicated in git and in
every Docker image, plus a runtime probe, to serve identical bytes.

**The one real difference** was `dice.mp4` — 1080p/1.4 MB in `kiosk-hd`, still
540p/544 KB in `transcoded`. Its 1080p copy was promoted before deletion. dice
is kiosk-only, so the public site never pays for it.

**Consequences:** every prime now pulls the full 1080p video set (they are in
`required`); the optional tick is just the 3D models. Kiosk launch URLs still
carrying `?sd=1` are inert rather than broken — the flag is simply never read.
If a weak device ever needs a lighter set, that is a NEW encode and a new
decision, not a resurrection of this folder.

**Needs a device pass:** `kiosk-sw.js` VERSION went v19 → v20, so the tablets
must be re-primed while online. None of this was verifiable from a Cowork
session — the offline prime, the SW cache and the playlist only prove
themselves on the hardware.

---

## Aug 2026 — Nav: About opens a menu, Origins owns /about

**Decision:** About no longer navigates. It is a `<button>` that only reveals
its dropdown, which now reads **Origins / Team / Patents**. Origins owns
`/about`. Publications left the menu; its ROUTE is unchanged and it is
surfaced from `/success-stories` for now. The logo routes through
`handleNavClick` like every other nav link.

**Why:** Origins was previously removed (Jul 2026) because it duplicated the
About item's own href — two adjacent entries pointing at `/about`, so whichever
you tapped second was a dead same-route navigation. Making About a pure
disclosure removes the duplication at its source instead: there is now exactly
one entry point to `/about`, named after that page's own H1.

**The trap this re-opened.** `isSubActive` prefix-matches, so restoring Origins
(`/about`) made it light up on `/about/patents` as well — two menu entries
reading as current at once. The exact-match special case for `/about` had been
DELETED when Origins was removed, and has to exist whenever Origins does.
Verified across every route that at most one sub-link is ever current. If
Origins is ever removed again, that special case can go with it — not before.

**Why Publications moved but its URL did not:** it is not "about the company"
the way Origins/Team/Patents are, so it left the About cluster completely —
the dropdown AND the `/about` sidebar. Its home is now **Success Stories**,
where it renders as a `PublicationsCard` below the story grid: an SPE or SPWLA
paper is the peer-reviewed end of the same evidence those stories tell
informally, so a reader who wants harder proof is already on the right page.

The ROUTE is deliberately unchanged (`/about/publications`, still in the
sitemap). Nesting a page under `/about` while presenting it from
`/success-stories` is a mild smell, but the alternative is a URL migration
with a 301 and a Search Console re-crawl, and the page's own title is already
a strong SEO asset ("Technical Papers on Wireline Conveyance"). Not worth
moving until the presentation has settled.

`/about/patents`, `/track-record` and `/contact` still link it. Those are
TRANSITIONAL — the intent is that the card is the single home — but they are
also the only remaining entry points, so prune them only after confirming the
card carries the traffic, or the page ends up reachable from the sitemap
alone.

**Placement is under review.** The card sits below the grid ("browse the field
record, then the formal record"); a card above would compete with the filter
panel for the first glance. That is a judgement call, not a finding, so
`PublicationsCard` takes no props and is a one-line move.

**Logo:** clicking it while already on the homepage was a same-URL navigation
Next deliberately ignores — measured on production at scrollY 2079 → 2079,
while the "Home" link beside it correctly returned to 0. Cross-route was
already correct (/catalog 1289 → home 0), so this was the same-route gap left
by `a99c756`, not a scroll-restoration bug.

---

## Aug 2026 — Myanmar is withheld from the published track record

**Decision:** an `EXCLUDED_COUNTRIES` set in
`scripts/python/normalization_config.py` drops Myanmar's rows immediately after
country normalisation and before any artifact is written. They reach no map,
chip, tooltip, Top-5 panel or headline number, and the pipeline logs the drop.

**Why not the first attempt.** This shipped that morning as a
`COUNTRY_NORMALIZATION` alias, Myanmar → Vietnam, and was reverted the same day.
The alias did keep Myanmar off the map, but it did so by making the map claim
104 deployments in Vietnam where 50 happened — a false statement on the page
whose entire job is proving the track record. Suppression reaches the same
business goal honestly: every country shown keeps a true count, and the totals
simply describe a smaller dataset.

**The trade, accepted explicitly:** published figures sit BELOW Jobs History
Master by exactly the excluded rows — 3,507 of 3,561 records, 3,114 deployments
against 3,167. A discrepancy of that size is the exclusion list, not a pipeline
fault; check the config before debugging. The source workbook is never modified.

**Filter placement matters:** the drop runs AFTER normalisation, so an alias
(`UAE` → `United Arab Emirates`) can never smuggle a row past the list, and
BEFORE the writes, so the slim JSON, the staff dump and the stats all describe
the same reality. Do not generalise this into "rename countries to fix the map"
— that is the France/French-Guiana trap, flagged two lines below it in the same
file.

---

## Aug 2026 — Trademark marking: prominent use only

**Decision:** Petromac™, Wireline Express™, Focus™, Tool Taxis™, Thor™ and
Hermes™ are marked at the first or most prominent use on a page and left bare
everywhere else. The full rule, the do-not-mark table and the location of every
mark live in `docs/VOCABULARY_MAP.md` §0.

**Why not everywhere:** "Petromac" alone appears ~110 times across ~38 files.
Marking all of them would put the symbol in `<title>` tags (cluttering SERP
snippets and eating the 60-character title budget), in `alt`/`aria-label` (screen
readers announce "trade mark" on every pass), in JSON-LD (structured data wants
the plain entity name) and on the legal entity in Terms/Privacy (the registered
company name is not the mark). Consistent marking of prominent uses is what
protects a mark; blanket marking just reads as amateurish.

**Implementation rule that matters:** symbols live in DISPLAY-LABEL MAPS, never
in data. `FAMILY_LABELS`/`familyLabel()` overrides the GENERATED `catalog.json`
family names without hand-editing that file, and `SYSTEM_LABELS` shows Thor™
while the key stays `Thor` so it still matches the `System` column. Put a ™ in a
filter value or a data key and filtering silently breaks.

---

## Aug 2026 — Success-stories filters: faceted counts, one label switch

**Decision:** `buildFacetedCaseStudyOptions` recounts each filter's options
against the active query; `SHOW_FILTERED_COUNT_ON_ACTIONS` +
`actionButtonLabel()` decide whether the Download/Email buttons show the count
(currently off).

**Why:** Martin's review — selecting MENA (16) still showed Challenges (21) and
SLB (36), totals from the whole 46-story set that cannot be right inside a
16-story subset.

**Three choices worth keeping:**

1. **A facet excludes its OWN selection from its counts.** Count Region against
   the Region choice and every region but the chosen one reads 0, so you could
   never switch away. Self-exclusion keeps siblings reachable while the other
   dropdowns narrow.
2. **Options are never dropped or reordered.** An empty combination renders
   `(0)` and disabled; order comes from the unfiltered tally. A list that
   reshuffles and loses entries as you filter is harder to use than one that
   stays put and names its dead ends.
3. **Free text feeds the counts**, or the dropdowns disagree with the cards on
   screen — the same class of bug being fixed.

**Why the switch lives in `filters.ts`, not the component:** TWO surfaces render
these buttons — the live browser and `/case-studies-preview`. A component-local
flag would be half-applied on day one, and half-applied is precisely the bug
Martin found (Download carried the number, Email did not). Both surfaces now
import one flag and one label function, so they cannot drift.

---

## Aug 2026 — Case Studies renamed to Success Stories, URL INCLUDED

**Decision:** `/case-studies` → `/success-stories` — route folder, nav,
H1, breadcrumbs, JSON-LD, sitemap, internal CTAs, e2e expectations. The
old tree 301s across in ONE hop via a `startsWithSegment('/case-studies')`
rule in `resolveLegacyRequest` (step 5b), and every legacy rule that used
to land on `/case-studies` now points straight at the new home so no
chains form. The `'/success-stories'` LEGACY_PATHS entry from the Jul
flipbook retirement was REMOVED — it is a real route again and the entry
would have redirected the page to itself. `/case-studies-preview` (orphan
proposal route) is deliberately not caught: `startsWithSegment` requires
an exact match or a following slash. Slugs are unchanged and stay frozen.

**Why:** Martin's review ("they are not really Case Studies") + Rajesh's
call to rename everything including the URL. SEO hedges: the meta title
keeps the search term alongside the new name ("Success Stories — Wireline
Logging Case Studies"), sitemap.xml (same address, regenerated contents)
was resubmitted in Search Console and the new index page put through
Request Indexing on 6 Aug. Expect old URLs to drift to "Page with
redirect" in GSC — correct behaviour, not a regression.

**Trap for the future:** the 21 WP-era root-slug redirects now target
`/success-stories/<slug>` directly. If this page ever renames again,
update LEGACY_PATHS destinations in the same commit or the no-chains
unit test will fail (that test is the guard — keep it).

---

## Aug 2026 — Homepage lightbox videos re-transcoded to 1080p

**Decision:** the four `transcoded/*-subtitled.mp4` web cuts are now
1920×1080 (CRF 22, 2.5 Mbps maxrate, `+faststart`, audio copied),
re-encoded from the `kiosk-hd/` 1080p files. `?v=20260806` cache-buster
on the ChallengeSelector sources.

**Why:** the old web cuts were 960×540 at starving bitrates (WirelineExpress
at 232 kbps) — reviewers saw blur, and Edge kept offering its Video Super
Resolution "Enhance" button, which only appears on low-res video. Page
weight is unchanged: the lightbox mounts no `<video>` until the poster is
clicked, so only the on-demand stream got heavier (~27–47 MB per clip,
progressive). Known limitation: kiosk-hd is itself a compressed
generation; if original masters resurface, re-encode from those.
`WirelineExpress-subtitled` remains SILENT in both trees — audio issue
tracked in TODO ("Martin's website review").

---

## Jul 2026 (late) — Redirects moved out of next.config into src/proxy.ts

**Decision:** all URL redirects now live in `src/lib/redirects.ts` (a pure
mapping table with a unit test) applied by `src/proxy.ts`, and
`next.config.ts` sets `skipTrailingSlashRedirect: true`. `redirects()` in
next.config is gone.

**Why:** the 30 Jul 2026 Search Console audit found six previously-indexed
WordPress pages 404ing, including `/contacts/` at 59 clicks / 1,045
impressions over six months — the site's second-biggest traffic source.
WordPress served everything with a trailing slash, and those slashed URLs
are what Google has indexed. Next normalises the trailing slash BEFORE it
consults `redirects()`, so `/contacts/` became `/contacts` and only then
looked for a rule: where a rule existed the visitor got a 308 → 301 chain,
and where none existed (the six pages) they got a plain 404. Middleware
doesn't help — it runs after `redirects()`, later still. The only way to
match the slashed form in one hop is to turn the built-in normalisation off
and do the lookup and the slash handling in the same pass. The proxy
therefore also owns the ordinary `/page/` → `/page` 308 that Next used to
emit; drop that and every page grows a duplicate URL.

**Also settled here:** legacy hops are 301 rather than Next's `permanent:
true` 308 — Google treats them identically, but 301 is what every SEO tool
and every person reading the audit expects. Dead WordPress feed URLs return
410 (drops from the index faster than 404). Unrecognised query strings on
public URLs return 404, because Google had crawled `/?11667727895.html` and
friends as four separate 200-serving pages; `utm_*`, `gclid`, `fbclid` and
the rest of the campaign params stay allowed, and the route allowlist in
redirects.ts is the extension point for any future page that reads
`searchParams`.

**Cost:** one more moving part in the request path, and a page that starts
reading a query param without adding it to `ROUTE_QUERY_PARAMS` will 404.
The unit test covers the whole mapping table, both slash forms, and asserts
no destination is itself redirected.

---

## Jul 2026 (late) — Catalog: three-level drill-down + enrichment layer

- **Overview → families → models**, mirroring the print catalog's own
  structure (product-line bands, vendor grouping from the PDF TOC). Family
  pages carry dense spec TABLES instead of card grids — comparison is the
  job at that level; narrative lives on model pages. All 32 model URLs
  unchanged (indexed); family pages are new real URLs (SEO + sitemap).
- **Enrichment layer over the generated content model.** catalog.json
  stays pipeline-generated (never hand-edited); everything website-specific
  — vendor sections, finder purposes, taxi roles, parsed numeric specs —
  lives in `enrich.ts`, keyed by slug, so a new catalog edition is just
  drop-IDML + regenerate. New products get safe defaults plus a build-time
  warning to add one curation row. Bearing types derive from TTA/TTB model
  prefixes; a fraction-aware parser reads hole/casing ranges, bore, temp,
  weight from the display spec strings (5 PDF-verified per-slug overrides).
- **Corruption fixed at the source**: the print font's fraction glyph
  (mojibake `�`) is mapped in catalog_config.json replacements and table
  titles now pass through replacements — 120 occurrences to zero, values
  verified against the PDF.
- **Device Finder v1**: hole/casing size + purpose over the parsed fields;
  pure filter function (headlessly tested), client island, no SKU names in
  the overview markup.

## Jul 2026 (late) — Track Record: map as hero, same-generation data

- **The map is the page; stats are furniture.** The three big stat cards
  duplicated the homepage band and pushed the map below the fold. Second
  iteration went further: no header band at all — the map card opens the
  page, its own header row carrying the H1, the filter chips (moved out of
  the in-map overlay), a live deployments counter, and a records anchor.
  One filter state (in `TrackRecordExperience`) drives the map and the
  counter+sparkline overlay (one compact card in the old legend corner,
  hidden while a country drawer is open) through a single shared
  calculation, with the all-systems curve baked at build for crawlers.
  Countries/years tiles were dropped; those figures live on in the map's
  pre-load placeholder sentence. A verified "Records & milestones" strip (facts checked against
  the success-stories PDF / publications list) gives the page substance
  beyond the homepage numbers.
- **No color legend on the choropleth.** Darker-means-more is intuitive;
  precise values come from the hover tooltip and the Top 5 / Show-all
  panel. Removing it also removed the main legend-over-navbar stacking
  risk (the card stays `isolate`d for the remaining overlays).
- **Versioned data fetch.** Page copy is baked at build from
  `operations_stats.json`; the map fetched `operations_data.json` at
  runtime, so a CDN-cached older file could disagree with the page for up
  to a day after a data deploy (the observed "52 vs 53"). The public fetch
  now carries `?v=<stats generatedAt>` — same pipeline generation by
  construction. Kiosk callers keep the bare URL so offline service-worker
  cache keys stay stable.
- **`isolate` on the map card** fences its overlay z-indexes (legend,
  panels, tooltip) into a local stacking context so they can never paint
  over the sticky site header.
- **Freeze audit (intermittent tab hang):** no ResizeObserver/rAF loops
  exist in the map stack; the only unbounded-frequency path was
  mousemove → hover state → full overlay re-render, now coalesced to one
  update per animation frame. Root cause of the one-off hang not
  definitively reproduced; this defensive guard removes the only
  render-flood candidate.

## Jul 2026 (late) — Launch-prep polish pass

- **No scroll snapping, by design.** Section heights are heterogeneous
  (90vh hero next to 150px bands), so snap points would fight the wheel.
  Premium scroll feel comes from CSS-only pieces instead: reduced-motion-
  aware smooth anchors, scroll-driven `.scroll-reveal` settle-ins on the two
  narrative pages, and a header shadow over the first 120px of scroll.
  Wheel/touch inertia stays fully native everywhere.
- **Tailwind v4 `@config` directive is load-bearing.** The v3-style
  `tailwind.config.ts` was silently ignored for weeks (v4 doesn't auto-load
  JS configs): every brand/heading/shadow utility compiled to nothing, and
  the site survived on two hand-written `.bg-brand`/`.text-brand` overrides.
  One directive in `globals.css` fixed fonts, hovers, focus rings, and the
  type scale site-wide.
- **Primary content is server-rendered; interactivity is islands.**
  `/track-record` became a server page (stat tiles from the build-time stats
  snapshot) with the map as its only client island — the pre-fetch state is
  a crawlable summary sentence, not a spinner. `/catalog` renders all four
  category panes with inactive ones `hidden`, so every product is in the
  initial HTML while the pushState workspace behaves exactly as before.
- **Indexability is derived, not configured.** Any build whose site URL
  isn't petromac.co.nz ships noindex + Disallow-all automatically, and
  `next.config.ts` refuses to build `NEXT_PUBLIC_ENV=production` against a
  non-production URL — the classic launch-day "shipped noindex to prod"
  mistake is structurally impossible rather than checklist-guarded.
- **Typewriter animations are progressive enhancements.** The hero headline
  and the Athena terminal (briefly on the homepage, now /simulation's
  "See it in action" demo) render their complete final text in the SSR
  HTML; the animation replays it after hydration (once, reduced-motion-
  aware, layout-shift-free via probe-measured width/height reservation).
  Crawlers, LCP, and no-JS users always get the finished state.
- **Hero background is a purpose-cut loop, not the product film.** The
  4-minute 13 MB WirelineExpress clip was replaced by a seamless ~13s
  ~1.9 MB loop whose first frame doubles as the poster — instant paint, ~85%
  less transfer, and mobile/reduced-motion users download no video at all
  (IO-gated source attach in `LazyVideo`).

## Jul 2026 — HTML catalog replaced the pdf.js viewer at /catalog

**Decision:** after a day of refinement at `/catalogtest`, the HTML catalog
took over `/catalog` outright (10 Jul 2026). The pdf.js viewer, `react-pdf`
(~350 KB gz), `public/pdfjs/` and `search-index.json` were removed; the
compressed print PDF remains only as the download/email artifact.
`/catalogtest/*` 301-redirects to `/catalog/*`; all 32 product pages are SSG
and in the sitemap. Category tree diverges from print deliberately: Fixed
Angle Guides is a group inside Guides & Holefinders (four categories total)
— per Rajesh, they're one section in practice.
**Why not keep both:** two catalog surfaces = two content update paths; the
viewer's UX problems (slow first paint, broken search jumps, no clickable
links) were the reason for the rebuild, and the HTML catalog covers every
viewer capability except literal print layout, which the downloadable PDF
still provides.

## Jul 2026 — HTML catalog from a curated content model (not a live IDML scraper)

**Decision:** `/catalog` is being rebuilt as a native HTML catalog (refining
at `/catalogtest`). Source of truth is a **curated content model**:
`scripts/python/catalog_config.json` (product↔spread mapping, summaries,
image picks, text fixes) + the generated
`src/features/catalog/content/catalog.json`. The IDML extractor stays in the
repo as the re-import/diff tool for future editions — but product boundaries
and editorial text are config, not inferred.
**Why:** the InDesign source is an art-directed brochure, not a database —
grouping is spatial (absolute positions), styles are visual not semantic, and
~40% of Links assets are design files. A fully automatic per-edition scraper
would break on every redesign. The curated split keeps re-import mechanical
where it's reliable (text, spec tables, images) and human where it's judgment
(what's a product, what's its summary). Spec edits go in the config +
`pnpm run data:catalog`, never hand-edits to `catalog.json` (ADMIN.md §2b).
**Extraction verified against the print PDF (2026-07-10):** all 1,665
extracted strings classified — 93.3% exact matches, 3.9% word-level matches
(pdftotext interleaves two-column layouts), 1.7% deliberately curated text,
and the remaining 1.1% is content that exists only in the IDML because the
designer's PDF export is older (TTB-S75U pages, SWHF configuration page,
H2S/sour-service footnotes on RO17/TWT-28/TWS-30). **Zero extraction errors.**

## Jul 2026 — Email via Microsoft Graph (app-only), not SMTP

**Decision:** All outbound mail (contact form + PDF sends) goes through
Microsoft Graph `sendMail` using the Entra app's **application** `Mail.Send`
permission, sending as the `info@petromac.co.nz` shared mailbox. No SMTP, no
mailbox password, no license. Backend reuses the same `ENTRA_*` creds as staff
sign-in + `MAIL_SENDER`.
**Why:** `info@` is a shared mailbox — shared mailboxes can't do SMTP AUTH at
all. Creating a licensed service user just for SMTP would be ~$4/mo of
throwaway work, because Microsoft disables SMTP AUTH basic auth by end of Dec
2026 anyway (Graph is the forced end-state). Graph sends as a shared mailbox
with zero extra licensing. Kiosk emails additionally send "as the signed-in staff member" (delegated
Graph `/me/sendMail`): the delegated access token is kept short-lived in the
encrypted session cookie (no refresh token), the send happens in a Next.js
route so the token never reaches FastAPI or client JS, and it falls back to
`info@` when there's no valid staff token. A cookie-size guard drops the token
rather than risk an oversized (silently-discarded) cookie.

## Jul 2026 — Intranet gated server-side; sign-out lands on the homepage

**Decision:** `/intranet` verifies the session cookie in the initial request
and 307s unauthenticated visitors straight to Microsoft sign-in — no page
shell, no client-side session check. Sign-out redirects to `/` (allowlisted
in `normalizeReturnTo`).
**Why:** The client-side gate loaded the page, hydrated, fetched the session,
and then redirected — slow and it flashed the content. Sign-out previously
returned to `/intranet`, which bounced freshly signed-out users back into the
Microsoft sign-in screen. Behind the tunnel, OAuth redirect URIs must come
from `getRequestOrigin()` (proxy headers) — `request.nextUrl.origin` resolves
to the container bind address and Microsoft rejects it (AADSTS50011).

## Jul 2026 — Catalog viewer: self-contained scroller + book spreads

**Decision:** The catalog viewer scrolls inside its own fixed-height area
with the toolbar always visible above it; pages lay out as book spreads
(cover alone, then 2-3, 4-5, …) at ~80% of the container width on wide
screens, single column below 1024px. PDF/worker/search-index are preload()ed
in parallel with the viewer chunk; a progress bar shows download %.
**Why:** The sticky toolbar never worked — the page shell's
`overflow-x-hidden` forces `overflow-y` non-visible, which disables
position:sticky on descendants (CSS spec). Search jumps scrolled the whole
document and lost the toolbar. Single-column pages wasted desktop width.
The assets loaded as a serial discovery chain (chunk → worker → PDF).

## Jul 2026 — Nav: Team merged under About

> **Superseded in part (Aug 2026)** — see "Nav: About opens a menu, Origins
> owns /about" above. About no longer navigates, the menu is Origins / Team /
> Patents, and Publications has left it. Team living under About still holds.
> The sidebar/menu mirroring below no longer holds either: the `/about` page
> sidebar is Team / Patents (Origins is omitted — you are already on it), and
> Publications was dropped from it as well.

**Decision:** Team left the top bar; About carries a hover/focus dropdown
(Team, Patents, Publications) and highlights as active for `/team` too. The
About page sidebar lists the same three in the same order.
**Why:** Team is company info — one fewer top-level item, and the About
cluster (team/patents/publications) reads as one destination.

## Jul 2026 — Single-PDF catalog scheme

**Decision:** When a new catalog lands, compress it to <4 MB (Ghostscript) and
linearize it (qpdf); that one PDF serves the viewer, the Download button,
and emailed attachments. No separate `email.pdf` for the catalog. Named
`petromac-product-catalog.pdf` (Jul 2026) — the artifact is user-facing
when downloaded, so `source.pdf` was a bad name.
**Why:** The viewer was already serving the compressed copy (see next entry),
so two files were redundant. Text/vector content survives compression sharp;
only photos downsample. The full-res master is always in `sources/_archive/`.
Success stories keeps its `email.pdf` because its `source.pdf` must stay
full-res (the flipbook page images render from it).

## Jul 2026 — Catalog: pdf.js viewer serves the compressed PDF (streaming abandoned)

**Decision:** The catalog viewer loads one ~4 MB compressed PDF outright
instead of range-streaming the full-res file.
**Why:** The catalog moved from a WebP image flipbook to a pdf.js viewer to
get selectable/searchable text and clickable links (the source PDF has ~52k
chars of text and 100+ link annotations that rasterizing threw away).
Range-request streaming of the 11 MB original was attempted — linearized PDF,
206-capable origin+CDN, `disableStream`/`disableAutoFetch` — but pdf.js still
full-downloads the file through Cloudflare. Verdict: don't fight it; make the
file small instead. Search uses a pipeline-built `search-index.json` (per-page
text) so the search box covers all pages without extra PDF fetches.

## Jul 2026 — Success stories opens as a Track Record overlay (REVERSED)

**Decision:** The Track Record button opened Success Stories as a full-screen
overlay (`/track-record?stories=1`); the standalone `/success-stories/flipbook`
route was kept.
**Why:** Kept map ↔ stories in one context. The standalone route stayed
because it's in the sitemap, is the target of the `/success-stories` redirect,
and emailed links may point at it. The flipbook component already supported
embedding (the kiosk uses the same API).
**Reversed (Jul 2026, pre-launch):** The overlay covered the site header and
footer, so visitors landed in a bare window with no navigation — it read as a
bug, and was inconsistent with the homepage cards linking to the standalone
page. The button now navigates to `/success-stories/flipbook`;
`?stories=1` 307-redirects there (`src/lib/redirects.ts`) for old shared links.
StoriesOverlay.tsx was deleted. The kiosk's embedded usage is unaffected.

## Jul 2026 — Cache policy: moderate max-age + long stale-while-revalidate

**Decision:** `next.config.ts` sets Cache-Control per bucket: quarterly assets
(flipbooks, images, videos, models, draco, pdfjs, icons, world map) get
`max-age=1d, swr=30d`; weekly operations data gets `max-age=1d, swr=7d`.
Requires Cloudflare Browser Cache TTL = "Respect Existing Headers".
**Why:** Content swaps reuse the same filenames and browser caches can't be
purged remotely — a long hard max-age would pin stale content for months after
a refresh. SWR gives cache-hit speed always, with staleness bounded to ~a day
(background 304 revalidation via ETags). Content cadence per owner: everything
quarterly, operations stats weekly.

## Jul 2026 — Homepage videos defer to scroll (LazyVideo)

**Decision:** All homepage `<video autoplay>` elements route through
`LazyVideo`, which attaches the source only when scrolled near the viewport.
**Why:** `autoPlay` downloads the full file on mount regardless of
`preload="metadata"`; six clips loaded at once (~60 MB), and clips reused
across sections double-downloaded because parallel fetches can't hit cache.
After: desktop loads only the hero (13 MB), mobile loads nothing (the hero is
`display:none` on mobile and a hidden element never intersects). Cards load
and autoplay as they scroll in, deduped by the HTTP cache.

## Jul 2026 — Email log removed; M365 Sent Items is the record

**Decision:** The email-log feature (backend JSONL log + config endpoints +
staff-gated intranet page + data volume) was deleted entirely.
**Why:** All mail sends as `info@petromac.co.nz` (Microsoft Graph), so the
mailbox's Sent Items already records every send. The JSONL copy was redundant
recipient PII on a server volume with an unsolved retention question. The
backend staff-session verification went with it (it gated only this feature);
the Next.js Microsoft sign-in is separate and remains for staff identity.

## Jul 2026 — Legacy kiosk routes removed

**Decision:** `/intranet/kiosk/productlines` (+ `SystemModal`,
`featuredSystems`) deleted; earlier, `OverlayExperience` and
`RockerExperience` were deleted after the kiosk OH/CH redesign.
**Why:** Zero inbound links after the May 2026 kiosk redesign; kept briefly
"for direct links", then judged dead weight.

## Jul 2026 — Backend hardening

**Decision:** Rate limiting keys on `CF-Connecting-IP`; `pageNumbers` capped
at 60 (model + pre-materialization check); 64 KB request-body limit;
contact-form field length caps; rate-limit dict prunes expired entries.
**Why:** The old left-most `X-Forwarded-For` value is client-supplied — an
attacker could mint a fresh rate bucket per request. Behind cloudflared,
`CF-Connecting-IP` is set by Cloudflare and can't be forged. The PDF endpoint
processed unbounded arrays before checking limits (CPU/memory DoS).
**Related invariant:** container ports MUST bind `127.0.0.1:` on the server —
a compose drift once published 8012/3015 on 0.0.0.0, exposing the backend
directly and bypassing Cloudflare (and therefore the rate limiting). See
DEPLOY.md.

## Jul 2026 — Content-Security-Policy

**Decision:** Strict self-hosted CSP with documented exceptions:
`'unsafe-inline'` scripts (App Router inline bootstrap; no nonce middleware),
`'wasm-unsafe-eval'` (Draco decoder), inline styles (styled-jsx),
`worker-src blob:` (three.js workers), `connect-src blob:` (GLTFLoader
fetches blob: URLs for textures embedded in Draco GLBs — found by testing).
**Why:** Everything is self-hosted (fonts via next/font, pdf.js worker at
`/pdfjs/`, Draco at `/draco/`), so a tight policy was cheap.

### Edge caching (28 Jul 2026)

Two Cache Rules were added after a header sweep found `/data/*.json` and
`/_next/image` both returning `cf-cache-status: DYNAMIC` — Cloudflare caches
neither `.json` nor query-string URLs by default, so the ~538 KB operations
dataset and every optimised image were served from the origin on each visit.
Rules: path starts-with `/data/` and ends-with `.json`; path equals
`/_next/image`. Both cache-eligible, edge TTL driven by the origin's
`cache-control`, browser TTL respect-origin.

Zone **Browser Cache TTL was 14400 (4 h) and is now `0` = Respect Existing
Headers.** A numeric value overrides the browser-facing `max-age` for
everything, which defeated the cadence policy above — the whole point of the
moderate `max-age` + long `stale-while-revalidate` pairs is that the app
controls staleness, in version-controlled code rather than a dashboard setting.

Traps, since the UI naming is inconsistent: Edge TTL has NO option called
"Respect origin TTL" (use "Use cache-control header if present, bypass cache if
not", which stores as `bypass_by_default`), whereas Browser TTL DOES have one
and defaults to **Bypass cache** — so expanding that section and leaving it
alone sets browser bypass. Never add a Cache Key setting to the `/_next/image`
rule: the query string must stay in the key or all image sizes collapse to one
entry. Cloudflare Web
Analytics (added 28 Jul 2026) is the one third-party script — it needs
`static.cloudflareinsights.com` in `script-src` and `cloudflareinsights.com` in
`connect-src`, or the beacon is blocked silently.
Self-hosting the decoders is itself a rule: the kiosk must work offline, so
no dependency may silently fall back to a CDN.

## Jul 2026 — Performance architecture (first-load pass)

**Decisions & why:**

- **Flipbook pages are WebP q80** rendered by the pipeline; the old JPEGs were
  4× the bytes for no visible gain at display size.
- **Flipbook loads a ±4-page window** around the current spread. Browser
  `loading="lazy"` is defeated by page-flip stacking all pages in-viewport —
  measured: the whole book downloaded on mount.
- **Flipbook/search manifests import at build time** instead of runtime
  fetches — each fetch was a serial round-trip gating first render.
- **Track Record loads its three big assets in parallel** (operations JSON,
  world topojson, d3 chunk were a serial waterfall) and memoizes fetched+
  decoded data at module level so back-navigation is instant.
- **Homepage stats are pipeline-generated** (`operations_stats.json`, imported
  at build time) — the homepage used to fetch 600 KB to show three numbers,
  with a hardcoded fallback that had drifted from reality.
- **GLBs are Draco-compressed** (221 MB → 14 MB) with the decoder self-hosted;
  large PNGs converted to WebP.
- **world-50m map kept over 110m** despite 7× size: the 110m simplification
  visibly broke Bolivia's border. Cached hard instead.

## May–Jun 2026 — Earlier decisions (summary)

- **Kiosk OH/CH split**: OH lane is a pure video attractor; CH lands in
  `HelixExperience` with video → product → mechanism/logs tiers.
- **Kiosk SD-by-default** (`?sd=1`): routine prime stays ~50 MB; 1080p opt-in.
- **Drop-zone content pipeline** (`sources/` + `pnpm run data`): content
  updates need no env vars, no renaming, no engineering.
- **Tags CSV is the single source of truth** for success-stories filtering.
- **Frontend reads `/data/*.json` statically**, never via the backend — the
  site must work even if the FastAPI backend is down.
- **Email over Microsoft (not Brevo)** (org standard deviation): Petromac
  lives in Microsoft 365; mail sends via Graph as the `info@` shared mailbox.
