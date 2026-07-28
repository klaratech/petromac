import assert from 'node:assert/strict';
import test from 'node:test';
import { caseStudies } from './content';
import {
  buildCaseStudyOptions,
  filterCaseStudies,
  isQueryActive,
  normalizeCategory,
  pageNumbersFor,
} from './filters';

// ── category normalisation (the tags.csv typo) ──────────────────────────

test('normalizeCategory repairs the missing-space variant', () => {
  assert.equal(normalizeCategory('Well Access:Deviation'), 'Well Access: Deviation');
  assert.equal(normalizeCategory('Well Access: Deviation'), 'Well Access: Deviation');
  assert.equal(normalizeCategory('  Sticking  Prevention '), 'Sticking Prevention');
});

test('the two Well Access: Deviation spellings collapse into one option', () => {
  const { categories } = buildCaseStudyOptions(caseStudies);
  const variants = categories.filter((c) => c.value.replace(/\s/g, '') === 'WellAccess:Deviation');
  assert.equal(variants.length, 1, 'expected a single merged option');
  // 17 correctly spelled + 4 typo'd in the source data.
  assert.equal(variants[0]?.count, 21);
});

// ── options ────────────────────────────────────────────────────────────

test('options are tallied, sorted by count, and exclude blanks', () => {
  const { regions, devices } = buildCaseStudyOptions(caseStudies);
  assert.ok(regions.length > 0);
  assert.equal(regions[0]?.value, 'MENA'); // most common region in the data
  for (let i = 1; i < regions.length; i++) {
    assert.ok(regions[i - 1]!.count >= regions[i]!.count, 'counts must descend');
  }
  // Two stories have an empty device string — it must not become an option.
  assert.ok(!devices.some((d) => d.value === ''));
});

// ── filtering ──────────────────────────────────────────────────────────

test('no query returns everything', () => {
  assert.equal(filterCaseStudies(caseStudies, {}).length, caseStudies.length);
});

test('region and device filters narrow correctly', () => {
  const mena = filterCaseStudies(caseStudies, { region: 'MENA' });
  assert.ok(mena.length > 0 && mena.length < caseStudies.length);
  assert.ok(mena.every((cs) => cs.region === 'MENA'));

  const pathfinder = filterCaseStudies(caseStudies, { device: 'Pathfinder' });
  assert.ok(pathfinder.every((cs) => cs.device === 'Pathfinder'));
});

test('category filter matches across both source spellings', () => {
  const hits = filterCaseStudies(caseStudies, { category: 'Well Access: Deviation' });
  assert.equal(hits.length, 21);
});

test('free text needs 2+ chars and requires every term', () => {
  // A single character is ignored rather than matching everything noisily.
  assert.equal(filterCaseStudies(caseStudies, { text: 'a' }).length, caseStudies.length);

  const saudi = filterCaseStudies(caseStudies, { text: 'saudi' });
  assert.ok(saudi.length > 0);
  assert.ok(saudi.every((cs) => JSON.stringify(cs).toLowerCase().includes('saudi')));

  // Both terms must appear — so this is a subset of the single-term result.
  const both = filterCaseStudies(caseStudies, { text: 'saudi arabia' });
  assert.ok(both.length <= saudi.length);

  assert.equal(filterCaseStudies(caseStudies, { text: 'zzzznotathing' }).length, 0);
});

test('filters combine (AND, not OR)', () => {
  const region = 'MENA';
  const combined = filterCaseStudies(caseStudies, { region, category: 'Sticking Prevention' });
  assert.ok(combined.every((cs) => cs.region === region));
  assert.ok(combined.length <= filterCaseStudies(caseStudies, { region }).length);
});

test('isQueryActive ignores blank text', () => {
  assert.equal(isQueryActive({}), false);
  assert.equal(isQueryActive({ text: '   ' }), false);
  assert.equal(isQueryActive({ text: 'ledge' }), true);
  assert.equal(isQueryActive({ region: 'APAC' }), true);
});

// ── page numbers for the filtered PDF ──────────────────────────────────

test('pageNumbersFor is ascending, deduped, and covers every story', () => {
  const all = pageNumbersFor(caseStudies);
  assert.equal(all.length, caseStudies.length);
  assert.deepEqual(
    all,
    [...all].sort((a, b) => a - b)
  );

  const subset = pageNumbersFor(filterCaseStudies(caseStudies, { region: 'EUR' }));
  assert.ok(subset.length > 0 && subset.length < all.length);
  assert.ok(subset.every((p) => Number.isInteger(p) && p > 0));
});
