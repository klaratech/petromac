# Decision Log

Why things are the way they are. Newest first. The other docs describe the
_current state_ and _how to operate it_; the reasoning lives here.

---

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

## Jul 2026 — Success stories opens as a Track Record overlay

**Decision:** The Track Record button opens Success Stories as a full-screen
overlay (`/track-record?stories=1`); the standalone `/success-stories/flipbook`
route is kept.
**Why:** Keeps map ↔ stories in one context. The standalone route stays
because it's in the sitemap, is the target of the `/success-stories` redirect,
and emailed links may point at it. The flipbook component already supported
embedding (the kiosk uses the same API).

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
**Why:** All mail sends from `info@petromac.co.nz` via Office 365 SMTP, so the
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
- **M365 SMTP over Brevo** (org standard deviation): Petromac already lives in
  Microsoft; one mailbox, one app password. Revisit if it becomes a burden.
- **Staff auth (Entra OAuth) and email (SMTP app password) are decoupled** —
  identity display today, Graph "send as me" is a possible later phase.
