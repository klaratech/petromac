import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { getSiteUrl, isProductionSite, PRODUCTION_SITE_URLS } from './src/lib/siteUrl';

// Launch-day guard: a deploy that declares itself production must point at
// the production domain — otherwise it would ship indexable pages whose
// canonicals/sitemap reference a staging URL. Conversely, without this env
// combination noindex is derived automatically, so an explicit production
// build can never ship noindex. Fails the build, not the request.
if (process.env.NEXT_PUBLIC_ENV === 'production' && !PRODUCTION_SITE_URLS.includes(getSiteUrl())) {
  throw new Error(
    `NEXT_PUBLIC_ENV=production but NEXT_PUBLIC_SITE_URL is "${getSiteUrl()}" — a production ` +
      `build must set NEXT_PUBLIC_SITE_URL to one of: ${PRODUCTION_SITE_URLS.join(', ')}. ` +
      'Refusing to build: this combination would index the wrong domain.'
  );
}

// Everything is self-hosted (fonts via next/font, Draco decoder in
// public/draco/, no analytics), so the CSP can be tight. The exceptions:
// - script-src 'unsafe-inline': App Router's inline bootstrap scripts (no
//   nonce middleware); 'wasm-unsafe-eval': the Draco decoder wasm.
// - style-src 'unsafe-inline': styled-jsx (Flipbook, EmailPdfButton) +
//   inline styles from Tailwind utilities/framer-motion.
// - worker-src blob:: three.js/Draco spawn blob workers.
// - img-src blob: + media-src 'self': 3D viewer textures and kiosk videos.
const isDev = process.env.NODE_ENV === 'development';

const contentSecurityPolicy = [
  "default-src 'self'",
  // React dev mode needs eval() (source maps, refresh); production never does.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // blob: is required — three.js GLTFLoader fetch()es blob: URLs for the
  // textures embedded in the Draco GLBs (img-src alone doesn't cover it).
  "connect-src 'self' blob:",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  // Staging/preview: belt-and-braces noindex at the header level too (pages
  // also carry meta noindex and robots.txt disallows everything).
  ...(isProductionSite() ? [] : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async redirects() {
    return [
      {
        // The bare parent path 404s otherwise — all internal links point at
        // /flipbook, this catches typed/shared URLs.
        source: '/success-stories',
        destination: '/success-stories/flipbook',
        permanent: true,
      },
      {
        // The HTML catalog was refined at /catalogtest before replacing
        // /catalog (Jul 2026) — keep review-era bookmarks working.
        source: '/catalogtest/:path*',
        destination: '/catalog/:path*',
        permanent: true,
      },
      {
        // Categories were ?category= views on /catalog until the Jul 2026
        // three-level restructure — send old bookmarks to the family pages.
        source: '/catalog',
        has: [
          {
            type: 'query',
            key: 'category',
            value: '(?<cat>tool-taxis|guides-holefinders|focus-centralisers|well-intervention)',
          },
        ],
        destination: '/catalog/:cat',
        permanent: true,
      },
      {
        // The 21 WordPress case studies lived at ROOT-level slugs
        // (petromac.co.nz/<slug>/) — rebuilt under /case-studies/<slug>
        // Jul 2026. Slugs are frozen: they must match
        // src/features/case-studies/content/case-studies.json.
        source:
          '/:slug(cast-cbl-successfully-deployed-to-82-deviation-in-norway|cement-evaluation-without-gemco-centralizers-to-85-deviation-in-ksa|elimination-of-pcl-saves-8-days-of-rig-time-in-mexico|expanding-logging-program|formation-testing-5000psi-overbalance|hermes-drag-planner-convinces-client-to-run-mdt-in-nigeria|high-quality-x-y-density-data-in-deviated-wellbores-in-new-zealand|high-side-sampling|holefinder-success-in-azerbaijan-2|image-tool-rotation|mril-d-conveyance-in-highly-deviated-casings-in-malaysia|ngi-logged-over-2400m-section-at-67-deviation-in-new-zealand|oriented-coring-avoids-wellbore-damage-in-the-gulf-of-mexico|oriented-hrsct-optimum-sidewall-core-recovery-in-mexico|positive-orientation-provides-100-fmi-image-coverage-in-iraq|slim-tool-taxis-facilitate-logging-a-highly-deviated-6-hole-section-on-wireline|smooth-mril-xl-logging-at-extreme-deviations-in-mexico|sonic-centralization|stick-slip|successful-open-hole-wireline-logging-to-79-deviation-in-uae|tlc-unable-to-pass-ledge)',
        destination: '/case-studies/:slug',
        permanent: true,
      },
      {
        // Success Stories used to open as a ?stories=1 overlay on Track
        // Record (retired Jul 2026) — send shared/bookmarked overlay URLs
        // to the standalone page.
        // Next passes the matched query param through to the destination
        // (?stories=1 stays in the URL); harmless — the flipbook ignores it.
        source: '/track-record',
        has: [{ type: 'query', key: 'stories', value: '1' }],
        destination: '/success-stories/flipbook',
        permanent: false,
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    // Cache policy (Jul 2026). Requires Cloudflare's Browser Cache TTL set to
    // "Respect Existing Headers" — otherwise CF overrides all of this with a
    // blanket 4 h (and the origin default of max-age=0 for /public assets).
    //
    // Content cadence: everything is a ~quarterly refresh except operations
    // data (weekly). Content swaps reuse the SAME filenames, and browser
    // caches can't be purged remotely — so instead of huge max-ages we use
    // moderate max-age + long stale-while-revalidate: the browser serves from
    // cache instantly, then revalidates in the background (Next sends ETags,
    // so unchanged files are a tiny 304). Staleness after a swap is bounded
    // by max-age; speed is a cache hit either way.
    const day = 86400;
    const week = 7 * day;
    const month = 30 * day;
    // Quarterly-refresh media/documents: fresh within a day of a swap.
    const quarterlyAssets = `public, max-age=${day}, stale-while-revalidate=${month}`;
    // Weekly-refresh data: up to a week stale is acceptable per content owner.
    const weeklyData = `public, max-age=${day}, stale-while-revalidate=${week}`;

    const cacheRule = (source: string, value: string) => ({
      source,
      headers: [{ key: 'Cache-Control', value }],
    });

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // --- Quarterly content + stable site assets ---
      cacheRule('/flipbooks/:path*', quarterlyAssets), // catalog PDFs + success-stories pages
      cacheRule('/images/:path*', quarterlyAssets),
      cacheRule('/videos/:path*', quarterlyAssets),
      cacheRule('/models/:path*', quarterlyAssets), // kiosk GLBs
      cacheRule('/draco/:path*', quarterlyAssets), // Draco decoder (changes with three.js upgrades)
      cacheRule('/icons/:path*', quarterlyAssets),
      // world-50m.json is static reference geometry (last changed May 2026,
      // with a filename change) — safe to treat like the quarterly bucket.
      cacheRule('/data/world-50m.json', quarterlyAssets),
      // --- Weekly-refresh operations data (Track Record, kiosk dashboard,
      //     datacheck, prime manifest) ---
      cacheRule('/data/operations_data.json', weeklyData),
      cacheRule('/data/operations_full.json', weeklyData),
      cacheRule('/data/operations_stats.json', weeklyData),
      cacheRule('/data/country_labels.json', weeklyData),
      cacheRule('/data/kiosk-offline-assets.json', weeklyData),
    ];
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(nextConfig);
