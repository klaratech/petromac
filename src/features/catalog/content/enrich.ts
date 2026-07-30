/**
 * Website enrichment over the GENERATED catalog content.
 *
 * catalog.json is regenerated from the InDesign IDML on every edition
 * (docs/ADMIN.md §2b) and must never be hand-edited — so everything the
 * website adds on top (vendor grouping, finder purposes, parsed numeric
 * specs, table roles) lives here, keyed by slug, and survives regeneration.
 *
 * Graceful updates: a NEW product in a future edition simply won't have a
 * curation entry — it gets safe defaults (purpose derived from its
 * category, no vendor) and a build-time console warning listing the slugs
 * that need a curation row added below.
 */

import type { CatalogProduct } from './types';
import { allProducts, categories, productHref } from './index';

export type Vendor = 'slb' | 'halliburton' | 'baker-hughes' | 'universal';
export type Purpose =
  | 'orient'
  | 'convey'
  | 'centralise'
  | 'formation-testing'
  | 'well-access'
  | 'intervention';

export const PURPOSE_LABELS: Record<Purpose, string> = {
  orient: 'Orient',
  convey: 'Convey',
  centralise: 'Centralise',
  'formation-testing': 'Formation testing',
  'well-access': 'Well access',
  intervention: 'Well intervention',
};

interface CurationEntry {
  purpose: Purpose;
  /** Vendor section on the guides family page (PDF TOC grouping). */
  vendor?: Vendor;
  /** Role column in the unified tool-taxi table. */
  role?: string;
}

/** Slug-keyed website curation. Vendor mapping verified against the PDF
 *  TOC (docs/plans/CATALOG_RESTRUCTURE.md, Phase 0). */
const CURATION: Record<string, CurationEntry> = {
  // tool-taxis
  'tta-505-ttb-505': { purpose: 'orient', role: 'Orient' },
  'tta-515-ttb-515': { purpose: 'convey', role: 'Convey' },
  'ttb-715': { purpose: 'convey', role: 'Convey' },
  'ttb-x-515': { purpose: 'centralise', role: 'Centre' },
  'ttb-s75-ttb-s85': { purpose: 'formation-testing', role: 'Formation testing' },
  'ttb-s75u-ttb-s85': { purpose: 'formation-testing', role: 'Formation testing' },
  'ttb-ttc-il6o': { purpose: 'orient', role: 'In-line orient' },
  'ttb-il6c': { purpose: 'convey', role: 'In-line convey' },
  // guides & holefinders
  pathfinder: { purpose: 'well-access', vendor: 'universal' },
  'pathfinder-ht': { purpose: 'well-access', vendor: 'universal' },
  ahfc: { purpose: 'well-access', vendor: 'slb' },
  'hf-ait-zait': { purpose: 'well-access', vendor: 'slb' },
  'shf-ait': { purpose: 'well-access', vendor: 'slb' },
  'hf-qait': { purpose: 'well-access', vendor: 'slb' },
  'hf-fmi': { purpose: 'well-access', vendor: 'slb' },
  'shf-fmi': { purpose: 'well-access', vendor: 'slb' },
  'hf8-msct': { purpose: 'well-access', vendor: 'slb' },
  'hf6-mdt': { purpose: 'well-access', vendor: 'slb' },
  'hf9-bn6': { purpose: 'well-access', vendor: 'slb' },
  hf9j: { purpose: 'well-access', vendor: 'halliburton' },
  'hf9-acrt': { purpose: 'well-access', vendor: 'halliburton' },
  'hf-b-wts': { purpose: 'well-access', vendor: 'baker-hughes' },
  // focus-centralisers
  cp12: { purpose: 'centralise' },
  cp8: { purpose: 'centralise' },
  ca7: { purpose: 'centralise' },
  cril: { purpose: 'centralise' },
  cru: { purpose: 'centralise' },
  cx9: { purpose: 'centralise' },
  // well-intervention
  rs7: { purpose: 'intervention' },
  ro17: { purpose: 'intervention' },
  'twt-28': { purpose: 'intervention' },
  'tws-30': { purpose: 'intervention' },
};

/** Custom SEO page titles for catalog products (un-branded; suffix ' | Petromac' added by root layout). */
export const PRODUCT_TITLES: Record<string, string> = {
  // tool-taxis
  'tta-505-ttb-505': 'Orienting Tool Taxis / Rollers — High Deviation',
  'tta-515-ttb-515': 'Conveyance Tool Taxi — Sticking Prevention',
  'ttb-715': 'TTB-715 Tool Taxi — Sticking Prevention',
  'ttb-x-515': 'Centering Tool Taxi — Wellbore Centralisation',
  'ttb-s75-ttb-s85': 'Formation Testing Wheels & Rollers',
  'ttb-s75u-ttb-s85': 'HPHT Formation Testing Wheels & Rollers',
  'ttb-ttc-il6o': 'Orienting Inline Wheels for Slim Open Hole — SLB',
  'ttb-il6c': 'Conveyance Inline Wheels for Slim Open Hole — SLB',
  // guides & holefinders
  pathfinder: 'Pathfinder Hole Finder — Universal Guide',
  'pathfinder-ht': 'Pathfinder HT HPHT Hole Finder — Universal Guide',
  ahfc: 'AHFC Adjustable Angle Hole Finder — Ledges (SLB)',
  'hf-ait-zait': 'AIT & ZAIT Hole Finder — Fixed Angle Guide (SLB)',
  'shf-ait': 'SHF-AIT Slim Hole Finder for AIT (SLB)',
  'hf-qait': 'QAIT Hole Finder — Fixed Angle Guide (SLB)',
  'hf-fmi': 'FMI Hole Finder — Fixed Angle Guide (SLB)',
  'shf-fmi': 'SHF-FMI Slim Hole Finder for FMI (SLB)',
  'hf8-msct': 'MSCT / XL-Rock Hole Finder — Sidewall Coring (SLB)',
  'hf6-mdt': 'HF6-MDT MDT Hole Finder for Formation Testers (SLB)',
  'hf9-bn6': 'HF9-BN6 Fixed Angle Hole Finder (SLB)',
  hf9j: 'J-Latch Hole Finder HF9J (Halliburton)',
  'hf9-acrt': 'HF9-ACRt Induction Hole Finder (Halliburton)',
  'hf-b-wts': 'WTS Connection Hole Finder Guide (BHI)',
  // well-intervention
  rs7: 'RS7 Roller Standoff — 7in CBL-VDL',
  ro17: 'RO17 Roller Slip-over for 1-11/16in Toolstrings',
  'twt-28': 'TWT-28 Titan Weight Bar Rollers / Wheels',
  'tws-30': 'TWS-30 Taxi Weight Bar Rollers — SLB Intervention',
};

/** Category fallback purposes for products missing a curation entry
 *  (future editions). */
const CATEGORY_DEFAULT_PURPOSE: Record<string, Purpose> = {
  'tool-taxis': 'convey',
  'guides-holefinders': 'well-access',
  'focus-centralisers': 'centralise',
  'well-intervention': 'intervention',
};

/** Parsed values the spec parser can't derive; verified against the PDF.
 *  Keep this list SHORT — prefer fixing the parser. */
const PARSE_OVERRIDES: Record<string, Partial<ParsedSpecs>> = {
  // Continuation rows with empty labels / composite casing strings the
  // parser can't attribute — values verified against the PDF spec tables.
  cp12: { holeMinIn: 10.125, holeMaxIn: 17.5 }, // min CH 10-1/8"; bit sizes to 17-1/2"
  cp8: { holeMinIn: 7.5, holeMaxIn: 8.5 }, // min CH 7-1/2"; for 8-1/2" boreholes
  ca7: { holeMinIn: 7, holeMaxIn: 7 }, // adjustable across 7" casing weights
  cx9: { holeMinIn: 7, holeMaxIn: 9.625 }, // adjustable 7" – 9-5/8" casing
  rs7: { holeMinIn: 7, holeMaxIn: 7 }, // Roller Standoff for 7" casing (no hole row in specs)
};

/* ------------------------------------------------------------------ */
/* Spec-string parsing                                                 */
/* ------------------------------------------------------------------ */

const VULGAR: Record<string, number> = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
};

/** All inch-ish measurements in a string: `12-1/4”`, `10-⅝"`, `4.44”`,
 *  `16”`, `9 5/8"`, plain `17.5`. Returns numbers (inches). */
const SUPER_SUB: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
  '⁄': '/',
};

export function parseInchValues(s: string): number[] {
  const out: number[] = [];
  // Normalize print typography: superscript/subscript digits and the
  // fraction slash (1-¹¹⁄₁₆” → 1-11/16”).
  let str = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁄]/g, (ch) => SUPER_SUB[ch] ?? ch);
  // mixed number with ascii fraction: 12-1/4 or 9 5/8
  const mixedAscii = /(\d+)[\s-]+(\d+)\s*\/\s*(\d+)/g;
  str = str.replace(mixedAscii, (_, a, b, c) => {
    out.push(Number(a) + Number(b) / Number(c));
    return ' ';
  });
  // bare ascii fraction: 3/8
  str = str.replace(/(\d+)\s*\/\s*(\d+)/g, (_, a, b) => {
    out.push(Number(a) / Number(b));
    return ' ';
  });
  // mixed number with vulgar fraction: 8-½ or 10⅝
  const vulgarClass = Object.keys(VULGAR).join('');
  const mixedVulgar = new RegExp(`(\\d+)[\\s-]*([${vulgarClass}])`, 'g');
  str = str.replace(mixedVulgar, (_, a, f) => {
    out.push(Number(a) + VULGAR[f]);
    return ' ';
  });
  // bare vulgar fraction
  str = str.replace(new RegExp(`[${vulgarClass}]`, 'g'), (f) => {
    out.push(VULGAR[f]);
    return ' ';
  });
  // decimals / integers
  str.replace(/(\d+(?:\.\d+)?)/g, (_, n) => {
    out.push(Number(n));
    return ' ';
  });
  return out.filter((n) => Number.isFinite(n));
}

export interface ParsedSpecs {
  holeMinIn?: number;
  holeMaxIn?: number;
  /** True when the catalog says "No limit" for max hole size. */
  holeNoLimit?: boolean;
  boreIn?: number;
  tempF?: number;
  weightLbs?: number;
}

function parseSpecs(p: CatalogProduct): ParsedSpecs {
  const parsed: ParsedSpecs = {};
  for (const table of p.specs) {
    for (const row of table.rows) {
      const label = row.label.trim().toLowerCase();
      const joined = row.values.join(' ');
      if (/^min(\.|imum)?\s*(hole|casing|restriction)\s*size/.test(label)) {
        const v = parseInchValues(joined);
        if (v.length) parsed.holeMinIn = Math.min(parsed.holeMinIn ?? Infinity, ...v);
      } else if (/^max(\.|imum)?\s*(hole|casing)\s*size/.test(label)) {
        if (/no\s*limit/i.test(joined)) parsed.holeNoLimit = true;
        const v = parseInchValues(joined);
        if (v.length) parsed.holeMaxIn = Math.max(parsed.holeMaxIn ?? -Infinity, ...v);
      } else if (/\bbore\b/.test(label)) {
        const v = parseInchValues(joined);
        if (v.length) parsed.boreIn = Math.max(parsed.boreIn ?? -Infinity, ...v);
      } else if (/^temperature/.test(label)) {
        const m = joined.match(/(\d+)\s*°?\s*F/);
        if (m) parsed.tempF = Math.max(parsed.tempF ?? -Infinity, Number(m[1]));
      } else if (/^weight/.test(label)) {
        const m = joined.match(/([\d.]+)\s*lb/i);
        if (m) parsed.weightLbs = Math.max(parsed.weightLbs ?? -Infinity, Number(m[1]));
      }
    }
  }
  return { ...parsed, ...PARSE_OVERRIDES[p.slug] };
}

/* ------------------------------------------------------------------ */
/* Display formatting                                                  */
/* ------------------------------------------------------------------ */

const SIXTEENTHS: [number, string][] = [
  [0, ''],
  [1, '-1/16'],
  [2, '-1/8'],
  [3, '-3/16'],
  [4, '-1/4'],
  [5, '-5/16'],
  [6, '-3/8'],
  [7, '-7/16'],
  [8, '-1/2'],
  [9, '-9/16'],
  [10, '-5/8'],
  [11, '-11/16'],
  [12, '-3/4'],
  [13, '-13/16'],
  [14, '-7/8'],
  [15, '-15/16'],
];

/** 10.625 → `10-5/8″`; falls back to decimals for non-sixteenth values. */
export function formatInches(n: number): string {
  const whole = Math.floor(n);
  const frac = n - whole;
  const sixteenth = Math.round(frac * 16);
  if (Math.abs(frac * 16 - sixteenth) < 0.01) {
    if (sixteenth === 16) return `${whole + 1}″`;
    const [, suffix] = SIXTEENTHS[sixteenth];
    return `${whole}${suffix}″`;
  }
  return `${n}″`;
}

export function formatHoleRange(p: ParsedSpecs): string {
  if (p.holeMinIn == null && p.holeMaxIn == null) return '—';
  const min = p.holeMinIn != null ? formatInches(p.holeMinIn) : '';
  if (p.holeNoLimit) return min ? `${min} +` : 'No limit';
  const max = p.holeMaxIn != null ? formatInches(p.holeMaxIn) : '';
  if (min && max) return min === max ? min : `${min} – ${max}`;
  return min || max || '—';
}

/* ------------------------------------------------------------------ */
/* Enriched products + accessors                                       */
/* ------------------------------------------------------------------ */

export interface EnrichedProduct extends CatalogProduct {
  purpose: Purpose;
  vendor?: Vendor;
  role?: string;
  /** Derived from model prefixes: TTA = Type A (carbide bearing),
   *  TTB = Type B (ball bearing). */
  bearing?: string;
  parsed: ParsedSpecs;
  href: string;
  /** Display group — maps well-intervention's empty group to "Accessories". */
  displayGroup: string;
}

function bearingFromModels(p: CatalogProduct): string | undefined {
  if (p.category !== 'tool-taxis') return undefined;
  const types: string[] = [];
  if (p.models.some((m) => m.startsWith('TTA'))) types.push('Type A (carbide)');
  if (p.models.some((m) => m.startsWith('TTB'))) types.push('Type B (ball)');
  return types.length ? types.join(' / ') : undefined;
}

const missingCuration: string[] = [];

export const enrichedProducts: EnrichedProduct[] = allProducts.map((p) => {
  const curation = CURATION[p.slug];
  if (!curation) missingCuration.push(p.slug);
  const bearing = bearingFromModels(p);
  return {
    ...p,
    purpose: curation?.purpose ?? CATEGORY_DEFAULT_PURPOSE[p.category] ?? 'convey',
    ...(curation?.vendor ? { vendor: curation.vendor } : {}),
    ...(curation?.role ? { role: curation.role } : {}),
    ...(bearing ? { bearing } : {}),
    parsed: parseSpecs(p),
    href: productHref(p),
    displayGroup: p.group || (p.category === 'well-intervention' ? 'Accessories' : ''),
  };
});

if (missingCuration.length > 0) {
  // Build-time nudge for future catalog editions: new devices work with
  // defaults but should get a curation row (vendor/purpose/role).
  console.warn(
    `[catalog enrich] ${missingCuration.length} product(s) missing curation ` +
      `(defaults applied): ${missingCuration.join(', ')} — add entries in enrich.ts`
  );
}

export function getEnriched(slug: string): EnrichedProduct | undefined {
  return enrichedProducts.find((p) => p.slug === slug);
}

export function enrichedInCategory(category: string): EnrichedProduct[] {
  return enrichedProducts.filter((p) => p.category === category);
}

export interface FamilySummary {
  slug: string;
  name: string;
  productLine: string;
  tagline: string;
  intro: string[];
  modelCount: number;
  productCount: number;
  groups: string[];
  href: string;
  /** Representative image (curated flagship, falls back to the family's
   *  first product gallery image). */
  image?: { src: string; width: number; height: number; alt: string };
}

/** Curated flagship product per family for the overview card image. */
const FAMILY_IMAGE_PICK: Record<string, string> = {
  'tool-taxis': 'tta-505-ttb-505',
  'guides-holefinders': 'pathfinder',
  'focus-centralisers': 'cx9',
  'well-intervention': 'rs7',
};

export function familySummaries(): FamilySummary[] {
  return categories.map((c) => {
    const products = enrichedInCategory(c.slug);
    const flagship = products.find((p) => p.slug === FAMILY_IMAGE_PICK[c.slug]) ?? products[0];
    const gallery = flagship?.images.find((i) => i.role === 'gallery' && !i.src.endsWith('.svg'));
    return {
      slug: c.slug,
      name: c.name,
      productLine: c.productLine,
      tagline: c.tagline,
      intro: c.intro,
      modelCount: products.reduce((n, p) => n + p.models.length, 0),
      productCount: products.length,
      groups: [...new Set(products.map((p) => p.displayGroup).filter(Boolean))],
      href: `/catalog/${c.slug}`,
      ...(gallery && {
        image: { src: gallery.src, width: gallery.width, height: gallery.height, alt: gallery.alt },
      }),
    };
  });
}

/** One row of a Level-2 family spec table (also reused on model pages). */
export interface FamilyTableRow {
  slug: string;
  href: string;
  name: string;
  models: string;
  role?: string;
  bearing?: string;
  vendor?: Vendor;
  group: string;
  summary: string;
  holeRange: string;
  bore: string;
  temp: string;
  weight: string;
}

export function familyTableRows(category: string): FamilyTableRow[] {
  return enrichedInCategory(category).map((p) => ({
    slug: p.slug,
    href: p.href,
    name: p.name,
    models: p.models.join(', '),
    ...(p.role && { role: p.role }),
    ...(p.bearing && { bearing: p.bearing }),
    ...(p.vendor && { vendor: p.vendor }),
    group: p.displayGroup,
    summary: p.summary,
    holeRange: formatHoleRange(p.parsed),
    bore: p.parsed.boreIn != null ? formatInches(p.parsed.boreIn) : '—',
    temp: p.parsed.tempF != null ? `${p.parsed.tempF}°F` : '—',
    weight: p.parsed.weightLbs != null ? `${p.parsed.weightLbs} lbs` : '—',
  }));
}

/** Compact index for the client-side Device Finder. */
export interface FinderEntry {
  slug: string;
  href: string;
  name: string;
  models: string;
  family: string;
  summary: string;
  purpose: Purpose;
  holeMinIn?: number;
  holeMaxIn?: number;
  holeNoLimit?: boolean;
  holeRange: string;
}

/** Finder filtering — pure so it can be tested headlessly. A product
 *  matches a size when its parsed range covers it (no-limit max counts);
 *  products without hole data only match when no size is given. */
export function filterFinderEntries(
  entries: FinderEntry[],
  query: { sizeIn?: number | undefined; purpose?: Purpose | '' | undefined }
): FinderEntry[] {
  const { sizeIn, purpose } = query;
  return entries.filter((e) => {
    if (purpose && e.purpose !== purpose) return false;
    if (sizeIn != null && Number.isFinite(sizeIn)) {
      if (e.holeMinIn == null && e.holeMaxIn == null) return false;
      if (e.holeMinIn != null && sizeIn < e.holeMinIn) return false;
      if (!e.holeNoLimit && e.holeMaxIn != null && sizeIn > e.holeMaxIn) return false;
    }
    return true;
  });
}

export function buildFinderIndex(): FinderEntry[] {
  const familyName = new Map(categories.map((c) => [c.slug, c.name]));
  return enrichedProducts.map((p) => ({
    slug: p.slug,
    href: p.href,
    name: p.name,
    models: p.models.join(', '),
    family: familyName.get(p.category) ?? p.category,
    summary: p.summary,
    purpose: p.purpose,
    ...(p.parsed.holeMinIn != null && { holeMinIn: p.parsed.holeMinIn }),
    ...(p.parsed.holeMaxIn != null && { holeMaxIn: p.parsed.holeMaxIn }),
    ...(p.parsed.holeNoLimit && { holeNoLimit: true }),
    holeRange: formatHoleRange(p.parsed),
  }));
}
