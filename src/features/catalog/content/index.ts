import catalogData from './catalog.json';
import type { CatalogCategory, CatalogContent, CatalogProduct } from './types';

export const catalog = catalogData as CatalogContent;

/**
 * Products the WEBSITE presents as one page though the print catalog gives
 * them a spread each. Key = the slug that disappears, value = the survivor.
 *
 * TTB-S75U/S85 duplicated TTB-S75/S85: byte-identical `description` and
 * `applications`, identical Materials and both Standoff tables, and only
 * three differing spec rows. Martin flagged the repetition (Aug 2026) and it
 * was the site's second-worst near-duplicate pair on 4-gram Jaccard (0.67).
 * The surviving page carries the difference as a note — see MERGE_NOTES.
 *
 * Applied HERE, at `allProducts`, and not in `enrich.ts`, because
 * `buildSearchIndex` reads `allProducts` directly. Filtering only in the
 * enrichment layer would drop the page while leaving the search box happily
 * offering a URL that no longer exists.
 *
 * `catalog.json` is GENERATED and must never be hand-edited, so the merged
 * product keeps being produced by the pipeline and keeps being absorbed here.
 * That is deliberate: a new catalog edition cannot silently resurrect the
 * duplicate page, and the merged product's data stays available if the
 * decision is ever reversed. Removing it from `catalog_config.json` instead
 * would throw the data away.
 */
const MERGED_INTO: Record<string, string> = {
  'ttb-s75u-ttb-s85': 'ttb-s75-ttb-s85',
};

/**
 * Editorial note shown on a merge SURVIVOR's page, keyed by its slug. Written
 * by hand rather than derived from the absorbed product's specs: which
 * differences matter is a judgement, and a generated diff of thirteen spec
 * rows would bury the one that does (the bore).
 */
export const MERGE_NOTES: Record<string, string> = {
  'ttb-s75-ttb-s85':
    'The TTB-S75U is a variant of the TTB-S75 with a 5-¼” bore instead of 4-¾”, ' +
    'sized for the physically larger ultra-high-pressure (30,000 psi) sampling ' +
    'tools. It weighs 19.8 lbs and is 9.9” long. Every other specification, ' +
    'including the 30,000 psi pressure rating, is as listed above.',
};

/**
 * Drops merged-away products and hands their model names to the survivor, so
 * a search for "TTB-S75U" still finds the page that now documents it —
 * `buildSearchIndex` puts `models` in its haystack, and the page renders them
 * as chips.
 *
 * Models are sorted, which puts the absorbed model beside its base
 * (TTB-S75, TTB-S75U, TTB-S85) rather than appended after it.
 */
function applyMerges(products: CatalogProduct[]): CatalogProduct[] {
  const absorbed = new Map<string, string[]>();
  for (const p of products) {
    const target = MERGED_INTO[p.slug];
    if (target) absorbed.set(target, [...(absorbed.get(target) ?? []), ...p.models]);
  }
  return products
    .filter((p) => !MERGED_INTO[p.slug])
    .map((p) => {
      const extra = absorbed.get(p.slug);
      if (!extra) return p;
      return { ...p, models: [...new Set([...p.models, ...extra])].sort() };
    });
}

/** Products in catalog (= print) order, used for prev/next navigation. */
export const allProducts: CatalogProduct[] = applyMerges(catalog.products);

export const categories: CatalogCategory[] = catalog.categories;

export function getCategory(slug: string): CatalogCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProduct(category: string, slug: string): CatalogProduct | undefined {
  return allProducts.find((p) => p.category === category && p.slug === slug);
}

export function productsInCategory(category: string): CatalogProduct[] {
  return allProducts.filter((p) => p.category === category);
}

export function productHref(p: CatalogProduct, base = '/catalog'): string {
  return `${base}/${p.category}/${p.slug}`;
}

/**
 * Previous/next WITHIN the product's own family, in catalog (print) order.
 *
 * This used to walk `allProducts`, the flat print-order list, so the last
 * product of a family linked straight into the first of the next one —
 * Pathfinder's "Previous" was TTB-IL6C, a tool taxi (Martin, Aug 2026). The
 * control reads as "another one like this"; sending someone sideways into an
 * unrelated family breaks that promise, and the family's own edges are the
 * honest place to stop. `FamilySiblings` above the nav already offers the
 * whole family, and the breadcrumb plus the new bottom link cover going back
 * up, so ending at null costs nothing.
 */
export function adjacentProducts(p: CatalogProduct): {
  prev: CatalogProduct | null;
  next: CatalogProduct | null;
} {
  const family = productsInCategory(p.category);
  const i = family.findIndex((x) => x.slug === p.slug);
  return {
    prev: i > 0 ? (family[i - 1] ?? null) : null,
    next: i >= 0 && i < family.length - 1 ? (family[i + 1] ?? null) : null,
  };
}

export interface SearchEntry {
  name: string;
  models: string[];
  summary: string;
  category: string;
  slug: string;
  categoryName: string;
  group: string;
  href: string;
  /** Lower-cased haystack: name + models + summary + description + spec labels. */
  haystack: string;
}

/** Compact client-side search index — built once at compile time on the
 *  server and passed to the search component as a prop. */
export function buildSearchIndex(base = '/catalog'): SearchEntry[] {
  return allProducts.map((p) => {
    const categoryName = getCategory(p.category)?.name ?? p.category;
    const haystack = [
      p.name,
      p.models.join(' '),
      p.summary,
      p.group,
      categoryName,
      ...p.description,
      ...p.applications,
      ...p.variants.flatMap((v) => [v.title, ...v.description, ...v.applications]),
      ...p.specs.flatMap((s) => s.rows.map((r) => r.label)),
    ]
      .join(' ')
      .toLowerCase();
    return {
      name: p.name,
      models: p.models,
      summary: p.summary,
      category: p.category,
      slug: p.slug,
      categoryName,
      group: p.group,
      href: `${base}/${p.category}/${p.slug}`,
      haystack,
    };
  });
}
