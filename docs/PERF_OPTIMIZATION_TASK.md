# PERF_OPTIMIZATION_TASK.md

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
git checkout -b chore/perf-page-speed
```

> **Guardrails:** This task must **not** change business logic or visuals. Only safe, additive optimizations for **page load speed** (LCP/CLS/JS payload/cache).

---

## 🎯 Goals
- Improve **page load speed** (especially LCP/CLS/JS payload) without changing UI or behavior.
- Keep builds/deploys stable. Zero breaking changes.
- Measure before/after and document outcomes.

---

## Phase 1 — Baseline measurements
1. Build & serve production locally:
   ```bash
   npm run build
   npm run start  # http://localhost:3000
   ```
2. Run **Lighthouse** in Chrome DevTools for these pages:
   - `/` (home)
   - `/track-record`
   - `/intranet/kiosk` (authenticated view; test after login)
3. Record scores (Performance, LCP, CLS, JS payload size) in `docs/PERF_NOTES.md` (create if missing).

**Acceptance (P1):** Baseline numbers are written to `docs/PERF_NOTES.md` with timestamps and test URLs.

---

## Phase 2 — Code splitting (dynamic imports, no visual changes)
**Target:** large client modules only load when needed.

1. Convert heavy components to **dynamic imports** with `ssr:false` (keeps UI identical, just defers JS):
   - `DrilldownMapPublic`, `DrilldownMapKiosk` (D3/topojson)
   - Flipbook component (`page-flip`/viewer)
   - Any `three`/`react-three-fiber` viewers
   - `react-player` (videos)
2. Pattern:
   ```tsx
   import dynamic from "next/dynamic";
   const DrilldownMap = dynamic(() => import("@/components/geo/DrilldownMapPublic"), {
     ssr: false,
     loading: () => <div className="min-h-40" aria-hidden="true" />,
   });
   ```
3. Ensure parent pages render a small placeholder to prevent layout shift (preserve height).

**Acceptance (P2):** Dynamic imports applied to heavy modules; no visible differences; pages render as before.

---

## Phase 3 — Images (Next Image + LCP)
1. Ensure all `<img>` tags in public pages use **`next/image`**.
2. Mark **only the LCP image** on the homepage as `priority`. Others should use proper `sizes` and let the optimizer pick formats (AVIF/WebP).
3. Verify team/intranet images use `fill`/`sizes` appropriately to avoid layout shift.

**Acceptance (P3):** No raw `<img>` on public routes; LCP image has `priority`; layout is stable (no CLS regression).

---

## Phase 4 — Data fetching & caching (CDN-first)
1. For **server components** that fetch from `/data/*.json`, add revalidation:
   ```ts
   export const revalidate = 86400; // 24h
   // or per-fetch:
   await fetch("https://your-domain/data/operations_data.json", { next: { revalidate: 86400 } })
   ```
2. For **client-side fetchers**, prefer:
   ```ts
   fetch("/data/operations_data.json", { cache: "force-cache" })
   ```
3. Ensure large datasets are **not imported** from `src/data/*.json` but fetched from `public/data/*.json`.

**Acceptance (P4):** All large datasets load via CDN (`/data/...`) with caching; no 404s.

---

## Phase 5 — Fonts (fast, no FOUT/CLS)
1. Use `next/font` for Google/local fonts to self-host and preload (likely already present). Keep variants minimal.
2. If you still import CSS fonts, replace with `next/font`.
3. Ensure `display: swap` behavior is active (done automatically by `next/font`).

**Acceptance (P5):** Fonts load via `next/font` with minimal variants; no layout shift caused by fonts.

---

## Phase 6 — Tailwind scan scope
1. Narrow Tailwind content globs to actual source paths to reduce scanning time and final CSS size:
   ```js
   // tailwind.config.(ts|mjs)
   content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"]
   ```
2. Confirm no styles are lost (visuals unchanged).

**Acceptance (P6):** Tailwind config uses specific globs; no visual regressions.

---

## Phase 7 — Third-party scripts
1. Ensure non-critical scripts use **lazy** strategies:
   ```tsx
   import Script from "next/script";
   <Script src="..." strategy="lazyOnload" />
   ```
2. Keep `@vercel/analytics` as-is (already optimized).

**Acceptance (P7):** All third-party scripts are lazy-loaded unless critical.

---

## Phase 8 — Bundle insights (dev-only, safe)
1. Add analyzer (dev-only):
   ```bash
   npm i -D @next/bundle-analyzer
   ```
2. Wrap `next.config.js/ts`:
   ```js
   const withBundleAnalyzer = require("@next/bundle-analyzer")({
     enabled: process.env.ANALYZE === "true",
   });
   module.exports = withBundleAnalyzer({ /* existing config */ });
   ```
3. Inspect bundles locally:
   ```bash
   ANALYZE=true npm run build
   ```
4. If any page imports large libs unnecessarily, convert to dynamic import (Phase 2).

**Acceptance (P8):** Analyzer runs locally on demand; no build differences when `ANALYZE` is unset.

---

## Phase 9 — Re-measure & document
1. Re-run Lighthouse for the same pages.
2. Update `docs/PERF_NOTES.md` with after numbers. Summarize % change for LCP/CLS and total JS.

**Acceptance (P9):** `docs/PERF_NOTES.md` contains before/after and a short summary.

---

## QA & Checks
```bash
npm run dev     # quick manual pass
npx tsc --noEmit
npx eslint .
npm run build
```
- No visual diffs.
- Network tab: big libs load only on pages that need them.
- No 404s from `/data/*.json`.

---

## Commit & PR
```bash
git add -A
git commit -m "chore(perf): page-speed optimizations (dynamic imports, image/font/cache tweaks) — no visual/logic changes"
git push -u origin chore/perf-page-speed
```

Open a PR with:
- Before/after Lighthouse screenshots for `/` and `/track-record`
- Notes on what was dynamically imported and why
- Confirmation that visuals/business logic are unchanged
