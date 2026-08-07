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
        </header>

        {/* Filters + the filtered-PDF actions + the card grid. The full set is
            passed in, so the initial HTML still contains all 46 stories and
            their links for crawlers and the no-JS path. */}
        <CaseStudiesBrowser studies={ordered} />

        <PublicationsCard />
      </div>
    </div>
  );
}

/**
 * Publications lives on this page now — this is its DESTINATION, not a
 * signpost (Rajesh, Aug 2026). It left the About cluster entirely: an SPE or
 * SPWLA paper is the peer-reviewed end of the same evidence these stories tell
 * informally, so a reader who wants harder proof is already in the right
 * place.
 *
 * PLACEMENT IS UNDER REVIEW. It sits below the grid on the reasoning that the
 * progression reads "browse the field record, then the formal record", and
 * that a card up top would compete with the filter panel for the first
 * glance. That is a guess, not a finding — so this is a self-contained
 * component taking no props: moving it above `<CaseStudiesBrowser />`, or into
 * the header, is a one-line change with nothing to rewire.
 *
 * The `/about/publications` ROUTE is unchanged and still in the sitemap.
 * `/about/patents`, `/track-record` and `/contact` still link it too; those
 * are transitional and can go once this card is settled — but check the count
 * before pruning, or the page ends up reachable from the sitemap alone.
 */
function PublicationsCard() {
  return (
    <section className="mt-10">
      <Link
        href="/about/publications"
        className="group block rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-colors hover:border-brand/40 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
              The peer-reviewed record
            </p>
            <h2 className="mt-1.5 font-heading text-xl font-bold text-slate-900 group-hover:text-brand transition-colors">
              Publications
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              SPE, SPWLA, IPTC and related papers — the same results as the
              stories above, written up and peer reviewed.
            </p>
          </div>
          {/* Decorative: the card itself is the link, so this must not be
              announced or focusable. */}
          <span
            aria-hidden="true"
            className="mt-1 shrink-0 text-brand transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </div>
      </Link>
    </section>
  );
}
