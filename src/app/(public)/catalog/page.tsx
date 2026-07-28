import { pageMetadata } from '@/lib/seo';
import Image from 'next/image';
import Link from 'next/link';
import { buildSearchIndex, catalog } from '@/features/catalog/content';
import {
  buildFinderIndex,
  familySummaries,
  type FamilySummary,
} from '@/features/catalog/content/enrich';
import CatalogSearch from '@/components/public/catalog/CatalogSearch';
import DeviceFinder from '@/components/public/catalog/DeviceFinder';
import EmailPdfAction from '@/components/public/catalog/EmailPdfAction';

export const metadata = pageMetadata({
  title: 'Product Catalog',
  description:
    'Petromac product lines — the Wireline Express™ tool taxi system with guides and holefinders, Focus™ precision centralisers, and well intervention accessories.',
  path: '/catalog',
});

/** Unchanged artifact — the compressed, linearized catalog PDF on the CDN. */
const CATALOG_PDF_HREF = '/flipbooks/catalog/petromac-product-catalog.pdf';

/**
 * Level 1 of the catalog drill-down: product-line bands with family cards
 * (no individual SKUs — those live on the family and model pages), a unified
 * "Find a product" panel (search + size/purpose filters), and the catalog PDF
 * actions up in the header where they're reachable without scrolling.
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
      {/* Header — title + intro, with the catalog PDF actions alongside at
          desktop widths so they're visible without scrolling. On mobile the
          actions drop directly beneath the intro, still above the finder. */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
          <div className="max-w-3xl">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-3">
              Product Catalog
            </h1>
            <p className="text-slate-600">{catalog.about.intro[0]}</p>
          </div>

          {/* Two balanced columns rather than a stacked label-over-buttons
              block in the header, which read oddly: the finder gives up some
              width and the PDF card sits beside it. On mobile the PDF card
              comes FIRST (order-1) so the actions stay above the fold, then
              the columns swap at lg.

              The finder panel is one tool, one job. Search is the most
              flexible way in, so it leads; size/purpose filters sit beneath.
              DeviceFinder stays a client island — the finder index reaches the
              browser only as serialized props, so no SKU names land in the
              page markup, and the family cards below remain the no-JS path. */}
          <div className="mt-8 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <CatalogPdfActions />
            <section
              aria-labelledby="find-a-product"
              className="order-2 rounded-2xl border border-slate-200 bg-white shadow-card p-5 md:p-6 lg:order-1"
            >
              <h2 id="find-a-product" className="font-heading text-base font-bold text-slate-900">
                Find a product
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Search by product or model, or narrow the catalog by size and purpose.
              </p>
              <div className="mt-4">
                <CatalogSearch entries={searchEntries} />
              </div>
              <div className="mt-5 border-t border-slate-100 pt-5">
                <DeviceFinder entries={buildFinderIndex()} />
              </div>
            </section>
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
      </div>

      {/* Footer strip — supporting information, deliberately understated. The
          patent notice is legal/trust context, not part of the browsing
          journey, so it stays here rather than competing with the finder up
          top. The contact action is the prominent thing in this strip; the PDF
          gets a quiet text link so someone who has read to the bottom doesn't
          have to scroll back up for it. */}
      <section className="bg-slate-50 border-t border-slate-100 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-xs leading-relaxed text-slate-500">
              {catalog.about.patents}{' '}
              <Link
                href={catalog.about.patentsUrl}
                className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-brand hover:decoration-brand"
              >
                View patents
              </Link>
            </p>
            <a
              href={CATALOG_PDF_HREF}
              download
              className="mt-2 inline-block text-xs font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-brand hover:decoration-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Download the complete catalog PDF
            </a>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Contact our regional managers
          </Link>
        </div>
      </section>
    </div>
  );
}

/**
 * Narrow companion card to the finder panel — restrained, not promotional.
 * Download is the primary action, Email the secondary one beneath it. Sits in
 * the right column at lg and above the finder on mobile.
 */
function CatalogPdfActions() {
  return (
    <aside
      aria-label="Complete catalog PDF"
      className="order-1 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:order-2"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Complete catalog PDF
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
        Full specifications for every model — for offline use and sharing.
      </p>
      <div className="mt-3 space-y-2">
        <a
          href={CATALOG_PDF_HREF}
          download
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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
        <EmailPdfAction />
      </div>
    </aside>
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
      className="group flex flex-col rounded-2xl bg-white ring-1 ring-slate-200 shadow-card overflow-hidden hover:ring-brand/40 hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      {/* h-40: the images are wide and shallow, so the taller box left a band
          of empty gradient under every one. object-contain keeps them whole. */}
      <div className="relative h-40 bg-slate-50">
        {family.image && (
          <Image
            src={family.image.src}
            alt={family.image.alt}
            fill
            className="object-contain p-4 group-hover:scale-[1.03] transition-transform duration-300"
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
        className="group flex items-center gap-5 rounded-2xl bg-white ring-1 ring-slate-200 shadow-card p-5 hover:ring-brand/40 hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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
