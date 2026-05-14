import type { JobRecord } from '@/types/JobRecord';

/**
 * Fetch operations data published by the data pipeline.
 *
 * Reads the static JSON in /public/data directly. The FastAPI
 * /api/data/operations endpoint is only a passthrough to this same file,
 * so static fetches keep map surfaces independent from backend reachability.
 */
export async function fetchOperationsData(): Promise<JobRecord[]> {
  const response = await fetch('/data/operations_data.json', {
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(`Failed to load operations data: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch country labels mapping. Same story as fetchOperationsData: pull
 * the static JSON from /public/data instead of via the backend route.
 */
export async function fetchCountryLabels(): Promise<Record<string, string>> {
  const response = await fetch('/data/country_labels.json', {
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(`Failed to load country labels: ${response.status}`);
  }

  return response.json();
}
