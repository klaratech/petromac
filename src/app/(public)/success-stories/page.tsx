import type { Metadata } from 'next';
import { caseStudies } from '@/features/case-studies/content';
import CaseStudiesBrowser from '@/components/public/case-studies/CaseStudiesBrowser';
import SeeAlso from '@/components/public/SeeAlso';
import JsonLd, { absoluteUrl } from '@/components/shared/JsonLd';
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

  // The hub as a machine-readable list of its 46 stories, in display order.
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Petromac success stories',
    numberOfItems: ordered.length,
    itemListElement: ordered.map((cs, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: cs.title,
      url: absoluteUrl(`/success-stories/${cs.slug}`),
    })),
  };

  return (
    <div className="bg-white">
      <JsonLd data={itemListSchema} />
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header: title + intro on the left, the evidence cross-links as a
            compact card on the right. Publications used to be a full-width
            band BELOW the grid; it is a card up here now (Rajesh, Aug 2026)
            because it is a signpost, not a destination — a reader deciding
            they want the formal record shouldn't have to scroll 46 stories to
            discover it exists. */}
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Success Stories
            </h1>
            <p className="text-slate-600 leading-relaxed">
              Field-proven results from demanding well programmes worldwide — and the innovations
              that delivered them.
            </p>
          </div>
          <SeeAlso current="/success-stories" />
        </header>

        {/* Filters + the filtered-PDF actions + the card grid. The full set is
            passed in, so the initial HTML still contains all 46 stories and
            their links for crawlers and the no-JS path. */}
        <CaseStudiesBrowser studies={ordered} />
      </div>
    </div>
  );
}
