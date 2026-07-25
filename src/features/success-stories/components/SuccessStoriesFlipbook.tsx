'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { preload } from 'react-dom';
import Link from 'next/link';
import { EmailPdfButton } from '@/components/shared/EmailPdfButton';
import { buildClientApiUrl } from '@/lib/api';
import SuccessStoriesFilters from './SuccessStoriesFilters';
import FlipbookErrorBoundary from './FlipbookErrorBoundary';
import { loadSuccessStoriesData } from '../services/successStories.service';
import {
  getAvailableOptions,
  getFilteredPageNumbers,
  getTotalStoryCount,
} from '../services/successStories.shared';
import type { SuccessStoriesFilters as FiltersState, SuccessStoryRow } from '../types';
import { FLIPBOOK_KEYS, buildFlipbookPageUrls, getFlipbookBasePath } from '@/features/flipbooks';
import { useFlipbookManifest } from '@/features/flipbooks/hooks/useFlipbookManifest';

const Flipbook = dynamic(() => import('@/components/shared/flipbook/Flipbook'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[700px] flex items-center justify-center" aria-hidden="true">
      Loading flipbook...
    </div>
  ),
});

/**
 * Page numbers that the deck has but tags.csv doesn't cover.
 *
 *   1                  cover
 *   2-3                "About us" + product-category intro (no per-story tags)
 *   4-47               tagged story pages — tags.csv lives here
 *   {manifest pageCount} back cover
 *
 * Without this constant the unfiltered flipbook would render 46 pages
 * (covers + tagged) and the matching PDF download would skip pages 2-3.
 * We always include 1 / 2 / 3 / last so the intro material stays
 * visible whether filters are active or not.
 */
const ALWAYS_INCLUDE_PAGES = [1, 2, 3];

interface SuccessStoriesFlipbookProps {
  /** Where the "back" control should navigate. Either pass a route via
   *  `backHref` (renders a Link) or `onBack` (renders a button that calls
   *  it — useful when embedding inside another experience). */
  backHref?: string;
  onBack?: () => void;
  backLabel: string;
  /** Optional pre-selected filter state — used when opening the flipbook
   *  from a context where the relevant filter is obvious (e.g. the kiosk
   *  Helix/Rocker Case Studies map opens Success Stories pre-filtered to
   *  techs: ['Focus-CH']). */
  initialFilters?: FiltersState;
}

export default function SuccessStoriesFlipbook({
  backHref,
  onBack,
  backLabel,
  initialFilters,
}: SuccessStoriesFlipbookProps) {
  const [filters, setFilters] = useState<FiltersState>(initialFilters ?? {});
  const [csvData, setCsvData] = useState<SuccessStoryRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { manifest } = useFlipbookManifest(FLIPBOOK_KEYS.successStories);

  // Kick off the first spread's image downloads in parallel with the
  // page-flip chunk. Runs in an effect, NOT during render: react-dom
  // preload() calls in the render path write into the SSR stream and
  // truncated it mid-flush (Next 16 turbopack dev), leaving the route
  // stuck on its Suspense fallback.
  useEffect(() => {
    for (const url of buildFlipbookPageUrls(FLIPBOOK_KEYS.successStories, manifest).slice(0, 2)) {
      preload(url, { as: 'image', fetchPriority: 'high' });
    }
  }, [manifest]);

  useEffect(() => {
    // Warm the page-flip chunk while the tags CSV downloads — the Flipbook
    // only renders after the data lands, and without this the chunk request
    // would start serially at that point.
    void import('@/components/shared/flipbook/Flipbook');
    loadSuccessStoriesData()
      .then((data) => {
        setCsvData(data);
        setIsLoadingData(false);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load success stories data');
        setIsLoadingData(false);
      });
  }, []);

  const options = useMemo(() => getAvailableOptions(csvData, filters), [csvData, filters]);

  const allowedPages = useMemo(() => getFilteredPageNumbers(csvData, filters), [csvData, filters]);

  const totalStories = useMemo(() => getTotalStoryCount(csvData), [csvData]);

  // Front/back covers + intro pages 2-3 ride alongside the tagged pages
  // whether filters are active or not.
  const supportingPages = useMemo<number[]>(() => {
    if (!manifest) return [];
    return [...ALWAYS_INCLUDE_PAGES, manifest.pageCount];
  }, [manifest]);

  // Pages that Download/Email send — simply the visible set (filtered
  // stories + covers/intro). Was toggleable state while the flipbook had
  // a per-page Exclude control; that was dropped in Jul 2026.
  const selectedPages = useMemo(
    () => Array.from(new Set([...allowedPages, ...supportingPages])).sort((a, b) => a - b),
    [allowedPages, supportingPages]
  );

  const displayPages = useMemo(() => {
    if (!manifest) return [];

    const allPages = buildFlipbookPageUrls(FLIPBOOK_KEYS.successStories, manifest).map(
      (url, index) => ({
        pageNumber: index + 1,
        url,
      })
    );

    const includeSet = new Set<number>([...allowedPages, ...supportingPages]);

    return allPages.filter((page) => includeSet.has(page.pageNumber));
  }, [allowedPages, supportingPages, manifest]);

  const pageUrls = useMemo(() => displayPages.map((page) => page.url), [displayPages]);
  const pageNumbers = useMemo(() => displayPages.map((page) => page.pageNumber), [displayPages]);

  const buildDownloadFilename = () => {
    const parts: string[] = ['petromac', 'successstories'];

    const appendFilters = (values?: string[]) => {
      if (!values || values.length === 0) return;
      const normalized = values
        .map((value) =>
          value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        )
        .filter(Boolean)
        .join('-');
      if (normalized) parts.push(normalized);
    };

    appendFilters(filters.areas);
    appendFilters(filters.companies);
    appendFilters(filters.techs);

    const date = new Date().toISOString().slice(0, 10);
    parts.push(date);

    return `${parts.join('_')}.pdf`;
  };

  const handleDownload = async () => {
    if (selectedPages.length === 0) return;
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const response = await fetch(buildClientApiUrl('/api/pdf/success-stories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumbers: selectedPages, mode: 'download' }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = buildDownloadFilename();
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const hasActiveFilter = Boolean(
    filters.areas?.length || filters.companies?.length || filters.techs?.length
  );

  // No default-state blurb — the subtitle only appears when it carries
  // information (loading, filter feedback, empty result).
  const subtitle = isLoadingData
    ? 'Loading stories…'
    : allowedPages.length === 0
      ? 'No stories match the current filters.'
      : hasActiveFilter
        ? `Showing ${allowedPages.length} of ${totalStories} stories that match your filters.`
        : null;

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="container mx-auto px-4 pt-10 md:pt-12 pb-6 md:pb-8">
        {/* Back nav — small, sits above the headline */}
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <BackArrow />
            {backLabel}
          </button>
        ) : backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <BackArrow />
            {backLabel}
          </Link>
        ) : null}

        {/* Headline row — Track Record style: big bold title with brand-navy
            accent word, primary actions aligned right on wide screens. */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-8">
          <div className="max-w-3xl">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.05]">
              Success <span className="text-brand">Stories</span>.
            </h1>
            {subtitle && <p className="mt-4 text-base md:text-lg text-slate-600">{subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-end">
            <EmailPdfButton
              pdfType="success-stories"
              pdfUrl={`${getFlipbookBasePath(FLIPBOOK_KEYS.successStories)}/source.pdf`}
              endpoint={buildClientApiUrl('/api/email/send-pdf')}
              payload={{ pageNumbers: selectedPages, filters }}
              disabled={selectedPages.length === 0}
            />
            <button
              onClick={handleDownload}
              disabled={selectedPages.length === 0 || isDownloading}
              className="inline-flex items-center gap-2 whitespace-nowrap px-6 py-3 rounded-full font-semibold text-sm text-white bg-brand hover:bg-brand/90 shadow-lg shadow-blue-900/20 ring-1 ring-blue-900/10 transition-all hover:-translate-y-px hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-50 disabled:bg-slate-300 disabled:hover:bg-slate-300 disabled:hover:translate-y-0 disabled:hover:shadow-lg disabled:cursor-not-allowed"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
                />
              </svg>
              {isDownloading ? 'Preparing PDF…' : 'Download PDF'}
            </button>
          </div>
        </div>
      </section>

      {/* Filter card */}
      <section className="container mx-auto px-4 pb-6">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-medium">
              Filter stories
            </p>
            {hasActiveFilter && (
              <button
                onClick={() => setFilters({})}
                className="text-xs font-medium text-brand hover:text-brand/80 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          <SuccessStoriesFilters filters={filters} options={options} onChange={setFilters} />
        </div>
      </section>

      {downloadError && (
        <section className="container mx-auto px-4 pb-4">
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {downloadError}
          </div>
        </section>
      )}

      {/* Flipbook frame — same rounded-2xl white card the rest of the page uses */}
      <section className="container mx-auto px-4 pb-12 md:pb-16">
        {loadError ? (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Couldn&apos;t load success stories
            </h3>
            <p className="text-slate-600 max-w-md">{loadError}</p>
            <p className="text-slate-600 max-w-md mt-3">
              Please try refreshing the page — or{' '}
              <Link href="/#contact" className="text-brand font-semibold hover:underline">
                contact us
              </Link>{' '}
              and we&apos;ll send you the success stories directly.
            </p>
          </div>
        ) : isLoadingData || !manifest ? (
          <div
            className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 flex items-center justify-center min-h-[600px] text-slate-500"
            role="status"
          >
            Loading success stories…
          </div>
        ) : allowedPages.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
            <p className="text-slate-900 text-lg font-semibold mb-2">
              No stories match your filters
            </p>
            <p className="text-slate-500 text-sm mb-6">
              Try clearing one of the filter dimensions, or start fresh.
            </p>
            <button
              onClick={() => setFilters({})}
              className="px-5 py-2 rounded-full bg-brand text-white font-semibold hover:bg-brand/90 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 md:p-8">
            <FlipbookErrorBoundary>
              {/* Key on the page-set so React fully remounts the Flipbook
                  when the filter changes the included pages. PageFlip's
                  internal destroy() races with its rebuild and used to
                  throw `NotFoundError: insertBefore ...` on rapid filter
                  changes; a clean unmount/mount sidesteps that path. */}
              <Flipbook key={pageNumbers.join('-')} pages={pageUrls} width={600} height={800} />
            </FlipbookErrorBoundary>
          </div>
        )}
      </section>
    </div>
  );
}

function BackArrow() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}
