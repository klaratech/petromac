# Decision Log

Why things are the way they are. Newest first. The other docs describe the
_current state_ and _how to operate it_; the reasoning lives here.

---

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
  4-minute 13 MB WirelineExpress clip was replaced by a seamless 14.9s
  2.6 MB loop whose first frame doubles as the poster — instant paint, ~80%
  less transfer, and mobile/reduced-motion users download no video at all
  (IO-gated source attach in `LazyVideo`).

## Jul 2026 — HTML catalog replaced the pdf.js viewer at /catalog

**Decision:** after a day of refinement at `/catalogtest`, the HTML catalog
took over `/catalog` outright (10 Jul 2026). The pdf.js viewer, `react-pdf`
(~350 KB gz), `public/pdfjs/` and `search-index.json` were removed; the
compressed print PDF remains only as the download/email artifact.
`/catalogtest/*` 308-redirects to `/catalog/*`; all 32 product pages are SSG
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
`?stories=1` 307-redirects there (next.config.ts) for old shared links.
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
`/pdfjs/`, Draco at `/draco/`, no analytics), so a tight policy was cheap.
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
