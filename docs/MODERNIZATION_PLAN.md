# Petromac Website + Kiosk Modernization Plan

## Summary
This plan modernizes the Petromac public site and kiosk into a single, shared codebase with two shells (public + kiosk), eliminates Success Stories drift, makes the kiosk offline‑first, hardens security, and updates tooling. Execution is intentionally phased to minimize risk and keep PRs small.

---

## Current Problems (Brief + Impact)

1. **Success Stories drift**
   - Three implementations (filters, parsing, PDF) and inconsistent CSV paths cause 404s and diverging behavior.
   - Impact: broken production paths, inconsistent filters, maintenance cost.

2. **Kiosk offline is partial**
   - Service Worker ignores `/data`, `/videos`, `/models`, `/flipbooks`, `/_next/static`, and map data comes from CDN.
   - Impact: kiosk fails offline or has degraded experience at trade shows.

3. **Global PWA behavior**
   - Manifest and theme are globally applied; kiosk fullscreen behavior bleeds into public pages.
   - Impact: public UX is affected by kiosk settings.

4. **Security gaps**
   - Basic Auth uses `Buffer` in middleware and returns 403 on bad creds; email endpoints allow arbitrary recipients and no rate limiting.
   - Impact: auth reliability, spam/abuse exposure.

5. **Tooling & structure drift**
   - Monolithic `components/` and `modules/` layout; duplication and unclear ownership.
   - npm lockfile only; no lightweight smoke tests or data validation.
   - Impact: slower iteration, higher risk of regressions.

---

## Target Architecture (Folders + Route Groups)

```
src/
  app/
    layout.tsx               # Base HTML + fonts + analytics (no manifest)
    (public)/
      layout.tsx             # Public shell (Header/Footer)
      page.tsx               # Home
      about/...
      catalog/...
      success-stories/...
      track-record/...
      intranet/...
    (kiosk)/
      layout.tsx             # Kiosk shell (fullscreen, SW reg, manifest, viewport)
      intranet/
        kiosk/...
    api/...

  features/
    success-stories/
      components/
      services/
      types/
      config/ (options + normalization)

  shared/
    ui/
      inputs/
      LoadingSpinner.tsx
      ...

  lib/
    map/...
    validation/...
```

**Shell separation**
- `(public)` layout applies Header/Footer and standard UX.
- `(kiosk)` layout provides fullscreen, kiosk SW registration, kiosk manifest, and kiosk-only preloads.

**Feature ownership**
- Success Stories is a single feature module. All parsing/filtering/option derivation/PDF generation routes flow through one service.

---

## Phased Implementation Plan

### Phase 0 — Baseline Plan + Guardrails (Docs Only)
**Goal:** Document current problems, architecture, and phased plan.
- Deliver: `docs/MODERNIZATION_PLAN.md` (this doc).
- Acceptance:
  - Plan includes folder architecture, phases, risks/rollback.

### Phase 1 — Tooling: pnpm Migration
**Goal:** Migrate to pnpm and update docs.
- Add `"packageManager": "pnpm@<version>"`.
- Generate `pnpm-lock.yaml`, remove `package-lock.json`.
- Update docs for pnpm usage (install/dev/build/lint/typecheck).
- Acceptance:
  - `pnpm install` works; all scripts run.
  - Docs reflect pnpm usage.

### Phase 2 — Success Stories Unification (Early & Critical)
**Goal:** One source of truth for parsing/filtering/options/PDF.
- Create `src/features/success-stories` with:
  - CSV loader + PapaParse parser
  - Canonical normalization + filter option derivation
  - Shared filters model
  - `getFilteredPages()` for flipbooks
- Replace all duplicate implementations:
  - Remove `src/components/successstories/Filters.tsx`
  - Remove `src/lib/successStoriesFilters.ts`
  - Remove `src/app/intranet/kiosk/api/successstories`
- Fix CSV/PDF paths:
  - Use `/data/successstories-summary.csv` and `/data/successstories.pdf`
- Add runtime warnings for unmapped CSV values.
- Acceptance:
  - Public and kiosk show identical filters + results.
  - No 404s for CSV/PDF paths.
  - Only one service handles parsing and filtering.

### Phase 3 — Shell Separation via Route Groups
**Goal:** isolate kiosk UX and public UX with route groups.
- Move routes into `src/app/(public)` and `src/app/(kiosk)`.
- Remove ConditionalLayout; use per‑shell layouts.
- Kiosk-only manifest + viewport + SW registration scoped to kiosk layout.
- Acceptance:
  - Public pages never register SW and never see kiosk manifest.
  - Kiosk pages are fullscreen and use kiosk SW.

### Phase 4 — Kiosk Offline‑First & CDN Removal
**Goal:** kiosk works offline with required assets.
- Store world map topojson locally in `public/data/world-110m.json`.
- Update map data URL to `/data/world-110m.json`.
- Improve kiosk SW:
  - Precache small critical assets (`/data/*.json`, CSV, core thumbnails).
  - Runtime cache for `/videos`, `/models`, `/flipbooks`, `/images`, `/_next/static`.
  - Cache versioning + cleanup on activate.
  - Cache navigation responses for kiosk pages (offline reloads).
- Document offline refresh steps.
- Acceptance:
  - Offline reload works for kiosk after one warm‑load.
  - Cached assets served from SW.

### Phase 5 — Security Hardening
**Goal:** tighten auth + public endpoints.
- Middleware:
  - Edge-safe basic auth (no Buffer)
  - 401 for invalid creds (browser prompts)
  - constant-time compare
- Email APIs:
  - Add rate limiting (memory fallback; optional Upstash)
  - Restrict recipient addresses/domains
  - Validate origin/referrer
  - Improve logging
- Acceptance:
  - Invalid creds prompt browser auth
  - Emails cannot be abused trivially

### Phase 6 — Tooling + Guardrails
**Goal:** introduce minimal automation and data validation.
- Add Playwright smoke test (public home, kiosk entry, success stories).
- Add `validate:successstories` script for CSV schema + unmapped values.
- Acceptance:
  - `pnpm lint`, `pnpm typecheck`, `pnpm test:e2e` run locally.
  - CSV validation can be run in CI.

### Phase 7 — Performance & UX Hygiene (Later)
**Goal:** reduce heavy bundles on public shell; kiosk preloads only in kiosk.
- Replace `react-player` with native `<video>` for kiosk.
- Ensure 3D/flipbook modules are dynamic imports.
- Kiosk-only preloads and font hints in kiosk layout only.
- Acceptance:
  - public bundle reduced; kiosk loads assets only when needed.

---

## Risks + Rollback
- **Route group refactor**: could break layout/metadata if mis‑scoped. Rollback by restoring prior `src/app` structure and ConditionalLayout.
- **SW changes**: aggressive caching risks stale assets. Rollback by bumping cache version or disabling SW registration.
- **Success Stories unification**: risk of filter mismatch if normalization changes. Rollback by reverting to previous parsing and filter behavior for a single release.
- **pnpm migration**: CI tooling mismatch. Rollback by restoring `package-lock.json` and removing pnpm lockfile.

---

## File Move Map (High‑Level)

- `src/app/*` → `src/app/(public)/*` (public routes)
- `src/app/intranet/kiosk/*` → `src/app/(kiosk)/intranet/kiosk/*`
- `src/components/successstories/*` → `src/features/success-stories/components/*`
- `src/lib/successStoriesFilters.ts` → `src/features/success-stories/services/*`
- `src/modules/success-stories/*` → `src/features/success-stories/*`
- `src/components/shared/inputs/*` → `src/shared/ui/inputs/*`
- `src/components/kiosk/LoadingSpinner.tsx` → `src/shared/ui/LoadingSpinner.tsx`

(Exact per‑phase moves listed in PR descriptions)
