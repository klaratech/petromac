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
        // operations_data.json is ~3.5 MB and powers Track Record on every
        // public visit. The previous `no-store` made every navigation
        // re-download the full payload. With max-age=300 +
        // stale-while-revalidate=86400, browsers serve from cache for 5
        // minutes, then revalidate in the background (Next.js sets an ETag
        // on /public assets, so the revalidation is usually a 304). The
        // data only changes when the pipeline regenerates the file
        // (occasional manual run), so this is safe.
        source: '/data/operations_data.json',
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
