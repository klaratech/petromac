import { useCallback, useEffect, useState } from 'react';
import type { JobRecord } from '@/types/JobRecord';

export type Operation = Record<string, string | number>;

interface UseOperationsDataOptions {
  refreshIntervalMs?: number;
  enabled?: boolean;
}

export default function useOperationsData<T = JobRecord>(options: UseOperationsDataOptions = {}) {
  const { refreshIntervalMs = 5 * 60 * 1000, enabled = true } = options;
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/data/operations_data.json', { cache: 'no-store' });
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
  }, []);

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