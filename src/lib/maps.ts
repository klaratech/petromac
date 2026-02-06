import * as d3 from 'd3';
import type { JobRecord } from '@/types/JobRecord';
import type { CountryStats, ProcessedMapData } from '@/types/MapTypes';

/**
 * Process map data based on selected systems
 */
export function processMapData(
  data: JobRecord[],
  selectedSystems: string[]
): ProcessedMapData {
  const filteredData = selectedSystems.length > 0
    ? data.filter((job) => selectedSystems.includes(job.System))
    : [];

  const isPathfinderOnly = selectedSystems.length === 1 &&
    selectedSystems[0].toLowerCase() === 'pathfinder';

  return {
    filteredData,
    isPathfinderOnly
  };
}

/**
 * Calculate country statistics based on data and filters
 */
export function calculateCountryStats(
  allData: JobRecord[],
  filteredData: JobRecord[],
  isPathfinderOnly: boolean
): CountryStats[] {
  const source = isPathfinderOnly ? allData : filteredData;

  return d3.rollups(
    source,
    (entries) => d3.sum(entries, (d) => {
      if (isPathfinderOnly) {
        return (d['PathFinder Run (Y/N)'] || '').trim().toUpperCase() === 'YES' ? 1 : 0;
      }
      return +d.Successful || 0;
    }),
    (d) => d.Country
  );
}

/**
 * Format deployment count for display
 */
export function formatDeploymentCount(count: number): string {
  return `${count} deployment${count !== 1 ? 's' : ''}`;
}

