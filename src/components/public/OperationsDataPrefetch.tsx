'use client';

import { usePathname } from 'next/navigation';

/**
 * Idle-prefetch the Track Record data file so the first hop from any public
 * page to /track-record renders instantly from cache.
 *
 * - `rel="prefetch"` (not "preload") = low-priority, runs during idle time
 *   and doesn't compete with the current page's own resources.
 * - `as="fetch"` + `crossOrigin="anonymous"` matches how
 *   `fetchOperationsData` requests the file, so the browser reuses the
 *   cached response.
 * - The header on this asset is
 *   `public, max-age=300, stale-while-revalidate=86400` (see next.config.ts),
 *   so revisits hit the cache directly.
 *
 * Catalog routes are excluded: the prefetch surfaced as a background 503 in
 * live testing there (Cloudflare Speed Brain re-issues it), and the catalog
 * is the one heavy page where a ~600 KB idle fetch competes with real assets.
 */
export default function OperationsDataPrefetch() {
  const pathname = usePathname();
  if (pathname.startsWith('/catalog')) return null;
  return (
    <link rel="prefetch" href="/data/operations_data.json" as="fetch" crossOrigin="anonymous" />
  );
}
