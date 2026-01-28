import fs from 'fs/promises';
import path from 'path';
import { buildValidationReport, parseSuccessStoriesCsv } from '../../src/features/success-stories/services/successStories.shared';

async function main() {
  const csvPath = path.join(process.cwd(), 'public', 'data', 'successstories-summary.csv');
  const csvText = await fs.readFile(csvPath, 'utf-8');
  const rows = parseSuccessStoriesCsv(csvText);
  const report = buildValidationReport(rows);

  const hasIssues =
    report.unknownAreas.length > 0 ||
    report.unknownCompanies.length > 0 ||
    report.unknownTechnologies.length > 0 ||
    report.missingPageRows > 0;

  if (hasIssues) {
    // eslint-disable-next-line no-console
    console.warn('[validate:successstories] Issues detected', report);
    process.exitCode = 1;
    return;
  }

  // eslint-disable-next-line no-console
  console.log('[validate:successstories] OK');
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[validate:successstories] Failed', error);
  process.exit(1);
});
