# Admin & Content Updates

The recurring jobs that keep the site current — what to do when new data
arrives, and how to publish it. Most of these are periodic (operations data,
flipbooks) or event-driven (a new patent is granted, a team member joins).

Every update follows the same shape: **change the source → rebuild or edit →
commit → push → CI deploys.** The specifics per content type are below.

For operations data and flipbooks there's a **drop zone**: put the new file
into the matching `sources/` folder (any filename), run one command, commit
what changed under `public/`. The pipeline archives the input for you. See
[sources/README.md](../sources/README.md).

---

## 1. Operations / job history data

Drives the **Track Record** map (`/track-record`) and the homepage **Proof**
stats. The published artifacts are `public/data/operations_data.json` (map
surfaces), `operations_full.json` (staff datacheck), and
`operations_stats.json` (headline numbers the homepage imports at build time).

**When:** new job history is available (roughly quarterly), or whenever the
numbers shown publicly need to be current.

**Steps:**

1. Drop the new job-history `.xlsx` into `sources/operations/` — any filename
   is fine, no renaming needed.
2. Run `pnpm run data:operations`. The pipeline picks the newest file in the
   folder, rebuilds `public/data/operations_data.json`, then moves the input
   into `sources/_archive/` (date-stamped).
3. Sanity-check the diff (`git diff --stat public/data/`).
4. Commit `public/data/operations_data.json` and push.

`pnpm run data` does this as part of a full run (operations + flipbooks).

---

## 2. Catalog & Success Stories documents

The **catalog** at `/catalog` (in-browser pdf.js viewer) and the **success
stories** flipbook at `/success-stories/flipbook`. Generated bundles live in
`public/flipbooks/{catalog,success-stories}/`.

- **Catalog** — served as the PDF itself through a searchable pdf.js viewer, so
  updating it is just a PDF swap. The pipeline ships the linearized
  `petromac-product-catalog.pdf`,
  compressed to <4 MB on ingest — the same file serves the viewer, downloads,
  and email — and `search-index.json` (per-page text for search).
  No page images. Keep the source PDF's real text + links intact (don't flatten
  to images) — that's what makes it searchable and clickable.
- **Success stories** — an image flipbook (WebP pages) with the tags-driven
  filter system; needs its summary `.xlsx` alongside the PDF.

**When:** the catalog PDF is revised, or the Success Stories PDF / summary
changes.

**Steps:**

1. Drop the files into their folders — any filename is fine:
   - catalog PDF → `sources/catalog/`
   - success-stories PDF **and** its tags `.xlsx` → `sources/success-stories/`
2. Run `pnpm run data:flipbooks` (needs Ghostscript for PDF compression:
   `brew install ghostscript`; and qpdf to linearize the catalog:
   `brew install qpdf`). The pipeline builds whichever documents have a new PDF
   (catalog → one compressed+linearized PDF + search index; success stories →
   WebP pages + a compressed `email.pdf`), re-syncs the kiosk offline-assets list,
   validates the bundles, and archives the inputs into `sources/_archive/`.
3. Commit `public/flipbooks/**` and push.
4. **If the kiosk needs the new content offline:** bump `VERSION` in
   `public/kiosk-sw.js` (see [KIOSK.md](KIOSK.md)) so trade-show devices
   evict the stale cache on next online load.

You can update just one flipbook — drop only a catalog PDF and success stories
is left untouched, and vice versa. `pnpm run data` does flipbooks and
operations together.

---

## 2b. HTML catalog (new — in refinement at `/catalogtest`)

The catalog is being rebuilt as a native HTML catalog (product pages, real
spec tables, instant search) generated from the **InDesign source**, not the
print PDF. It lives at `/catalogtest` until it replaces `/catalog`; the
pdf.js viewer above stays live until then.

**Source of truth:** the InDesign package — the `.idml` export **plus its
`Links` folder** (original image assets). The `.indd` itself isn't used.

**When a new catalog edition lands:**

1. Drop the whole InDesign package folder (containing the `.idml` and
   `Links/`) anywhere under `sources/catalog/` — no renaming needed. Export
   the IDML from InDesign via _File → Export → InDesign Markup (IDML)_ if the
   designer only sent the `.indd`.
2. Run `pnpm run data:catalog` (needs `poppler` for the `.ai` force charts:
   `brew install poppler`; Pillow: `pip3 install Pillow`). This re-extracts
   the IDML and regenerates:
   - `src/features/catalog/content/catalog.json` — the content model the
     site builds from (committed; the deploy build never needs InDesign files)
   - `public/images/catalog/*.webp|svg` — web derivatives of the product
     renders and charts
3. **Review the git diff of `catalog.json`.** Spec values and text flow
   through automatically. Things that need a human eye:
   - **New/renamed/moved products** → update the product→spread mapping in
     `scripts/python/catalog_config.json` (spread indices are 0-based IDML
     spread order = catalog page − 1). The config also carries each product's
     slug, category/group, one-line summary, image selection with alt
     text/captions, and typo fixes. The builder prints a warning for images
     it can't find and products with no spec tables.
   - **New images** → add them to the product's `images` list in the config
     (only listed images are processed; backgrounds/logos are ignored).
4. Commit `catalog.json` + `public/images/catalog/**` (+ config if edited)
   and push.

Editorial fixes (typos, better wording, reordering images) go in
`scripts/python/catalog_config.json` — either the `replacements` list or the
per-product overrides (`description`, `applications`, `summary`) — then re-run
step 2, so a future edition re-import doesn't lose them. Don't hand-edit
`catalog.json` directly.

Pipeline internals: `scripts/python/extract_catalog_idml.py` (IDML → raw
spread dump) → `scripts/python/build_catalog_content.py` (raw + config →
content model + images), orchestrated by `scripts/python/update_catalog.py`.

---

## 3. Patents

The Patents page (`/about/patents`) is **hand-maintained** from the list IP
counsel sends (a Word doc, updated roughly every 12 months).

**When:** counsel sends an updated patent list, or new PDFs come through.

**Steps:**

1. Edit the `DEVICES` array in
   `src/app/(public)/about/patents/PatentsClient.tsx`:
   - Add new patents under the right device category, or add a new category.
   - Update jurisdictions if any changed.
   - Move patents between categories if counsel reclassified them.
2. Update the intro line counts (`44 patents across 9 device categories`).
   The numbers are derived automatically from the array — just confirm they
   read right.
3. Drop the granted-patent PDFs into `public/patent_pdfs/`. Use the bare
   patent number as the filename, with commas and spaces removed
   (e.g. `US12,320,216` → `US12320216.pdf`). Add the matching
   `link: "/patent_pdfs/<filename>"` field to each patent entry.
   Patents without a PDF yet render as plain text — that's fine.
4. Terminology: use **"category"**, not "family" — per counsel, a patent
   "family" has a specific legal meaning (patents sharing one filing) and a
   product category here can span multiple unrelated families.
5. Commit and push.

---

## 4. Publications

The Publications page (`/about/publications`) is hand-maintained.

**When:** a new paper or conference presentation is published.

**Steps:**

1. Edit the `publications` array in
   `src/app/(public)/about/publications/page.tsx` — add an entry with
   `organization`, `reference` (full citation), `event`, and `url` (the
   DOI / OnePetro / SPWLA link).
2. Commit and push.

---

## 5. Team

Team page (`/team`). Data is in `src/data/team.ts`.

**When:** someone joins, leaves, or changes role/region.

**Steps:**

1. Edit `regionalManagers` or `hqTeam` in `src/data/team.ts`.
2. Add the portrait to `public/images/team/` (square, ~256×256, < 20 KB —
   see [ASSET_MANIFEST.md](ASSET_MANIFEST.md)).
3. Commit and push.

---

## 6. Large media (videos, images, 3D models)

**When:** new product video, kiosk asset, or GLB model is delivered.

**Rules:**

- **GitHub rejects any file over 100 MB.** Raw exports from graphics/
  PowerPoint routinely exceed this — they must be transcoded/compressed
  _before_ committing.
- Videos: transcode to H.264, 854×480 or 1080p, no audio if it plays muted.
  Reference pattern: `differential-sticking.mp4` (257 MB → 3.6 MB) and
  `WirelineExpress.mp4` (50 MB → 3.7 MB).
- Patent PDFs: compress scanned docs (Acrobat "Reduce File Size", or
  `gs -dPDFSETTINGS=/ebook`). Re-rendering can garble fonts — spot-check
  any compressed legal document before committing.
- Keep raw multi-hundred-MB source files **out of git** — `.gitignore`
  already excludes the ICOTA `*.pptx` decks; do the same for other raws.

---

## 7. Kiosk HD videos (`public/videos/kiosk-hd/`)

**When:** you want the trade-show kiosk to play sharper 1080p clips on the
big 60" screen instead of the default web-optimised ones.

**How it works:**

- The kiosk always works with the committed clips in
  `public/videos/transcoded/` — that is the safe default and nothing breaks
  if `kiosk-hd/` is empty.
- If a file of the **same name** exists in `public/videos/kiosk-hd/`, the
  kiosk loop and the product experiences automatically prefer it. Resolution
  is per-file: any clip without an HD counterpart just keeps using its
  transcoded copy while the others upgrade.
- The matching is purely by filename — `kiosk-hd/helix-subtitled.mp4`
  overrides `transcoded/helix-subtitled.mp4`, and so on.
- Current `kiosk-hd/` inventory: `dice.mp4`, `helix-subtitled.mp4`,
  `pf-subtitled.mp4`, `differential-sticking-subtitled.mp4`,
  `WirelineExpress.mp4`.

**Rules:**

- `kiosk-hd/` files **are committed** (unlike `originals/`) — they have to be
  in git so the Docker build ships them to `petromac.klaratech.it`.
- Still respect GitHub's 100 MB-per-file limit. Transcode masters to 1080p
  H.264 (`-crf 20 -preset veryfast` is a good balance) rather than committing
  raw graphics exports. Current files land in the 50–95 MB range.
- After adding or replacing files here, bump `VERSION` in
  `public/kiosk-sw.js` and re-prime the kiosk once online (see
  [KIOSK.md](KIOSK.md)) so devices pick up the new media.

---

## Quick reference

| Content         | Drop into                                                         | Build                             | Commit                                  |
| --------------- | ----------------------------------------------------------------- | --------------------------------- | --------------------------------------- |
| Operations data | `sources/operations/` (`.xlsx`)                                   | `pnpm run data:operations`        | `public/data/operations_data.json`      |
| Flipbooks       | `sources/catalog/`, `sources/success-stories/` (`.pdf` + `.xlsx`) | `pnpm run data:flipbooks`         | `public/flipbooks/**`                   |
| Patents         | counsel's Word doc                                                | hand-edit `PatentsClient.tsx`     | that file + `public/patent_pdfs/`       |
| Publications    | new paper                                                         | hand-edit `publications/page.tsx` | that file                               |
| Team            | —                                                                 | hand-edit `src/data/team.ts`      | that file + `public/images/team/`       |
| Large media     | graphics delivery                                                 | transcode/compress first          | the asset file                          |
| Kiosk HD videos | `public/videos/kiosk-hd/` (1080p, same filename as transcoded)    | transcode masters first           | the `.mp4` + bump `kiosk-sw.js` VERSION |

After any push to `main`, CI runs and `deploy-prod.yml` builds the Docker
images and redeploys the Hetzner box (`petromac.klaratech.it`). See
[DEPLOY.md](../DEPLOY.md).
