import type { SuccessStoryRow, SuccessStoriesValidationReport } from '../types';
import { buildValidationReport, parseSuccessStoriesCsv } from './successStories.shared';

const CSV_URL = '/data/successstories-summary.csv';

let cachedData: SuccessStoryRow[] | null = null;
let cachedValidation: SuccessStoriesValidationReport | null = null;
let hasLoggedValidation = false;

function logValidationIfNeeded(report: SuccessStoriesValidationReport) {
  if (hasLoggedValidation) return;
  hasLoggedValidation = true;

  const hasIssues =
    report.unknownAreas.length > 0 ||
    report.unknownCompanies.length > 0 ||
    report.unknownTechnologies.length > 0 ||
    report.missingPageRows > 0;

  if (!hasIssues) return;

  // Warn once per runtime to surface data issues without breaking UX.
  // eslint-disable-next-line no-console
  console.warn('[SuccessStories] CSV validation issues detected', report);
}

export async function loadSuccessStoriesData(): Promise<SuccessStoryRow[]> {
  if (cachedData) return cachedData;

  const response = await fetch(CSV_URL, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Failed to load success stories CSV: ${response.status}`);
  }

  const csvText = await response.text();
  const data = parseSuccessStoriesCsv(csvText);
  cachedData = data;

  cachedValidation = buildValidationReport(data);
  if (cachedValidation) logValidationIfNeeded(cachedValidation);

  return data;
}

export function getValidationReport(): SuccessStoriesValidationReport | null {
  return cachedValidation;
}
