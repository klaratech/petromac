import catalogData from './catalog.json';
import type { CatalogCategory, CatalogContent, CatalogProduct } from './types';

export const catalog = catalogData as CatalogContent;

/** Products in catalog (= print) order, used for prev/next navigation. */
export const allProducts: CatalogProduct[] = catalog.products;

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
