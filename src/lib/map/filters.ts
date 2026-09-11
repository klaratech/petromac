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
  /** Selected size-class keys (see SIZE_CLASSES); [] = any. */
  sizes: string[];
}

export const NO_ADVANCED_FILTERS: AdvancedFilters = {
  deviations: [],
  muds: [],
  holes: [],
  sizes: [],
};

export interface DeviationBucket {
  key: string;
  label: string;
  /** [min, max) in degrees; max = Infinity for the open-ended bucket. */
  min: number;
  max: number;
}

/** The source keeps 0° for vertical wells, which lands in the first
 *  bucket. High deviation is where Petromac's story lives, so that end
 *  is split finer (Rajesh, Sep 2026): 60–70 / 70–80 / 80+. */
export const DEVIATION_BUCKETS: DeviationBucket[] = [
  { key: '0-30', label: '0–30°', min: 0, max: 30 },
  { key: '30-60', label: '30–60°', min: 30, max: 60 },
  { key: '60-70', label: '60–70°', min: 60, max: 70 },
  { key: '70-80', label: '70–80°', min: 70, max: 80 },
  { key: '80+', label: '80°+', min: 80, max: Infinity },
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

export interface SizeClass {
  key: string;
  label: string;
  /** Which hole type this class belongs to — a bit size only means
   *  anything in open hole, a casing size only in cased hole. Selecting
   *  a class therefore implies its hole type, which is what makes the
   *  hole chips and the size chips interlock. */
  hole: 'OH' | 'CH';
  /** [min, max) in inches, tested against every size component. */
  min: number;
  max: number;
}

/**
 * Size classes instead of the raw 58 distinct values (Rajesh, Sep 2026).
 * Open hole clusters around the standard bit programme — the slim
 * 5-7/8–6-1/2 family, the 8-1/2 class with its adjacent sizes, the
 * 12-1/4 class, and the big tophole bits — and everything else in the
 * column is a casing OD. Boundaries sit in the gaps between families so
 * every size in the dataset lands in exactly one class per hole type.
 */
export const SIZE_CLASSES: SizeClass[] = [
  { key: 'oh-slim', label: '≤ 6-3/4″', hole: 'OH', min: 0, max: 6.9 },
  { key: 'oh-85', label: '7″ – 9-7/8″', hole: 'OH', min: 6.9, max: 10 },
  { key: 'oh-1225', label: '10″ – 13-3/8″', hole: 'OH', min: 10, max: 13.45 },
  { key: 'oh-large', label: '≥ 13-1/2″', hole: 'OH', min: 13.45, max: Infinity },
  { key: 'ch-small', label: '≤ 5-1/2″', hole: 'CH', min: 0, max: 6 },
  { key: 'ch-7', label: '7″ – 8-5/8″', hole: 'CH', min: 6, max: 9.4 },
  { key: 'ch-95', label: '9-5/8″ – 9-7/8″', hole: 'CH', min: 9.4, max: 10.5 },
  { key: 'ch-large', label: '≥ 10-3/4″', hole: 'CH', min: 10.5, max: Infinity },
];

const SIZE_CLASS_BY_KEY = new Map(SIZE_CLASSES.map((c) => [c.key, c]));

/** Numeric components of a record's size — "8.5" → [8.5]; a tapered or
 *  combined string like "7/9.625" or "4.5 & 5.5" → both numbers. */
export function sizeComponents(record: JobRecord): number[] {
  const raw = record['Bit size / Csg size [inches]'];
  if (raw === undefined || raw === null || raw === '') return [];
  return String(raw)
    .split(/[/&]/)
    .map((piece) => Number(piece.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/** A record matches a class when its hole type agrees AND any of its
 *  size components falls in the class range — so a tapered 7″ × 9-5/8″
 *  completion counts for both families it touches. */
export function matchesSizeClass(record: JobRecord, classKey: string): boolean {
  const cls = SIZE_CLASS_BY_KEY.get(classKey);
  if (!cls) return false;
  if ((record['Open Hole /Cased Hole'] ?? '').trim() !== cls.hole) return false;
  return sizeComponents(record).some((n) => n >= cls.min && n < cls.max);
}

/** Drop selected size classes whose hole type the hole selection now
 *  excludes — the UI hides those chips, and a hidden active filter would
 *  silently zero the map. No hole selected = both types allowed. */
export function pruneSizesForHoles(f: AdvancedFilters): AdvancedFilters {
  if (f.holes.length === 0) return f;
  const sizes = f.sizes.filter((key) => {
    const cls = SIZE_CLASS_BY_KEY.get(key);
    return cls !== undefined && f.holes.includes(cls.hole);
  });
  return sizes.length === f.sizes.length ? f : { ...f, sizes };
}

export function hasActiveFilters(f: AdvancedFilters): boolean {
  return f.deviations.length > 0 || f.muds.length > 0 || f.holes.length > 0 || f.sizes.length > 0;
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
    if (f.sizes.length > 0 && !f.sizes.some((key) => matchesSizeClass(r, key))) return false;
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
