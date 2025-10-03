# REPO_TIDY_AND_KIOSK_PWA_TASK.md

## ⚙️ Environment Setup (macOS / VS Code) — prevent hangs
Run these once in the VS Code integrated terminal (zsh) so the agent never stalls:
```bash
# Ensure zsh
echo $SHELL  # expect: /bin/zsh

# Disable git pagers to avoid (END) screens
git config --global pager.branch false
git config --global pager.log false
git config --global pager.diff false
git config --global core.pager cat

# If a command shows (END), re-run with --no-pager (e.g., git --no-pager log -n 5)
```

Create a working branch:
```bash
git checkout -b chore/repo-slim-and-kiosk-pwa
```

> **Guardrails:** No visual or business-logic changes. We are consolidating modules to remove duplication and making **PWA apply only to Kiosk**. Public site remains non-PWA.

---

## 🎯 Objectives
1. **De-duplicate** components & modules (map, success stories, header/footer).
2. **Single source of truth** for Success Stories options & CSV location.
3. **Scoped PWA** for **/intranet/kiosk/** only (offline cache for videos, models, flipbooks).
4. Update docs and ensure the app builds & runs cleanly.

---

## Current ground truth (paths we will touch)
- Public pages: `src/app/...`
- Intranet/Kiosk: `src/app/intranet/kiosk/...`
- Shared map (keep): `src/components/geo/DrilldownMapCore.tsx`, `DrilldownMapPublic.tsx`, `DrilldownMapKiosk.tsx`
- Flipbook (keep): `src/components/shared/pdf/Flipbook.tsx`
- Success Stories options (keep): `src/data/successStoriesOptions.ts`
- Success Stories CSV (keep path): `public/data/successstories-summary.csv`
- Legacy duplicates to remove: old kiosk map components, duplicate options/constants, duplicate CSV at `public/successstories-summary.csv`, duplicated header/footer.

If any path differs, adjust accordingly but **do not skip** the step.

---

## Phase 1 — Map: one implementation
1) **Remove legacy kiosk map** files if unused:
```bash
git --no-pager grep -n "components/kiosk/DrilldownMap" -- src || true
git --no-pager grep -n "components/kiosk/MapRenderer" -- src || true
```
- Replace any remaining imports with:
  ```ts
  import DrilldownMapKiosk from "@/components/geo/DrilldownMapKiosk";
  ```
- Keep the shared core under `src/components/geo/*` only.

**Acceptance (P1):** No duplicate map implementations remain; both public `/track-record` and kiosk use the shared core.

---

## Phase 2 — Header/Footer: single pair used everywhere
- Choose **shared** versions: `src/components/shared/Header.tsx`, `src/components/shared/Footer.tsx` (or move the best ones there).
- Import them in **both** layouts:
  - `src/app/layout.tsx`
  - `src/app/intranet/layout.tsx` (or `src/app/intranet/kiosk/layout.tsx` if using nested)
- Remove any `components/public/Header/Footer.tsx` duplicates after migration.

**Acceptance (P2):** Only one Header/Footer pair exists; visible on public + intranet pages.

---

## Phase 3 — Success Stories: one feature & one options file
1) **Options:** Keep only `src/data/successStoriesOptions.ts`. Remove duplicate `src/modules/success-stories/constants/options.ts` (or similar). Update imports.
2) **CSV location:** Keep only `public/data/successstories-summary.csv`. Delete any duplicate at `public/successstories-summary.csv`. Update fetches to `/data/successstories-summary.csv`.
3) **Feature container:** Expose a single container under `src/modules/success-stories/containers/SuccessStoriesPage.tsx`. Have both public & intranet routes render this container (thin adapters). Remove duplicate panel/page logic.

**Acceptance (P3):** One options file, one CSV path, one container used by both entry points.

---

## Phase 4 — Data access layer: one place
- Prefer `src/lib/map/data.ts` for map dataset fetchers. Remove overlapping “map data” utilities elsewhere, or refactor them to import from this service.
- For success stories, keep **services** in `src/modules/success-stories/services/successStories.service.ts` and hooks in `src/modules/success-stories/hooks/…` that rely on the service.

**Acceptance (P4):** Each feature has a single fetch/service; hooks are thin wrappers; no duplicate services.

---

## Phase 5 — Scoped PWA for Kiosk only
> We will **not** use `next-pwa` globally. Instead, **register a dedicated Service Worker only on kiosk pages**, with a **scope limited to `/intranet/kiosk/`**.

1) **Remove/disable global PWA** if present:
   - Ensure there’s **no** global registration in `_document` or global layout.
   - Remove any `public/sw.js` (already gone) and `service-worker.js` at repo root **if not used**.
   - If `next-pwa` is in `next.config.*`, disable its registration (comment out wrapper) or ensure it won’t generate a global sw.

2) **Add a kiosk-specific service worker** file:
   - Create: `public/kiosk-sw.js`
   - Minimal strategy (can be Workbox-based or simple Cache API) — cache videos, 3D models, flipbooks, CSV/JSON used by kiosk:
     ```js
     // public/kiosk-sw.js
     const KIOSK_CACHE = "kiosk-cache-v1";
     const KIOSK_SCOPE = "/intranet/kiosk/";

     self.addEventListener("install", (event) => {
       self.skipWaiting();
     });

     self.addEventListener("activate", (event) => {
       event.waitUntil(self.clients.claim());
     });

     self.addEventListener("fetch", (event) => {
       const url = new URL(event.request.url);
       // Only handle requests under the kiosk scope
       if (!url.pathname.startsWith(KIOSK_SCOPE)) return;
       // Basic cache-first for images/video/models; network-first for JSON/CSV
       if (/\.(png|jpg|jpeg|webp|mp4|glb|gltf)$/i.test(url.pathname)) {
         event.respondWith(caches.open(KIOSK_CACHE).then(async (cache) => {
           const cached = await cache.match(event.request);
           if (cached) return cached;
           const res = await fetch(event.request);
           if (res.ok) cache.put(event.request, res.clone());
           return res;
         }));
       } else if (/\.(json|csv)$/i.test(url.pathname)) {
         event.respondWith(fetch(event.request).then(async (res) => {
           // optionally stale-while-revalidate here
           return res;
         }).catch(() => caches.match(event.request)));
       }
     });
     ```

3) **Register the kiosk SW only within the intranet/kiosk layout**:
   - In `src/app/intranet/kiosk/layout.tsx` (or the highest kiosk-only layout), add a small client component to register:
     ```tsx
     "use client";
     import { useEffect } from "react";

     export default function KioskLayout({ children }: { children: React.ReactNode }) {
       useEffect(() => {
         if ("serviceWorker" in navigator) {
           navigator.serviceWorker.register("/kiosk-sw.js", { scope: "/intranet/kiosk/" })
             .catch(console.error);
         }
       }, []);
       return <>{children}</>;
     }
     ```
   - Ensure this layout is **not** used by public routes.

4) **Test offline**:
   - Build → start → open `/intranet/kiosk/...`
   - DevTools → Application → Service Workers → “Offline” → reload kiosk pages and verify assets still serve.

**Acceptance (P5):** No SW is registered on public pages. A SW is registered **only** on `/intranet/kiosk/*` and caches kiosk assets for offline use.

---

## Phase 6 — Depcheck & removal of dead files
```bash
npx depcheck || true
git --no-pager grep -n "successStoriesOptions" -- src || true
git --no-pager grep -n "successstories-summary.csv" -- src || true
# Remove unused modules/files and update imports accordingly
```

**Acceptance (P6):** No unused duplicate modules remain; dependencies look sane.

---

## Phase 7 — Docs update
Update:
- `README.md`: single Header/Footer, unified map, success-stories consolidation, **kiosk-only PWA** scope.
- `REPO_STRUCTURE.md`: final file locations for shared map, flipbook, options, CSV; kiosk SW.
- `ARCHITECTURE.md`: feature ownership; services/hooks; PWA scoping design.
- `DEVELOPMENT.md`: how to modify options (`src/data/successStoriesOptions.ts`); kiosk SW registration & testing; how to add assets to kiosk cache.

**Acceptance (P7):** All docs reflect the tidy structure and kiosk-only PWA behavior.

---

## QA & Checks
```bash
npm run dev
# Smoke test public pages (About, Catalog, Track Record, Team)
# Smoke test intranet → Kiosk pages (map, videos, 3D, flipbook)
# Verify Header/Footer visible everywhere

npx tsc --noEmit
npx eslint .
npm run build
npm run start

# PWA:
# - Visit /intranet/kiosk/... → SW registered (Application tab)
# - Visit / (home) → NO SW registered
```

**Acceptance (QA):** Builds cleanly; no 404s; kiosk SW scoped correctly; public remains non-PWA.

---

## Commit & PR
```bash
git add -A
git commit -m "chore(repo): consolidate shared components; single options+CSV paths; kiosk-only PWA; docs updated"
git push -u origin chore/repo-slim-and-kiosk-pwa
```

Open a PR with before/after screenshots:
- Header/Footer on both public & intranet
- Track Record (public) and Kiosk map
- DevTools → Application → SW: registered on kiosk, not on public
