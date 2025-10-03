# SUCCESS_STORIES_FILTERS_TASK.md

## ⚙️ Environment Setup (macOS / VS Code) — prevent hangs
Run these once in the VS Code integrated terminal (zsh) so the agent never stalls:
```bash
# Ensure zsh in integrated terminal
echo $SHELL  # expect: /bin/zsh

# Disable git pagers to avoid (END) screens
git config --global pager.branch false
git config --global pager.log false
git config --global pager.diff false
git config --global core.pager cat

# If a command ever shows (END), re-run with --no-pager, e.g.:
#   git --no-pager log -n 5
```

Create a working branch:
```bash
git checkout -b feat/success-stories-filters
```

> **Guardrails:** Only implement the 3 dropdown **multi-select** filters and wire them to the **Success Stories flipbook**. **Do not** change visuals outside the filter area or alter business logic of the flipbook rendering.


---

## 🎯 Goal
Add **three dropdown multi-select filters** above the **Success Stories flipbook** and remove the legacy auto-generated options logic. The options are **hard-coded** in a small TypeScript module. Update docs to tell editors **which file to edit** if options change.

- Filter 1: **Area** — `APAC, MENA, EUR, LAM, NAM, AFR`
- Filter 2: **Service Company** — `SLB, HAL, BHI, Other`
- Filter 3: **Technology** — `Pathfinder, Focus-OH, Focus-CH, Wireline Express, THOR`

The data remains in `public/data/successstories-summary.csv`. Filters should limit the visible pages in the **flipbook** (and any linked “Download/Email/Preview” actions if present) by using that CSV’s page mapping.


---

## 📁 File/Folder Targets (concrete paths)
- Success Stories page (public): `src/app/success-stories/page.tsx`  
  _(If the flipbook lives under a different route, apply the same changes there and note it in docs.)_
- Flipbook component(s): `src/components/flipbook/*` (e.g., `Flipbook.tsx`, wrapper)
- **New options module (create):** `src/data/successStoriesOptions.ts`
- CSV data (already present): `public/data/successstories-summary.csv`
- Optional helpers: `src/lib/successstories/*` (e.g., CSV loader/parser, filter helpers)

> If a separate **intranet** Success Stories view exists (e.g., `src/app/intranet/success-stories/page.tsx` or `src/app/intranet/kiosk/successstories/page.tsx`), **reuse the same filter component** there too.


---

## Phase 1 — Add static options (no CSV parsing for options)
Create `src/data/successStoriesOptions.ts`:

```ts
// src/data/successStoriesOptions.ts
export const AREA_OPTIONS = ["APAC", "MENA", "EUR", "LAM", "NAM", "AFR"] as const;
export const SERVICE_COMPANY_OPTIONS = ["SLB", "HAL", "BHI", "Other"] as const;
export const TECHNOLOGY_OPTIONS = ["Pathfinder", "Focus-OH", "Focus-CH", "Wireline Express", "THOR"] as const;

export type Area = typeof AREA_OPTIONS[number];
export type ServiceCompany = typeof SERVICE_COMPANY_OPTIONS[number];
export type Technology = typeof TECHNOLOGY_OPTIONS[number];

export interface SuccessStoryRow {
  page: number;          // page number in flipbook
  area: Area | string;   // tolerate legacy values (string), normalize later
  company: ServiceCompany | string;
  tech: Technology | string;
  // ... add any other columns from CSV as needed (title, country, year, etc.)
}

/** WHERE TO EDIT OPTIONS (Docs pointer)
 * To add/remove filter options, edit the arrays above and re-deploy.
 * Do NOT auto-generate options from CSV.
 */
```

**Acceptance (P1):** Options are defined in one place, with clear types and docs comment.


---

## Phase 2 — Filter UI (multi-select dropdowns)
Create a reusable **Filters** component and mount it **above** the flipbook.

- New component: `src/components/successstories/Filters.tsx`
- Requirements:
  - 3 multi-select dropdowns (Area, Service Company, Technology)
  - Controlled via props and `onChange` callback
  - Keyboard accessible + labels
  - Debounce update to avoid excessive re-rendering of flipbook

A simple headless structure is fine (Tailwind Listbox/Disclosure or a minimal custom menu). **No visual redesign** needed—just neat defaults that match the site’s styling.

**Props signature (example):**
```ts
export interface FiltersState {
  areas: string[];
  companies: string[];
  techs: string[];
}

interface FiltersProps {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
}
```

**Acceptance (P2):** Filters render above flipbook; you can select multiple values in each.


---

## Phase 3 — Wire filters to flipbook (CSV-driven page filtering)
1. Load `public/data/successstories-summary.csv` once (client or server) and map rows to **flipbook page numbers**.
   - If we already have a CSV parser utility, reuse it. Otherwise, use `papaparse` which is already in dependencies.
2. Normalize CSV fields to our canonical option set (case-insensitive mapping, e.g., `focus-oh` → `Focus-OH`).
3. Build a filtered **set of page numbers** based on current filter selections. If a filter group is empty → means “select all” in that group.
4. Pass the allowed pages list to the flipbook so it only renders those pages (or toggles visibility).

> Keep the flipbook module **untouched** except for a clean API to “limit visible pages” (e.g., prop `visiblePages?: number[]`).

**Acceptance (P3):** Changing a filter immediately updates which pages appear in the flipbook. No errors; CSV is only used for mapping/filtering, not to generate options.


---

## Phase 4 — Remove legacy code (auto-generated options)
- Search and remove any code that **reads the CSV to derive filter options** (old approach).
  ```bash
  git --no-pager grep -nE "successstories-summary.csv|options|multiselect|generateOptions" src || true
  ```
- Keep only the hard-coded options module (`src/data/successStoriesOptions.ts`).
- Ensure any other page (e.g., **Catalog** flipbook) is unaffected.

**Acceptance (P4):** No references remain to “generate options from CSV”. Project builds cleanly.


---

## Phase 5 — Docs update
- `docs/README.md`: add a short section “Success Stories Filters” mentioning the three filters and that options live at `src/data/successStoriesOptions.ts`.
- `docs/REPO_STRUCTURE.md`: include the new component and data file paths under Components/Data sections.
- `docs/DEVELOPMENT.md`: add guidance that options are **hard-coded** and where to edit them; CSV still drives **page mapping only**.
- `docs/ARCHITECTURE.md`: note the separation of concerns—**options source** vs **CSV-filtered page mapping**.

**Acceptance (P5):** All four docs updated and committed with concise notes.


---

## Phase 6 — QA & Checks
```bash
npm run dev
# Visit /success-stories (or the route hosting the flipbook)
# - Select multiple Areas, Service Companies, Technologies
# - Confirm visible pages in the flipbook change accordingly
# - Clear all to show all

npx tsc --noEmit
npx eslint .
npm run build
```
- DevTools Network: `/data/successstories-summary.csv` returns **200 OK**.
- No 404s; no console errors.
- Catalog flipbook (if any) still works.


---

## Commit & PR
```bash
git add -A
git commit -m "feat(success-stories): add 3 multiselect filters (hard-coded options); remove legacy CSV option generation; docs updated"
git push -u origin feat/success-stories-filters
```

Open a PR with:
- Screenshot of the filters above the flipbook (selected values visible)
- Short note confirming docs updated and legacy generator removed
- Any follow-ups (e.g., reuse of Filters component on intranet view)
