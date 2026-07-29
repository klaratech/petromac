'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { buildClientApiUrl } from '@/lib/api';
import { EmailPdfButton } from '@/components/shared/EmailPdfButton';
import type { CaseStudy } from '@/features/case-studies/content';
import {
  buildCaseStudyOptions,
  caseStudyCategories,
  filterCaseStudies,
  isQueryActive,
  pageNumbersFor,
  type CaseStudyQuery,
} from '@/features/case-studies/filters';

export default function CaseStudiesBrowserPreview({ studies }: { studies: CaseStudy[] }) {
  const [query, setQuery] = useState<CaseStudyQuery>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const options = useMemo(() => buildCaseStudyOptions(studies), [studies]);
  const results = useMemo(() => filterCaseStudies(studies, query), [studies, query]);
  const active = isQueryActive(query);
  const pageNumbers = useMemo(() => pageNumbersFor(results), [results]);
  const requestPages = active ? pageNumbers : undefined;

  const set = <K extends keyof CaseStudyQuery>(key: K, value: CaseStudyQuery[K]) =>
    setQuery((q) => ({ ...q, [key]: value || undefined }));

  const pdfFilters = {
    ...(query.region ? { areas: [query.region] } : {}),
    ...(query.device ? { techs: [query.device] } : {}),
  };

  const handleDownload = async () => {
    if (pageNumbers.length === 0) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch(buildClientApiUrl('/api/pdf/success-stories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumbers: requestPages, mode: 'download' }),
      });
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = active
        ? `petromac-case-studies-${pageNumbers.length}-stories.pdf`
        : 'petromac-case-studies.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setDownloadError('Couldn’t build the PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const selectClass =
    'w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30';
  const labelClass =
    'block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5';

  return (
    <>
      {/* Filter Header Box */}
      <section
        aria-labelledby="filter-stories"
        className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-6 md:p-8 backdrop-blur-md -mt-8 relative z-20"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h2 id="filter-stories" className="font-heading text-lg font-bold text-white">
              Filter Case Studies
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Filter by keyword, region, engineering challenge, or product line.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || pageNumbers.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand/90 disabled:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {isDownloading ? 'Building…' : active ? `Download ${results.length}` : 'Download all'}
            </button>
            <EmailPdfButton
              pdfType="success-stories"
              endpoint={buildClientApiUrl('/api/email/send-pdf')}
              payload={{ pageNumbers: requestPages, filters: pdfFilters }}
              disabled={pageNumbers.length === 0}
              buttonLabel="Email"
            />
          </div>
        </div>

        {/* Search */}
        <div className="mt-5">
          <label htmlFor="cs-search" className={labelClass}>
            Search
          </label>
          <input
            id="cs-search"
            type="search"
            value={query.text ?? ''}
            onChange={(e) => set('text', e.target.value)}
            placeholder="Search keywords, countries, tools (e.g. 80° deviation, ledge, Vietnam)..."
            className={selectClass}
          />
        </div>

        {/* Filters */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="cs-region" className={labelClass}>
              Region
            </label>
            <select
              id="cs-region"
              value={query.region ?? ''}
              onChange={(e) => set('region', e.target.value)}
              className={selectClass}
            >
              <option value="">All regions</option>
              {options.regions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value} ({o.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cs-category" className={labelClass}>
              Challenge / Application
            </label>
            <select
              id="cs-category"
              value={query.category ?? ''}
              onChange={(e) => set('category', e.target.value)}
              className={selectClass}
            >
              <option value="">All challenges</option>
              {options.categories.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value} ({o.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cs-device" className={labelClass}>
              Product Line
            </label>
            <select
              id="cs-device"
              value={query.device ?? ''}
              onChange={(e) => set('device', e.target.value)}
              className={selectClass}
            >
              <option value="">All products</option>
              {options.devices.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value} ({o.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cs-company" className={labelClass}>
              Service Company
            </label>
            <select
              id="cs-company"
              value={query.company ?? ''}
              onChange={(e) => set('company', e.target.value)}
              className={selectClass}
            >
              <option value="">All companies</option>
              {options.companies.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} ({o.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <p>
            Showing <span className="font-semibold text-white">{results.length}</span> of{' '}
            <span className="font-semibold text-white">{studies.length}</span> case studies
          </p>
          {active && (
            <button
              type="button"
              onClick={() => setQuery({})}
              className="font-semibold text-blue-400 underline underline-offset-2 hover:text-blue-300 focus:outline-none"
            >
              Clear filters
            </button>
          )}
        </div>
        {downloadError && <p className="mt-2 text-xs text-red-400">{downloadError}</p>}
      </section>

      {/* Grid */}
      {results.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-600">No case studies match the selected filters.</p>
          <button
            type="button"
            onClick={() => setQuery({})}
            className="mt-3 text-sm font-semibold text-brand underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((cs) => {
            const primaryCategory = caseStudyCategories(cs)[0];
            return (
              <li key={cs.slug}>
                <Link
                  href={`/case-studies/${cs.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-brand/40 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {/* Visual Image Header Frame */}
                  <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                    <Image
                      src={cs.image.src}
                      alt={cs.title}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

                    {/* Top Pill Overlay */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                      <span className="rounded-full bg-slate-950/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
                        📍 {cs.country}
                      </span>
                      {cs.device && (
                        <span className="rounded-full bg-brand/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-sm">
                          {cs.device}
                        </span>
                      )}
                    </div>

                    {/* Bottom Category Overlay */}
                    {primaryCategory && (
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="rounded-md bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2 py-0.5 text-[11px] font-semibold tracking-wide backdrop-blur-md uppercase">
                          {primaryCategory}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-heading text-base font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors">
                      {cs.title}
                    </h3>
                    <p className="mt-2.5 text-xs text-slate-600 leading-relaxed line-clamp-3 flex-1">
                      {cs.metaDescription}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand">
                      <span>View case study</span>
                      <span
                        aria-hidden="true"
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
