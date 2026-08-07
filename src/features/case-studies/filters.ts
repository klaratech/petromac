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
  /** A code from SERVICE_COMPANIES, or OTHER_COMPANY. */
  company?: string;
}

/**
 * Service company filter. The `WL Co` column holds SLB / HAL / BHI plus the
 * occasional one-off (Geoplex today), so the majors get named options and
 * everything else falls under "Other" — otherwise the dropdown grows a
 * single-story entry every time an unusual operator appears.
 */
export const OTHER_COMPANY = '__other__';

export const SERVICE_COMPANIES: { code: string; label: string }[] = [
  { code: 'SLB', label: 'SLB' },
  { code: 'HAL', label: 'Halliburton' },
  { code: 'BHI', label: 'Baker Hughes' },
];

const MAJOR_CODES = SERVICE_COMPANIES.map((c) => c.code);

export function isMajorServiceCompany(raw: string): boolean {
  return MAJOR_CODES.includes(raw.trim().toUpperCase());
}

function matchesCompany(cs: CaseStudy, company: string): boolean {
  const value = cs.wirelineCompany.trim().toUpperCase();
  if (company === OTHER_COMPANY) return value !== '' && !MAJOR_CODES.includes(value);
  return value === company.trim().toUpperCase();
}

/**
 * Whitespace-canonical form of a category, and the value everything else keys
 * off. `tags.csv` once had "Well Access:Deviation" alongside
 * "Well Access: Deviation" — the same category split by a missing space, which
 * rendered as two separate filter options. That typo was fixed at source (Jul
 * 2026), so this is now belt-and-braces: a future PDF edition can reintroduce
 * it, and a duplicate filter option is a silent, easy-to-miss regression.
 */
export function normalizeCategory(raw: string): string {
  return raw.replace(/:\s*/g, ': ').replace(/\s+/g, ' ').trim();
}

/**
 * How a category is SHOWN. The taxonomy nests siblings under a "Well Access:"
 * prefix ("Well Access: Deviation", "Well Access: Ledges"), which is useful
 * structure in the CSV but noise on screen — three options sharing eleven
 * leading characters are harder to scan than "Deviation" and "Ledges", and the
 * prefix eats width in a badge that has to sit next to a country and a product.
 *
 * Display only: `normalizeCategory()` output stays the filter key, so the one
 * story tagged bare "Well Access" keeps its own distinct option instead of
 * collapsing into a sibling — which is exactly why the prefix can't simply be
 * stripped from the data.
 */
export function categoryLabel(raw: string): string {
  const normalized = normalizeCategory(raw);
  // Only strip when something survives: a hypothetical bare "Well Access:"
  // must not render as an empty badge.
  return normalized.replace(/^Well Access:\s*(?=\S)/, '');
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
    companies: buildCompanyOptions(studies),
  };
}

/**
 * Show the filtered story count on the Download and Email action buttons.
 *
 * ON (Rajesh, 7 Aug 2026 — flipped after seeing the faceted dropdowns live).
 * Set to `false` and the count disappears from BOTH buttons on BOTH surfaces
 * at once; that is the whole point of the switch, and it was off for a day
 * while the page was reviewed.
 *
 * It lives here, next to the filtering logic, precisely so it cannot be
 * half-applied: the live browser and the preview route both render the same
 * two buttons, and the bug Martin found was exactly this kind of drift
 * (Download carried the number, Email did not).
 *
 * Typed `boolean` rather than inferred as `false` so the on-branch still
 * typechecks and neither branch reads as dead code.
 */
export const SHOW_FILTERED_COUNT_ON_ACTIONS: boolean = true;

/**
 * Label for a Download/Email action button. `all` always marks the unfiltered
 * set — that distinction is worth keeping whether or not counts are shown —
 * and the number appears only when the switch above is on:
 *
 *   unfiltered          -> "Download all"  / "Email all"
 *   filtered, count off -> "Download"      / "Email"
 *   filtered, count on  -> "Download 16"   / "Email 16"
 */
export function actionButtonLabel(verb: string, active: boolean, count: number): string {
  if (!active) return `${verb} all`;
  return SHOW_FILTERED_COUNT_ON_ACTIONS ? `${verb} ${count}` : verb;
}

/** Which filter a facet owns — used to exclude it from its own counts. */
type Facet = 'region' | 'category' | 'device' | 'company';

/**
 * The query as it applies to ONE facet: every other active filter, minus the
 * facet's own selection. That self-exclusion is what keeps a dropdown usable
 * once you have chosen from it — count Region against the Region selection and
 * every region except the chosen one reads 0, so you could never see where
 * else to go. Free text is always included: it filters the cards, so it must
 * filter the counts, or the two disagree on screen.
 */
function queryExcluding(query: CaseStudyQuery, facet: Facet): CaseStudyQuery {
  const rest: CaseStudyQuery = { ...query };
  delete rest[facet];
  return rest;
}

/**
 * Filter options whose COUNTS reflect the current selection, while their
 * ORDER and MEMBERSHIP stay fixed.
 *
 * Reported by Martin (Aug 2026): picking MENA (16) still showed Challenges
 * (21) and SLB (36) — totals from the whole 46-story set, which cannot be
 * right inside a 16-story subset.
 *
 * Two deliberate choices beyond the arithmetic:
 *
 * 1. Options are never dropped. A combination with nothing in it renders as
 *    `Rocker (0)`, disabled, rather than vanishing — a list that reshuffles
 *    and loses entries as you filter is harder to use than one that stays put
 *    and tells you a dead end is a dead end.
 * 2. Order comes from the UNFILTERED tally (most common first), not the live
 *    counts, so options hold their position while the numbers move under them.
 *
 * Every count is therefore <= the current result count, which is what Martin
 * asked for.
 */
export function buildFacetedCaseStudyOptions(studies: CaseStudy[], query: CaseStudyQuery) {
  const base = buildCaseStudyOptions(studies);

  /** Re-count `base` options against everything except their own facet. */
  const recount = <T extends { value: string; count: number }>(
    options: T[],
    facet: Facet,
    // Underscored because these name a TYPE's parameters, not bindings: the
    // base no-unused-vars rule reads a function-type annotation as a real
    // signature and flags them, and `/^_/u` is the escape hatch it allows.
    countIn: (_subset: CaseStudy[], _value: string) => number
  ): T[] => {
    const subset = filterCaseStudies(studies, queryExcluding(query, facet));
    return options.map((o) => ({ ...o, count: countIn(subset, o.value) }));
  };

  return {
    regions: recount(base.regions, 'region', (subset, value) =>
      subset.filter((s) => s.region === value).length
    ),
    categories: recount(base.categories, 'category', (subset, value) =>
      subset.filter((s) => caseStudyCategories(s).includes(value)).length
    ),
    devices: recount(base.devices, 'device', (subset, value) =>
      subset.filter((s) => s.device === value).length
    ),
    companies: recount(base.companies, 'company', (subset, value) =>
      subset.filter((s) => matchesCompany(s, value)).length
    ),
  };
}

/** Named majors that actually appear, then "Other" if anything else does. */
export function buildCompanyOptions(
  studies: CaseStudy[]
): { value: string; label: string; count: number }[] {
  const options = SERVICE_COMPANIES.map(({ code, label }) => ({
    value: code,
    label,
    count: studies.filter((s) => matchesCompany(s, code)).length,
  })).filter((o) => o.count > 0);

  const otherCount = studies.filter((s) => matchesCompany(s, OTHER_COMPANY)).length;
  if (otherCount > 0) {
    options.push({ value: OTHER_COMPANY, label: 'Other', count: otherCount });
  }
  return options;
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
    if (query.company && !matchesCompany(cs, query.company)) return false;
    if (terms.length > 0) {
      const hay = haystack(cs);
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

export function isQueryActive(query: CaseStudyQuery): boolean {
  return Boolean(
    (query.text && query.text.trim() !== '') ||
    query.region ||
    query.category ||
    query.device ||
    query.company
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
