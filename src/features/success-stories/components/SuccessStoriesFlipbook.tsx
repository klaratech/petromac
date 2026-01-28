'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { EmailPdfButton } from '@/components/shared/EmailPdfButton';
import { useDebounce } from '@/hooks/useDebounce';
import SuccessStoriesFilters from './SuccessStoriesFilters';
import {
  loadSuccessStoriesData,
} from '../services/successStories.service';
import {
  getAvailableOptions,
  getFilteredPageNumbers,
  getTotalStoryCount,
} from '../services/successStories.shared';
import type { SuccessStoriesFilters as FiltersState, SuccessStoryRow } from '../types';
import { FLIPBOOK_KEYS, buildFlipbookPageUrls, getFlipbookBasePath } from '@/features/flipbooks';
import { useFlipbookManifest } from '@/features/flipbooks/hooks/useFlipbookManifest';

const Flipbook = dynamic(() => import('@/components/shared/pdf/Flipbook'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[700px] flex items-center justify-center" aria-hidden="true">
      Loading flipbook...
    </div>
  ),
});

interface SuccessStoriesFlipbookProps {
  backHref: string;
  backLabel: string;
}

export default function SuccessStoriesFlipbook({ backHref, backLabel }: SuccessStoriesFlipbookProps) {
  const [filters, setFilters] = useState<FiltersState>({});
  const [csvData, setCsvData] = useState<SuccessStoryRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { manifest } = useFlipbookManifest(FLIPBOOK_KEYS.successStories);

  const debouncedFilters = useDebounce(filters, 200);

  useEffect(() => {
    loadSuccessStoriesData()
      .then((data) => {
        setCsvData(data);
        setIsLoadingData(false);
      })
      .catch(() => {
        setIsLoadingData(false);
      });
  }, []);

  const options = useMemo(() => getAvailableOptions(csvData, debouncedFilters), [csvData, debouncedFilters]);

  const allowedPages = useMemo(
    () => getFilteredPageNumbers(csvData, debouncedFilters),
    [csvData, debouncedFilters]
  );

  const totalStories = useMemo(() => getTotalStoryCount(csvData), [csvData]);

  useEffect(() => {
    setSelectedPages(allowedPages);
  }, [allowedPages]);

  const pages = useMemo(() => {
    if (!manifest) return [];

    const allPages = buildFlipbookPageUrls(FLIPBOOK_KEYS.successStories, manifest).map((url, index) => ({
      pageNumber: index + 1,
      url,
    }));

    return allPages
      .filter((page) => allowedPages.includes(page.pageNumber))
      .map((page) => page.url);
  }, [allowedPages, manifest]);

  const handleToggleSelection = (pageNumber: number) => {
    setSelectedPages((prev) => {
      if (prev.includes(pageNumber)) {
        return prev.filter((page) => page !== pageNumber);
      }
      return [...prev, pageNumber].sort((a, b) => a - b);
    });
  };

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
      const response = await fetch('/api/pdf/success-stories', {
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

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          {backLabel}
        </Link>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Success Stories</h2>
          <SuccessStoriesFilters filters={filters} options={options} onChange={setFilters} />
          {(filters.areas?.length || filters.companies?.length || filters.techs?.length) && (
            <button
              onClick={() => setFilters({})}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Success Stories</h1>
            <p className="text-gray-600 mt-1">
              {isLoadingData
                ? 'Loading data...'
                : allowedPages.length === 0
                ? 'No stories match the selected filters'
                : `Showing ${allowedPages.length} of ${totalStories} success stories`}
            </p>
        </div>
        <div className="flex flex-wrap gap-3">
            <EmailPdfButton
              pdfType="success-stories"
              pdfUrl={`${getFlipbookBasePath(FLIPBOOK_KEYS.successStories)}/source.pdf`}
              endpoint="/api/email/send-pdf"
              payload={{ pageNumbers: selectedPages, filters: debouncedFilters }}
              disabled={selectedPages.length === 0}
            />
            <button
              onClick={handleDownload}
              disabled={selectedPages.length === 0 || isDownloading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:bg-blue-300"
            >
              {isDownloading ? 'Preparing PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {downloadError && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {downloadError}
          </div>
        )}

        {isLoadingData || !manifest ? (
          <div className="bg-white rounded-lg shadow-lg p-6 flex items-center justify-center min-h-[700px]">
            <p className="text-gray-600">Loading success stories data...</p>
          </div>
        ) : allowedPages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-gray-600 text-lg mb-2">No stories match your filters</p>
              <button
                onClick={() => setFilters({})}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters to see all stories
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Flipbook
              pages={pages}
              pageNumbers={allowedPages}
              width={600}
              height={800}
              selectedPages={selectedPages}
              onToggleSelect={handleToggleSelection}
            />
          </div>
        )}
      </div>
    </main>
  );
}
