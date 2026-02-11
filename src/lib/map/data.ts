import type { JobRecord } from '@/types/JobRecord';

/**
 * Fetch operations data from the public data directory
 * Always fetch fresh operations data so track-record reflects latest generated output
 */
export async function fetchOperationsData(): Promise<JobRecord[]> {
  const response = await fetch('/data/operations_data.json');
  
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

