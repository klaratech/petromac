import { useState, useEffect, useCallback } from 'react';
import { json } from 'd3-fetch';
import { geoCentroid } from 'd3-geo';
import * as topojson from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';
import { EXTERNAL_URLS } from '@/constants/app';

type WorldFeatures = FeatureCollection<Geometry, { name?: string }>;

interface UseMapDataResult {
  worldData: WorldFeatures | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

// Module-level memo of the fetched AND decoded world geometry. The
// ~740 KB topojson download, topojson.feature() decode, and per-feature
// geoCentroid filtering used to re-run on every map mount (navigate
// away and back = do it all again). One promise per session instead;
// a failed attempt clears the memo so retry() actually retries.
let worldDataPromise: Promise<WorldFeatures> | null = null;

function loadWorldFeatures(): Promise<WorldFeatures> {
  if (!worldDataPromise) {
    worldDataPromise = (async () => {
      const topologyData = (await json(EXTERNAL_URLS.WORLD_MAP_DATA)) as Topology;

      if (!topologyData || !topologyData.objects || !topologyData.objects.countries) {
        throw new Error('Invalid topology data structure');
      }

      const geo = topojson.feature(topologyData, topologyData.objects.countries);

      if (!('features' in geo)) {
        throw new Error('Invalid GeoJSON FeatureCollection');
      }

      const countries = geo as WorldFeatures;

      // Filter out Antarctica and remote Pacific islands
      const filtered = countries.features.filter((f) => {
        const [lon, lat] = geoCentroid(f);
        return f.properties?.name !== 'Antarctica' && !(lon < -150 && lat > 10);
      });

      return { ...countries, features: filtered };
    })().catch((err) => {
      worldDataPromise = null;
      throw err;
    });
  }

  return worldDataPromise;
}

export function useMapData(): UseMapDataResult {
  const [worldData, setWorldData] = useState<WorldFeatures | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorldData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      setWorldData(await loadWorldFeatures());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load world map data';
      setError(errorMessage);
      // Log error for debugging without console
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Map data loading error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    loadWorldData();
  }, [loadWorldData]);

  useEffect(() => {
    loadWorldData();
  }, [loadWorldData]);

  return {
    worldData,
    isLoading,
    error,
    retry,
  };
}
