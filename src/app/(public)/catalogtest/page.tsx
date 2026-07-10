import type { Metadata } from 'next';
import Link from 'next/link';
import CatalogSearch from '@/components/public/catalogtest/CatalogSearch';
import ProductCard from '@/components/public/catalogtest/ProductCard';
import {
  buildSearchIndex,
  catalog,
  categories,
  productsInCategory,
} from '@/features/catalog/content';

export const metadata: Metadata = {
  title: 'Product Catalogue | Petromac',
  description:
    'Petromac equipment catalogue — Wireline Express™ tool taxis, guides and holefinders, Focus™ precision centralisers and well intervention accessories.',
};

const PDF_HREF = '/flipbooks/catalog/petromac-product-catalog.pdf';

export default function CatalogTestPage() {
  const searchIndex = buildSearchIndex();

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand mb-2">
            {catalog.edition} Edition
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Product Catalogue
          </h1>
          <p className="text-slate-600 max-w-3xl mb-8">{catalog.about.intro[0]}</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <CatalogSearch entries={searchIndex} />
            <a
              href={PDF_HREF}
              download
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand transition-colors whitespace-nowrap"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4"
                />
              </svg>
              Download PDF
            </a>
          </div>

          {/* Category jump nav */}
          <nav aria-label="Catalog categories" className="mt-8 flex flex-wrap gap-2">
            {categories.map((c) => (
              <a
                key={c.slug}
                href={`#${c.slug}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 hover:border-brand/40 hover:text-brand transition-colors"
              >
                {c.name}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* Product lines */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-6">
          {catalog.about.productLines.map((line) => (
            <div key={line.id} className="rounded-xl border-2 border-slate-200 p-6">
              <h2 className="font-heading text-xl font-bold text-brand mb-2">{line.name}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{line.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          {catalog.about.patents}{' '}
          <a
            href={catalog.about.patentsUrl}
            className="underline hover:text-brand"
            target="_blank"
            rel="noopener noreferrer"
          >
            View patents
          </a>
        </p>
      </section>

      {/* Categories */}
      {categories.map((category) => {
        const products = productsInCategory(category.slug);
        const groups = category.groups.length
          ? category.groups
          : [...new Set(products.map((p) => p.group))];
        return (
          <section
            key={category.slug}
            id={category.slug}
            className="max-w-7xl mx-auto px-6 py-10 scroll-mt-24 border-t border-slate-100"
          >
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              {category.name}
            </h2>
            <p className="text-slate-600 max-w-3xl mb-1">{category.tagline}</p>
            {category.intro.map((para) => (
              <p key={para.slice(0, 32)} className="text-sm text-slate-500 max-w-3xl mb-1">
                {para}
              </p>
            ))}
            <div className="mt-6 space-y-8">
              {groups.map((group) => {
                const groupProducts = products.filter((p) => p.group === group);
                if (groupProducts.length === 0) return null;
                return (
                  <div key={group || 'default'}>
                    {group && (
                      <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
                        {group}
                      </h3>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {groupProducts.map((p) => (
                        <ProductCard key={p.slug} product={p} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Footer strip */}
      <section className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Need help selecting equipment for your operation?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 transition-colors"
          >
            Contact our regional managers
          </Link>
        </div>
      </section>
    </div>
  );
}
