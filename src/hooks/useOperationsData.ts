import { useCallback, useEffect, useState } from 'react';
import type { JobRecord } from '@/types/JobRecord';

export type Operation = Record<string, string | number>;

interface UseOperationsDataOptions {
  refreshIntervalMs?: number;
  enabled?: boolean;
  /** Override the source URL. Defaults to `/data/operations_data.json` (slim
   *  6-column file used by every map surface). The staff diagnostic at
   *  /intranet/kiosk/datacheck overrides with `/data/operations_full.json`
   *  to get all 33 columns. */
  url?: string;
}

export default function useOperationsData<T = JobRecord>(options: UseOperationsDataOptions = {}) {
  const {
    refreshIntervalMs = 5 * 60 * 1000,
    enabled = true,
    url = '/data/operations_data.json',
  } = options;
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      // Fetch the static JSON published by the data pipeline directly.
      // The backend route is just a passthrough to this same file, so the
      // map stays independent from backend reachability.
      //
      // No explicit cache option — let the browser honour the server's
      // Cache-Control (`public, max-age=300, stale-while-revalidate=86400`
      // on /data/operations_data.json, see next.config.ts). Previously we
      // forced `force-cache` to defeat the old `no-store` server header;
      // now the server cooperates and we want normal revalidation so
      // pipeline updates propagate.
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load operations data: ${res.status}`);
      }
      const json = (await res.json()) as T[];
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error while loading operations data'));
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!enabled) return;

    setIsLoading(true);
    void load();

    if (refreshIntervalMs <= 0) return;
    const timer = window.setInterval(() => {
      void load();
    }, refreshIntervalMs);

    return () => window.clearInterval(timer);
  }, [enabled, load, refreshIntervalMs]);

  return { data, isLoading, error, refresh: load };
}
