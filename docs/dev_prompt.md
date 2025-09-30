# Dev Prompt — Repo Reorganization

You are my repository maintainer. Apply the following structural improvements to the repo.  
Do **not** change business logic or visuals. Only move/rename files, fix imports, and update docs where specified.  
After completing, update the **existing `REPO_STRUCTURE.md`** to reflect the new organization.

---

## 🎯 Goals
1. Remove duplicates (esp. PDF modals).
2. Clarify intranet vs kiosk responsibilities.
3. Centralize reusable components (inputs, pdf, panels).
4. Consolidate `lib`, `constants`, `config`, `data`.
5. Normalize naming conventions.
6. Improve documentation.

---

## 🔧 Tasks

### 1. PDF Builder Modal
- Keep **only** `src/components/shared/pdf/PDFBuilderModal.tsx` as the canonical implementation.
- Delete or merge the duplicate `src/components/PdfBuilderModal.tsx`.
- Fix all imports across the repo to use the shared version.

### 2. Intranet Structure
- `/src/app/intranet/catalog` → stays as top-level intranet page.
- `/src/app/intranet/success-stories` → stays as top-level intranet page.
- `/src/app/intranet/kiosk` → keep focused on dashboard/drilldown functions only.
- If kiosk needs catalog or success stories → import their **widgets** (`CatalogWidget`, `SuccessStoriesWidget`) from `modules/`.

### 3. Panels & Inputs
- Ensure `SuccessStoriesPanel.tsx` and `CatalogPanel.tsx` live under `src/components/shared/panels/`.
- Move `MultiSelect.tsx` into `src/components/shared/inputs/` and update imports.

### 4. Lib & Helpers
- Ensure all PDF helpers live under `src/lib/pdf/` (e.g., `buildPdf.ts`).
- Move generic helpers like `dataValidation.ts` and `mapUtils.ts` into `src/lib/`.
- Add an `index.ts` barrel in each lib subfolder for cleaner imports.

### 5. Constants / Config / Data
- **`src/constants/`** → pure constants (enums, option lists, thresholds).
- **`src/config/`** → app-level config (feature flags, featured systems).
- **`src/data/`** → domain data (region data, product specs, static success stories).
- Move files accordingly, fix imports.

### 6. Python Scripts
- Under `scripts/python/`, add a `__main__.py` that can run the pipeline end-to-end:
  ```bash
  python -m scripts.python
  ```
- Do not rewrite business logic, just add orchestration.

### 7. Naming Conventions
- Normalize all React components to **PascalCase** filenames.
- Example: if both `PdfBuilderModal.tsx` and `PDFBuilderModal.tsx` exist → keep one (`PDFBuilderModal.tsx`).

### 8. Documentation
- Update `README.md`:
  - Clarify intranet now has **five tiles**: Athena (Prod), Athena (Test), Kiosk, Success Stories, Catalog.
  - Clarify that we only use a **PDF Builder Modal** (no viewer modal).
  - Add note that Catalog and Success Stories both use the builder modal and can also be embedded into Kiosk.
- Update `REPO_STRUCTURE.md` after reorg to reflect new structure.
- Add `/docs/ARCHITECTURE.md`:
  - Diagram or text explaining Public vs Intranet vs Kiosk and where modules fit.
- Add `/docs/DEVELOPMENT.md`:
  - Local setup instructions (Node, Python, env vars).
  - How to run the Python pipeline.
  - How to run dev vs prod builds.

---

## ✅ Acceptance Criteria
- Only one PDF builder modal exists under `src/components/shared/pdf/`.
- Intranet routes: `/intranet/catalog` and `/intranet/success-stories` are standalone pages; kiosk stays dashboard-only.
- Panels (`SuccessStoriesPanel`, `CatalogPanel`) reusable and imports fixed.
- `MultiSelect.tsx` moved to shared/inputs.
- `lib/`, `constants/`, `config/`, `data/` separated cleanly.
- All React components PascalCase.
- Python pipeline runnable via `python -m scripts.python`.
- `README.md` and `REPO_STRUCTURE.md` updated.
- New docs `ARCHITECTURE.md` and `DEVELOPMENT.md` created.

---
