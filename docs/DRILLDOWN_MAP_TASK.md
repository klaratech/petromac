# DRILLDOWN_MAP_TASK.md

## ⚙️ Environment Setup (macOS / VS Code) — prevent hangs
Run these once in the VS Code terminal (zsh) so the agent never stalls:
```bash
# Ensure zsh
echo $SHELL  # should be /bin/zsh

# Disable git pagers
git config --global pager.branch false
git config --global pager.log false
git config --global pager.diff false
git config --global core.pager cat

# If a command ever shows (END), re-run it with --no-pager
#   e.g., git --no-pager log -n 5
```

Create a working branch:
```bash
git checkout -b chore/drilldown-map-routing-and-structure
```

---

## 🎯 Objective
- Make the **“Track Record”** link in the site header open a **public Drilldown Map page** at `/track-record`.
- Centralize the **Drilldown Map** into a **shared core** used by **both** the public page and the **Intranet/Kiosk**.
- Keep the codebase modular and reusable; no duplication of map logic.
- Update the **README.md**, **REPO_STRUCTURE.md**, **ARCHITECTURE.md**, **DEVELOPMENT.md** afterwards.
- Work in **phases** to avoid regressions.

---

## ✅ Ground Truth (current structure we are targeting)
- Root layout: `src/app/layout.tsx`
- Header component: `src/components/public/Header.tsx` (imported by `layout.tsx`)
- Kiosk app: `src/app/intranet/kiosk/...`
- Current Drilldown Map is used in the Kiosk dashboard; we will refactor it into a shared core.
- Data is served from `public/data/operations_data.json` (accessed at runtime as `/data/operations_data.json`).

> If any file deviates, **update the path, don’t skip the step**.

---

## Phase 1 — Wire the Header “Track Record” link
1. Open `src/components/public/Header.tsx`.
2. Ensure the **Track Record** nav item points to the new route:
   - `href="/track-record"`
3. Keep existing styling and active link logic intact.

**Acceptance (P1):** The header link visibly points to `/track-record` in the UI.

---

## Phase 2 — Public page for Drilldown Map
Create the public page that will host the map:
```
src/app/track-record/page.tsx
```
Stub it as a server→client wrapper:
```tsx
// src/app/track-record/page.tsx
import dynamic from "next/dynamic";

const DrilldownMapPublic = dynamic(
  () => import("@/components/geo/DrilldownMapPublic"),
  { ssr: false }
);

export const metadata = {
  title: "Track Record",
  description: "Global deployments and operations history"
};

export default function TrackRecordPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Track Record</h1>
      <DrilldownMapPublic />
    </main>
  );
}
```

**Acceptance (P2):** Visiting `/track-record` renders the placeholder wrapper (even before the shared core is extracted).

---

## Phase 3 — Extract shared Drilldown Map core + wrappers
Create a **single source of truth** for the map logic and thin wrappers for context‑specific behavior.

**Target structure:**
```
src/
  components/
    geo/
      DrilldownMapCore.tsx    # pure, reusable map logic (client component)
      DrilldownMapPublic.tsx  # thin wrapper for public page
      DrilldownMapKiosk.tsx   # thin wrapper for intranet/kiosk
  lib/
    map/
      data.ts                 # typed fetchers/hooks for /data/*.json
      utils.ts                # projections, formatting, filters (if needed)
```
**Steps:**
1. Move the existing map logic from the kiosk into `src/components/geo/DrilldownMapCore.tsx`.  
   - Props to accept: `initialFilters?`, `onSelect?`, `readOnly?`, etc.  
   - **No kiosk/public assumptions** inside the core.
2. Create `src/components/geo/DrilldownMapPublic.tsx` importing the core and setting public defaults.
3. Create `src/components/geo/DrilldownMapKiosk.tsx` importing the core and setting kiosk defaults.
4. Create `src/lib/map/data.ts` that exposes typed fetchers:
   - `fetchOperationsData()` → `GET /data/operations_data.json`
   - Any other datasets (`/data/country_labels.json`, `/data/region_coords.json`), as needed.

**Acceptance (P3):**
- Public and kiosk compile using the **same** `DrilldownMapCore`.
- No map logic duplication remains.

---

## Phase 4 — Kiosk integration
Update the kiosk dashboard to use the new wrapper:
1. Open `src/app/intranet/kiosk/dashboard/page.tsx`.
2. Replace the old map import with:
   ```ts
   import DrilldownMapKiosk from "@/components/geo/DrilldownMapKiosk";
   ```
3. Pass any kiosk‑specific callbacks/filters as props to the wrapper (which forwards to the core).

**Acceptance (P4):** Kiosk dashboard renders as before with the new shared component.

---

## Phase 5 — Data access normalization
- Ensure all large datasets are fetched from `/data/*.json`.  
  **Do not** import large JSON from `src/data` directly.
- In `src/lib/map/data.ts`, add safe fetchers (with error handling and optional caching hints):
```ts
// src/lib/map/data.ts
export async function fetchOperationsData() {
  const r = await fetch("/data/operations_data.json", { cache: "force-cache" });
  if (!r.ok) throw new Error(`Failed to load operations_data.json: ${r.status}`);
  return r.json();
}
```
- Update the core/wrappers to use these helpers.

**Acceptance (P5):** Network tab shows 200 OK for `/data/operations_data.json` on both public and kiosk pages.

---

## Phase 6 — Structure clean‑up (no dead code)
- Remove any obsolete/duplicated map files left behind in kiosk/public folders.
- Keep shared code only under `src/components/geo/*` and `src/lib/map/*`.
- Ensure imports reference the **new locations**.

**Acceptance (P6):** No duplicate map components remain; project builds cleanly.

---

## Phase 7 — Docs update (required)
Update these files to reflect the new route, shared component, and data‑fetching approach:
- `docs/README.md`
- `docs/REPO_STRUCTURE.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`

**What to add:**
- Track Record public route at `/track-record`.
- Shared **DrilldownMapCore** with public/kiosk wrappers and their file paths.
- Fetching data from `/data/...` via `src/lib/map/data.ts` helpers.

Commit doc updates in the same branch.

**Acceptance (P7):** All four docs updated with accurate paths and explanations.

---

## Phase 8 — QA & checks
```bash
npm run dev
# Header → Track Record → map loads
# Intranet/Kiosk dashboard → map still works

npx tsc --noEmit
npx eslint .
npm run build
```
Browser DevTools → Network → verify `/data/operations_data.json` (and related datasets) return **200 OK** in both public and kiosk views.

**Acceptance (P8):**
- Public and kiosk maps render, no console errors, no 404s.

---

## Commit & PR
```bash
git add -A
git commit -m "feat(map): public /track-record + shared DrilldownMapCore; kiosk wrapper; docs updated"
git push -u origin chore/drilldown-map-routing-and-structure
```
Open a PR with screenshots:
- Header showing “Track Record” → public map
- Kiosk dashboard map
- Network panel showing successful `/data/...` fetches
