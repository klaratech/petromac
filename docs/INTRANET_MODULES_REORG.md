# Intranet Modules Reorg (PDF Builder–Only) — Agent Prompt

**Context:** This repo hosts the Petromac public site and intranet (Athena links, Kiosk, Success Stories, Catalog). We need to reorganize to make **PDF builder** functionality reusable across intranet and kiosk. **There is no PDF viewer modal** in this project; only a **PDF Builder Modal** that creates/downloads PDFs.

> Do not change any business logic. Perform safe refactors, fix imports/paths, and create thin wrappers as needed. Visual output should remain the same unless noted.

---

## Objectives

1) **Centralize PDF builder modal** as a shared component for reuse by:
   - Intranet **Success Stories** page/module
   - Intranet **Catalog** page/module
   - Kiosk embeds that trigger PDF building

2) **Intranet homepage tiles** (route: `/intranet`):
   - **Athena (Prod)** → `https://athena.petromac.co.nz/`
   - **Athena (Test)** → `process.env.NEXT_PUBLIC_ATHENA_TEST_URL || "#"`
   - **Kiosk** → `/intranet/kiosk`
   - **Success Stories** → `/intranet/success-stories` (uses shared panel + builder modal)
   - **Catalog** → `/intranet/catalog` (uses shared panel + builder modal)

3) **Make Success Stories module reusable** in three modes:
   - Full page at `/intranet/success-stories`
   - Embeddable panel for the **Kiosk** (e.g., launched from Drilldown Map)
   - Optional modal/page wrapper on intranet home (triggering the **builder** directly)

4) **Make Catalog module reusable** with its own filter state, mirroring Success Stories design (page + embeddable panel), and using the shared **PDF Builder Modal**.

5) **Documentation:** Update both `README.md` and `REPO_STRUCTURE.md` to reflect the reorg and clarify that **only a PDF Builder Modal** exists (no viewer).

---

## Target Structure

> Move/rename as needed. Do not delete legacy code; adapt and fix imports.

```
app/
  page.tsx
  intranet/
    page.tsx                          # 5 tiles: Athena Prod, Athena Test, Kiosk, Success Stories, Catalog
    success-stories/
      page.tsx                        # full page: panel + builder modal
    catalog/
      page.tsx                        # full page: panel + builder modal
    kiosk/
      page.tsx
      ...existing routes...
      successstories-embed/
        page.tsx                      # optional: embeddable panel route (no builder required here)

components/
  public/
    ...public homepage components...
  shared/
    pdf/
      PDFBuilderModal.tsx             # centralized builder modal (single source of truth)
      index.ts
    panels/
      SuccessStoriesPanel.tsx         # reusable panel (filters/search + actions)
      CatalogPanel.tsx                # reusable panel (filters/search + actions)
      index.ts

modules/
  success-stories/
    containers/
      SuccessStoriesPage.tsx          # composes panel + builder modal (page)
      SuccessStoriesWidget.tsx        # embeddable widget for kiosk (no builder required here)
    hooks/
      useSuccessStoriesFilters.ts
    services/
      successStories.service.ts       # data load/transform
    types/
      successStories.types.ts
    index.ts
  catalog/
    containers/
      CatalogPage.tsx
      CatalogWidget.tsx
    hooks/
      useCatalogFilters.ts
    services/
      catalog.service.ts
    types/
      catalog.types.ts
    index.ts

lib/
  pdf/
    buildPdf.ts                       # helper wrapper for build/export (reuses existing logic)
  utils/
    ...shared small helpers...
```

> If the builder currently lives inside kiosk-specific code, extract to `components/shared/pdf/PDFBuilderModal.tsx` and update all callsites.

---

## Component Contracts (TypeScript)

Use **minimal prop interfaces** for reuse. Do not alter business logic—only wrap where needed.

**`components/shared/pdf/PDFBuilderModal.tsx`**
```ts
export interface PDFBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;

  /**
   * Build callback triggered by the modal. Should return a URL string
   * of the built PDF (e.g., in /public or a CDN URL).
   */
  onBuild: (options: Record<string, unknown>) => Promise<string>;

  /** Optional defaults to pre-seed the modal form */
  defaultOptions?: Record<string, unknown>;

  /** Optional: Called when build completes with the URL */
  onBuiltUrl?: (url: string) => void;
}
export default function PDFBuilderModal(props: PDFBuilderModalProps): JSX.Element;
```

**`components/shared/panels/SuccessStoriesPanel.tsx`**
```ts
export interface SuccessStoriesPanelProps {
  filters?: Partial<SuccessStoriesFilters>;
  onFiltersChange?: (f: SuccessStoriesFilters) => void;

  /**
   * Optional hook to trigger building a PDF using current filters.
   * Panels should not own the builder; they only signal intent.
   */
  onRequestBuildPdf?: (currentFilters: SuccessStoriesFilters) => void;

  dense?: boolean; // compact layout for kiosk embed
}
export default function SuccessStoriesPanel(props: SuccessStoriesPanelProps): JSX.Element;
```

**`components/shared/panels/CatalogPanel.tsx`**
```ts
export interface CatalogPanelProps {
  filters?: Partial<CatalogFilters>;
  onFiltersChange?: (f: CatalogFilters) => void;
  onRequestBuildPdf?: (currentFilters: CatalogFilters) => void;
  dense?: boolean;
}
export default function CatalogPanel(props: CatalogPanelProps): JSX.Element;
```

**Filters types** (adapt to your current keys—keep naming stable):
```ts
// modules/success-stories/types/successStories.types.ts
export interface SuccessStoriesFilters {
  region?: string[];
  yearRange?: [number, number];
  system?: string[];
  keywords?: string;
}

// modules/catalog/types/catalog.types.ts
export interface CatalogFilters {
  productLine?: string[];
  orientation?: string[];
  deviationClass?: string[];
  search?: string;
}
```

---

## Wiring Guidelines

- **Page wrappers** (`SuccessStoriesPage`, `CatalogPage`): compose **Panel + PDFBuilderModal**.  
  The panel signals `onRequestBuildPdf(currentFilters)`, the page opens the builder modal and passes a build callback that calls `lib/pdf/buildPdf.ts` with filters/options.

- **Kiosk embed**: use the **Widget** (panel-only). If the kiosk needs to build, it can open the same shared **PDFBuilderModal** in its own page layer.

- **No PDF viewer**: After building, the modal should:
  - Show a **download link** and/or **“Open in new tab”** link to the built PDF URL.
  - Optionally offer a “Copy link” button.
  - Close on success if desired (maintain current UX).

- **`lib/pdf/buildPdf.ts`**: thin wrapper that calls existing builder logic (server action, API route, or Python script). Do not rewrite the build process; only expose a promise that resolves to a **publicly accessible URL** (e.g., `/successstories.pdf` or `/catalog/catalog.pdf`), or a timestamped file if that’s how it works today.

- **Imports & paths**: fix all moved/renamed imports. Add **barrel exports** (`index.ts`) for ergonomic imports.

---

## README & REPO_STRUCTURE Updates

**Update `README.md`:**
- Reflect that the intranet has **five tiles** (Athena Prod, Athena Test, Kiosk, Success Stories, Catalog).  
- Clarify **there is no PDF viewer modal**; we only use a **PDF Builder Modal** that outputs a downloadable link/URL.  
- Add a short section explaining where built PDFs are saved (e.g., `public/` or a temporary location) and how they are served.  
- Mention that Success Stories and Catalog pages both use the shared builder modal, and that Success Stories can be embedded in Kiosk.

**Update `REPO_STRUCTURE.md`:**
- Add `components/shared/pdf/PDFBuilderModal.tsx` and remove any mention of viewer modal.  
- Add `components/shared/panels/*` and `modules/success-stories/*`, `modules/catalog/*`.  
- Add optional `app/intranet/kiosk/successstories-embed/page.tsx`.  
- Ensure intranet tiles list matches: Athena Prod, Athena Test, Kiosk, Success Stories, Catalog.

---

## Acceptance Criteria

- **Shared PDF Builder** lives in `components/shared/pdf/PDFBuilderModal.tsx` and is used by:
  - `/intranet/success-stories` page
  - `/intranet/catalog` page
  - Kiosk (when building is needed)
- **Panels** (`SuccessStoriesPanel`, `CatalogPanel`) do **not** contain builder logic; they only raise `onRequestBuildPdf` events.
- **Success Stories** is reusable:
  - Full page at `/intranet/success-stories`
  - Embeddable in Kiosk (compact)
- **Catalog** mirrors the same structure with its own filters.
- Imports/paths corrected; build passes with no type errors.
- `README.md` and `REPO_STRUCTURE.md` are updated to reflect the reorg and the builder-only approach.
- Visual parity maintained; no business logic regressions.
