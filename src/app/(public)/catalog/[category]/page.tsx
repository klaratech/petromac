import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categories, getCategory } from '@/features/catalog/content';
import {
  enrichedInCategory,
  familyLabel,
  familyTableRows,
  type FamilyTableRow,
  type Vendor,
} from '@/features/catalog/content/enrich';
import FamilySpecTable, {
  FAMILY_COLUMNS,
  type FamilyColumn,
} from '@/components/public/catalog/FamilySpecTable';
import JsonLd, { absoluteUrl } from '@/components/shared/JsonLd';
import { pageMetadata } from '@/lib/seo';

interface Params {
  category: string;
}

export function generateStaticParams(): Params[] {
  return categories.map((c) => ({ category: c.slug }));
}

export const dynamicParams = false;

const CATEGORY_TITLES: Record<string, string> = {
  'tool-taxis': 'Tool Taxis — Conveyance Accessories for Sticking Reduction',
  'guides-holefinders': 'Holefinders & Guides for Wireline Logging',
  'focus-centralisers': 'Centralisers for Wireline Logging — Open & Cased Hole',
  'well-intervention': 'Rollers for Well Intervention — Over Body & Wireline',
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  const title = CATEGORY_TITLES[category] ?? cat.name;
  return pageMetadata({
    title,
    description: cat.tagline,
    path: `/catalog/${cat.slug}`,
  });
}

const PRODUCT_LINE_LABELS: Record<string, string> = {
  'wireline-express': 'Wireline Express™',
  focus: 'Focus™',
};

const VENDOR_SECTION_TITLES: Record<Vendor, string> = {
  slb: 'For SLB tools',
  halliburton: 'For Halliburton tools',
  'baker-hughes': 'For Baker Hughes tools',
  universal: 'Universal',
};

/** Representative image for a set of rows: first product's first raster
 *  gallery image. */
function sectionImage(category: string, slugs: string[]) {
  const products = enrichedInCategory(category);
  for (const slug of slugs) {
    const p = products.find((x) => x.slug === slug);
    const img = p?.images.find((i) => i.role === 'gallery' && !i.src.endsWith('.svg'));
    if (img) return img;
  }
  return undefined;
}

function SectionHeading({
  title,
  image,
}: {
  title: string;
  image?: ReturnType<typeof sectionImage>;
}) {
  return (
    <div className="flex items-center gap-4 mb-4">
      {image && (
        <div className="hidden sm:block relative h-16 w-24 shrink-0 rounded-lg bg-slate-50 ring-1 ring-slate-200 overflow-hidden">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-contain p-1.5"
            sizes="96px"
          />
        </div>
      )}
      <h2 className="font-heading text-xl md:text-2xl font-bold text-slate-900">{title}</h2>
    </div>
  );
}

export default async function CatalogFamilyPage({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const rows = familyTableRows(cat.slug);
  const line = PRODUCT_LINE_LABELS[cat.productLine];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Catalog', item: absoluteUrl('/catalog') },
      { '@type': 'ListItem', position: 2, name: cat.name },
    ],
  };

  return (
    <div className="bg-white">
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
            <li aria-current="page" className="text-slate-600 font-medium">
              {cat.name}
            </li>
          </ol>
        </nav>

        {/* Family intro */}
        <header className="mb-8 max-w-3xl">
          {line && (
            <p className="text-sm font-semibold uppercase tracking-wider text-brand mb-2">{line}</p>
          )}
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            {familyLabel(cat.slug, cat.name)}
          </h1>
          <p className="text-slate-600">{cat.tagline}</p>
          {cat.intro.map((para) => (
            <p key={para.slice(0, 32)} className="mt-2 text-sm text-slate-500">
              {para}
            </p>
          ))}
        </header>

        {cat.slug === 'tool-taxis' && <ToolTaxisSections rows={rows} />}
        {cat.slug === 'guides-holefinders' && <GuidesSections rows={rows} />}
        {cat.slug === 'focus-centralisers' && <CentralisersSections rows={rows} />}
        {cat.slug === 'well-intervention' && <InterventionSections rows={rows} />}
      </div>
    </div>
  );
}

/* ── tool-taxis: ONE unified table with Role + Bearing ─────────────── */

function ToolTaxisSections({ rows }: { rows: FamilyTableRow[] }) {
  const columns: FamilyColumn[] = FAMILY_COLUMNS['tool-taxis'];
  const image = sectionImage('tool-taxis', ['tta-505-ttb-505']);
  return (
    <section aria-label="Tool taxi models">
      <SectionHeading title="All tool taxi models" image={image} />
      <FamilySpecTable rows={rows} columns={columns} ariaLabel="Tool taxi specifications" />
    </section>
  );
}

/* ── guides-holefinders: Pathfinder featured + vendor sections ─────── */

function GuidesSections({ rows }: { rows: FamilyTableRow[] }) {
  const pathfinders = rows.filter((r) => r.vendor === 'universal');
  const columns: FamilyColumn[] = FAMILY_COLUMNS['guides-holefinders'];
  const vendors: Vendor[] = ['slb', 'halliburton', 'baker-hughes'];
  return (
    <>
      {/* Universal option, featured */}
      <section aria-label="Universal hole finders" className="mb-10">
        <SectionHeading title="Universal — any toolstring" />
        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
          {pathfinders.map((r) => {
            const image = sectionImage('guides-holefinders', [r.slug]);
            return (
              <Link
                key={r.slug}
                href={r.href}
                className="group flex gap-4 rounded-xl bg-white ring-1 ring-slate-200 shadow-card p-4 hover:ring-brand/40 hover:shadow-lg transition-all"
              >
                {image && (
                  <div className="relative h-20 w-20 shrink-0 rounded-lg bg-slate-50 ring-1 ring-slate-100 overflow-hidden">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-contain p-1.5"
                      sizes="80px"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-heading font-bold text-slate-900 group-hover:text-brand transition-colors">
                    {r.models}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{r.summary}</p>
                  <p className="mt-1.5 text-xs text-slate-600 tabular-nums">
                    Hole {r.holeRange} · {r.temp}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Vendor-specific fixed angle guides */}
      {vendors.map((vendor) => {
        const vendorRows = rows.filter((r) => r.vendor === vendor);
        if (vendorRows.length === 0) return null;
        const image = sectionImage(
          'guides-holefinders',
          vendorRows.map((r) => r.slug)
        );
        return (
          <section key={vendor} aria-label={VENDOR_SECTION_TITLES[vendor]} className="mb-10">
            <SectionHeading title={VENDOR_SECTION_TITLES[vendor]} image={image} />
            <FamilySpecTable
              rows={vendorRows}
              columns={columns}
              ariaLabel={`${VENDOR_SECTION_TITLES[vendor]} specifications`}
            />
          </section>
        );
      })}
    </>
  );
}

/* ── focus-centralisers: Open Hole / Cased Hole sections ───────────── */

function CentralisersSections({ rows }: { rows: FamilyTableRow[] }) {
  const columns: FamilyColumn[] = FAMILY_COLUMNS['focus-centralisers'];
  const sections = [
    { title: 'Open hole', group: 'Open Hole' },
    { title: 'Cased hole', group: 'Cased Hole' },
  ];
  return (
    <>
      {sections.map(({ title, group }) => {
        const sectionRows = rows.filter((r) => r.group === group);
        if (sectionRows.length === 0) return null;
        const image = sectionImage(
          'focus-centralisers',
          sectionRows.map((r) => r.slug)
        );
        return (
          <section key={group} aria-label={`${title} centralisers`} className="mb-10">
            <SectionHeading title={title} image={image} />
            <FamilySpecTable
              rows={sectionRows}
              columns={columns}
              ariaLabel={`${title} centraliser specifications`}
            />
          </section>
        );
      })}
    </>
  );
}

/* ── well-intervention: single Accessories table ───────────────────── */

function InterventionSections({ rows }: { rows: FamilyTableRow[] }) {
  const columns: FamilyColumn[] = FAMILY_COLUMNS['well-intervention'];
  const image = sectionImage('well-intervention', ['rs7']);
  return (
    <section aria-label="Well intervention accessories">
      <SectionHeading title="Accessories" image={image} />
      <FamilySpecTable rows={rows} columns={columns} ariaLabel="Accessory specifications" />
    </section>
  );
}
