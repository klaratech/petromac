import type { JobRecord } from '@/types/JobRecord';
import { buildClientApiUrl } from '@/lib/api';

/**
 * Fetch operations data from the public data directory
 * Always fetch fresh operations data so track-record reflects latest generated output
 */
export async function fetchOperationsData(): Promise<JobRecord[]> {
  const response = await fetch(buildClientApiUrl('/api/data/operations'));
  
  if (!response.ok) {
    throw new Error(`Failed to load operations data: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch country labels mapping
 */
export async function fetchCountryLabels(): Promise<Record<string, string>> {
  const response = await fetch(buildClientApiUrl('/api/data/country-labels'), {
    cache: 'force-cache' 
  });
  
  if (!response.ok) {
    throw new Error(`Failed to load country labels: ${response.status}`);
  }
  
  return response.json();
}
