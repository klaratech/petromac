import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Idle-prefetch the Track Record data file so the first hop from any
          public page to /track-record renders instantly from cache.
          - `rel="prefetch"` (not "preload") = low-priority, runs during idle
            time and doesn't compete with the home page's own resources.
          - `as="fetch"` + `crossOrigin="anonymous"` matches how
            `fetchOperationsData` requests the file, so the browser reuses
            the cached response.
          - The header on this asset is now
            `public, max-age=300, stale-while-revalidate=86400`
            (see next.config.ts), so revisits hit the cache directly. */}
      <link
        rel="prefetch"
        href="/data/operations_data.json"
        as="fetch"
        crossOrigin="anonymous"
      />
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
