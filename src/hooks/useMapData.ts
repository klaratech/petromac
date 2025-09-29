import { useState, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';
import { EXTERNAL_URLS } from '@/constants/app';

interface UseMapDataResult {
  worldData: FeatureCollection<Geometry, { name?: string }> | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useMapData(): UseMapDataResult {
  const [worldData, setWorldData] = useState<FeatureCollection<Geometry, { name?: string }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorldData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const topologyData = await d3.json(EXTERNAL_URLS.WORLD_MAP_DATA) as Topology;
      
      if (!topologyData || !topologyData.objects || !topologyData.objects.countries) {
        throw new Error('Invalid topology data structure');
      }

      const geo = topojson.feature(topologyData, topologyData.objects.countries);
      
      if (!('features' in geo)) {
        throw new Error('Invalid GeoJSON FeatureCollection');
      }

      const countries = geo as FeatureCollection<Geometry, { name?: string }>;
      
      // Filter out Antarctica and remote Pacific islands
      const filtered = countries.features.filter((f) => {
        const [lon, lat] = d3.geoCentroid(f);
        return f.properties?.name !== 'Antarctica' && !(lon < -150 && lat > 10);
      });

      setWorldData({ ...countries, features: filtered });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load world map data';
      setError(errorMessage);
      console.error('Map data loading error:', err);
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
    retry
  };
}
