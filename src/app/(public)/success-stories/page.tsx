import type { Metadata } from 'next';
import Link from 'next/link';
import { caseStudies } from '@/features/case-studies/content';
import CaseStudiesBrowser from '@/components/public/case-studies/CaseStudiesBrowser';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Success Stories — Wireline Logging Case Studies',
  description:
    'Field-proven results from Petromac wireline conveyance and centralisation: world-record deviations, rig-time savings, and data-quality wins worldwide.',
  path: '/success-stories',
});

export default function SuccessStoriesPage() {
  // Newest stories first — year is null for a handful of undated ones,
  // which sort after the dated ones in original page order.
  const ordered = [...caseStudies].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* No max-width on the header: the intro is meant to sit on ONE line at
            desktop, which a max-w-3xl container forces to wrap. Tightened
            bottom margin so the filter box sits higher up the page. */}
        <header className="mb-5">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Success Stories
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Field-proven results from demanding well programmes worldwide — and the
            innovations that delivered them.
          </p>
          {/* Publications left the About menu (Aug 2026) and is surfaced here
              instead: an SPE paper is the peer-reviewed end of the same
              evidence these stories tell informally, so a reader who wants
              harder proof is already in the right place. Interim — where
              Publications ultimately belongs is still open (see TODO). */}
          <p className="mt-2 text-sm text-slate-500">
            For the peer-reviewed record, see our{' '}
            <Link
              href="/about/publications"
              className="font-medium text-brand hover:underline"
            >
              published papers
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
