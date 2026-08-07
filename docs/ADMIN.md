# Admin & Content Updates

The recurring jobs that keep the site current — what to do when new data
arrives, and how to publish it. Most of these are periodic (operations data,
flipbooks) or event-driven (a new patent is granted, a team member joins).

Every update follows the same shape: **change the source → rebuild or edit →
commit → push → check https://test.petromac.co.nz → promote.** A push
deploys only the TEST site; the live site updates when the "Promote to
Production" workflow runs (see [DEPLOY.md](../DEPLOY.md)). The
specifics per content type are below.

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

**Withheld countries — Myanmar is suppressed, not relabelled.** Rajesh's call
(Aug 2026), implemented as `EXCLUDED_COUNTRIES` in
`scripts/python/normalization_config.py`. Rows for a listed country are dropped
immediately after country normalisation (so an alias like "UAE" cannot smuggle
one past the list) and before any artifact is written, so they appear in no
map, chip, tooltip, Top-5 panel or headline number. The pipeline logs what it
dropped — `Excluded 54 rows for withheld countries: Myanmar`.

Myanmar was briefly published AS Vietnam instead; that was reverted the same day
because it made the map claim deployments in a country where they never
happened. **Consequence to expect:** published totals sit BELOW Jobs History
Master by exactly the excluded rows (currently 3,507 of 3,561 records and 3,114
deployments), while every country actually shown keeps a true count. A
discrepancy of that size is this list, not a pipeline bug — check it first. The
source workbook is never modified. Do NOT "fix" a map problem by renaming one
country to another — that is the France/French-Guiana trap, called out in the
same config file.

**Note on running it from a Cowork session:** `pnpm run data:operations` shells
out to `scripts/python/generate_json.py`, which needs `polars` + `fastexcel`.
The desktop-bridge VM has neither and no network, so the pipeline is run either
on Rajesh's Mac or in the Cowork cloud container (stage the xlsx + the
`scripts/python` helpers, `pip install polars==1.38.0 fastexcel==0.19.0`, run
with `EXCEL_PATH=... SKIP_GITHUB_PUSH=true`, then commit the three JSONs back
and archive the source by hand — the archiving step lives in the tsx wrapper,
which is skipped on that path).

---

## 2. Catalog PDF & Success Stories documents

The **catalog PDF** (the download/email artifact behind the `/catalog` page's
Download and Email buttons — the page itself is the HTML catalog, see §2b)
and the **success stories** collection, which is now published as the case
stories at `/success-stories` (renamed from /case-studies Aug 2026; the public flipbook route was retired Jul 2026 —
see CLAUDE.md; the flipbook page images are still generated, because each case
study uses its page webp as the story visual).
Generated bundles live in `public/flipbooks/{catalog,success-stories}/`.

- **Catalog PDF** — the pipeline ships one linearized
  `petromac-product-catalog.pdf`, compressed to <4 MB on ingest, for
  downloads and emailed attachments. Keep the source PDF's real text + links
  intact (don't flatten to images).
- **Success stories** — an image flipbook (WebP pages) with the tags-driven
  filter system; needs its summary `.xlsx` alongside the PDF.

**When:** the catalog print PDF is revised, or the Success Stories PDF /
summary changes.

**Steps:**

1. Drop the files into their folders — any filename is fine:
   - catalog PDF → `sources/catalog/`
   - success-stories PDF **and** its tags `.xlsx` → `sources/success-stories/`
2. Run `pnpm run data:flipbooks` (needs Ghostscript for PDF compression:
   `brew install ghostscript`; and qpdf to linearize the catalog:
   `brew install qpdf`). The pipeline builds whichever documents have a new PDF
   (catalog → one compressed+linearized PDF; success stories →
   WebP pages + a compressed `email.pdf`), re-syncs the kiosk offline-assets list,
   validates the bundles, and archives the inputs into `sources/_archive/`.
3. Commit `public/flipbooks/**` and push.
4. **If the kiosk needs the new content offline:** bump `VERSION` in
   `public/kiosk-sw.js` (see [KIOSK.md](KIOSK.md)) so trade-show devices
   evict the stale cache on next online load.

You can update just one flipbook — drop only a catalog PDF and success stories
is left untouched, and vice versa. `pnpm run data` does flipbooks and
operations together.

**Success-story pages (after a success-stories update):** the `/success-stories`
pages are generated FROM the flipbook — after step 2, run
`python3 scripts/python/build_case_studies.py` to regenerate
`src/features/case-studies/content/case-studies.json`. New stories in the
edition need a `NEW_SLUG` entry in that script (it fails loudly on an
unmapped page); existing slugs are frozen (indexed URLs + redirects).
Skim the regenerated titles for PDF text-order gloms (`TITLE_OVERRIDE`).

---

## 2b. HTML catalog (`/catalog` page content)

The `/catalog` page is a native HTML catalog (product pages, real spec
tables, instant search) generated from the **InDesign source**, not the
print PDF. It replaced the pdf.js viewer in Jul 2026 (`/catalogtest`, its
refinement URL, redirects here).

The UI is a three-level drill-down (Jul 2026): `/catalog` shows product-line
bands with family cards plus the Device Finder; `/catalog/<category>` family
pages render spec TABLES built from parsed spec fields; SSG product pages
stay at `/catalog/<category>/<slug>`. Category tree note: the print
catalog's "Fixed Angle Guides" section lives INSIDE Guides & Holefinders
(vendor sections on the family page split it by SLB / Halliburton /
Baker Hughes) — that mapping is in `catalog_config.json` + `enrich.ts`, not
the IDML. Things content editors get for free:

- **Family tables & Device Finder values** (hole range, bore, temp, weight)
  are parsed automatically from each product's Technical Specifications
  table — fix a spec in the config, regenerate, and every surface follows.
- **Email PDF** on the overview sends the catalog PDF as the signed-in staff
  member (Graph, lands in their Sent Items) or from `info@` for everyone
  else — it attaches the same `petromac-product-catalog.pdf` as the
  Download link.
- **Website enrichment layer**: after regenerating `catalog.json`, check
  the build output for a `[catalog enrich]` warning — a NEW product needs
  one curation row (vendor / finder purpose / taxi role) in
  `src/features/catalog/content/enrich.ts`; per-slug overrides there cover
  spec values the parser can't attribute. Everything else is automatic.

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
   **Filenames must match `[A-Za-z0-9._-]` — no spaces, no commas.** Four
   files broke that rule until Jul 2026 and Google had them indexed in their
   percent-encoded form (`/patent_pdfs/MY-169945%20B.pdf`), which is awkward
   to cite and easy for link-checkers to mangle. They were renamed, with
   301s from the old paths in `PATENT_PDF_RENAMES` (`src/lib/redirects.ts`);
   `redirects.test.ts` fails the build if a new file needs escaping. If you
   ever have to rename a PDF that has been live, add a `PATENT_PDF_RENAMES`
   entry rather than breaking the URL.
4. Run `pnpm run data:patents` for a dry-run report, then
   `pnpm run data:patents --apply` to write it. Patent offices issue enormous
   scans — the set was 206 MB before the Jul 2026 pass and is 130 MB after.
   **Do NOT reach for `gs -dPDFSETTINGS=/ebook` here**, the recipe the catalog
   PDF uses: these files are already JPEG2000 page scans, and re-encoding them
   through pdfwrite makes them BIGGER (measured: 7.3 MB → 8.2 MB). The script
   rasterises pages instead, and only for files with no text layer, so a
   searchable patent is never flattened. See its header comment for the
   reasoning.
5. Terminology: use **"category"**, not "family" — per counsel, a patent
   "family" has a specific legal meaning (patents sharing one filing) and a
   product category here can span multiple unrelated families.
6. Commit and push.

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
- Videos: transcode to H.264. The four homepage lightbox `*-subtitled` cuts
  are 1080p since Aug 2026 (`-crf 22 -maxrate 2500k -bufsize 5000k
  -movflags +faststart`, audio copied) — 540p at low bitrates read as blur
  and triggered Edge's "Enhance" (Video Super Resolution) offer. Small
  muted mechanism/background clips can stay SD. Strip audio (`-an`) only
  for clips that play muted (hero/background loops); narrated `*-subtitled`
  cuts keep their audio track — the homepage lightbox and kiosk lane play
  them with sound. NOTE: `WirelineExpress-subtitled` has no usable audio at ANY
  generation (even its original is 540p/silent) — the homepage plays the
  full `WirelineExpress.mp4` master cut instead, which has narration; the
  kiosk keeps the subtitled cut.
  When replacing same-name videos, bump the `?v=` query on the referencing
  component (ChallengeSelector) to bust edge caches.
- Homepage hero background: `public/videos/hero/hero-loop.mp4` (short
  seamless loop, ~13 s / ~1.9 MB) + `hero-loop-poster.jpg` (its first frame).
  Keep BOTH filenames when replacing — `Hero.tsx` references them directly.
  Regenerate the poster with `ffmpeg -i hero-loop.mp4 -frames:v 1`. Note the
  image cache: same-name swaps take ~a day to reach returning browsers;
  rename (and update Hero.tsx) to bust instantly.
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
  in git so the Docker build ships them to `www.petromac.co.nz`.
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
| Patents         | counsel's Word doc                                                | hand-edit + `pnpm data:patents`   | that file + `public/patent_pdfs/`       |
| Publications    | new paper                                                         | hand-edit `publications/page.tsx` | that file                               |
| Team            | —                                                                 | hand-edit `src/data/team.ts`      | that file + `public/images/team/`       |
| Large media     | graphics delivery                                                 | transcode/compress first          | the asset file                          |
| Kiosk HD videos | `public/videos/kiosk-hd/` (1080p, same filename as transcoded)    | transcode masters first           | the `.mp4` + bump `kiosk-sw.js` VERSION |

A push to `main` deploys to **TEST only** (https://test.petromac.co.nz).
`www.petromac.co.nz` changes ONLY when someone runs the "Promote to
Production" workflow — `gh workflow run deploy-prod.yml`, or GitHub → Actions.
So content updates land on test for review first, and go live on your say-so.
See [DEPLOY.md](../DEPLOY.md).
