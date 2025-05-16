declare module 'next-pwa/cache' {
  export interface RuntimeCachingEntry {
    urlPattern: RegExp | string;
    handler: string;
    method?: string;
    options?: {
      cacheName?: string;
      expiration?: {
        maxEntries?: number;
        maxAgeSeconds?: number;
      };
      cacheableResponse?: {
        statuses?: number[];
        headers?: { [key: string]: string };
      };
      networkTimeoutSeconds?: number;
      broadcastUpdate?: {
        channelName?: string;
      };
    };
  }

  const runtimeCaching: RuntimeCachingEntry[];
  export default runtimeCaching;
}