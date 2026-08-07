# Development Workflow

This document describes how to develop, test, and deploy features for the Petromac website and intranet.

## Local Development

### Setup

```bash
git clone https://github.com/Klaratech/petromac.git
cd petromac
pnpm install
cp .env.example .env.local
cp .env.example .env.dev
pnpm run dev
```

- Python scripts: set up virtualenv in `scripts/python`, install from `requirements.txt`
- Use `docker compose up --build` when you need the frontend and FastAPI backend together.
- `.env.local` is loaded by Next.js local development; `.env.dev` is loaded by Docker Compose and `pnpm run data`.

### Running Locally

- Public site: http://localhost:3000
- Backend API: http://localhost:8000
- Intranet: http://localhost:3000/intranet
- Track Record (map): http://localhost:3000/track-record

### Documents (catalog + success stories)

See [FLIPBOOKS.md](FLIPBOOKS.md) for the build pipeline and
[ADMIN.md](ADMIN.md) for update recipes.

## Code Organization

- `src/app/(public)` → Public shell routes
- `src/app/(kiosk)` → Kiosk shell routes
- `backend/app` → FastAPI backend service
- `src/app/auth/microsoft/*` → Entra login/callback/logout routes
- `src/components/public/` → Public site components
- `src/components/shared/flipbook/Flipbook.tsx` → Shared flipbook component
- `src/components/geo/` → Shared map components
  - `DrilldownMapCore.tsx` → Core map logic (reusable). The public
    `/track-record` page imports it directly via `next/dynamic`; the
    kiosk dashboard uses `DrilldownMapKiosk` as a wrapper for fullscreen
    chrome and additional kiosk-only controls.
  - `DrilldownMapKiosk.tsx` → Kiosk wrapper for the operations dashboard.
- `src/lib/map/data.ts` → Static data fetchers (`/data/operations_data.json`,
  `/data/country_labels.json`). Backend `/api/data/*` routes remain as
  passthrough/debug endpoints, but frontend map surfaces should fetch the
  published JSON directly.
- `src/features/success-stories/` → Success Stories feature (filters, parsing, services)
- `src/components/ui/` → Shared UI primitives

## GitHub Actions

- `.github/workflows/data-build.yaml` → unified data pipeline (`pnpm run data`)
- `.github/workflows/pdf-flipbooks-build.yml` → Flipbook generation

## Unified Data Pipeline (`pnpm run data`)

The pipeline reads from the `sources/` drop zone — no env vars, no renaming. Drop
a file into the matching folder (any filename) and run the pipeline:

| Drop into                  | Contents                              | Build                      |
| -------------------------- | ------------------------------------- | -------------------------- |
| `sources/operations/`      | job-history `.xlsx`                   | `pnpm run data:operations` |
| `sources/catalog/`         | catalog `.pdf`                        | `pnpm run data:flipbooks`  |
| `sources/success-stories/` | success-stories `.pdf` + tags `.xlsx` | `pnpm run data:flipbooks`  |

Or run everything at once:

```bash
pnpm run data
```

This will:

1. build `public/data/operations_data.json` from the newest `sources/operations/` file
2. rebuild `public/flipbooks/*` from the newest `sources/catalog/` (one compressed PDF — the pdf.js viewer and its search index were retired Jul 2026) and `sources/success-stories/` (WebP pages + `tags.csv` + `email.pdf`) files
3. run flipbook/success-stories validators
4. move consumed inputs into `sources/_archive/` (date-stamped)

It does NOT rebuild the public case-studies pages. If the success-stories PDF or
tags changed, run `python3 scripts/python/build_case_studies.py` as well — see
[FLIPBOOKS.md](FLIPBOOKS.md).

An empty `sources/` subfolder is simply skipped. See [sources/README.md](../sources/README.md).

## Testing

- Run lint/typecheck before commits (`pnpm run lint`, `pnpm run typecheck`)
- Syntax check backend Python (`python3 -m compileall backend`)
- Run data validation (`pnpm run validate:successstories`)
- Unit tests (`pnpm run test:unit`) — pure logic; runs in CI and pre-push
- Smoke tests (`pnpm run test:e2e`) — Playwright starts its own `next start`, so
  run `pnpm build` first and skip the separate-server step. Runs in CI as the
  `e2e` job; failures annotate the PR diff and upload an HTML report artifact.
  Set `PLAYWRIGHT_BASE_URL` to point at a deployed environment instead, which
  also disables the local server. It asserts against a PRODUCTION build on
  purpose: the URL-migration rules live in middleware, whose status codes and
  404 rewrite are the wrong thing to test against `next dev`.
- Production deploys build in GitHub Actions and run on Hetzner (`klaratech-1`) via Docker Compose — see [DEPLOY.md](../DEPLOY.md)
- If you are testing Microsoft staff sign-in locally, add the localhost callback URL to the Entra app and populate the Entra env vars in `.env.dev`

## Working on this repo from a Cowork session

A Cowork/Claude session edits the repo through the desktop bridge, which mounts
your Mac's working copy inside a **Linux** VM. That copy IS the source of truth
and is what you push — but `node_modules` on your Mac are macOS binaries, so on
the bridge:

```
pnpm typecheck / lint / test:unit / build     ← ALL fail (esbuild platform mismatch)
```

The error names it plainly: *"You installed esbuild for another platform than
the one you're currently using… @esbuild/darwin-arm64 is present but this
platform needs @esbuild/linux-arm64"*. Do not try to "fix" it by reinstalling —
that would break YOUR toolchain.

**Consequence: the pre-push hook is the first real gate.** It runs
`typecheck && lint && test:unit && build`, none of which the session can run
itself. Expect to bounce a push occasionally and paste the output back.

### Running unit tests anyway

Pure-logic tests can be run in the Cowork cloud container (a separate Linux
sandbox with network): copy the module + its data under a scratch dir,
`npm install tsx`, and `npx tsx --test <file>`.

**Verify the copies match before believing a green run.** `md5sum` the scratch
files against the repo files. On 7 Aug a test file drifted by two comment lines
between the two, which meant "25/25 pass" briefly described a file that was
never committed. Same check applies to the Python pipeline, which is run the
same way (`pip install polars==1.38.0 fastexcel==0.19.0`, see ADMIN.md §1).

### Committing from the bridge

- The **pre-commit** hook calls `pnpm exec lint-staged` and fails with
  `pnpm: not found`. Commit with `--no-verify`; the pre-push hook still runs on
  your Mac and CI still gates the merge, so nothing is actually skipped.
- Git leaves `.git/HEAD.lock`, `.git/objects/maintenance.lock` and
  `tmp_obj_*` files behind, because the bridge cannot delete files
  (`rm` → "Operation not permitted"). A later commit then dies with *"Another
  git process seems to be running"*. Move them into `_to_delete/` instead and
  bin that folder yourself.

### Lint/typecheck traps that have actually bitten

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Cannot find module '../../../src/app/(public)/<old-route>/page.js'` from `.next/dev/types/validator.ts` | Stale Next type cache after a route folder was renamed | `rm -rf .next` and push again — the source was fine |
| `no-unused-vars` on parameters you never declared | The BASE rule (not the TS-aware one) reads a function **type** annotation as a real signature, so `cb: (subset: X[], value: string) => number` looks like two unused args | Prefix them: `(_subset: X[], _value: string)`. `/^_/u` is the allowance the rule's own config states |
| `no-console` at `enrich.ts:368` | Pre-existing, deliberate build-time nudge listing catalog products missing a curation row | Leave it. It is a WARNING; `eslint .` exits 0 on warnings, so it never blocks a push |

### Verify what you cannot run

Nothing above substitutes for the hook, so lean on checks that do not need the
toolchain: `python3 -m compileall` (or `ast.parse`) for Python, `md5sum` to
prove the tested file is the committed file, and running the affected pure
functions against the REAL content set to print before/after numbers rather
than asserting from memory.

## Kiosk offline refresh

See [KIOSK.md](KIOSK.md) — bump the SW `VERSION` + re-prime devices.

## Data Conventions

### Three-Tier Data Organization

Follow these conventions when working with data:

#### 1. Pipeline Inputs (`sources/`)

- **Never commit large Excel files or raw PDFs** — dropped files are gitignored
- Drop into `sources/{operations,catalog,success-stories}/` (any filename)
- Consumed inputs are auto-moved to `sources/_archive/`
- These files are never deployed

#### 2. Published Data (`public/data/`)

- JSON/CSV/PDF artifacts generated for frontend and backend use
- Frontend map surfaces fetch JSON directly from `/data/*`
- Use for:
  - Large datasets (operations_data.json ~600 KB slim / operations_full.json ~3.5 MB)
  - Map data (country_labels.json, world-50m.json)
- **Fetch at runtime from `/data/*`** - do not import large JSON files from here
- Deliberate exceptions — tiny generated artifacts imported at build time so
  pages skip a runtime fetch: `operations_stats.json` (homepage ProofSection)
  and the flipbook `manifest.json` files (`src/features/flipbooks/manifests.ts`).
  Changes to these ship with the next deploy, not on CDN refresh.

Flipbook assets (PDFs + images) live under `public/flipbooks/` and are accessed via `/flipbooks/*` URLs.

#### 3. TypeScript Modules (`src/data/`)

- Small, typed data only (e.g., `team.ts`)
- Import directly: `import { data } from "@/data/module"`
- **Do not store large JSON here** - use `public/data/` instead

### Fetching Data

For data in `public/data/`, always use fetch:

```tsx
// ✅ Client Component
'use client';
const [data, setData] = useState(null);

useEffect(() => {
  fetch('/data/operations_data.json')
    .then((r) => r.json())
    .then(setData);
}, []);

// ✅ Server Component
const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/data/operations_data.json`, {
  next: { revalidate: 3600 },
});
const data = await res.json();

// ❌ WRONG - Don't import large JSON
import data from '@/data/operations_data.json'; // NO!
```

### Python Script Output Targets

When creating or modifying Python scripts:

- ✅ Read pipeline inputs from: `sources/` (e.g. `sources/operations/`)
- ✅ Write published data to: `public/data/`
- ✅ Write flipbook images to: `public/flipbooks/`
- ❌ **Never** write to `scripts/python/` (creates duplicates)

Example:

```python
# Correct paths
EXCEL_PATH = "sources/operations/jobhistory.xlsx"
OUTPUT_JSON = "public/data/operations_data.json"
```

### Verifying Data Fetches

After making changes, verify all data fetches work:

```bash
docker compose up --build
# Open http://localhost:3000
# Open DevTools → Network tab → Filter by "/data/"
# Verify published data requests return 200 OK (no 404s)
```

Check these pages:

- Public Track Record (map): http://localhost:3000/track-record
- Kiosk Dashboard (map): http://localhost:3000/intranet/kiosk/dashboard
- Data validation: http://localhost:3000/intranet/kiosk/datacheck

## Notes

- The old PDF viewer/builder modals are **deprecated** and replaced by the Flipbook module.
- Source PDFs and tags xlsx are dropped into the `sources/` drop zone (see `sources/README.md`).
- **Data organization is critical** - follow the three-tier structure to avoid deployment issues.
