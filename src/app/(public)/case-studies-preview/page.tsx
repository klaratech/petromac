import type { Metadata } from 'next';
import { caseStudies } from '@/features/case-studies/content';
import CaseStudiesBrowserPreview from '@/components/public/case-studies/CaseStudiesBrowserPreview';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Case Studies Preview',
  description: 'Design proposal preview for Petromac case studies showcase.',
  path: '/case-studies-preview',
});

export default function CaseStudiesPreviewPage() {
  const ordered = [...caseStudies].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

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
              <span>46 Published Field Stories</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-2 border border-slate-700">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span>50+ Countries Worldwide</span>
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
