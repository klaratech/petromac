# DATA_ORGANIZATION_TASK.md
**Goal:** Keep three folders but give each a single, clear purpose; delete duplicates; and update all code **and docs** accordingly. After the re‑org, **verify every `fetch("/data/...")` call works** (no 404s).

- `data/` → **private sources & intermediates only** (never deployed)
- `public/data/` → **published artifacts** (static JSON, CSV, PDFs, flipbook images) served by Vercel CDN
- `src/data/` → **small TypeScript data modules** consumed by UI (e.g., `team.ts`), **no large JSON blobs**

This task is macOS/zsh-safe and avoids pager hangs.

---

## 0) Safety & Environment (macOS / VS Code) — **Do this first**
```bash
# Use zsh
echo $SHELL  # should be /bin/zsh

# Avoid git pager hangs in VS Code terminal
git config --global pager.branch false
git config --global pager.log false
git config --global pager.diff false
git config --global core.pager cat

# If you ever see (END) in terminal, rerun with --no-pager
#   e.g., git --no-pager log -n 5
```

Create a branch:
```bash
git checkout -b chore/data-organization
```

---

## 1) Decisions (single source of truth)

1. **Private data** lives only under `data/private/`:
   - `data/private/raw/` → uploads like Excel files.
   - `data/private/intermediate/` → Python intermediates (temporary JSON/CSVs, diagnostics).
   - `data/private/**` is **gitignored** and NOT deployed.

2. **Public artifacts** live under `public/data/`:
   - `operations_data.json`, `country_labels.json`, `region_coords.json`, `successstories-summary.csv`
   - `product-catalog.pdf`, `successstories.pdf`
   - Flipbook images → `public/flipbooks/...`

3. **UI constants** live in `src/data/` (TypeScript only):
   - Keep `src/data/team.ts` (small typed arrays + interfaces).
   - Avoid large JSON here. If a dataset is large or shared across server/client, move it to `public/data/` and **fetch** it at runtime or during build.

---

## 2) Remove duplicates & normalize locations

### A) Eliminate stray generated JSON inside `scripts/python`
- `scripts/python/operations_data.json` is a duplicate byproduct. Remove it; use `public/data/operations_data.json` as the published copy.
```bash
git rm -f scripts/python/operations_data.json 2>/dev/null || true
```

### B) Unify region/map assets
- We already have `public/data/region_coords.json` and `public/data/country_labels.json`.
- We also have `src/data/region_data.json`. **Move this to `public/data/region_data.json`** so all map datasets reside together.
```bash
mkdir -p public/data
if [ -f src/data/region_data.json ]; then
  git mv src/data/region_data.json public/data/region_data.json
fi
```

> After the move, **update imports**: replace any `import ... from "@/data/region_data.json"` with a **fetch** call to `"/data/region_data.json"` (client components) or a server‑side `await fetch()` in server components.

Search & patch imports:
```bash
git --no-pager grep -n "region_data.json" -- src || true

# BEFORE: import regionData from "@/data/region_data.json";
# AFTER (client component):
#   const res = await fetch("/data/region_data.json");
#   const regionData = await res.json();
```

> If the dataset is tiny and only used in one place, you may instead convert it to `src/constants/regionData.ts` and export a TS object. **Pick one approach—do not keep both.**

### C) Keep `src/data/team.ts` as TS (no change)
- This stays as-is (small + typed).

---

## 3) Update Python pipeline outputs
Ensure Python generators **only write to**:
- `data/private/intermediate/` (temporary intermediates), and/or
- `public/data/` (final published artifacts).

Review and adjust paths in:
- `scripts/python/generate_json.py`
- `scripts/python/validate_data.py`
- `scripts/python/successstories.py`
- `scripts/python/pdf_to_images.py`

Guidelines:
- Use repo‑relative paths (via `Path(__file__).resolve().parents[...]`), not absolute.
- Outputs:
  - Final sanitized JSON → `public/data/operations_data.json`
  - Flipbook images → `public/flipbooks/(productcatalog|successstories)/page-XYZ.jpg`
  - Diagnostics → `data/private/intermediate/...`

---

## 4) Code changes (fetch vs import)
For components that used to `import` JSON from `src/data/*.json` and were moved to `public/data/`:
- Replace static imports with `fetch("/data/FILE.json")` (client) or `await fetch()` in **server** components.
- For App Router static generation, you can `await fetch` in a server component with `{ next: { revalidate: 3600 } }` as needed.

Client hook example:
```tsx
"use client";
import { useEffect, useState } from "react";

export function useRegionData() {
  const [data, setData] = useState<any | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch("/data/region_data.json")
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(r.statusText)))
      .then((d) => mounted && setData(d))
      .catch(() => mounted && setData(null));
    return () => { mounted = false; };
  }, []);
  return data;
}
```

---

## 5) Verify all fetches work (no 404s)
### Local
```bash
npm run dev
# In the browser:
#  - Open DevTools → Network tab → filter by "data/"
#  - Verify requests to /data/*.json, /data/*.csv resolve 200 OK
#  - Fix any 404s by adjusting paths (remember: files live under public/data/ → URL is /data/...)
```

### Preview / Production
- Open the Vercel preview deployment for your branch.
- Repeat the Network tab checks.
- Confirm map/flipbook pages render with live data.
- If using ISR: confirm `revalidate` behavior is acceptable.

---

## 6) Docs updates (do this **after** code changes)
Update the following docs to reflect the new rules/paths (and add a short “Fetching data” section showing `fetch("/data/...")`):

- `docs/REPO_STRUCTURE.md` → Data section with the three-tier purpose and key file paths.
- `docs/ARCHITECTURE.md` → Published data served from `public/data/`; private sources/intermediates under `data/private/`.
- `docs/DEVELOPMENT.md` → Conventions: do **not** commit large JSON to `src/data/`; prefer `public/data/` + fetch; Python output targets; how to verify fetches.

Commit doc changes as part of this PR.

---

## 7) Acceptance Criteria
- No duplicate JSON remains (e.g., `scripts/python/operations_data.json` removed).
- All **map datasets** consolidated under `public/data/` (including `region_data.json`).
- App runs without import errors; all **fetches resolve 200** locally and on preview.
- Python scripts write only to `data/private/intermediate/` and `public/data/`.
- Docs updated (Repo Structure, Architecture, Development) to match the new layout.
- CI passes:
  ```bash
  npx tsc --noEmit
  npx eslint .
  npm run build
  ```

---

## 8) Commit & PR
```bash
git add -A
git commit -m "chore(data): rationalize data folders; move large JSON to public/data; fetch updates; docs updated"
git push -u origin chore/data-organization
```

Open a PR with a short summary and screenshots of the Network tab showing successful `/data/...` fetches.
