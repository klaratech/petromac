import type { JobRecord } from '@/types/JobRecord';

/**
 * Advanced record filters for the public Track Record page (Sep 2026):
 * deviation group, mud type, open/cased hole, and bit/casing size. Pure
 * functions over the slim operations records so the page can pre-filter
 * BEFORE the map / counter / sparkline aggregate — DrilldownMapCore and
 * cumulativeDeploymentsByYear stay untouched and every surface keeps the
 * same counting semantics.
 *
 * Selection semantics differ from the system chips on purpose: systems
 * default to ALL-selected and toggling OFF hides one, while an advanced
 * dimension with NOTHING selected applies no constraint at all. That is
 * the conventional "narrow down" pattern for advanced filters, and it
 * means the default state shows the full dataset either way.
 */

export interface AdvancedFilters {
  /** Selected deviation bucket keys (see DEVIATION_BUCKETS); [] = any. */
  deviations: string[];
  /** Selected Mud values, e.g. ["SOBM"]; [] = any. */
  muds: string[];
  /** Selected hole types ("OH" / "CH"); [] = any. */
  holes: string[];
  /** Selected size key (see sizeKey) or null = any. */
  size: string | null;
}

export const NO_ADVANCED_FILTERS: AdvancedFilters = {
  deviations: [],
  muds: [],
  holes: [],
  size: null,
};

export interface DeviationBucket {
  key: string;
  label: string;
  /** [min, max) in degrees; max = Infinity for the open-ended bucket. */
  min: number;
  max: number;
}

/** Buckets follow the industry's usual coarse bands. The source keeps 0°
 *  for vertical wells, which lands in the first bucket. */
export const DEVIATION_BUCKETS: DeviationBucket[] = [
  { key: '0-30', label: '0–30°', min: 0, max: 30 },
  { key: '30-60', label: '30–60°', min: 30, max: 60 },
  { key: '60-90', label: '60–90°', min: 60, max: 90 },
  { key: '90+', label: '90°+', min: 90, max: Infinity },
];

/** Mud display order — by frequency in the dataset. */
export const MUD_ORDER = ['SOBM', 'WBM', 'OBM'];

export const HOLE_LABELS: Record<string, string> = {
  OH: 'Open hole',
  CH: 'Cased hole',
};

export function deviationBucketOf(record: JobRecord): string | null {
  const raw = record.Deviation;
  if (raw === undefined || raw === null || raw === '') return null;
  const deg = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(deg)) return null;
  const bucket = DEVIATION_BUCKETS.find((b) => deg >= b.min && deg < b.max);
  return bucket ? bucket.key : null;
}

/** Canonical string key for a record's bit/casing size — matches the keys
 *  sizeOptions() emits ("8.5", "6", "7/9.625"). */
export function sizeKey(record: JobRecord): string | null {
  const raw = record['Bit size / Csg size [inches]'];
  if (raw === undefined || raw === null || raw === '') return null;
  return String(raw).trim();
}

export function hasActiveFilters(f: AdvancedFilters): boolean {
  return f.deviations.length > 0 || f.muds.length > 0 || f.holes.length > 0 || f.size !== null;
}

/**
 * Apply the advanced filters: AND across dimensions, OR within one.
 * Records missing a constrained field are excluded — a filter that can't
 * see a value can't claim the record matches it. Returns the input array
 * identity when nothing is active, so memoized consumers don't re-run.
 */
export function filterRecords(records: JobRecord[], f: AdvancedFilters): JobRecord[] {
  if (!hasActiveFilters(f)) return records;
  return records.filter((r) => {
    if (f.deviations.length > 0) {
      const bucket = deviationBucketOf(r);
      if (!bucket || !f.deviations.includes(bucket)) return false;
    }
    if (f.muds.length > 0) {
      const mud = (r.Mud ?? '').trim();
      if (!f.muds.includes(mud)) return false;
    }
    if (f.holes.length > 0) {
      const hole = (r['Open Hole /Cased Hole'] ?? '').trim();
      if (!f.holes.includes(hole)) return false;
    }
    if (f.size !== null && sizeKey(r) !== f.size) return false;
    return true;
  });
}

/** Mud values present in the data, in MUD_ORDER (unknown ones appended). */
export function mudOptions(records: JobRecord[]): string[] {
  const found = new Set<string>();
  for (const r of records) {
    const mud = (r.Mud ?? '').trim();
    if (mud) found.add(mud);
  }
  return [
    ...MUD_ORDER.filter((m) => found.has(m)),
    ...[...found].filter((m) => !MUD_ORDER.includes(m)).sort(),
  ];
}

/**
 * Distinct bit/casing sizes in the data, ascending by their first numeric
 * component (so "7/9.625" sorts with the 7s). Each option carries the
 * catalog-style fraction label ("8-1/2\"").
 */
export function sizeOptions(records: JobRecord[]): { key: string; label: string }[] {
  const found = new Set<string>();
  for (const r of records) {
    const key = sizeKey(r);
    if (key) found.add(key);
  }
  return [...found]
    .map((key) => ({ key, sort: parseFloat(key) }))
    .filter(({ sort }) => Number.isFinite(sort))
    .sort((a, b) => a.sort - b.sort || a.key.localeCompare(b.key))
    .map(({ key }) => ({ key, label: formatInches(key) }));
}

// Sixteenths cover every fraction the drilling world prints (1/2, 1/4,
// 3/8, 5/8, 7/8, 15/16…). Anything that isn't a clean sixteenth stays
// decimal rather than pretending to a fraction it isn't.
function formatOneSize(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  const whole = Math.floor(num);
  const frac = num - whole;
  if (frac === 0) return String(whole);
  const sixteenths = frac * 16;
  if (Math.abs(sixteenths - Math.round(sixteenths)) > 1e-9) return String(num);
  let n = Math.round(sixteenths);
  let d = 16;
  while (n % 2 === 0) {
    n /= 2;
    d /= 2;
  }
  return whole > 0 ? `${whole}-${n}/${d}` : `${n}/${d}`;
}

/** "8.5" → "8-1/2\"" · "12.25" → "12-1/4\"" · "7/9.625" → "7\" / 9-5/8\""
 *  (the column stores composite runs with "/"; sizes themselves are
 *  decimal, so every "/" is a separator). */
export function formatInches(key: string): string {
  return key
    .split('/')
    .map((piece) => `${formatOneSize(piece.trim())}"`)
    .join(' / ');
}
