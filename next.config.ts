import type { NextConfig } from 'next';
import withPWA from 'next-pwa';
import withBundleAnalyzer from '@next/bundle-analyzer';

const isProd = process.env.NODE_ENV === 'production' && process.env.PWA !== 'off';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(
  withPWA({
    dest: 'public',
    disable: !isProd,
    register: true,
    skipWaiting: true,
    swSrc: 'service-worker.js',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)(nextConfig)
);
