# Performance Optimization Notes

## Baseline Measurements (Before Optimization)

**Date:** October 3, 2025, 12:20 AM (Europe/Rome, UTC+2:00)
**Test Environment:** Production build on localhost:3000
**Browser:** Chrome DevTools Lighthouse

### Pages Tested:
- `/` (home)
- `/track-record`
- `/intranet/kiosk` (authenticated view)

### Baseline Scores:
*To be filled with Lighthouse measurements*

| Page | Performance | LCP (s) | CLS | JS Payload (KB) |
|------|-------------|---------|-----|-----------------|
| `/` (home) | TBD | TBD | TBD | TBD |
| `/track-record` | TBD | TBD | TBD | TBD |
| `/intranet/kiosk` | TBD | TBD | TBD | TBD |

---

## After Optimization

**Date:** TBD
**Test Environment:** Production build on localhost:3000

### After Scores:
*To be filled after completing optimizations*

| Page | Performance | LCP (s) | CLS | JS Payload (KB) |
|------|-------------|---------|-----|-----------------|
| `/` (home) | TBD | TBD | TBD | TBD |
| `/track-record` | TBD | TBD | TBD | TBD |
| `/intranet/kiosk` | TBD | TBD | TBD | TBD |

---

## Changes Summary

### Phase 2: Code Splitting (Dynamic Imports)
Converted heavy client-side components to use dynamic imports with `ssr: false` to defer JS loading:

1. **Flipbook Component** (`src/app/catalog/page.tsx`)
   - Added dynamic import for page-flip library
   - Loading state with 700px min-height to prevent CLS
   - Reduces initial bundle for catalog page

2. **Map Components**
   - `DrilldownMapPublic` in `/track-record` - Added loading placeholder (600px min-height)
   - `DrilldownMapKiosk` in `/intranet/kiosk/dashboard` - Added loading placeholder
   - Defers D3 and topojson libraries until needed

3. **3D Viewer Components**
   - `CircularGallery` in `/intranet/kiosk/catalog` - Defers three.js/react-three-fiber
   - Loading state prevents layout shift on kiosk pages

**Impact:** Heavy libraries (page-flip, D3, topojson, three.js) now load only when their pages are visited, significantly reducing initial JS payload for homepage and other routes.

### Phase 3: Image Optimization
**Status:** Already optimized - all images use `next/image` with proper `priority`, `fill`, and `sizes` attributes throughout the application.

### Phase 4: Data Fetching & Caching
Added `cache: 'force-cache'` to all data fetches for CDN optimization:

1. **Updated Files:**
   - `src/lib/validation.ts` - fetchJsonWithValidation now uses force-cache
   - `src/components/kiosk/SystemModal.tsx` - operations_data.json with caching
   - `src/components/kiosk/DataTable.tsx` - operations_data.json with caching  
   - `src/components/kiosk/DeviceViewer.tsx` - operations_data.json with caching

2. **Existing Optimizations:**
   - Custom hooks (useMapData, useCountryLabels) already fetch from `/data/*.json` (CDN paths)
   - External world map data fetched from jsdelivr CDN
   - No direct imports from `src/data/*.json` that would bundle data

**Impact:** Large JSON datasets are now cached by the browser and CDN, reducing repeated network requests and improving subsequent page loads.

### Phase 5: Font Optimization
**Status:** Already optimized - using `next/font` for Inter and IBM Plex Sans with:
- Self-hosted fonts (no external requests)
- Automatic `display: swap` behavior
- Minimal font weight variants (400, 500, 600, 700)
- CSS variables for Tailwind integration

### Phase 6: Tailwind Scan Scope
**Status:** Already optimized - `tailwind.config.ts` uses specific content paths:
```typescript
content: [
  "./src/app/**/*.{ts,tsx}",
  "./src/components/**/*.{ts,tsx}",
  "./src/pages/**/*.{ts,tsx}",
]
```
This minimizes CSS scanning time and final CSS bundle size.

### Phase 7: Third-Party Scripts
**Status:** Already optimized - `@vercel/analytics` is the only third-party script and uses Next.js optimized loading.

### Phase 8: Bundle Analysis
Added `@next/bundle-analyzer` to enable on-demand bundle inspection:
- Installed as dev dependency
- Configured in `next.config.ts` with `ANALYZE=true` env flag
- Run with: `ANALYZE=true pnpm run build`
- Does not affect production builds when ANALYZE is unset

---

## Overall Impact
*To be calculated after measurements*
