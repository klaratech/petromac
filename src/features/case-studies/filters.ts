import type { CaseStudy } from './content';

/**
 * Filtering for the /case-studies browser. Pure, so it can be tested
 * headlessly and reused by the kiosk in phase 2 (when the CH lane's Case
 * Studies takeover moves off the flipbook).
 */

export interface CaseStudyQuery {
  text?: string;
  region?: string;
  category?: string;
  device?: string;
}

/**
 * `tags.csv` has "Well Access:Deviation" (4 stories) alongside
 * "Well Access: Deviation" (17) — the same category split by a missing space,
 * which would otherwise render as two separate filter options. Normalising
 * here keeps the UI honest; the underlying CSV typo is worth fixing at source.
 */
export function normalizeCategory(raw: string): string {
  return raw.replace(/:\s*/g, ': ').replace(/\s+/g, ' ').trim();
}

export function caseStudyCategories(cs: CaseStudy): string[] {
  return cs.categories.map(normalizeCategory).filter(Boolean);
}

/** Distinct values with counts, most common first — drives the filter options. */
function tally(values: string[]): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue; // a couple of stories have an empty device
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function buildCaseStudyOptions(studies: CaseStudy[]) {
  return {
    regions: tally(studies.map((s) => s.region)),
    categories: tally(studies.flatMap(caseStudyCategories)),
    devices: tally(studies.map((s) => s.device)),
  };
}

/** Free-text haystack: title, place, product, company, categories, narrative. */
function haystack(cs: CaseStudy): string {
  return [
    cs.title,
    cs.country,
    cs.region,
    cs.device,
    cs.wirelineCompany,
    ...caseStudyCategories(cs),
    ...cs.challenge,
    ...cs.solution,
    ...cs.results,
    ...cs.narrative,
  ]
    .join(' ')
    .toLowerCase();
}

export function filterCaseStudies(studies: CaseStudy[], query: CaseStudyQuery): CaseStudy[] {
  const text = query.text?.trim().toLowerCase() ?? '';
  // Every whitespace-separated term must appear somewhere — same semantics as
  // the catalog search, so the two behave alike.
  const terms = text.length >= 2 ? text.split(/\s+/) : [];

  return studies.filter((cs) => {
    if (query.region && cs.region !== query.region) return false;
    if (query.device && cs.device !== query.device) return false;
    if (query.category && !caseStudyCategories(cs).includes(query.category)) return false;
    if (terms.length > 0) {
      const hay = haystack(cs);
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

export function isQueryActive(query: CaseStudyQuery): boolean {
  return Boolean(
    (query.text && query.text.trim() !== '') || query.region || query.category || query.device
  );
}

/**
 * Flipbook page numbers for a set of studies, ascending — exactly what
 * `/api/pdf/success-stories` wants, so the filtered download/email survives
 * the flipbook viewer's retirement.
 */
export function pageNumbersFor(studies: CaseStudy[]): number[] {
  return [...new Set(studies.map((s) => s.page))].sort((a, b) => a - b);
}
