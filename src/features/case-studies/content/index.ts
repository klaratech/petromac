import caseStudiesJson from './case-studies.json';

/**
 * Case studies — the 46 success stories from the flipbook PDF, one page
 * per story (Jul 2026; replaced the 21 WordPress-era studies — those 21
 * kept their slugs, so live URLs and the WP-era redirects in
 * next.config.ts stayed valid).
 *
 * The JSON is GENERATED from the flipbook source PDF + tags.csv by the
 * scratchpad script (see docs/ADMIN.md) — text extracted per page, tags
 * from the CSV, each story's visual is its published flipbook page
 * (public/flipbooks/success-stories/pages/NNNN.webp). Slugs are FROZEN:
 * redirects and indexed URLs depend on them.
 */

export interface CaseStudy {
  slug: string;
  /** 1-based page number in the success-stories flipbook PDF. */
  page: number;
  /** Un-branded SEO title (root template appends "| Petromac"). */
  title: string;
  metaDescription: string;
  country: string;
  region: string;
  year: number | null;
  wirelineCompany: string;
  /** Product line, e.g. "Wireline Express - FT", "Focus - CH". */
  device: string;
  categories: string[];
  challenge: string[];
  solution: string[];
  results: string[];
  /** Long-form narrative paragraphs from the story page. */
  narrative: string[];
  /** The published flipbook page — figures, logs and layout included. */
  image: { src: string; width: number; height: number };
}

export const caseStudies = caseStudiesJson as CaseStudy[];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((cs) => cs.slug === slug);
}
