"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { EmailPdfButton } from "@/components/shared/EmailPdfButton";
import { Filters, type FiltersState } from "@/components/successstories/Filters";
import {
  loadSuccessStoriesData,
  filterSuccessStories,
} from "@/lib/successStoriesFilters";
import type { SuccessStoryRow } from "@/data/successStoriesOptions";

const Flipbook = dynamic(() => import("@/components/shared/pdf/Flipbook"), {
  ssr: false,
  loading: () => <div className="min-h-[700px] flex items-center justify-center" aria-hidden="true">Loading flipbook...</div>,
});

export default function SuccessStoriesFlipbookPage() {
  const [filters, setFilters] = useState<FiltersState>({
    areas: [],
    companies: [],
    techs: [],
  });
  const [csvData, setCsvData] = useState<SuccessStoryRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load CSV data on mount
  useEffect(() => {
    loadSuccessStoriesData()
      .then((data) => {
        setCsvData(data);
        setIsLoadingData(false);
      })
      .catch((error) => {
        console.error("Failed to load success stories data:", error);
        setIsLoadingData(false);
      });
  }, []);

  // Calculate filtered page numbers (memoized to prevent unnecessary recalculations)
  const allowedPages = useMemo(
    () => filterSuccessStories(csvData, filters),
    [csvData, filters]
  );

  // Generate filtered page URLs (memoized to prevent flipbook re-initialization)
  const pages = useMemo(() => {
    const allPages = Array.from({ length: 47 }, (_, i) => ({
      pageNumber: i + 1,
      url: `/flipbooks/successstories/page-${String(i + 1).padStart(3, "0")}.jpg`,
    }));

    return allPages
      .filter((page) => allowedPages.includes(page.pageNumber))
      .map((page) => page.url);
  }, [allowedPages]);

  // Create a stable key for the flipbook that only changes when filters change
  const flipbookKey = useMemo(
    () => JSON.stringify({ areas: filters.areas, companies: filters.companies, techs: filters.techs }),
    [filters]
  );

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <Filters value={filters} onChange={setFilters} />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Success Stories</h1>
            <p className="text-gray-600 mt-1">
              {isLoadingData
                ? "Loading data..."
                : allowedPages.length === 0
                ? "No stories match the selected filters"
                : `Showing ${allowedPages.length} of 43 success stories`}
            </p>
          </div>
          <div className="flex gap-3">
            <EmailPdfButton 
              pdfUrl="/data/successstories.pdf"
              pdfType="success-stories"
            />
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
                onClick={() => setFilters({ areas: [], companies: [], techs: [] })}
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
