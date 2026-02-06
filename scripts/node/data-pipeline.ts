import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();

// Load .env.local so `pnpm data` picks up OneDrive source paths
// (Next.js does this automatically, but tsx does not)
function loadEnvFile(filename: string) {
  const filepath = path.join(ROOT, filename);
  if (!existsSync(filepath)) return;

  const lines = readFileSync(filepath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    // Don't override values already set in the environment
    if (!(key in process.env) || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

function resolvePath(value: string | undefined): string | undefined {
  if (!value || value.trim().length === 0) return undefined;
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
  const operationsOnly = process.argv.includes('--operations-only');

  const operationsSource = resolvePath(process.env.OPERATIONS_SOURCE_XLSX);

  // eslint-disable-next-line no-console
  console.log(operationsOnly
    ? '🚀 Starting operations-only data pipeline...'
    : '🚀 Starting unified data pipeline...');

  if (operationsSource && existsSync(operationsSource)) {
    // eslint-disable-next-line no-console
    console.log(`📊 Processing operations data from: ${operationsSource}`);
    run('python', ['scripts/python/generate_json.py'], {
      EXCEL_PATH: operationsSource,
      SKIP_GITHUB_PUSH: 'true',
    });
  } else {
    warnOrThrow(
      `Operations source not found. Set OPERATIONS_SOURCE_XLSX in .env.local${operationsSource ? ` (checked: ${operationsSource})` : ''}`,
      strict
    );
  }

  if (!operationsOnly) {
    const catalogSource = resolvePath(process.env.FLIPBOOK_CATALOG_SOURCE_PDF);
    const successSource = resolvePath(process.env.FLIPBOOK_SUCCESS_STORIES_SOURCE_PDF);
    const successTagsXlsx = resolvePath(process.env.FLIPBOOK_SUCCESS_STORIES_TAGS_XLSX);

    if (catalogSource && existsSync(catalogSource) && successSource && existsSync(successSource)) {
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

      if (successTagsXlsx && existsSync(successTagsXlsx)) {
        flipbookArgs.push('--tags-xlsx', successTagsXlsx);
      }

      run('python', flipbookArgs);
    } else {
      warnOrThrow(
        `Flipbook source PDFs not found. Set FLIPBOOK_CATALOG_SOURCE_PDF and FLIPBOOK_SUCCESS_STORIES_SOURCE_PDF in .env.local`,
        strict
      );
    }

    // eslint-disable-next-line no-console
    console.log('✅ Running validations...');
    run('pnpm', ['run', 'validate:flipbooks']);
    run('pnpm', ['run', 'validate:successstories']);
  }

  // eslint-disable-next-line no-console
  console.log('🎉 Data pipeline complete.');
}

main();
