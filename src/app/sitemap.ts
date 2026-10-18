import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';
import { allProducts, categories, catalog } from '@/features/catalog/content';
import { caseStudies } from '@/features/case-studies/content';
import { getFlipbookManifest } from '@/features/flipbooks/manifests';
import { FLIPBOOK_KEYS } from '@/features/flipbooks/constants';

const BASE_URL = getSiteUrl();

/**
 * `lastmod` must describe when the CONTENT changed, not when the container
 * was built. Every entry used to be `new Date()`, so a deploy that touched
 * one page told Google all 94 had changed — the signal Google uses to
 * prioritise re-crawls, permanently pinned to "everything, just now", which
 * is the same as no signal at all (Search Console audit, 9 Aug 2026).
 *
 * Dates now come from the content itself wherever the content carries one,
 * and from the map below for hand-authored pages. Two rules keep this
 * honest: never fall back to build time (that reintroduces the bug), and
 * bump a date here only when the page's copy actually changes.
 */

/**
 * Hand-authored routes: date of the last meaningful CONTENT edit, seeded
 * from `git log -1 --format=%cs` per page file on 9 Aug 2026. A styling or
 * refactor commit is not a content change — leave the date alone for those.
 *
 * Worked example, 10 Aug 2026: the SeeAlso change edited seven files, but only
 * FOUR dates moved — /about, /about/patents, /about/publications and
 * /success-stories, whose own copy changed. `Header.tsx` changed too and
 * appears on all 94 pages, but site-wide chrome is not a per-page content
 * change: bumping all 94 for a nav edit would recreate the exact
 * "everything changed at once" noise this map exists to remove.
 */
const PAGE_LAST_MODIFIED: Record<string, string> = {
  '/': '2026-07-26',
  '/about': '2026-08-10',
  '/about/patents': '2026-08-10',
  '/about/publications': '2026-08-10',
  '/team': '2026-07-30',
  '/catalog': '2026-08-07',
  '/track-record': '2026-08-06',
  '/success-stories': '2026-08-10',
  '/simulation': '2026-07-30',
  '/contact': '2026-08-06',
  '/privacy': '2026-07-26',
  '/terms': '2026-07-26',
};

/**
 * Catalog pages regenerate wholesale from the InDesign IDML, so the edition's
 * own date is the truthful modification date for every one of them. Parsed
 * from the source filename ("V6 Petromac Catalog - 20260707.idml") rather
 * than hardcoded, so a new edition carries its own date in without an edit
 * here. Falls back to the catalog page's date if a future filename drops the
 * stamp — never to build time.
 */
function catalogEditionDate(): Date {
  const stamp = /(\d{4})(\d{2})(\d{2})/.exec(catalog.source);
  if (!stamp) return new Date(PAGE_LAST_MODIFIED['/catalog'] as string);
  return new Date(`${stamp[1]}-${stamp[2]}-${stamp[3]}`);
}

const CATALOG_UPDATED = catalogEditionDate();

/**
 * Success stories are generated from one flipbook edition, so they all share
 * the edition's ingest date — which is the truth: they did all change at
 * once, and they stop changing between editions.
 */
const STORIES_UPDATED = new Date(
  getFlipbookManifest(FLIPBOOK_KEYS.successStories).updatedAt ??
    PAGE_LAST_MODIFIED['/success-stories']
);

export default function sitemap(): MetadataRoute.Sitemap {
  // Success stories — long-tail landing pages (tool + country + deviation).
  const caseStudyUrls: MetadataRoute.Sitemap = caseStudies.map((cs) => ({
    url: `${BASE_URL}/success-stories/${cs.slug}`,
    lastModified: STORIES_UPDATED,
    changeFrequency: 'yearly',
    priority: 0.7,
  }));
  // Catalog family pages (Level 2 of the drill-down).
  const familyUrls: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/catalog/${c.slug}`,
    lastModified: CATALOG_UPDATED,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));
  // Every catalog product has its own indexable page.
  const productUrls: MetadataRoute.Sitemap = allProducts.map((p) => ({
    url: `${BASE_URL}/catalog/${p.category}/${p.slug}`,
    lastModified: CATALOG_UPDATED,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const staticEntry = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: number
  ): MetadataRoute.Sitemap[number] => ({
    url: path === '/' ? BASE_URL : `${BASE_URL}${path}`,
    lastModified: new Date(PAGE_LAST_MODIFIED[path] as string),
    changeFrequency,
    priority,
  });

  return [
    staticEntry('/', 'monthly', 1),
    staticEntry('/about', 'monthly', 0.8),
    staticEntry('/about/patents', 'yearly', 0.6),
    staticEntry('/about/publications', 'yearly', 0.6),
    staticEntry('/team', 'monthly', 0.7),
    staticEntry('/catalog', 'monthly', 0.9),
    staticEntry('/track-record', 'weekly', 0.8),
    staticEntry('/success-stories', 'monthly', 0.8),
    staticEntry('/simulation', 'monthly', 0.8),
    staticEntry('/contact', 'yearly', 0.7),
    staticEntry('/privacy', 'yearly', 0.3),
    staticEntry('/terms', 'yearly', 0.3),
    ...familyUrls,
    ...productUrls,
    ...caseStudyUrls,
  ];
}
