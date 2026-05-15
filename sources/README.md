# Content sources — the drop zone

This folder is where raw content updates go **in**. The published output goes
to `public/` (operations data → `public/data/`, flipbooks → `public/flipbooks/`).

Files you drop here are **never committed** — only the structure and this
README are tracked. Build the published artifacts with `pnpm run data`.

## How it works

Drop a file into the matching folder — **any filename works** — then run the
pipeline:

| Drop into… | What goes there | Run |
|---|---|---|
| `sources/operations/` | the job-history `.xlsx` | `pnpm run data:operations` |
| `sources/catalog/` | the catalog `.pdf` | `pnpm run data:flipbooks` |
| `sources/success-stories/` | the success-stories `.pdf` **and** its tags `.xlsx` | `pnpm run data:flipbooks` |

Or just run `pnpm run data` to process everything that's been dropped.

The pipeline picks the **newest** file in each folder, builds the published
output, then moves the file (and any older ones it superseded) into
`sources/_archive/` with a date stamp — so the drop folders stay empty and
ready for the next update. An empty folder is simply skipped.

Nothing here needs renaming. Drop, run, commit the changes in `public/`.
