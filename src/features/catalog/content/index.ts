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

/* ------------------------------------------------------------------ */
/* Product card models — the slim shape the client-side catalog        */
/* browser receives as props (keeps catalog.json out of the JS bundle) */
/* ------------------------------------------------------------------ */

export interface ProductCardModel {
  slug: string;
  category: string;
  group: string;
  name: string;
  summary: string;
  href: string;
  image: { src: string; width: number; height: number; alt: string } | null;
  /** Headline badge shown over the card image, e.g. "400°F rated". */
  badge: string | null;
  /** Compact key-spec tags for the card footer, e.g. "Hole 8”–17.5”". */
  tags: string[];
}

/** First non-empty value of a spec row; null when the models genuinely
 *  differ (a single number would be misleading on the card). */
function rowValue(row: { values: string[] }): string | null {
  const nonEmpty = row.values.map((v) => v.trim()).filter(Boolean);
  if (nonEmpty.length === 0) return null;
  const distinct = new Set(nonEmpty);
  return distinct.size === 1 || nonEmpty.length === 1 ? nonEmpty[0] : null;
}

function findRow(p: CatalogProduct, ...labelPrefixes: string[]) {
  for (const table of p.specs) {
    for (const row of table.rows) {
      const label = row.label.toLowerCase();
      if (labelPrefixes.some((l) => label.startsWith(l))) return row;
    }
  }
  return undefined;
}

function spec(p: CatalogProduct, ...labelPrefixes: string[]): string | null {
  const row = findRow(p, ...labelPrefixes);
  return row ? rowValue(row) : null;
}

/** Leading size token of values like `7”-32# (ID 6.09”)` → `7”`. */
function sizeToken(v: string | null): string | null {
  if (!v) return null;
  const m = v.match(/^[\d][\d\s\-⁄/.]*[”"″⅛¼⅜½⅝¾⅞]*[”"″]/);
  return m ? m[0].replace(/\s+/g, '') : null;
}

function keySpecTags(p: CatalogProduct): string[] {
  const tags: string[] = [];

  const minHole = spec(p, 'min. hole', 'minimum hole');
  const maxHole = spec(p, 'max. hole', 'maximum hole');
  if (minHole && maxHole) {
    tags.push(/no limit/i.test(maxHole) ? `Hole ${minHole}+` : `Hole ${minHole}–${maxHole}`);
  }

  // Casing coverage: either an explicit min/max pair of rows, or a single
  // "Adjustable Casing Range" row whose two columns are min and max.
  const minCasing = spec(p, 'min. casing', 'minimum casing');
  const maxCasing = spec(p, 'max. casing', 'maximum casing');
  if (minCasing && maxCasing) {
    tags.push(`Casing ${minCasing}–${maxCasing}`);
  } else {
    const rangeRow = findRow(p, 'adjustable casing range');
    if (rangeRow) {
      const lo = sizeToken(rangeRow.values[0] ?? null);
      const hi = sizeToken(rangeRow.values[1] ?? null);
      if (lo && hi) tags.push(lo === hi ? `Casing ${lo}` : `Casing ${lo}–${hi}`);
    }
  }

  const restriction = spec(p, 'min. restriction');
  if (restriction) tags.push(`Min. restriction ${restriction}`);

  const bore = spec(p, 'taxi bore', 'bore');
  if (bore && !/in-line/i.test(bore)) tags.push(`Bore ${bore}`);

  const angle = spec(p, 'nose angle');
  if (angle) tags.push(`Nose ${angle.replace(' degrees', '°').replace('Adjustable: ', '')}`);

  const weight = spec(p, 'weight');
  if (weight) tags.push(weight.replace(/\s*\[.*\]$/, ''));

  return tags.slice(0, 3);
}

export function buildCardModels(base = '/catalog'): ProductCardModel[] {
  return allProducts.map((p) => {
    const hero = p.images.find((i) => i.role === 'gallery') ?? p.images[0] ?? null;
    const temp = spec(p, 'temperature rating');
    return {
      slug: p.slug,
      category: p.category,
      group: p.group,
      name: p.name,
      summary: p.summary,
      href: `${base}/${p.category}/${p.slug}`,
      image: hero ? { src: hero.src, width: hero.width, height: hero.height, alt: hero.alt } : null,
      badge: temp ? `${temp} rated` : null,
      tags: keySpecTags(p),
    };
  });
}
