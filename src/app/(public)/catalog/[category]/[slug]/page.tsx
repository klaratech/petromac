import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SpecTableView from '@/components/public/catalog/SpecTableView';
import {
  adjacentProducts,
  allProducts,
  getCategory,
  getProduct,
  productHref,
} from '@/features/catalog/content';
import type { CatalogImage } from '@/features/catalog/content/types';
import JsonLd, { absoluteUrl } from '@/components/shared/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { familyTableRows, PRODUCT_TITLES } from '@/features/catalog/content/enrich';
import FamilySpecTable, { FAMILY_COLUMNS } from '@/components/public/catalog/FamilySpecTable';

interface Params {
  category: string;
  slug: string;
}

export function generateStaticParams(): Params[] {
  return allProducts.map((p) => ({ category: p.category, slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category, slug } = await params;
  const product = getProduct(category, slug);
  if (!product) return {};
  // Product-specific share card. SVG figures don't render as OG images, so
  // pageMetadata falls back to the site-wide card when a product has no
  // raster image. Title is the bare product name — the root template
  // appends "| Petromac" exactly once.
  const ogImage = product.images.find((img) => !img.src.endsWith('.svg'));
  const title = PRODUCT_TITLES[slug] ?? product.name;
  return pageMetadata({
    title,
    description: product.summary,
    path: `/catalog/${category}/${slug}`,
    ogImage: ogImage && {
      url: ogImage.src,
      width: ogImage.width,
      height: ogImage.height,
      alt: ogImage.alt,
    },
  });
}

/** SVG figures skip next/image (the optimizer doesn't process SVGs). */
function FigureImage({ image }: { image: CatalogImage }) {
  const cls = 'w-full h-auto object-contain';
  return image.src.endsWith('.svg') ? (
    // eslint-disable-next-line @next/next/no-img-element -- SVG asset, no optimizer support
    <img
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading="lazy"
      className={cls}
    />
  ) : (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      className={cls}
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { category: categorySlug, slug } = await params;
  const product = getProduct(categorySlug, slug);
  const category = getCategory(categorySlug);
  if (!product || !category) notFound();

  const gallery = product.images.filter((i) => i.role === 'gallery');
  const figures = product.images.filter((i) => i.role === 'figure');
  const { prev, next } = adjacentProducts(product);

  // schema.org rich data — name/summary/images straight from catalog.json,
  // no offers/ratings (industrial equipment, no listed pricing).
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.summary,
    category: category.name,
    brand: { '@type': 'Brand', name: 'Petromac' },
    url: absoluteUrl(productHref(product)),
    image: product.images.filter((i) => !i.src.endsWith('.svg')).map((i) => absoluteUrl(i.src)),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: '0.00',
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(productHref(product)),
      seller: {
        '@type': 'Organization',
        name: 'Petromac',
      },
    },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Catalog', item: absoluteUrl('/catalog') },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.name,
        item: absoluteUrl(`/catalog/${category.slug}`),
      },
      { '@type': 'ListItem', position: 3, name: product.name },
    ],
  };

  return (
    <div className="bg-white">
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/catalog" className="hover:text-brand transition-colors">
                Catalog
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/catalog/${category.slug}`}
                className="hover:text-brand transition-colors"
              >
                {category.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-slate-600 font-medium">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Header + gallery */}
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            {product.group && (
              <p className="text-sm font-semibold uppercase tracking-wider text-brand mb-2">
                {product.group}
              </p>
            )}
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              {product.name}
            </h1>
            <p className="text-slate-600 mb-4">{product.summary}</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {product.models.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {m}
                </span>
              ))}
            </div>

            {product.description.length > 0 && (
              <section aria-labelledby="description-heading" className="mb-8">
                <h2
                  id="description-heading"
                  className="font-heading text-lg font-bold text-slate-900 mb-3"
                >
                  Description
                </h2>
                <div className="space-y-3">
                  {product.description.map((para) => (
                    <p key={para.slice(0, 48)} className="text-sm text-slate-600 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {product.applications.length > 0 && (
              <section aria-labelledby="applications-heading">
                <h2
                  id="applications-heading"
                  className="font-heading text-lg font-bold text-slate-900 mb-3"
                >
                  Applications
                </h2>
                <ul className="space-y-2">
                  {product.applications.map((app) => (
                    <li key={app.slice(0, 48)} className="flex gap-2.5 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                      <span className="leading-relaxed">{app}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="space-y-4">
            {gallery.map((img) => (
              <figure
                key={img.src + img.alt}
                className="rounded-xl border border-slate-200 bg-slate-50 p-6"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  className="w-full h-auto object-contain max-h-[420px]"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={img === gallery[0]}
                />
                {img.caption && (
                  <figcaption className="mt-3 text-center text-sm font-semibold text-slate-500">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>

        {/* Variants (e.g. Type A / Type B bearing options) */}
        {product.variants.length > 0 && (
          <section aria-labelledby="variants-heading" className="mt-12">
            <h2 id="variants-heading" className="sr-only">
              Variants
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {product.variants.map((v) => (
                <div key={v.title} className="rounded-xl border-2 border-slate-200 p-6">
                  <h3 className="font-heading text-lg font-bold text-brand mb-3">{v.title}</h3>
                  <div className="space-y-2 mb-4">
                    {v.description.map((para) => (
                      <p key={para.slice(0, 48)} className="text-sm text-slate-600 leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                  <ul className="space-y-1.5">
                    {v.applications.map((app) => (
                      <li key={app.slice(0, 48)} className="flex gap-2.5 text-sm text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                        <span className="leading-relaxed">{app}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Specifications */}
        {product.specs.length > 0 && (
          <section aria-labelledby="specs-heading" className="mt-12">
            <h2 id="specs-heading" className="font-heading text-2xl font-bold text-slate-900 mb-5">
              Specifications
            </h2>
            <div className="grid lg:grid-cols-2 gap-6 items-start">
              {product.specs.map((table, i) => (
                <SpecTableView key={table.title + i} table={table} />
              ))}
            </div>
          </section>
        )}

        {/* Figures: charts, standoff diagrams, configurations */}
        {figures.length > 0 && (
          <section aria-labelledby="figures-heading" className="mt-12">
            <h2
              id="figures-heading"
              className="font-heading text-2xl font-bold text-slate-900 mb-5"
            >
              Charts & Diagrams
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 items-start">
              {figures.map((img) => (
                <figure
                  key={img.src + (img.caption ?? '')}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <FigureImage image={img} />
                  {img.caption && (
                    <figcaption className="mt-3 text-center text-sm text-slate-500">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Lateral navigation: the rest of the family, Level-2 columns */}
        <FamilySiblings categorySlug={category.slug} categoryName={category.name} slug={slug} />

        {/* Prev / next */}
        <nav
          aria-label="Adjacent products"
          className="mt-14 flex items-stretch justify-between gap-4 border-t border-slate-100 pt-6"
        >
          {prev ? (
            <Link
              href={productHref(prev)}
              className="group max-w-[48%] text-left text-sm text-slate-500 hover:text-brand transition-colors"
            >
              <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">
                ← Previous
              </span>
              <span className="font-heading font-semibold">{prev.name}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={productHref(next)}
              className="group max-w-[48%] text-right text-sm text-slate-500 hover:text-brand transition-colors"
            >
              <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">
                Next →
              </span>
              <span className="font-heading font-semibold">{next.name}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </div>
  );
}

/** "Other models in this family" — same columns as the family page. */
function FamilySiblings({
  categorySlug,
  categoryName,
  slug,
}: {
  categorySlug: string;
  categoryName: string;
  slug: string;
}) {
  const rows = familyTableRows(categorySlug).filter((r) => r.slug !== slug);
  if (rows.length === 0) return null;
  return (
    <section aria-label="Other models in this family" className="mt-14">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="font-heading text-xl md:text-2xl font-bold text-slate-900">
          Other models in this family
        </h2>
        <Link
          href={`/catalog/${categorySlug}`}
          className="text-sm font-semibold text-brand hover:underline whitespace-nowrap"
        >
          All {categoryName} →
        </Link>
      </div>
      <FamilySpecTable
        rows={rows}
        columns={FAMILY_COLUMNS[categorySlug] ?? ['hole', 'temp', 'weight']}
        ariaLabel={`Other ${categoryName} models`}
      />
    </section>
  );
}
