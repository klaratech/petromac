declare module 'next-pwa' {
  import type { NextConfig } from 'next';
  import type { RuntimeCachingEntry } from 'next-pwa/cache';

  type PWAOptions = {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: RuntimeCachingEntry[];
    buildExcludes?: string[];
  };

  function withPWA(options: PWAOptions): (config?: NextConfig) => NextConfig;
  export default withPWA;
}
