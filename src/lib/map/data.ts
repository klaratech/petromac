import type { JobRecord } from '@/types/JobRecord';

/**
 * Fetch operations data published by the data pipeline.
 *
 * Reads the static JSON in /public/data directly. We used to route through
 * the FastAPI backend's /api/data/operations endpoint, but on Vercel the
 * backend isn't deployed and that fetch hangs — so the Track Record page
 * was stuck on "Loading…". The backend handler was just a passthrough to
 * this same file, so fetching it statically gives identical results and
 * works on every deploy.
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
 * Fetch country labels mapping. Same story as fetchOperationsData — pull
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
