import type { Metadata } from 'next';
import { caseStudies } from '@/features/case-studies/content';
import CaseStudiesBrowserPreview from '@/components/public/case-studies/CaseStudiesBrowserPreview';
import { pageMetadata } from '@/lib/seo';
import operationsStats from '../../../../public/data/operations_stats.json';

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Case Studies Preview',
    description: 'Design proposal preview for Petromac case studies showcase.',
    path: '/case-studies-preview',
  }),
  // Nothing links here and it is out of the sitemap, but neither of those makes
  // a route private — it is a public URL with a canonical, so a shared link or
  // any crawler that finds it would index an unfinished page as real Petromac
  // content. On test the whole site is noindex, so this only ever bites once
  // the route is promoted; hence the explicit directive rather than relying on
  // "no one knows the URL". Remove it when the design goes live at /case-studies.
  robots: { index: false, follow: false },
};

export default function CaseStudiesPreviewPage() {
  const ordered = [...caseStudies].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  // Derived, not hardcoded, so the pills can't drift when a new edition lands.
  // The story count is deliberately NOT shown — leading with "46" undersells a
  // library people browse by problem, and it was dropped from /case-studies copy
  // for the same reason. Countries here is the count the STORIES actually cover
  // (21); the company-wide figures come from the operations snapshot, kept
  // separate so neither number implies the other.
  const storyCountries = new Set(ordered.map((cs) => cs.country)).size;

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {/* Hero Header */}
      <section className="relative py-16 px-6 bg-gradient-to-b from-slate-950 via-[#081a3a] to-slate-900 overflow-hidden border-b border-slate-800">
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent"
          aria-hidden="true"
        />
        <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400 font-semibold mb-3">
            Field Proven Performance
          </p>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Case Studies & Field Records
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-3xl leading-relaxed">
            Proven results from Petromac wireline conveyance, centralisation, and well intervention
            technologies across demanding global well profiles.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-2 border border-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Field stories from {storyCountries} countries</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-2 border border-slate-700">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span>
                {operationsStats.deployments.toLocaleString('en-US')}+ deployments worldwide
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="bg-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <CaseStudiesBrowserPreview studies={ordered} />
        </div>
      </div>
    </div>
  );
}
