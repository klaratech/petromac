# Content sources — the drop zone

This folder is where raw content updates go **in**. The published output goes
to `public/` (operations data → `public/data/`, flipbooks → `public/flipbooks/`).

Files you drop here are **never committed** — only the structure and this
README are tracked. Build the published artifacts with `pnpm run data`.

## How it works

Drop a file into the matching folder — **any filename works** — then run the
pipeline:

| Drop into…                 | What goes there                                                       | Run                        |
| -------------------------- | --------------------------------------------------------------------- | -------------------------- |
| `sources/operations/`      | the job-history `.xlsx`                                               | `pnpm run data:operations` |
| `sources/catalog/`         | the catalog `.pdf` (download/email artifact)                          | `pnpm run data:flipbooks`  |
| `sources/catalog/`         | the InDesign package folder (`.idml` + `Links/`) for the HTML catalog | `pnpm run data:catalog`    |
| `sources/success-stories/` | the InDesign package folder (`.idml` + `Links/` + export `.pdf`)      | `pnpm run data:flipbooks`  |
| `sources/success-stories/` | a tags `.xlsx` on its own, to re-tag in place                         | `pnpm run data:flipbooks`  |

A tags `.xlsx` on its own re-tags the published stories in place (page
images untouched) — you don't need to re-drop the PDF for a tags-only fix.

**Success stories need the whole InDesign package**, not just a PDF — the
`/success-stories` pages take their prose from the layout's paragraph styles
and their figures from its geometry (see docs/ADMIN.md §2). Drop the folder
InDesign produces, containing the `.idml`, its `Links/` folder and the export
PDF.

That page build used to be a manual follow-up; it now runs as part of
`pnpm run data` / `pnpm run data:flipbooks`, so 46 live pages can no longer be
left describing the previous edition while the flipbook images show the new
one. `pnpm run data:stories` rebuilds just the pages.

Category spellings in the tags xlsx are user-visible: they become the badges
and filter options on those pages.

Or just run `pnpm run data` to process everything that's been dropped.

The pipeline picks the **newest** file in each folder, builds the published
output, then moves the file (and any older ones it superseded) into
`sources/_archive/` with a date stamp — so the drop folders stay empty and
ready for the next update. An empty folder is simply skipped.

Exception: a dropped **InDesign package folder** is never archived — the
catalog's and the success stories' alike — so the extraction can be re-run
while curating. Only loose files at the top of a drop folder are archived.
Both pipelines' outputs are committed:
`src/features/catalog/content/catalog.json` + `public/images/catalog/`, and
`src/features/case-studies/content/case-studies.json` +
`public/flipbooks/success-stories/figures/`.
Review the `catalog.json` git diff after each run (docs/ADMIN.md §2b).

Nothing here needs renaming. Drop, run, commit the changes in `public/` (plus
`src/features/catalog/content/` for the HTML catalog, and
`src/features/case-studies/content/case-studies.json` for success stories).

A push deploys **TEST** only — production needs the "Promote to Production"
workflow. See [../DEPLOY.md](../DEPLOY.md).
