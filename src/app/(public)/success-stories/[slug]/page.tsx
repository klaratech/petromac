import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { caseStudies, getCaseStudy } from '@/features/case-studies/content';
import { storyTitle } from '@/features/case-studies/content/seo-titles';
import {
  caseStudyCategories,
  categoryLabel,
  deviceCatalogLink,
  relatedCaseStudies,
} from '@/features/case-studies/filters';
import JsonLd, { absoluteUrl } from '@/components/shared/JsonLd';
import DownloadStoryPage from '@/components/public/case-studies/DownloadStoryPage';
import { pageMetadata } from '@/lib/seo';
import { getFlipbookManifest } from '@/features/flipbooks/manifests';
import { FLIPBOOK_KEYS } from '@/features/flipbooks/constants';

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return caseStudies.map((cs) => ({ slug: cs.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const cs = getCaseStudy(slug);
  if (!cs) return {};
  return pageMetadata({
    // Curated short title (seo-titles.ts) — the H1 keeps the full headline.
    title: storyTitle(cs),
    description: cs.metaDescription,
    path: `/success-stories/${slug}`,
    ogImage: {
      url: cs.image.src,
      width: cs.image.width,
      height: cs.image.height,
      alt: `${cs.title} — published success story`,
    },
  });
}

/** Human names for the tags.csv area codes, for the region-map caption. */
const REGION_LABELS: Record<string, string> = {
  MENA: 'Middle East & North Africa',
  APAC: 'Asia-Pacific',
  NAM: 'North America',
  LAM: 'Latin America',
  EUR: 'Europe',
  AFR: 'Africa',
};

/** The map artwork's own region code, as a tags.csv area code. */
const MAP_CODE_TO_AREA: Record<string, string> = {
  MEA: 'MENA',
  APAC: 'APAC',
  NAM: 'NAM',
  LAM: 'LAM',
  EUR: 'EUR',
  AFR: 'AFR',
};

/**
 * Caption for the region-map card. Normally "country · region", but when the
 * layout's placed map disagrees with the tags.csv area (page 7: Azerbaijan is
 * tagged EUR while the printed page places the MEA map), naming either region
 * would contradict the image or the filters — so the caption stays with just
 * the country. The filters keep using the tags value either way.
 */
function mapCaption(country: string, region: string, mapCode: string): string {
  if (MAP_CODE_TO_AREA[mapCode] !== region) return country;
  return `${country} · ${REGION_LABELS[region] ?? region}`;
}

/**
 * "Fig.1." / "Fig 2:" / "Fig 2 & 3:" — the caption's own numbering prefix.
 * The number becomes the card's label chip and the prefix is stripped from
 * the caption text, so the pair never reads "Fig. 2 Fig.2. …". Numbering
 * comes from the caption, NOT the render order: page 35 numbers its third
 * web figure "Fig 4" because Fig 3 is a table set into that figure's pixels.
 */
const FIG_PREFIX = /^\s*Figs?\.?\s*\.?\s*(\d+(?:\s*&\s*\d+)?)\s*[.:]?\s*/i;

/**
 * Render a paragraph's inline typography: the print's bold spans (carried
 * as ** markers in the generated JSON) become <strong>, and SPE citations
 * link to their DOI within the plain segments. The bold is the page
 * designer's scan layer — key figures, product names, outcomes — restored
 * Aug 2026 after the print/live review.
 */
function richText(text: string, refs: { label: string; href: string | null }[] = []) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-slate-800">
        {part}
      </strong>
    ) : (
      <span key={i}>{withReferenceLinks(part, refs)}</span>
    )
  );
}

/**
 * SPE citations linked to their DOI — the printed page links them, and the
 * IDML's hyperlink table carries the URL. A reference without a href
 * renders as plain text.
 */
function withReferenceLinks(text: string, refs: { label: string; href: string | null }[]) {
  const linked = refs.filter((r) => r.href && text.includes(r.label));
  if (linked.length === 0) return text;
  const pattern = new RegExp(`(${linked.map((r) => r.label).join('|')})`, 'g');
  const hrefs = new Map(linked.map((r) => [r.label, r.href!]));
  return text.split(pattern).map((part, i) =>
    hrefs.has(part) ? (
      <a
        key={i}
        href={hrefs.get(part)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-brand hover:underline"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

/** CHALLENGE / SOLUTION / RESULTS side panel. */
function SidePanel({ title, paras }: { title: string; paras: string[] }) {
  if (paras.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-brand mb-2">
        {title}
      </h2>
      <div className="space-y-2">
        {paras.map((p) => (
          <p key={p.slice(0, 48)} className="text-sm text-slate-600 leading-relaxed">
            {richText(p)}
          </p>
        ))}
      </div>
    </section>
  );
}

export default async function CaseStudyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const cs = getCaseStudy(slug);
  if (!cs) notFound();

  const related = relatedCaseStudies(cs, caseStudies);
  const product = deviceCatalogLink(cs.device);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cs.title,
    description: cs.metaDescription,
    url: absoluteUrl(`/success-stories/${cs.slug}`),
    image: [absoluteUrl(cs.image.src)],
    // The edition date the sitemap also reports for these pages — the only
    // REAL date the content carries. There is deliberately no datePublished:
    // the stories have no per-story publication dates, and inventing them is
    // the $0.00-offers mistake again (docs/DECISIONS.md, structured data).
    dateModified: getFlipbookManifest(FLIPBOOK_KEYS.successStories).updatedAt,
    author: { '@type': 'Organization', name: 'Petromac' },
    publisher: {
      '@type': 'Organization',
      name: 'Petromac',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/images/Petromac-Logo.png.webp'),
      },
    },
    about: [{ '@type': 'Thing', name: cs.device }],
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Success Stories',
        item: absoluteUrl('/success-stories'),
      },
      { '@type': 'ListItem', position: 2, name: cs.title },
    ],
  };

  return (
    <div className="bg-white">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <article className="max-w-7xl mx-auto px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/success-stories" className="hover:text-brand transition-colors">
                Success Stories
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-slate-600 font-medium">
              {cs.country}
            </li>
          </ol>
        </nav>

        <header className="max-w-3xl mb-10">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 font-semibold text-brand">
              {cs.country}
            </span>
            {cs.device && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                {cs.device}
              </span>
            )}
            {/* One application only, matching the index card. 34 of the 46
                stories carry a second tag, so this is a deliberate editorial
                choice rather than all the data there is: the badge row is
                orientation, and the narrative below covers the rest. Year is
                gone for the same reason — an application tells a reader whether
                the story is about their problem; a year doesn't. */}
            {caseStudyCategories(cs)[0] && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                {categoryLabel(caseStudyCategories(cs)[0])}
              </span>
            )}
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900">{cs.title}</h1>
          {/* The layout's own standfirst. It was always on the page — the
              PDF-text pipeline just could not tell it apart from the story, so
              it arrived as a duplicate-sounding first sentence of the
              narrative. Reading the IDML's paragraph styles separates it out
              (Aug 2026), and it earns its place here: it states the outcome in
              one line, above the fold, before the narrative gets to it. */}
          {cs.subtitle && (
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">{cs.subtitle}</p>
          )}
        </header>

        <div className="grid lg:grid-cols-[1fr_320px] gap-10 lg:gap-14 items-start">
          <div>
            {/* Narrative, with the layout's own mid-story subheads restored
                at their printed positions (page 39). */}
            <div className="space-y-5 mb-10">
              {cs.narrative.map((p, i) => (
                <div key={p.slice(0, 48)} className="space-y-5">
                  {cs.narrativeSubheads
                    .filter((h) => Math.min(h.before, cs.narrative.length - 1) === i)
                    .map((h) => (
                      <h2 key={h.text} className="font-heading text-xl font-bold text-brand pt-2">
                        {h.text}
                      </h2>
                    ))}
                  <p className="text-slate-600 leading-relaxed">{richText(p, cs.references)}</p>
                </div>
              ))}
            </div>

            {/* Closing banner — the printed page's own bottom statement
                (page 30), set as display copy rather than a paragraph. */}
            {cs.callout && (
              <p className="mb-10 border-l-4 border-brand bg-brand/[0.04] px-5 py-4 font-heading text-lg font-bold leading-snug text-brand">
                {cs.callout}
              </p>
            )}

            {/* Figures from the story's published page.
                Until Aug 2026 this rendered the WHOLE published page as one
                image, directly below the prose extracted from that same page —
                so every reader got the story twice, the second time as pixels
                they couldn't select, search or resize, and at a size that made
                the actual logs and plots unreadable on a phone. The figures are
                the only part of the page the text can't carry, so they are the
                only part worth rendering.
                Portrait figures pair up on a row (page 11's two tension
                profiles are meant to be read side by side); landscape ones run
                full width. Captions come from the page's own "Fig.N" lines and
                are absent where the layout had none. */}
            {cs.figures.length > 0 && (
              <div className="grid grid-cols-2 gap-5">
                {cs.figures.map((fig, i) => {
                  const wide = fig.width >= fig.height;
                  const prefix = fig.caption?.match(FIG_PREFIX);
                  const label = prefix ? `Fig. ${prefix[1].replace(/\s*&\s*/, ' & ')}` : null;
                  const text = prefix ? fig.caption!.slice(prefix[0].length) : fig.caption;
                  return (
                    <figure
                      key={fig.src}
                      className={
                        wide
                          ? 'col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4'
                          : 'col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-1'
                      }
                    >
                      <Image
                        src={fig.src}
                        alt={fig.caption ?? `${cs.title} — figure ${i + 1}`}
                        width={fig.width}
                        height={fig.height}
                        className="mx-auto h-auto w-full object-contain"
                        /* Renders are 400 dpi crops; capping display at 3/4 of
                         the source pixels keeps a small diagram from being
                         blown up soft across the whole column now that
                         autocrop has removed the white margins that used to
                         pad figures out to column width. */
                        style={{ maxWidth: `min(100%, ${Math.round(fig.width * 0.75)}px)` }}
                        /* Wide figures span the whole prose column (~65vw at
                         desktop), portrait ones share a row so they get half
                         of it. One combined `sizes` under-served the wide
                         ones — a 1200px source came down as 512px and looked
                         soft at 807px on screen. */
                        sizes={
                          wide
                            ? '(max-width: 1024px) 100vw, 65vw'
                            : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                        }
                        priority={i === 0}
                      />
                      {(label || text) && (
                        <figcaption className="mt-3 text-sm leading-snug text-slate-500">
                          {label && (
                            <span className="mr-1.5 font-semibold text-slate-700">{label}</span>
                          )}
                          {text}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            )}

            {/* The published page is still available — as a download, not as a
                second copy of the story rendered into the page. */}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
              <DownloadStoryPage page={cs.page} slug={cs.slug} />
              <Link
                href="/success-stories"
                className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-brand hover:underline"
              >
                Browse all success stories
              </Link>
            </div>
          </div>

          <aside className="space-y-8 rounded-xl border border-slate-200 bg-slate-50/60 p-6 lg:sticky lg:top-24">
            {/* The region world-map the printed page opens with — restored
                Aug 2026; the first figure-extraction pass filtered it out as
                page furniture and the location ended up as nothing but a
                country badge. */}
            {cs.regionMap && (
              <figure>
                <div className="rounded-lg bg-white ring-1 ring-slate-200 p-2">
                  <Image
                    src={cs.regionMap.src}
                    alt={`World map highlighting the region where this operation ran`}
                    width={cs.regionMap.width}
                    height={cs.regionMap.height}
                    className="h-auto w-full"
                    sizes="(max-width: 1024px) 100vw, 288px"
                  />
                </div>
                <figcaption className="mt-2 text-xs font-medium text-slate-500">
                  {mapCaption(cs.country, cs.region, cs.regionMap.code)}
                </figcaption>
              </figure>
            )}
            <SidePanel title="Challenge" paras={cs.challenge} />
            <SidePanel title="Solution" paras={cs.solution} />
            <SidePanel title="Results" paras={cs.results} />
            <SidePanel title="Learnings" paras={cs.learnings} />
          </aside>
        </div>

        {/* Where this story leads. Until Aug 2026 the page ended here with a
            single link back to the hub, so every story was a crawl dead end
            and a reader who finished one had nowhere to go.
            Order matters: the product/track-record/contact line comes FIRST
            because it follows straight on from the story you just read, then
            related stories as the "or read another" step. There is deliberately
            no "← All success stories" link here — the actions row above the
            figures already carries "Browse all success stories", and two links
            to the hub on one page is just noise. */}
        <nav
          aria-label="Where to next"
          className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-600"
        >
          <p className="leading-relaxed">
            {product && (
              <>
                This run used Petromac{' '}
                <Link href={product.href} className="font-semibold text-brand hover:underline">
                  {product.label}
                </Link>
                . See the full range in the{' '}
                <Link href="/catalog" className="font-semibold text-brand hover:underline">
                  product catalog
                </Link>
                , the worldwide{' '}
              </>
            )}
            {!product && (
              <>
                See the full range in the{' '}
                <Link href="/catalog" className="font-semibold text-brand hover:underline">
                  product catalog
                </Link>
                , the worldwide{' '}
              </>
            )}
            <Link href="/track-record" className="font-semibold text-brand hover:underline">
              deployment track record
            </Link>
            , or{' '}
            <Link href="/contact" className="font-semibold text-brand hover:underline">
              talk to us about a well like this one
            </Link>
            .
          </p>
        </nav>

        {related.length > 0 && (
          <section
            aria-labelledby="related-stories"
            className="mt-14 border-t border-slate-200 pt-8"
          >
            <h2
              id="related-stories"
              className="font-heading text-xl md:text-2xl font-bold text-slate-900"
            >
              Related success stories
            </h2>
            <ul className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
              {related.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/success-stories/${other.slug}`}
                    className="group flex h-full flex-col rounded-xl bg-white ring-1 ring-slate-200 shadow-card p-5 hover:ring-brand/40 hover:shadow-lg transition-all"
                  >
                    <span className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="rounded-full bg-brand/10 px-2.5 py-0.5 font-semibold text-brand">
                        {other.country}
                      </span>
                      {other.device && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                          {other.device}
                        </span>
                      )}
                    </span>
                    <span className="mt-3 flex-1 font-semibold text-slate-900 text-sm leading-snug group-hover:text-brand transition-colors">
                      {other.title}
                    </span>
                    <span className="mt-3 text-sm font-semibold text-brand">
                      Read the story{' '}
                      <span
                        aria-hidden="true"
                        className="inline-block transition-transform group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
