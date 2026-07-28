import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { caseStudies, getCaseStudy, imageAlt } from '@/features/case-studies/content';
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
  const firstImage = cs.body.find((b) => b.type === 'image');
  return pageMetadata({
    title: cs.title,
    description: cs.metaDescription,
    path: `/case-studies/${slug}`,
    ogImage: firstImage && {
      url: firstImage.src,
      width: firstImage.width,
      height: firstImage.height,
      alt: imageAlt(cs, firstImage.src),
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

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cs.title,
    description: cs.metaDescription,
    url: absoluteUrl(`/case-studies/${cs.slug}`),
    image: cs.body
      .filter((b) => b.type === 'image')
      .map((b) => absoluteUrl((b as { src: string }).src)),
    author: { '@type': 'Organization', name: 'Petromac' },
    publisher: { '@type': 'Organization', name: 'Petromac' },
    about: cs.products.map((p) => ({ '@type': 'Product', name: p })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Case Studies',
        item: absoluteUrl('/case-studies'),
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
              <Link href="/case-studies" className="hover:text-brand transition-colors">
                Case Studies
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
            {cs.products.map((p) => (
              <span
                key={p}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600"
              >
                {p}
              </span>
            ))}
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {cs.title}
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">{cs.headline}</p>
        </header>

        <div className="grid lg:grid-cols-[1fr_320px] gap-10 lg:gap-14 items-start">
          {/* Narrative: paragraphs interleaved with log/figure images */}
          {/* First image is usually the LCP — preload it via priority. */}
          <div className="space-y-6">
            {cs.body.map((block) =>
              block.type === 'paragraph' ? (
                <p key={block.text.slice(0, 48)} className="text-slate-600 leading-relaxed">
                  {block.text}
                </p>
              ) : (
                <figure
                  key={block.src}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <Image
                    src={block.src}
                    alt={imageAlt(cs, block.src)}
                    width={block.width}
                    height={block.height}
                    className="w-full h-auto object-contain"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority={block === cs.body.find((b) => b.type === 'image')}
                  />
                </figure>
              )
            )}
          </div>

          <aside className="space-y-8 rounded-xl border border-slate-200 bg-slate-50/60 p-6 lg:sticky lg:top-24">
            <SidePanel title="Challenge" paras={cs.challenge} />
            <SidePanel title="Solution" paras={cs.solution} />
            <SidePanel title="Results" paras={cs.results} />
          </aside>
        </div>

        <nav
          aria-label="More case studies"
          className="mt-14 border-t border-slate-100 pt-6 text-sm"
        >
          <Link href="/case-studies" className="font-semibold text-brand hover:underline">
            ← All case studies
          </Link>
        </nav>
      </article>
    </div>
  );
}
