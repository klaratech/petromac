import type { JobRecord } from '@/types/JobRecord';

/**
 * Fetch operations data published by the data pipeline.
 *
 * Reads the slim JSON in /public/data — just the six fields every map
 * surface consumes. The full 33-column artifact is at
 * `/data/operations_full.json` and only fetched by the staff diagnostic
 * (`/intranet/kiosk/datacheck`).
 *
 * The FastAPI /api/data/operations endpoint is just a passthrough to this
 * same file, so static fetches keep map surfaces independent from backend
 * reachability.
 *
 * No explicit cache option — we let the browser honour the server's
 * Cache-Control (`public, max-age=300, stale-while-revalidate=86400`, set
 * in next.config.ts). The previous `force-cache` was needed when the
 * server shipped `no-store`; now the server cooperates and revalidation
 * happens naturally.
 */
let operationsPromise: Promise<JobRecord[]> | null = null;

export function fetchOperationsData(): Promise<JobRecord[]> {
  // Module-level memo: several surfaces (track record, kiosk dashboard,
  // in-experience maps) call this on mount; fetch + parse the ~600 KB
  // payload once per session instead of once per navigation. A failed
  // attempt clears the memo so the next mount retries.
  if (!operationsPromise) {
    operationsPromise = (async () => {
      const response = await fetch('/data/operations_data.json');

      if (!response.ok) {
        throw new Error(`Failed to load operations data: ${response.status}`);
      }

      return response.json();
    })().catch((err) => {
      operationsPromise = null;
      throw err;
    });
  }

  return operationsPromise;
}

/**
 * Fetch country labels mapping. Same story as fetchOperationsData: pull
 * the static JSON from /public/data instead of via the backend route.
 */
export async function fetchCountryLabels(): Promise<Record<string, string>> {
  const response = await fetch('/data/country_labels.json');

  if (!response.ok) {
    throw new Error(`Failed to load country labels: ${response.status}`);
  }

  return response.json();
}
