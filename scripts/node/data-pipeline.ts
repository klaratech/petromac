import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();

const DEFAULTS = {
  operationsXlsx: path.join(ROOT, 'data', 'private', 'raw', 'jobhistory.xlsx'),
  catalogPdf: path.join(ROOT, 'assets', 'source-pdfs', 'catalog.pdf'),
  successPdf: path.join(ROOT, 'assets', 'source-pdfs', 'success-stories.pdf'),
  successTagsXlsx: path.join(ROOT, 'assets', 'tags', 'success-stories-summary.xlsx'),
};

function resolvePath(value: string | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) return fallback;
  return path.isAbsolute(value) ? value : path.resolve(ROOT, value);
}

function run(command: string, args: string[], env: Record<string, string | undefined> = {}) {
  const res = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: ROOT,
    env: { ...process.env, ...env },
  });

  if (res.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${res.status}`);
  }
}

function warnOrThrow(message: string, strict: boolean) {
  if (strict) throw new Error(message);
  // eslint-disable-next-line no-console
  console.warn(`⚠️ ${message} (skipping in non-strict mode)`);
}

function main() {
  const strict = process.env.DATA_PIPELINE_STRICT !== 'false';

  const operationsSource = resolvePath(process.env.OPERATIONS_SOURCE_XLSX, DEFAULTS.operationsXlsx);
  const catalogSource = resolvePath(process.env.FLIPBOOK_CATALOG_SOURCE_PDF, DEFAULTS.catalogPdf);
  const successSource = resolvePath(process.env.FLIPBOOK_SUCCESS_STORIES_SOURCE_PDF, DEFAULTS.successPdf);
  const successTagsXlsx = resolvePath(process.env.FLIPBOOK_SUCCESS_STORIES_TAGS_XLSX, DEFAULTS.successTagsXlsx);

  // eslint-disable-next-line no-console
  console.log('🚀 Starting unified data pipeline...');

  if (existsSync(operationsSource)) {
    // eslint-disable-next-line no-console
    console.log(`📊 Processing operations data from: ${operationsSource}`);
    run('python', ['scripts/python/generate_json.py'], {
      EXCEL_PATH: operationsSource,
      SKIP_GITHUB_PUSH: 'true',
    });
  } else {
    warnOrThrow(`Operations source not found: ${operationsSource}`, strict);
  }

  if (existsSync(catalogSource) && existsSync(successSource)) {
    // eslint-disable-next-line no-console
    console.log('📘 Building flipbooks...');
    const flipbookArgs = [
      'scripts/update_flipbooks.py',
      '--catalog-pdf',
      catalogSource,
      '--success-pdf',
      successSource,
      '--skip-validate',
    ];

    if (existsSync(successTagsXlsx)) {
      flipbookArgs.push('--tags-xlsx', successTagsXlsx);
    }

    run('python', flipbookArgs);
  } else {
    warnOrThrow(
      `Flipbook source PDF missing. catalog: ${catalogSource}, success-stories: ${successSource}`,
      strict
    );
  }

  // eslint-disable-next-line no-console
  console.log('✅ Running validations...');
  run('pnpm', ['run', 'validate:flipbooks']);
  run('pnpm', ['run', 'validate:successstories']);

  // eslint-disable-next-line no-console
  console.log('🎉 Data pipeline complete.');
}

main();
