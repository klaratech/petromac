import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { caseStudies, getCaseStudy } from '@/features/case-studies/content';
import {
  caseStudyCategories,
  categoryLabel,
  deviceCatalogLink,
  relatedCaseStudies,
} from '@/features/case-studies/filters';
import JsonLd, { absoluteUrl } from '@/components/shared/JsonLd';
import { pageMetadata } from '@/lib/seo';

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
    title: cs.title,
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
            {p}
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
    author: { '@type': 'Organization', name: 'Petromac' },
    publisher: { '@type': 'Organization', name: 'Petromac' },
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
        </header>

        <div className="grid lg:grid-cols-[1fr_320px] gap-10 lg:gap-14 items-start">
          <div>
            {/* Narrative */}
            <div className="space-y-5 mb-10">
              {cs.narrative.map((p) => (
                <p key={p.slice(0, 48)} className="text-slate-600 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>

            {/* The published story page — carries the figures and logs */}
            <figure className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Image
                src={cs.image.src}
                alt={`${cs.title} — published success story with figures`}
                width={cs.image.width}
                height={cs.image.height}
                className="w-full h-auto object-contain"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
              <figcaption className="mt-3 text-center text-sm text-slate-500">
                As published in the Petromac success stories collection —{' '}
                <Link href="/success-stories" className="font-medium text-brand hover:underline">
                  browse the full collection
                </Link>
              </figcaption>
            </figure>
          </div>

          <aside className="space-y-8 rounded-xl border border-slate-200 bg-slate-50/60 p-6 lg:sticky lg:top-24">
            <SidePanel title="Challenge" paras={cs.challenge} />
            <SidePanel title="Solution" paras={cs.solution} />
            <SidePanel title="Results" paras={cs.results} />
          </aside>
        </div>

        {/* Where this story leads. Until Aug 2026 the page ended here with a
            single link back to the hub, so every story was a crawl dead end
            and a reader who finished one had nowhere to go.
            Order matters: the product/track-record/contact line comes FIRST
            because it follows straight on from the story you just read, then
            related stories as the "or read another" step. The old
            "← All success stories" link was dropped — the figure caption above
            already says "browse the full collection", and two links to the hub
            on one page is just noise. */}
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
