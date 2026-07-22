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
| `sources/success-stories/` | the success-stories `.pdf` **and/or** its tags `.xlsx`                | `pnpm run data:flipbooks`  |

A tags `.xlsx` on its own re-tags the published stories in place (page
images untouched) — you don't need to re-drop the PDF for a tags-only fix.

Or just run `pnpm run data` to process everything that's been dropped.

The pipeline picks the **newest** file in each folder, builds the published
output, then moves the file (and any older ones it superseded) into
`sources/_archive/` with a date stamp — so the drop folders stay empty and
ready for the next update. An empty folder is simply skipped.

Exception: `pnpm run data:catalog` (HTML catalog) does **not** archive — the
InDesign package stays in place so the extraction can be re-run while
curating `scripts/python/catalog_config.json`. Its outputs are committed:
`src/features/catalog/content/catalog.json` + `public/images/catalog/`.
Review the `catalog.json` git diff after each run (docs/ADMIN.md §2b).

Nothing here needs renaming. Drop, run, commit the changes in `public/`
(and, for the HTML catalog, `src/features/catalog/content/`).
