import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const securityHeaders = [
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
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // operations_data.json (slim, ~600 KB) is fetched by Track Record
        // on every public visit and by the kiosk dashboard. The previous
        // `no-store` re-downloaded the full payload on every navigation.
        // With max-age=300 + stale-while-revalidate=86400, browsers serve
        // from cache for 5 minutes, then revalidate in the background
        // (Next.js sets an ETag on /public assets, so the revalidation is
        // usually a 304). The data only changes when the pipeline
        // regenerates the file (occasional manual run), so this is safe.
        source: '/data/operations_data.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // operations_full.json (~3.5 MB) is the same data with all 33
        // columns from the source xlsx — only fetched by the staff
        // diagnostic at /intranet/kiosk/datacheck. Same cache policy as
        // the slim file (it's behind the intranet anyway).
        source: '/data/operations_full.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(nextConfig);
