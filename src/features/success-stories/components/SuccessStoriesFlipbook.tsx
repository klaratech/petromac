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
import { SUCCESS_STORIES_TOTAL_PAGES } from '../config/options';

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

  const pages = useMemo(() => {
    const allPages = Array.from({ length: SUCCESS_STORIES_TOTAL_PAGES }, (_, i) => ({
      pageNumber: i + 1,
      url: `/flipbooks/successstories/page-${String(i + 1).padStart(3, '0')}.jpg`,
    }));

    return allPages
      .filter((page) => allowedPages.includes(page.pageNumber))
      .map((page) => page.url);
  }, [allowedPages]);

  const flipbookKey = useMemo(
    () => JSON.stringify({ areas: filters.areas, companies: filters.companies, techs: filters.techs }),
    [filters]
  );

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

        <div className="flex justify-between items-center mb-6">
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
          <div className="flex gap-3">
            <EmailPdfButton pdfUrl="/data/successstories.pdf" pdfType="success-stories" />
            <a
              href="/data/successstories.pdf"
              download
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Download PDF
            </a>
          </div>
        </div>

        {isLoadingData ? (
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
            <Flipbook key={flipbookKey} pages={pages} width={600} height={800} />
          </div>
        )}
      </div>
    </main>
  );
}
