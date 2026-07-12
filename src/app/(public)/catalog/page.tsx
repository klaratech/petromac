import type { Metadata } from 'next';
import Link from 'next/link';
import CatalogBrowser from '@/components/public/catalog/CatalogBrowser';
import { buildCardModels, buildSearchIndex, catalog, categories } from '@/features/catalog/content';

export const metadata: Metadata = {
  title: 'Product Catalogue | Petromac',
  description:
    'Petromac equipment catalogue — Wireline Express™ tool taxis, guides and holefinders, Focus™ precision centralisers and well intervention accessories.',
};

export default function CatalogTestPage() {
  // Slim props built at compile time — the client browser never sees the
  // full catalog.json.
  const browserCategories = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    intro: c.intro,
    groups: c.groups,
  }));
  const cards = buildCardModels();
  const searchEntries = buildSearchIndex();

  return (
    <div className="bg-white">
      {/* Compact header */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand mb-2">
            {catalog.edition} Edition
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Product Catalogue
          </h1>
          <p className="text-slate-600 max-w-3xl">{catalog.about.intro[0]}</p>
        </div>
      </section>

      {/* Sidebar + content workspace */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <CatalogBrowser
          categories={browserCategories}
          cards={cards}
          searchEntries={searchEntries}
        />
      </div>

      {/* Footer strip */}
      <section className="bg-slate-50 border-t border-slate-100 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {catalog.about.patents}{' '}
            <Link href={catalog.about.patentsUrl} className="underline hover:text-brand">
              View patents
            </Link>
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 transition-colors whitespace-nowrap"
          >
            Contact our regional managers
          </Link>
        </div>
      </section>
    </div>
  );
}
