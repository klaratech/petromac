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

export function productHref(p: CatalogProduct, base = '/catalogtest'): string {
  return `${base}/${p.category}/${p.slug}`;
}

export function adjacentProducts(p: CatalogProduct): {
  prev: CatalogProduct | null;
  next: CatalogProduct | null;
} {
  const i = allProducts.findIndex((x) => x.slug === p.slug && x.category === p.category);
  return {
    prev: i > 0 ? allProducts[i - 1] : null,
    next: i >= 0 && i < allProducts.length - 1 ? allProducts[i + 1] : null,
  };
}

export interface SearchEntry {
  name: string;
  models: string[];
  summary: string;
  categoryName: string;
  group: string;
  href: string;
  /** Lower-cased haystack: name + models + summary + description + spec labels. */
  haystack: string;
}

/** Compact client-side search index — built once at compile time on the
 *  server and passed to the search component as a prop. */
export function buildSearchIndex(base = '/catalogtest'): SearchEntry[] {
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
      categoryName,
      group: p.group,
      href: `${base}/${p.category}/${p.slug}`,
      haystack,
    };
  });
}
