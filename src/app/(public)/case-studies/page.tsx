import type { Metadata } from 'next';
import Link from 'next/link';
import { caseStudies } from '@/features/case-studies/content';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Case Studies',
  description:
    'Field-proven results from Petromac wireline conveyance and centralisation: world-record deviations, rig-time savings, and data-quality wins worldwide.',
  path: '/case-studies',
});

export default function CaseStudiesPage() {
  // Newest stories first — year is null for a handful of undated ones,
  // which sort after the dated ones in original page order.
  const ordered = [...caseStudies].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="max-w-3xl mb-10">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Case Studies
          </h1>
          <p className="text-slate-600 leading-relaxed">
            {caseStudies.length} field stories from operations worldwide — what the well demanded,
            how the tool string was configured, and what the logs show. For the aggregate picture,
            see the{' '}
            <Link href="/track-record" className="text-brand font-medium hover:underline">
              track record
            </Link>
            ; to read the stories as published, open the{' '}
            <Link
              href="/success-stories/flipbook"
              className="text-brand font-medium hover:underline"
            >
              success stories flipbook
            </Link>
            .
          </p>
        </header>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ordered.map((cs) => (
            <li key={cs.slug}>
              <Link
                href={`/case-studies/${cs.slug}`}
                className="group flex h-full flex-col rounded-xl border border-slate-200 p-6 transition-all hover:border-brand/40 hover:shadow-card"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 font-semibold text-brand">
                    {cs.country}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                    {cs.device}
                  </span>
                  {cs.year && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                      {cs.year}
                    </span>
                  )}
                </div>
                <h2 className="font-heading text-lg font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors">
                  {cs.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {cs.metaDescription}
                </p>
                <span className="mt-auto pt-4 text-sm font-semibold text-brand">
                  Read the case study →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
