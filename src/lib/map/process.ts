import { rollups, sum, quantile } from 'd3-array';
import type { JobRecord } from '@/types/JobRecord';
import type { CountryStats, ProcessedMapData } from '@/types/MapTypes';
import { MAP_CONSTANTS } from '@/constants/mapConstants';

/**
 * Process map data based on selected systems
 */
export function processMapData(data: JobRecord[], selectedSystems: string[]): ProcessedMapData {
  const filteredData =
    selectedSystems.length > 0 ? data.filter((job) => selectedSystems.includes(job.System)) : [];

  const isPathfinderOnly =
    selectedSystems.length === 1 && selectedSystems[0].toLowerCase() === 'pathfinder';

  return {
    filteredData,
    isPathfinderOnly,
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

  return rollups(
    source,
    (entries) =>
      sum(entries, (d) => {
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

export interface IntensityScale {
  /** Returns the bucketed fill color for a given count (0 returns the
   *  empty-country color). */
  color: (_count: number) => string;
  /** The thresholds that define the buckets (sorted ascending). */
  breaks: number[];
  /** The minimum non-zero count in the dataset (for legend min label). */
  min: number;
  /** The maximum count in the dataset (for legend max label). */
  max: number;
}

/**
 * Build a quantile-based intensity scale from the current country stats.
 * Returns a color function that maps a deployment count to one of the
 * MAP_CONSTANTS.COLORS.INTENSITY_RAMP buckets, plus the breakpoints for
 * rendering a legend.
 *
 * Uses the 0.2 / 0.4 / 0.6 / 0.8 quantiles so each bucket holds roughly
 * a fifth of the countries-with-data — visually balanced regardless of
 * whether deployment counts are evenly distributed or heavily skewed.
 */
export function buildIntensityScale(countryStats: CountryStats[]): IntensityScale {
  const ramp = MAP_CONSTANTS.COLORS.INTENSITY_RAMP;
  const empty = MAP_CONSTANTS.COLORS.COUNTRY_DEFAULT;

  const counts = countryStats
    .map(([, count]) => count)
    .filter((c) => c > 0)
    .sort((a, b) => a - b);

  if (counts.length === 0) {
    return {
      color: () => empty,
      breaks: [],
      min: 0,
      max: 0,
    };
  }

  const min = counts[0];
  const max = counts[counts.length - 1];

  // Build quantile breaks. With a small N we may get duplicates — dedupe
  // so adjacent buckets don't collapse.
  const rawBreaks = [0.2, 0.4, 0.6, 0.8]
    .map((q) => quantile(counts, q) ?? max)
    .map((v) => Math.round(v));
  const breaks = Array.from(new Set(rawBreaks)).sort((a, b) => a - b);

  const color = (count: number): string => {
    if (count <= 0) return empty;
    let bucket = breaks.findIndex((b) => count <= b);
    if (bucket === -1) bucket = breaks.length;
    // Clamp to ramp length in case dedupe collapsed buckets.
    bucket = Math.min(bucket, ramp.length - 1);
    return ramp[bucket];
  };

  return { color, breaks, min, max };
}
