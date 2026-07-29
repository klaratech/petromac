import assert from 'node:assert/strict';
import test from 'node:test';
import { caseStudies } from './content';
import {
  buildCaseStudyOptions,
  filterCaseStudies,
  isMajorServiceCompany,
  isQueryActive,
  categoryLabel,
  normalizeCategory,
  OTHER_COMPANY,
  pageNumbersFor,
  SERVICE_COMPANIES,
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
  // 21 stories, all now spelled with the space since the tags.csv fix.
  assert.equal(variants[0]?.count, 21);
});

// ── display labels ─────────────────────────────────────────────────────

test('categoryLabel drops the Well Access: prefix but keeps the bare value', () => {
  assert.equal(categoryLabel('Well Access: Deviation'), 'Deviation');
  assert.equal(categoryLabel('Well Access: Ledges'), 'Ledges');
  // The one story tagged with no sub-category must still read as something.
  assert.equal(categoryLabel('Well Access'), 'Well Access');
  // Repairs the typo on the way through, so a regressed CSV can't leak a
  // "Deviation" that fails to match its sibling's label.
  assert.equal(categoryLabel('Well Access:Deviation'), 'Deviation');
  // Unprefixed categories pass through untouched.
  assert.equal(categoryLabel('Sticking Prevention'), 'Sticking Prevention');
});

test('categoryLabel never yields an empty badge', () => {
  assert.equal(categoryLabel('Well Access:'), 'Well Access:');
  assert.equal(categoryLabel('Well Access: '), 'Well Access:');
});

test('labels stay unique, so no two filter options read the same', () => {
  const { categories } = buildCaseStudyOptions(caseStudies);
  const labels = categories.map((c) => categoryLabel(c.value));
  assert.equal(new Set(labels).size, labels.length, `duplicate labels: ${labels.join(', ')}`);
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
  assert.equal(isQueryActive({ company: 'SLB' }), true);
});

// ── service company (majors + Other) ───────────────────────────────────

test('company options name the majors and bucket the rest as Other', () => {
  const { companies } = buildCaseStudyOptions(caseStudies);
  assert.deepEqual(
    companies.map((c) => c.label),
    ['SLB', 'Halliburton', 'Baker Hughes', 'Other']
  );
  // Every story is accounted for exactly once across the four buckets.
  assert.equal(
    companies.reduce((sum, c) => sum + c.count, 0),
    caseStudies.length
  );
});

test('major company filter matches only that company', () => {
  const slb = filterCaseStudies(caseStudies, { company: 'SLB' });
  assert.ok(slb.length > 0);
  assert.ok(slb.every((cs) => cs.wirelineCompany.toUpperCase() === 'SLB'));

  // "hal" as free text over-matches ("challenging", "shallow"); the filter
  // must not — that's the whole reason it exists.
  const hal = filterCaseStudies(caseStudies, { company: 'HAL' });
  assert.ok(hal.every((cs) => cs.wirelineCompany.toUpperCase() === 'HAL'));
  assert.ok(hal.length < filterCaseStudies(caseStudies, { text: 'hal' }).length);
});

test('Other excludes all three majors and is non-empty', () => {
  const other = filterCaseStudies(caseStudies, { company: OTHER_COMPANY });
  assert.ok(other.length > 0, 'expected at least one non-major operator');
  assert.ok(other.every((cs) => !isMajorServiceCompany(cs.wirelineCompany)));
  assert.ok(other.every((cs) => cs.wirelineCompany.trim() !== ''));
});

test('the four company buckets partition the set with no overlap', () => {
  const seen = new Set<string>();
  for (const value of [...SERVICE_COMPANIES.map((c) => c.code), OTHER_COMPANY]) {
    for (const cs of filterCaseStudies(caseStudies, { company: value })) {
      assert.ok(!seen.has(cs.slug), `${cs.slug} matched two company buckets`);
      seen.add(cs.slug);
    }
  }
  assert.equal(seen.size, caseStudies.length);
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
