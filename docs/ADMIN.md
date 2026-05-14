# Admin & Content Updates

The recurring jobs that keep the site current — what to do when new data
arrives, and how to publish it. Most of these are periodic (operations data,
flipbooks) or event-driven (a new patent is granted, a team member joins).

Every update follows the same shape: **change the source → rebuild or edit →
commit → push → CI deploys.** The specifics per content type are below.

---

## 1. Operations / job history data

Drives the **Track Record** map (`/track-record`) and the homepage **Proof**
stats. The published artifact is `public/data/operations_data.json`.

**When:** new job history is available (roughly quarterly), or whenever the
numbers shown publicly need to be current.

**Steps:**

1. Put the latest `jobhistory.xlsx` where the pipeline expects it. The path
   comes from `OPERATIONS_SOURCE_XLSX` in `.env.dev` (an OneDrive-synced
   location — the raw file is never committed).
2. Run `pnpm run data`. This rebuilds `public/data/operations_data.json`.
3. Sanity-check the diff on that JSON file (`git diff --stat public/data/`).
4. Commit `public/data/operations_data.json` and push.

**Alternative:** the `data-build.yaml` GitHub Action runs this weekly and can
be triggered manually (Actions tab → "Data Build Pipeline" → Run workflow).
It needs `OPERATIONS_SOURCE_XLSX_URL` configured as a repo secret.

---

## 2. Flipbooks — Catalog & Success Stories

The interactive flipbooks at `/catalog` and `/success-stories/flipbook`.
Generated bundles live in `public/flipbooks/{catalog,success-stories}/`.

**When:** the catalog PDF is revised, or the Success Stories summary changes.

**Steps:**

1. Update the source PDFs / tags xlsx in their OneDrive locations. Paths are
   set in `.env.dev`: `FLIPBOOK_CATALOG_SOURCE_PDF`,
   `FLIPBOOK_SUCCESS_STORIES_SOURCE_PDF`, `FLIPBOOK_SUCCESS_STORIES_TAGS_XLSX`.
2. Run `pnpm run data` (rebuilds operations JSON *and* flipbooks) or
   `pnpm run build:flipbooks` (flipbooks only).
3. Run `pnpm run validate:flipbooks && pnpm run validate:successstories`.
4. Commit `public/flipbooks/**` and push.
5. **If the kiosk needs the new content offline:** bump `VERSION` in
   `public/kiosk-sw.js` (see [KIOSK.md](KIOSK.md)) so trade-show devices
   evict the stale cache on next online load.

**Alternative:** the `pdf-flipbooks-build.yml` GitHub Action regenerates
flipbooks automatically when the build scripts change.

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
  *before* committing.
- Videos: transcode to H.264, 854×480 or 1080p, no audio if it plays muted.
  Reference pattern: `differential-sticking.mp4` (257 MB → 3.6 MB) and
  `WirelineExpress.mp4` (50 MB → 3.7 MB).
- Patent PDFs: compress scanned docs (Acrobat "Reduce File Size", or
  `gs -dPDFSETTINGS=/ebook`). Re-rendering can garble fonts — spot-check
  any compressed legal document before committing.
- Keep raw multi-hundred-MB source files **out of git** — `.gitignore`
  already excludes the ICOTA `*.pptx` decks; do the same for other raws.

---

## Quick reference

| Content | Source | Rebuild | Commit |
|---|---|---|---|
| Operations data | `jobhistory.xlsx` (OneDrive) | `pnpm run data` | `public/data/operations_data.json` |
| Flipbooks | source PDFs + tags (OneDrive) | `pnpm run data` | `public/flipbooks/**` |
| Patents | counsel's Word doc | hand-edit `PatentsClient.tsx` | that file + `public/patent_pdfs/` |
| Publications | new paper | hand-edit `publications/page.tsx` | that file |
| Team | — | hand-edit `src/data/team.ts` | that file + `public/images/team/` |
| Large media | graphics delivery | transcode/compress first | the asset file |

After any push to `main`, CI runs and `deploy-prod.yml` builds the Docker
images and redeploys the Hetzner box (`petromac.klaratech.it`). See
[DEPLOY.md](../DEPLOY.md).
