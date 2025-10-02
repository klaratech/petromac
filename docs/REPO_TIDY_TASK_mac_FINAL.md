# Repo Tidy — macOS (Final Plan for Cline)  
*(tailored to current repo — last checked against `repo_structure.txt`)*

> Why this update? Your current tree shows kiosk components at `src/components/*`, feature assets outside their modules, and legacy lib names. This plan is **macOS-safe** (BSD `sed -i ''`) and prevents terminal hangs by **disabling git pager**, doing **small batches**, and running **bounded checks**.

---

## 0) One-time setup (avoid terminal hangs)

**Disable git pager** so `git branch -a`, `git log`, etc. don’t open `less`:
```bash
git config --global core.pager cat
git config --global pager.branch false
git config --global pager.tag false
git config --global pager.stash false
git config --global pager.status false
git config --global pager.log false
```

**Never run watchers in agent terminal** (no `npm run dev`). Use only bounded commands.

---

## 1) Branching (work only in a chore branch)

```bash
git checkout -b chore/repo-tidy
npm ci || npm install

# quick bounded checks
npx tsc --noEmit
npx eslint . || true   # allow warnings; we’ll fix structure first
```

---

## 2) Barrels & path aliases (no moves yet)

**Ensure tsconfig paths** (`tsconfig.json`):
```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@modules/*": ["src/modules/*"],
      "@lib/*": ["src/lib/*"],
      "@data/*": ["src/data/*"],
      "@constants/*": ["src/constants/*"]
    }
  }
}
```

**Create/update barrels** (add index files if missing):
- `src/components/kiosk/index.ts` (export all kiosk components)
- `src/components/shared/inputs/index.ts`
- `src/components/shared/panels/index.ts`
- `src/components/shared/pdf/index.ts`
- `src/lib/pdf/index.ts` (re-export `build`, `email`, `viewer` if present)
- `src/lib/index.ts`:
  ```ts
  export * as pdf from "./pdf";
  export * from "./maps";
  export * from "./validation";
  ```

Verify:
```bash
npx tsc --noEmit
npx eslint .
```

---

## 3) Consolidate kiosk components (small batches, macOS sed)

Your tree shows kiosk pieces at root of `src/components`:  
`CarouselView.tsx, CircularGallery.tsx, CountryChart.tsx, DataTable.tsx, DeviceViewer.tsx, DrilldownMap.tsx, ErrorBoundary.tsx, IdleRedirect.tsx, LoadingSpinner.tsx, MapRenderer.tsx, SplashLoop.tsx, SystemModal.tsx, YearlyStatsChart.tsx`.

Move **3 files per batch** to `src/components/kiosk/` and update imports with BSD `sed`:

```bash
# Batch 1 (example)
git mv src/components/DrilldownMap.tsx src/components/kiosk/DrilldownMap.tsx 2>/dev/null || true
git mv src/components/SystemModal.tsx src/components/kiosk/SystemModal.tsx 2>/dev/null || true
git mv src/components/YearlyStatsChart.tsx src/components/kiosk/YearlyStatsChart.tsx 2>/dev/null || true

git grep -l "components/DrilldownMap" | xargs -I{} sed -i '' "s#components/DrilldownMap#components/kiosk/DrilldownMap#g" {}
git grep -l "components/SystemModal" | xargs -I{} sed -i '' "s#components/SystemModal#components/kiosk/SystemModal#g" {}
git grep -l "components/YearlyStatsChart" | xargs -I{} sed -i '' "s#components/YearlyStatsChart#components/kiosk/YearlyStatsChart#g" {}

npx tsc --noEmit
npx eslint .
```
Repeat with remaining files (3 at a time) until all kiosk-only components reside in `src/components/kiosk/`.  
Update `src/components/kiosk/index.ts` to export them.

---
## 4) Feature ownership (move domain assets into modules)

From your tree:
- Success Stories assets live in `src/constants/successStoriesOptions.ts` and `src/data/successStories.ts`
- Catalog assets live in `src/config/featuredSystems.ts`, `src/data/deviceSpecs.ts`, `src/data/modelMap.ts`

Move into their modules (batch small, verify after each):

```bash
# Success Stories
git mv src/constants/successStoriesOptions.ts src/modules/success-stories/constants/options.ts 2>/dev/null || true
git mv src/data/successStories.ts src/modules/success-stories/data/successStories.ts 2>/dev/null || true

# Catalog
git mv src/config/featuredSystems.ts src/modules/catalog/config/featuredSystems.ts 2>/dev/null || true
git mv src/data/deviceSpecs.ts src/modules/catalog/data/deviceSpecs.ts 2>/dev/null || true
git mv src/data/modelMap.ts src/modules/catalog/data/modelMap.ts 2>/dev/null || true
```

Fix imports with **macOS sed**:
```bash
git grep -l "from '@/constants/successStoriesOptions" | xargs -I{} sed -i '' "s#@/constants/successStoriesOptions#@modules/success-stories/constants/options#g" {}
git grep -l "from '@/data/successStories"           | xargs -I{} sed -i '' "s#@/data/successStories#@modules/success-stories/data/successStories#g" {}
git grep -l "from '@/config/featuredSystems"        | xargs -I{} sed -i '' "s#@/config/featuredSystems#@modules/catalog/config/featuredSystems#g" {}
git grep -l "from '@/data/deviceSpecs"              | xargs -I{} sed -i '' "s#@/data/deviceSpecs#@modules/catalog/data/deviceSpecs#g" {}
git grep -l "from '@/data/modelMap"                 | xargs -I{} sed -i '' "s#@/data/modelMap#@modules/catalog/data/modelMap#g" {}

npx tsc --noEmit
npx eslint .
```

---

## 5) Lib naming normalization

Your lib currently has `dataValidation.ts` and `mapUtils.ts`.

Rename to concise names and fix imports:

```bash
git mv src/lib/dataValidation.ts src/lib/validation.ts 2>/dev/null || true
git mv src/lib/mapUtils.ts       src/lib/maps.ts       2>/dev/null || true

git grep -l "from '@/lib/dataValidation" | xargs -I{} sed -i '' "s#@/lib/dataValidation#@/lib/validation#g" {}
git grep -l "from '@/lib/mapUtils"       | xargs -I{} sed -i '' "s#@/lib/mapUtils#@/lib/maps#g" {}

# ensure lib barrels exist
printf "export * as pdf from './pdf';\nexport * from './maps';\nexport * from './validation';\n" > src/lib/index.ts

npx tsc --noEmit
npx eslint .
```

If you have PDF helpers, ensure they’re exported via `src/lib/pdf/index.ts`.

---

## 6) Footer/layout & notes

- Ensure **global Footer** is used in both layouts:  
  `src/app/layout.tsx` and `src/app/intranet/layout.tsx` (if present).
- Move `src/app/notes.txt` → `docs/NOTES.md` and remove the original.

```bash
mkdir -p docs
git mv src/app/notes.txt docs/NOTES.md 2>/dev/null || true
```

Verify layouts manually after build.

---

## 7) Docs refresh

- Update `docs/REPO_STRUCTURE.md` to reflect final moves (kiosk under `src/components/kiosk/*`; modules own their data/config/constants; lib naming).
- Update `docs/ARCHITECTURE.md` (feature ownership, shared lib/pdf).
- Update `docs/DEVELOPMENT.md` (use `npx eslint .`, don’t run dev server in agent terminal).

---

## 8) Final verification and push

```bash
npx tsc --noEmit
npx eslint .
npm run build

git add -A
git commit -m "chore(repo): tidy components/modules/lib + docs (mac)"
git push -u origin chore/repo-tidy
```

Open a PR: **“chore: repo tidy (mac-safe)”**

---

## Troubleshooting

- If any `sed` step fails on macOS, ensure you used **`sed -i ''`** (BSD sed).
- If the terminal shows `(END)`, a pager is active — we disabled it above; if you still see it, press `q`.
- If a batch introduces errors, revert that batch and split into smaller moves.

---

## Acceptance Criteria

- All kiosk-only components are in `src/components/kiosk/*` and exported via a barrel.
- Success Stories & Catalog assets live under their modules (`constants/`, `data/`, `config/`).
- Lib files are normalized: `src/lib/validation.ts`, `src/lib/maps.ts`, plus `src/lib/index.ts` and `src/lib/pdf/index.ts` as needed.
- Global Footer is present on all pages; `notes.txt` moved to `docs/NOTES.md`.
- Docs updated to match the new structure.
- `npx tsc --noEmit`, `npx eslint .`, and `npm run build` all pass.
