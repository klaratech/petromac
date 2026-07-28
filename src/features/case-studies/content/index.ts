import caseStudiesJson from './case-studies.json';

/**
 * Case studies — 21 field stories migrated from the old WordPress site
 * (Jul 2026). The JSON here is the canonical, hand-editable source: the
 * WordPress site is gone (raw HTML mirror archived outside the repo in
 * Website_Archive/oldsite-case-studies). Body images live in
 * public/images/case-studies/.
 *
 * Old URLs were root-level slugs (petromac.co.nz/<slug>/) — next.config.ts
 * 301s each of them to /case-studies/<slug>, so slugs must never change.
 */

export type CaseStudyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; width: number; height: number };

export interface CaseStudy {
  slug: string;
  /** Un-branded SEO title (root template appends "| Petromac"). */
  title: string;
  metaDescription: string;
  country: string;
  /** Product lines involved — display + filter labels. */
  products: string[];
  /** Long-form results headline shown as the page lede. */
  headline: string;
  /** Narrative column: ordered paragraphs and log/figure images. */
  body: CaseStudyBlock[];
  challenge: string[];
  solution: string[];
  results: string[];
}

export const caseStudies = caseStudiesJson as CaseStudy[];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((cs) => cs.slug === slug);
}

/** Readable alt text for a body image, derived from its filename. */
export function imageAlt(cs: CaseStudy, src: string): string {
  const base = src
    .split('/')
    .pop()!
    .replace(/\.webp$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  return `${base} — ${cs.title}`;
}
