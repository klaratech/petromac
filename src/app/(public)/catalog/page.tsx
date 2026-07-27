import { pageMetadata } from '@/lib/seo';
import Image from 'next/image';
import Link from 'next/link';
import { buildSearchIndex, catalog } from '@/features/catalog/content';
import { familySummaries, type FamilySummary } from '@/features/catalog/content/enrich';
import CatalogSearch from '@/components/public/catalog/CatalogSearch';
import EmailPdfAction from '@/components/public/catalog/EmailPdfAction';

export const metadata = pageMetadata({
  title: 'Product Catalog',
  description:
    'Petromac product lines — the Wireline Express™ tool taxi system with guides and holefinders, Focus™ precision centralisers, and well intervention accessories.',
  path: '/catalog',
});

/**
 * Level 1 of the catalog drill-down: product-line bands with family cards
 * (no individual SKUs — those live on the family and model pages), search
 * that navigates straight to model pages, and the full-catalog PDF block.
 */
export default function CatalogOverviewPage() {
  const families = familySummaries();
  const bySlug = new Map(families.map((f) => [f.slug, f]));
  const wirelineExpress = [bySlug.get('tool-taxis'), bySlug.get('guides-holefinders')].filter(
    Boolean
  ) as FamilySummary[];
  const focus = [bySlug.get('focus-centralisers')].filter(Boolean) as FamilySummary[];
  const intervention = bySlug.get('well-intervention');

  const lineCopy = new Map(catalog.about.productLines.map((l) => [l.id, l]));
  const searchEntries = buildSearchIndex();

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Product Catalog
          </h1>
          <p className="text-slate-600 max-w-3xl">{catalog.about.intro[0]}</p>

          {/* Search — results navigate straight to model pages */}
          <div className="mt-6 max-w-xl">
            <CatalogSearch entries={searchEntries} />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* Wireline Express™ band */}
        <ProductLineBand
          name={lineCopy.get('wireline-express')?.name ?? 'Wireline Express™'}
          text={lineCopy.get('wireline-express')?.text}
          families={wirelineExpress}
        />

        {/* Focus™ band */}
        <ProductLineBand
          name={lineCopy.get('focus')?.name ?? 'Focus™ Precision Centralisers'}
          text={lineCopy.get('focus')?.text}
          families={focus}
        />

        {/* Well intervention — compact row */}
        {intervention && <InterventionRow family={intervention} />}

        {/* Full-catalog PDF block */}
        <section
          aria-label="Catalog PDF"
          className="rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="md:flex-1">
              <h2 className="font-heading text-xl font-bold text-slate-900">
                The complete catalog, as a PDF
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Full specifications for every model — the exhaustive reference for offline use and
                sharing.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:w-auto w-full">
              <a
                href="/flipbooks/catalog/petromac-product-catalog.pdf"
                download
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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
              <div className="sm:w-56">
                <EmailPdfAction />
              </div>
            </div>
          </div>
        </section>
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

function ProductLineBand({
  name,
  text,
  families,
}: {
  name: string;
  text?: string | undefined;
  families: FamilySummary[];
}) {
  if (families.length === 0) return null;
  return (
    <section aria-label={name}>
      <div className="mb-5 max-w-3xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900">{name}</h2>
        {text && <p className="mt-2 text-sm text-slate-500">{text}</p>}
      </div>
      <div className={`grid gap-5 ${families.length > 1 ? 'md:grid-cols-2' : 'md:grid-cols-2'}`}>
        {families.map((family) => (
          <FamilyCard key={family.slug} family={family} />
        ))}
      </div>
    </section>
  );
}

function FamilyCard({ family }: { family: FamilySummary }) {
  return (
    <Link
      href={family.href}
      className="group flex flex-col rounded-2xl bg-white ring-1 ring-slate-200 shadow-card overflow-hidden hover:ring-brand/40 hover:shadow-lg transition-all"
    >
      <div className="relative h-44 bg-gradient-to-b from-slate-50 to-slate-100/60">
        {family.image && (
          <Image
            src={family.image.src}
            alt={family.image.alt}
            fill
            className="object-contain p-5 group-hover:scale-[1.03] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
        <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-white tracking-wide">
          {family.productCount} models
        </span>
      </div>
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-heading text-lg font-bold text-slate-900 group-hover:text-brand transition-colors">
          {family.name}
        </h3>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed flex-1">{family.tagline}</p>
        {family.groups.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Product groups">
            {family.groups.map((group) => (
              <li
                key={group}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 whitespace-nowrap"
              >
                {group}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm font-semibold text-brand">
          Browse the family{' '}
          <span
            aria-hidden="true"
            className="inline-block transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </p>
      </div>
    </Link>
  );
}

function InterventionRow({ family }: { family: FamilySummary }) {
  return (
    <section aria-label={family.name}>
      <Link
        href={family.href}
        className="group flex items-center gap-5 rounded-2xl bg-white ring-1 ring-slate-200 shadow-card p-5 hover:ring-brand/40 hover:shadow-lg transition-all"
      >
        {family.image && (
          <div className="relative hidden sm:block h-20 w-28 shrink-0 rounded-lg bg-slate-50 ring-1 ring-slate-100 overflow-hidden">
            <Image
              src={family.image.src}
              alt={family.image.alt}
              fill
              className="object-contain p-2"
              sizes="112px"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-bold text-slate-900 group-hover:text-brand transition-colors">
            {family.name}
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">{family.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-slate-500">{family.productCount} models</p>
          <p className="mt-0.5 text-sm font-semibold text-brand">
            Browse{' '}
            <span
              aria-hidden="true"
              className="inline-block transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </p>
        </div>
      </Link>
    </section>
  );
}
