import * as d3 from 'd3';
import type { Feature, Geometry } from 'geojson';
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

/**
 * Get country centroid for positioning
 */
export function getCountryCentroid(feature: Feature<Geometry>): [number, number] {
  return d3.geoCentroid(feature);
}

/**
 * Validate if coordinates are within map bounds
 */
export function isValidCoordinate(lon: number, lat: number): boolean {
  return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
}

/**
 * Create a safe country name for use as HTML ID
 */
export function createSafeCountryId(countryName: string): string {
  return countryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

/**
 * Check if a country should be excluded from the map
 */
export function shouldExcludeCountry(feature: Feature<Geometry>): boolean {
  const [lon, lat] = getCountryCentroid(feature);
  const name = feature.properties?.name;
  
  // Exclude Antarctica and remote Pacific islands
  return name === 'Antarctica' || (lon < -150 && lat > 10);
}

/**
 * Sort countries by deployment count (descending)
 */
export function sortCountriesByCount(countries: CountryStats[]): CountryStats[] {
  return [...countries].sort((a, b) => b[1] - a[1]);
}

/**
 * Filter countries with zero deployments
 */
export function filterCountriesWithData(countries: CountryStats[]): CountryStats[] {
  return countries.filter(([, count]) => count > 0);
}
