# Repo Tidy — Incremental Plan (macOS/VS Code, BSD `sed` safe)


Based on current structure (`repo_structure.txt`):
- `src/components/{kiosk,public,shared}` exist
- `src/modules/{catalog,success-stories}` exist
- `src/lib/{pdf,validation.ts,maps.ts,index.ts}` exist
- `src/constants/{app.ts,mapConstants.ts}`
- `src/data/region_data.json`
- `public/successstories.pdf`, `public/successstories-summary.csv`
- `scripts/python/*`

**Rules**
- Don’t change business logic or visuals.
- Move/rename, add barrels/aliases, fix imports.
- Never run watchers in agent terminal (no `npm run dev` there).
- After each mini-batch: `npx tsc --noEmit && npx eslint .`

---


## Phase 0 — Prep

```bash
# ensure fresh deps and bounded checks
npm ci || npm install
npx tsc --noEmit
npx eslint .
```
Checkpoint ✅: Type-check & lint pass (or known warnings only).

---

## Phase 1 — Barrels & Aliases (No Moves Yet)

1) **tsconfig.json** (paths):
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

2) **Create/update barrels**:
- `src/components/kiosk/index.ts` → export all kiosk components.
- `src/components/shared/inputs/index.ts` → export `MultiSelect` etc.
- `src/components/shared/panels/index.ts` → export `SuccessStoriesPanel`, `CatalogPanel`.
- `src/components/shared/pdf/index.ts` → export `PDFBuilderModal` (+ helpers if any).
- `src/lib/pdf/index.ts` → export `build`, `email`, `viewer` (create stubs if needed).
- `src/lib/index.ts`:
  ```ts
  export * as pdf from "./pdf";
  export * from "./maps";
  export * from "./validation";
  ```

3) **Search-only (no edits yet)**:
```bash
git grep -n "from 'src/components/" || true
git grep -n "from '@/components/" || true
git grep -n "from 'src/lib/" || true
git grep -n "from '@/lib/" || true
```

4) **Verify**:
```bash
npx tsc --noEmit
npx eslint .
```

---

## Phase 2 — Consolidate Kiosk Components (Small Batches)

> If any kiosk component still lives outside `src/components/kiosk`, move **3 files max per batch**.

**Example batch** (replace filenames with ones you actually need to move):
```bash
git mv src/components/DrilldownMap.tsx src/components/kiosk/DrilldownMap.tsx 2>/dev/null || true
git mv src/components/SystemModal.tsx src/components/kiosk/SystemModal.tsx 2>/dev/null || true
git mv src/components/YearlyStatsChart.tsx src/components/kiosk/YearlyStatsChart.tsx 2>/dev/null || true

# macOS BSD sed: use -i ''
git grep -l "components/DrilldownMap" | xargs -I{} sed -i '' "s#components/DrilldownMap#components/kiosk/DrilldownMap#g" {}
git grep -l "components/SystemModal" | xargs -I{} sed -i '' "s#components/SystemModal#components/kiosk/SystemModal#g" {}
git grep -l "components/YearlyStatsChart" | xargs -I{} sed -i '' "s#components/YearlyStatsChart#components/kiosk/YearlyStatsChart#g" {}

npx tsc --noEmit
npx eslint .
```
Repeat until all kiosk-only components are under `src/components/kiosk/`.  
Update `src/components/kiosk/index.ts` to export moved components.

Checkpoint ✅: Build & lint still pass. If not, revert last small batch and adjust manually.

---

## Phase 3 — Feature Ownership (Minimal Moves)

If any **feature-specific** constants/data still sit in `src/constants` or `src/data`, move them into their module.

**Examples (only if these exist)**:
```bash
# Success Stories
git mv src/constants/successStoriesOptions.ts src/modules/success-stories/constants/options.ts 2>/dev/null || true
git mv src/data/successStories.ts src/modules/success-stories/data/successStories.ts 2>/dev/null || true

# Catalog
git mv src/data/deviceSpecs.ts src/modules/catalog/data/deviceSpecs.ts 2>/dev/null || true
git mv src/data/modelMap.ts src/modules/catalog/data/modelMap.ts 2>/dev/null || true
git mv src/config/featuredSystems.ts src/modules/catalog/config/featuredSystems.ts 2>/dev/null || true
```

**Fix imports (macOS-safe `sed`)**:
```bash
git grep -l "from '@/data/successStories" | xargs -I{} sed -i '' "s#@/data/successStories#@modules/success-stories/data/successStories#g" {}
git grep -l "from '@/constants/successStoriesOptions" | xargs -I{} sed -i '' "s#@/constants/successStoriesOptions#@modules/success-stories/constants/options#g" {}
git grep -l "from '@/data/deviceSpecs" | xargs -I{} sed -i '' "s#@/data/deviceSpecs#@modules/catalog/data/deviceSpecs#g" {}
git grep -l "from '@/data/modelMap" | xargs -I{} sed -i '' "s#@/data/modelMap#@modules/catalog/data/modelMap#g" {}
git grep -l "from '@/config/featuredSystems" | xargs -I{} sed -i '' "s#@/config/featuredSystems#@modules/catalog/config/featuredSystems#g" {}

npx tsc --noEmit
npx eslint .
```

Checkpoint ✅: No new errors.

---

## Phase 4 — Lib Naming (Confirm/Normalize)

You already have `src/lib/maps.ts`, `src/lib/validation.ts`, and `src/lib/pdf/`.

Actions:
1) Ensure `src/lib/pdf/` contains: `build.ts`, `email.ts`, `viewer.ts` (or adapt existing files); re-export from `src/lib/pdf/index.ts`.
2) Ensure `src/lib/index.ts` re-exports pdf/maps/validation as above.

Verify:
```bash
npx tsc --noEmit
npx eslint .
```

---

## Phase 5 — Footer & Layouts Check

- Make sure `src/components/shared/Footer.tsx` is the single source of truth.
- Ensure both layouts include it:
  - `src/app/layout.tsx` → `<Footer />` after `{children}`
  - `src/app/intranet/layout.tsx` (if present) → also `<Footer />`
- Confirm `/privacy`, `/terms`, `/contact` exist and display Footer.

---

## Phase 6 — Docs

- Update **docs/REPO_STRUCTURE.md** to reflect final moves (kiosk folder, modules own data/config/constants, lib barrels).  
- Update **docs/ARCHITECTURE.md** with one paragraph on module ownership and shared lib.  
- Update **docs/DEVELOPMENT.md**:
  - Prefer `npx eslint .`
  - Don’t run `npm run dev` inside agent terminal (run in your own terminal).

---

## Phase 7 — Verify & Merge

```bash
npx tsc --noEmit
npx eslint .
npm run build
```

Manual:
- Run `npm run dev` **in your terminal** (not agent).  
- Verify public pages, intranet pages, kiosk flows, Success Stories/Catalog UI.

Commit & push:
```bash
git add -A
git commit -m "chore(repo): tidy v3 phase 1 (barrels/aliases)"
git push -u origin repo-tidy-v3
# repeat per phase
```

Merge:
```bash
git checkout main
git merge repo-tidy-v3 --no-ff
git push origin main
```

---

## Troubleshooting (Agent Hang)

- Avoid watch servers in agent terminal.  
- If a command hangs, try `reset` or open a new terminal.  
- Prefer **small batches** (2–3 files) for `git mv` + `sed` find/replace.  
- macOS **BSD sed** requires `-i ''` for in-place edits; or `brew install gnu-sed` and use `gsed -i`.

---

## Acceptance Criteria

- Kiosk-only components live in `src/components/kiosk/*` with a barrel export.
- Shared panels/inputs/pdf exported from `src/components/shared/*` barrels.
- Feature-owned constants/data/config live under their modules.
- `src/lib/pdf/{build,email,viewer}.ts` (or equivalents) exist and re-exported via `src/lib/pdf/index.ts` and `src/lib/index.ts`.
- Global Footer appears on all pages (public + intranet + legal).
- Docs updated to reflect final structure.
- `npx tsc --noEmit`, `npx eslint .`, `npm run build` pass.
