/**
 * Content pipeline — drop-zone scanner.
 *
 * Scans the `sources/` drop zone, builds the published artifacts, and archives
 * the inputs it consumed. See `sources/README.md` for the convention.
 *
 *   sources/operations/        newest .xlsx          -> public/data/operations_data.json
 *   sources/catalog/           newest .pdf           -> public/flipbooks/catalog/
 *   sources/success-stories/   newest .pdf + .xlsx   -> public/flipbooks/success-stories/
 *
 * Drop a file in (any filename), run the pipeline, commit the changes in
 * `public/`. Consumed inputs are moved to `sources/_archive/` with a date
 * stamp. An empty folder is simply skipped — not an error.
 *
 * Usage:
 *   tsx scripts/node/data-pipeline.ts                  # everything that's been dropped
 *   tsx scripts/node/data-pipeline.ts --operations-only
 *   tsx scripts/node/data-pipeline.ts --flipbooks-only
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const SOURCES = path.join(ROOT, 'sources');
const ARCHIVE = path.join(SOURCES, '_archive');

interface Found {
  path: string;
  name: string;
}

/** Newest non-dotfile in `dir` whose extension is in `exts` (lowercase, with dot). */
function newestFile(dir: string, exts: string[]): Found | null {
  if (!existsSync(dir)) return null;
  const matches = readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .filter((name) => exts.includes(path.extname(name).toLowerCase()))
    .map((name) => {
      const filePath = path.join(dir, name);
      return { path: filePath, name, mtime: statSync(filePath).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return matches.length ? { path: matches[0].path, name: matches[0].name } : null;
}

/** Every non-dotfile in `dir` — the file we used plus anything it superseded. */
function allFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .map((name) => path.join(dir, name))
    .filter((filePath) => statSync(filePath).isFile());
}

/** Move consumed inputs into sources/_archive/ with a YYYY-MM-DD prefix. */
function archive(files: string[]): void {
  if (files.length === 0) return;
  mkdirSync(ARCHIVE, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  for (const file of files) {
    const base = path.basename(file);
    let dest = path.join(ARCHIVE, `${stamp}_${base}`);
    let n = 1;
    while (existsSync(dest)) dest = path.join(ARCHIVE, `${stamp}_${n++}_${base}`);
    renameSync(file, dest);
    // eslint-disable-next-line no-console
    console.log(`   archived  ${base}  ->  _archive/${path.basename(dest)}`);
  }
}

function run(command: string, args: string[], env: Record<string, string> = {}): void {
  const res = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: ROOT,
    env: { ...process.env, ...env },
  });
  if (res.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${res.status}`);
  }
}

/** sources/operations/ -> public/data/operations_data.json */
function processOperations(): void {
  const configuredSource = process.env.OPERATIONS_SOURCE_XLSX || process.env.EXCEL_PATH;
  if (configuredSource) {
    if (!existsSync(configuredSource)) {
      throw new Error(`Configured operations source not found: ${configuredSource}`);
    }

    // eslint-disable-next-line no-console
    console.log(`📊 operations  — ${configuredSource}`);
    run('python3', ['scripts/python/generate_json.py'], {
      EXCEL_PATH: configuredSource,
      SKIP_GITHUB_PUSH: 'true',
    });
    return;
  }

  const dir = path.join(SOURCES, 'operations');
  const src = newestFile(dir, ['.xlsx', '.xls']);
  if (!src) {
    // eslint-disable-next-line no-console
    console.log('📊 operations  — nothing in sources/operations/, skipped');
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`📊 operations  — ${src.name}`);
  run('python3', ['scripts/python/generate_json.py'], {
    EXCEL_PATH: src.path,
    SKIP_GITHUB_PUSH: 'true',
  });
  archive(allFiles(dir));
}

/** sources/catalog/ + sources/success-stories/ -> public/flipbooks/* */
function processFlipbooks(): void {
  const catalogDir = path.join(SOURCES, 'catalog');
  const successDir = path.join(SOURCES, 'success-stories');
  const catalogPdf = newestFile(catalogDir, ['.pdf']);
  const successPdf = newestFile(successDir, ['.pdf']);
  const successTags = newestFile(successDir, ['.xlsx', '.xls']);

  if (!catalogPdf && !successPdf && !successTags) {
    // eslint-disable-next-line no-console
    console.log(
      '📘 flipbooks   — nothing in sources/catalog/ or sources/success-stories/, skipped'
    );
    return;
  }

  const args = ['scripts/python/update_flipbooks.py', '--skip-validate'];

  if (catalogPdf) {
    // eslint-disable-next-line no-console
    console.log(`📘 catalog     — ${catalogPdf.name}`);
    args.push('--catalog-pdf', catalogPdf.path);
  }
  if (successPdf) {
    // eslint-disable-next-line no-console
    console.log(
      `📗 success     — ${successPdf.name}${successTags ? ` + ${successTags.name}` : ' (no tags .xlsx — keeping existing tags)'}`
    );
    args.push('--success-pdf', successPdf.path);
    if (successTags) args.push('--tags-xlsx', successTags.path);
  } else if (successTags) {
    // Tags-only drop: re-tag the published success stories in place.
    // eslint-disable-next-line no-console
    console.log(`📗 success     — ${successTags.name} (tags only; pages untouched)`);
    args.push('--tags-xlsx', successTags.path);
  }

  run('python3', args);

  if (catalogPdf) archive(allFiles(catalogDir));
  if (successPdf || successTags) archive(allFiles(successDir));
}

/**
 * Rewrite the flipbook page entries in public/data/kiosk-offline-assets.json
 * from the published manifests, so the kiosk prime list can't go stale when
 * a flipbook's page count or image format changes. Non-page entries
 * (manifest.json, tags.csv, routes, videos, …) are left untouched.
 */
function syncKioskOfflineAssets(): void {
  const offlinePath = path.join(ROOT, 'public', 'data', 'kiosk-offline-assets.json');
  if (!existsSync(offlinePath)) return;

  const offline = JSON.parse(readFileSync(offlinePath, 'utf8'));
  const isPageEntry = (entry: { url?: string }) =>
    typeof entry.url === 'string' && /^\/flipbooks\/[^/]+\/pages\//.test(entry.url);

  const pageEntries: { kind: string; url: string }[] = [];
  // Only success-stories is an image flipbook the kiosk caches. The catalog
  // is a public-only pdf.js viewer (not in the kiosk) and has no page images.
  for (const docKey of ['success-stories']) {
    const manifestPath = path.join(ROOT, 'public', 'flipbooks', docKey, 'manifest.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    for (let page = 1; page <= manifest.pageCount; page++) {
      const pad = String(page).padStart(manifest.pageDigits, '0');
      pageEntries.push({
        kind: 'flipbook',
        url: `/flipbooks/${docKey}/${manifest.pagesPath}/${pad}.${manifest.pageExtension}`,
      });
    }
  }

  const kept = offline.required.filter((entry: { url?: string }) => !isPageEntry(entry));
  // Insert page entries after the last non-page flipbook entry (manifests/tags)
  // so the file stays organized; fall back to appending.
  const lastFlipbookMeta = kept.findLastIndex((entry: { url?: string }) =>
    (entry.url ?? '').startsWith('/flipbooks/')
  );
  const insertAt = lastFlipbookMeta >= 0 ? lastFlipbookMeta + 1 : kept.length;
  offline.required = [...kept.slice(0, insertAt), ...pageEntries, ...kept.slice(insertAt)];

  writeFileSync(offlinePath, JSON.stringify(offline, null, 2) + '\n', 'utf8');
  // eslint-disable-next-line no-console
  console.log(`🗂  kiosk-offline-assets.json — synced ${pageEntries.length} flipbook page entries`);
}

function main(): void {
  const operationsOnly = process.argv.includes('--operations-only');
  const flipbooksOnly = process.argv.includes('--flipbooks-only');

  // eslint-disable-next-line no-console
  console.log('🚀 Content pipeline — scanning sources/\n');

  if (!flipbooksOnly) processOperations();
  if (!operationsOnly) {
    processFlipbooks();
    syncKioskOfflineAssets();
  }

  // Flipbook validation is advisory — it checks the published bundles, so it
  // runs whenever flipbooks were in scope, even if nothing new was dropped.
  if (!operationsOnly) {
    // eslint-disable-next-line no-console
    console.log('\n🔎 Validating flipbook bundles…');
    try {
      run('pnpm', ['run', 'validate:flipbooks']);
      run('pnpm', ['run', 'validate:successstories']);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️  Validation reported issues: ${(err as Error).message}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('\n🎉 Done. Review the changes under public/ and commit.');
}

main();
