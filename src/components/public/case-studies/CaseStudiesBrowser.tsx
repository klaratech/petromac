'use client';

import { useMemo, useState } from 'react';
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

/**
 * The /case-studies browser: free-text search + region/category/product
 * filters over all 46 stories, with the filtered set available as a PDF
 * (download or email).
 *
 * This is the surface that replaced the public success-stories flipbook
 * (Jul 2026). The filtered PDF still comes from the flipbook's own pages —
 * every story carries its `page` number, which is exactly what
 * `/api/pdf/success-stories` takes — so retiring the viewer cost nothing.
 *
 * Cards are rendered here rather than on the server because the list is
 * filtered client-side; the full set is in the initial HTML, so the no-JS and
 * crawler view is still all 46 stories with their links.
 */
export default function CaseStudiesBrowser({ studies }: { studies: CaseStudy[] }) {
  const [query, setQuery] = useState<CaseStudyQuery>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const options = useMemo(() => buildCaseStudyOptions(studies), [studies]);
  const results = useMemo(() => filterCaseStudies(studies, query), [studies, query]);
  const active = isQueryActive(query);
  const pageNumbers = useMemo(() => pageNumbersFor(results), [results]);
  /**
   * Unfiltered means "the whole publication", so send NO page list and let the
   * backend return the source PDF untouched — that way you get the editorial
   * front matter (pages 2-3) too, not just cover + stories + back. A filtered
   * request sends its pages and the backend wraps them in cover/back.
   */
  const requestPages = active ? pageNumbers : undefined;

  const set = <K extends keyof CaseStudyQuery>(key: K, value: CaseStudyQuery[K]) =>
    setQuery((q) => ({ ...q, [key]: value || undefined }));

  // Keeps the emailed/downloaded filename meaningful — the backend derives it
  // from these (see build_filtered_filename).
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
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
  const labelClass = 'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1';

  return (
    <>
      <section
        aria-labelledby="filter-stories"
        className="rounded-2xl border border-slate-200 bg-white shadow-card p-5 md:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="filter-stories" className="font-heading text-base font-bold text-slate-900">
              Filter the stories
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Search the text, or narrow by region, challenge and product line.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || pageNumbers.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand/90 disabled:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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

        {/* Search gets its own line — it's the broadest way in and reads badly
            squeezed beside three dropdowns. The four filters sit under it. */}
        <div className="mt-4">
          <label htmlFor="cs-search" className={labelClass}>
            Search
          </label>
          <input
            id="cs-search"
            type="search"
            value={query.text ?? ''}
            onChange={(e) => set('text', e.target.value)}
            placeholder="e.g. ledge, world record, CCS"
            className={selectClass}
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              Challenge
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
              Product line
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
              Service company
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

        {/* No running total: whether it's 46 or 56 tells nobody anything, and
            it dates the page. The only count worth stating is zero, handled by
            the empty state below. The Download label carries the number where
            it's actually actionable. */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            For the aggregate picture, see the{' '}
            <Link href="/track-record" className="font-medium text-brand hover:underline">
              track record
            </Link>
            .
          </p>
          {active && (
            <button
              type="button"
              onClick={() => setQuery({})}
              className="text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-brand hover:decoration-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Clear filters
            </button>
          )}
        </div>
        {downloadError && <p className="mt-2 text-xs text-red-600">{downloadError}</p>}
      </section>

      {results.length === 0 ? (
        <p className="mt-10 text-sm text-slate-500">
          No stories match those filters — try clearing one, or search for a country or tool.
        </p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((cs) => (
            <li key={cs.slug}>
              <Link
                href={`/case-studies/${cs.slug}`}
                className="group flex h-full flex-col rounded-xl border border-slate-200 p-6 transition-all hover:border-brand/40 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 font-semibold text-brand">
                    {cs.country}
                  </span>
                  {cs.device && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                      {cs.device}
                    </span>
                  )}
                  {caseStudyCategories(cs)[0] && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                      {caseStudyCategories(cs)[0]}
                    </span>
                  )}
                </div>
                {/* No "Read the case study" line: the whole card is the link,
                    and 46 repetitions of the same sentence is wallpaper. The
                    affordance is the title colouring on hover plus an arrow
                    that slides — always visible, so it works on touch too. */}
                <h3 className="font-heading text-lg font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors">
                  {cs.title}
                  <span
                    aria-hidden="true"
                    className="ml-1.5 inline-block align-baseline text-base font-normal text-brand transition-transform duration-200 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {cs.metaDescription}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
