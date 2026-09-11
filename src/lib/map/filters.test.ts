import assert from 'node:assert/strict';
import test from 'node:test';
import type { JobRecord } from '@/types/JobRecord';
import {
  DEVIATION_BUCKETS,
  NO_ADVANCED_FILTERS,
  SIZE_CLASSES,
  deviationBucketOf,
  filterRecords,
  hasActiveFilters,
  matchesSizeClass,
  mudOptions,
  pruneSizesForHoles,
  sizeComponents,
} from './filters';

const rec = (over: Partial<JobRecord>): JobRecord => ({
  Country: 'Kuwait',
  System: 'Wireline Express',
  Subsystem: '',
  Year: 2024,
  Successful: 1,
  'PathFinder Run (Y/N)': 'N',
  Mud: 'SOBM',
  Deviation: 45,
  'Bit size / Csg size [inches]': 8.5,
  'Open Hole /Cased Hole': 'OH',
  ...over,
});

// ── deviation buckets ────────────────────────────────────────────────────

test('deviation buckets cover 0° (vertical) through 80°+ with no gaps', () => {
  assert.equal(deviationBucketOf(rec({ Deviation: 0 })), '0-30');
  assert.equal(deviationBucketOf(rec({ Deviation: 29.9 })), '0-30');
  assert.equal(deviationBucketOf(rec({ Deviation: 30 })), '30-60');
  assert.equal(deviationBucketOf(rec({ Deviation: 60 })), '60-70');
  assert.equal(deviationBucketOf(rec({ Deviation: 70 })), '70-80');
  assert.equal(deviationBucketOf(rec({ Deviation: 80 })), '80+');
  assert.equal(deviationBucketOf(rec({ Deviation: 92 })), '80+');
});

test('deviation accepts numeric strings and rejects blanks/garbage', () => {
  assert.equal(deviationBucketOf(rec({ Deviation: '55' })), '30-60');
  assert.equal(deviationBucketOf(rec({ Deviation: '' })), null);
  const withoutDeviation = rec({});
  delete withoutDeviation.Deviation;
  assert.equal(deviationBucketOf(withoutDeviation), null);
  assert.equal(deviationBucketOf(rec({ Deviation: 'n/a' })), null);
});

test('bucket and size-class keys are unique (they are filter state keys)', () => {
  const keys = [...DEVIATION_BUCKETS.map((b) => b.key), ...SIZE_CLASSES.map((c) => c.key)];
  assert.equal(new Set(keys).size, keys.length);
});

// ── size classes ─────────────────────────────────────────────────────────

test('every open-hole size in the dataset lands in exactly one OH class', () => {
  // Representative sizes per family, straight from the source data.
  const cases: [number, string][] = [
    [5.875, 'oh-slim'],
    [6.5, 'oh-slim'],
    [6.75, 'oh-slim'],
    [7, 'oh-85'],
    [8.375, 'oh-85'],
    [8.5, 'oh-85'],
    [9.25, 'oh-85'],
    [9.875, 'oh-85'],
    [10.625, 'oh-1225'],
    [12.25, 'oh-1225'],
    [13.5, 'oh-large'],
    [16, 'oh-large'],
    [17.5, 'oh-large'],
  ];
  for (const [size, expected] of cases) {
    const r = rec({ 'Bit size / Csg size [inches]': size, 'Open Hole /Cased Hole': 'OH' });
    const matching = SIZE_CLASSES.filter((c) => matchesSizeClass(r, c.key));
    assert.deepEqual(
      matching.map((c) => c.key),
      [expected],
      `size ${size}`
    );
  }
});

test('casing sizes land in their CH family', () => {
  const cases: [number | string, string][] = [
    [4.5, 'ch-small'],
    [5.5, 'ch-small'],
    [7, 'ch-7'],
    [8.5, 'ch-7'],
    [9.625, 'ch-95'],
    [9.875, 'ch-95'],
    [10.75, 'ch-large'],
    [13.375, 'ch-large'],
  ];
  for (const [size, expected] of cases) {
    const r = rec({ 'Bit size / Csg size [inches]': size, 'Open Hole /Cased Hole': 'CH' });
    const matching = SIZE_CLASSES.filter((c) => matchesSizeClass(r, c.key));
    assert.deepEqual(
      matching.map((c) => c.key),
      [expected],
      `size ${size}`
    );
  }
});

test('a size class only matches its own hole type — the interlink', () => {
  const openHole85 = rec({ 'Bit size / Csg size [inches]': 8.5, 'Open Hole /Cased Hole': 'OH' });
  assert.equal(matchesSizeClass(openHole85, 'oh-85'), true);
  assert.equal(matchesSizeClass(openHole85, 'ch-7'), false); // 8.5 is in ch-7's range, wrong hole
  const casedHole85 = rec({ 'Bit size / Csg size [inches]': 8.5, 'Open Hole /Cased Hole': 'CH' });
  assert.equal(matchesSizeClass(casedHole85, 'ch-7'), true);
  assert.equal(matchesSizeClass(casedHole85, 'oh-85'), false);
});

test('tapered/combined strings match every family they touch', () => {
  const tapered = rec({
    'Bit size / Csg size [inches]': '7/9.625',
    'Open Hole /Cased Hole': 'CH',
  });
  assert.deepEqual(sizeComponents(tapered), [7, 9.625]);
  assert.equal(matchesSizeClass(tapered, 'ch-7'), true);
  assert.equal(matchesSizeClass(tapered, 'ch-95'), true);
  assert.equal(matchesSizeClass(tapered, 'ch-small'), false);
  const combined = rec({
    'Bit size / Csg size [inches]': '4.5 & 5.5',
    'Open Hole /Cased Hole': 'CH',
  });
  assert.deepEqual(sizeComponents(combined), [4.5, 5.5]);
  assert.equal(matchesSizeClass(combined, 'ch-small'), true);
});

// ── filterRecords ────────────────────────────────────────────────────────

const SAMPLE: JobRecord[] = [
  rec({ Country: 'Kuwait', Mud: 'SOBM', Deviation: 10, 'Open Hole /Cased Hole': 'OH' }),
  rec({ Country: 'Oman', Mud: 'WBM', Deviation: 65, 'Open Hole /Cased Hole': 'OH' }),
  rec({
    Country: 'Norway',
    Mud: 'WBM',
    Deviation: 92,
    'Open Hole /Cased Hole': 'CH',
    'Bit size / Csg size [inches]': '7/9.625',
  }),
  rec({ Country: 'Brazil', Mud: 'OBM', Deviation: '', 'Bit size / Csg size [inches]': 12.25 }),
];

test('no active filters returns the input array identity', () => {
  assert.equal(filterRecords(SAMPLE, NO_ADVANCED_FILTERS), SAMPLE);
  assert.equal(hasActiveFilters(NO_ADVANCED_FILTERS), false);
});

test('single-dimension filters narrow, OR within the dimension', () => {
  const wbm = filterRecords(SAMPLE, { ...NO_ADVANCED_FILTERS, muds: ['WBM'] });
  assert.deepEqual(
    wbm.map((r) => r.Country),
    ['Oman', 'Norway']
  );
  const high = filterRecords(SAMPLE, {
    ...NO_ADVANCED_FILTERS,
    deviations: ['60-70', '80+'],
  });
  assert.deepEqual(
    high.map((r) => r.Country),
    ['Oman', 'Norway']
  );
});

test('dimensions AND together', () => {
  const out = filterRecords(SAMPLE, {
    ...NO_ADVANCED_FILTERS,
    muds: ['WBM'],
    holes: ['CH'],
  });
  assert.deepEqual(
    out.map((r) => r.Country),
    ['Norway']
  );
});

test('a record missing a constrained field is excluded, not assumed', () => {
  // Brazil has Deviation: '' — filtering by any deviation bucket drops it.
  const out = filterRecords(SAMPLE, { ...NO_ADVANCED_FILTERS, deviations: ['0-30'] });
  assert.deepEqual(
    out.map((r) => r.Country),
    ['Kuwait']
  );
});

test('size classes filter with OR within the dimension', () => {
  const out = filterRecords(SAMPLE, {
    ...NO_ADVANCED_FILTERS,
    sizes: ['ch-95', 'oh-1225'],
  });
  // Norway's tapered casing hits ch-95; Brazil's 12.25 open hole hits oh-1225.
  assert.deepEqual(
    out.map((r) => r.Country),
    ['Norway', 'Brazil']
  );
});

test('pruneSizesForHoles drops size classes the hole selection hides', () => {
  const f = { ...NO_ADVANCED_FILTERS, holes: ['CH'], sizes: ['oh-85', 'ch-95'] };
  assert.deepEqual(pruneSizesForHoles(f).sizes, ['ch-95']);
  const untouched = { ...NO_ADVANCED_FILTERS, sizes: ['oh-85', 'ch-95'] };
  assert.equal(pruneSizesForHoles(untouched), untouched); // no holes = keep identity
});

// ── options builders ─────────────────────────────────────────────────────

test('mudOptions keeps the frequency order SOBM, WBM, OBM', () => {
  assert.deepEqual(mudOptions(SAMPLE), ['SOBM', 'WBM', 'OBM']);
});
