import path from 'path';
import { buildValidationReport, parseSuccessStoriesTagsCsv } from '../../src/features/success-stories/services/successStories.shared';
import fs from 'fs/promises';

async function validate() {
  const csvPath = path.join(process.cwd(), 'public', 'flipbooks', 'success-stories', 'tags.csv');
  const csvText = await fs.readFile(csvPath, 'utf-8');
  const data = parseSuccessStoriesTagsCsv(csvText);
  const report = buildValidationReport(data);

  if (
    report.unknownAreas.length ||
    report.unknownCompanies.length ||
    report.unknownTechnologies.length ||
    report.missingPageRows
  ) {
    console.warn('[validate:successstories] Issues detected', report);
    process.exitCode = 1;
    return;
  }

  console.log('[validate:successstories] OK');
}

validate().catch((error) => {
  console.error('[validate:successstories] Failed', error);
  process.exit(1);
});
