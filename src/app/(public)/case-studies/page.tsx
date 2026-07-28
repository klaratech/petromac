import type { Metadata } from 'next';
import Link from 'next/link';
import { caseStudies } from '@/features/case-studies/content';
import CaseStudiesBrowser from '@/components/public/case-studies/CaseStudiesBrowser';
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
        <header className="max-w-3xl mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Case Studies
          </h1>
          <p className="text-slate-600 leading-relaxed">
            What the well demanded, how the tool string was configured, and what the logs show —
            well by well, worldwide. For the aggregate picture, see the{' '}
            <Link href="/track-record" className="text-brand font-medium hover:underline">
              track record
            </Link>
            .
          </p>
        </header>

        {/* Filters + the filtered-PDF actions + the card grid. The full set is
            passed in, so the initial HTML still contains all 46 stories and
            their links for crawlers and the no-JS path. */}
        <CaseStudiesBrowser studies={ordered} />
      </div>
    </div>
  );
}
