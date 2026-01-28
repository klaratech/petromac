import fs from 'fs/promises';
import path from 'path';
import { parseSuccessStoriesTagsCsv } from '../../src/features/success-stories/services/successStories.shared';

type FlipbookManifest = {
  docKey: string;
  title: string;
  pageCount: number;
  pageDigits: number;
  pageExtension: string;
  pagesPath: string;
  sourcePdf: string;
};

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function validateFlipbook(docKey: string, requireTags: boolean) {
  const baseDir = path.join(process.cwd(), 'public', 'flipbooks', docKey);
  const manifestPath = path.join(baseDir, 'manifest.json');
  const errors: string[] = [];

  if (!(await fileExists(manifestPath))) {
    errors.push(`[${docKey}] manifest.json not found`);
    return errors;
  }

  const manifestRaw = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestRaw) as FlipbookManifest;

  if (!manifest.pageCount || manifest.pageCount <= 0) {
    errors.push(`[${docKey}] manifest.pageCount invalid`);
  }
  if (!manifest.pageDigits || manifest.pageDigits <= 0) {
    errors.push(`[${docKey}] manifest.pageDigits invalid`);
  }
  if (!manifest.pageExtension) {
    errors.push(`[${docKey}] manifest.pageExtension missing`);
  }
  if (!manifest.pagesPath) {
    errors.push(`[${docKey}] manifest.pagesPath missing`);
  }
  if (!manifest.sourcePdf) {
    errors.push(`[${docKey}] manifest.sourcePdf missing`);
  }

  const sourcePdfPath = path.join(baseDir, manifest.sourcePdf || 'source.pdf');
  if (!(await fileExists(sourcePdfPath))) {
    errors.push(`[${docKey}] source PDF missing at ${sourcePdfPath}`);
  }

  const pagesDir = path.join(baseDir, manifest.pagesPath || 'pages');
  for (let i = 1; i <= manifest.pageCount; i += 1) {
    const filename = `${String(i).padStart(manifest.pageDigits, '0')}.${manifest.pageExtension}`;
    const pagePath = path.join(pagesDir, filename);
    if (!(await fileExists(pagePath))) {
      errors.push(`[${docKey}] missing page image ${filename}`);
      if (errors.length > 10) break;
    }
  }

  if (requireTags) {
    const tagsPath = path.join(baseDir, 'tags.csv');
    if (!(await fileExists(tagsPath))) {
      errors.push(`[${docKey}] tags.csv not found`);
    } else {
      const csvText = await fs.readFile(tagsPath, 'utf-8');
      const rows = parseSuccessStoriesTagsCsv(csvText);
      const invalid = rows.filter((row) => row.page < 1 || row.page > manifest.pageCount);
      if (invalid.length > 0) {
        errors.push(`[${docKey}] tags contain ${invalid.length} pages outside range 1-${manifest.pageCount}`);
      }
    }
  }

  return errors;
}

async function run() {
  const errors: string[] = [];
  errors.push(...(await validateFlipbook('success-stories', true)));
  errors.push(...(await validateFlipbook('catalog', false)));

  if (errors.length > 0) {
    console.error('[validate:flipbooks] Issues detected:');
    errors.forEach((err) => console.error(`- ${err}`));
    process.exit(1);
  }

  console.log('[validate:flipbooks] OK');
}

run().catch((error) => {
  console.error('[validate:flipbooks] Failed', error);
  process.exit(1);
});
