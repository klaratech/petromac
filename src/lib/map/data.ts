import type { JobRecord } from '@/types/JobRecord';

/**
 * Fetch operations data from the public data directory
 * Always fetch fresh operations data so track-record reflects latest generated output
 */
export async function fetchOperationsData(): Promise<JobRecord[]> {
  const response = await fetch('/data/operations_data.json', { 
    cache: 'no-store' 
  });
  
  if (!response.ok) {
    throw new Error(`Failed to load operations_data.json: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch country labels mapping
 */
export async function fetchCountryLabels(): Promise<Record<string, string>> {
  const response = await fetch('/data/country_labels.json', { 
    cache: 'force-cache' 
  });
  
  if (!response.ok) {
    throw new Error(`Failed to load country_labels.json: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch region coordinates
 */
export async function fetchRegionCoords(): Promise<Record<string, unknown>> {
  const response = await fetch('/data/region_coords.json', { 
    cache: 'force-cache' 
  });
  
  if (!response.ok) {
    throw new Error(`Failed to load region_coords.json: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch region data
 */
export async function fetchRegionData(): Promise<Record<string, unknown>> {
  const response = await fetch('/data/region_data.json', { 
    cache: 'force-cache' 
  });
  
  if (!response.ok) {
    throw new Error(`Failed to load region_data.json: ${response.status}`);
  }
  
  return response.json();
}
