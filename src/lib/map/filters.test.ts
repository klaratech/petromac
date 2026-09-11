import assert from 'node:assert/strict';
import test from 'node:test';
import type { JobRecord } from '@/types/JobRecord';
import {
  DEVIATION_BUCKETS,
  NO_ADVANCED_FILTERS,
  deviationBucketOf,
  filterRecords,
  formatInches,
  hasActiveFilters,
  mudOptions,
  sizeKey,
  sizeOptions,
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

test('deviation buckets cover 0° (vertical) through 90°+ with no gaps', () => {
  assert.equal(deviationBucketOf(rec({ Deviation: 0 })), '0-30');
  assert.equal(deviationBucketOf(rec({ Deviation: 29.9 })), '0-30');
  assert.equal(deviationBucketOf(rec({ Deviation: 30 })), '30-60');
  assert.equal(deviationBucketOf(rec({ Deviation: 60 })), '60-90');
  assert.equal(deviationBucketOf(rec({ Deviation: 90 })), '90+');
  assert.equal(deviationBucketOf(rec({ Deviation: 104 })), '90+');
});

test('deviation accepts numeric strings and rejects blanks/garbage', () => {
  assert.equal(deviationBucketOf(rec({ Deviation: '55' })), '30-60');
  assert.equal(deviationBucketOf(rec({ Deviation: '' })), null);
  const withoutDeviation = rec({});
  delete withoutDeviation.Deviation;
  assert.equal(deviationBucketOf(withoutDeviation), null);
  assert.equal(deviationBucketOf(rec({ Deviation: 'n/a' })), null);
});

test('every bucket key is unique (they are filter state keys)', () => {
  const keys = DEVIATION_BUCKETS.map((b) => b.key);
  assert.equal(new Set(keys).size, keys.length);
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
  const highOrHorizontal = filterRecords(SAMPLE, {
    ...NO_ADVANCED_FILTERS,
    deviations: ['60-90', '90+'],
  });
  assert.deepEqual(
    highOrHorizontal.map((r) => r.Country),
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

test('size filter matches composite values exactly', () => {
  const out = filterRecords(SAMPLE, { ...NO_ADVANCED_FILTERS, size: '7/9.625' });
  assert.deepEqual(
    out.map((r) => r.Country),
    ['Norway']
  );
  assert.equal(sizeKey(SAMPLE[3]), '12.25');
});

// ── options builders ─────────────────────────────────────────────────────

test('mudOptions keeps the frequency order SOBM, WBM, OBM', () => {
  assert.deepEqual(mudOptions(SAMPLE), ['SOBM', 'WBM', 'OBM']);
});

test('sizeOptions sorts numerically and labels with fractions', () => {
  const opts = sizeOptions(SAMPLE);
  assert.deepEqual(
    opts.map((o) => o.key),
    ['7/9.625', '8.5', '12.25']
  );
  assert.deepEqual(
    opts.map((o) => o.label),
    ['7" / 9-5/8"', '8-1/2"', '12-1/4"']
  );
});

// ── fraction formatting ──────────────────────────────────────────────────

test('formatInches renders the catalog spellings', () => {
  assert.equal(formatInches('8.5'), '8-1/2"');
  assert.equal(formatInches('12.25'), '12-1/4"');
  assert.equal(formatInches('9.625'), '9-5/8"');
  assert.equal(formatInches('5.875'), '5-7/8"');
  assert.equal(formatInches('6'), '6"');
  assert.equal(formatInches('6.125'), '6-1/8"');
  assert.equal(formatInches('17.5'), '17-1/2"');
});

test('formatInches leaves non-sixteenth decimals as decimals', () => {
  assert.equal(formatInches('8.7'), '8.7"');
});
