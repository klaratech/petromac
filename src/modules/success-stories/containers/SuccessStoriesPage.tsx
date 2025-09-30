'use client';

import { useState } from 'react';
import { SuccessStoriesPanel } from '@/components/shared/panels';
import { PDFBuilderModal } from '@/components/shared/pdf';
import type { SuccessStoriesFilters } from '../types/successStories.types';

export default function SuccessStoriesPage() {
  const [filters, setFilters] = useState<SuccessStoriesFilters>({});
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const handleRequestBuildPdf = (currentFilters: SuccessStoriesFilters) => {
    setFilters(currentFilters);
    setIsPdfModalOpen(true);
  };

  const handleBuildPdf = async (_options: Record<string, unknown>) => {
    // Build the PDF with the current filters
    const formData = new FormData();
    formData.append('filters_json', JSON.stringify(filters));
    formData.append('case_insensitive', 'true');

    const response = await fetch('/api/successstories', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'PDF generation failed');
    }

    // Create a blob URL for the PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    return url;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Success Stories</h1>
              <p className="mt-2 text-gray-600">
                Browse and filter Petromac success stories by region, technology, and application
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Filters Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Filter Success Stories</h2>
            <SuccessStoriesPanel
              filters={filters}
              onFiltersChange={setFilters}
              onRequestBuildPdf={handleRequestBuildPdf}
            />
          </div>

          {/* Right: PDF Preview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Success Stories Collection</h2>
            <p className="text-gray-600 mb-4">
              View the complete success stories document or use the filters to create a customized PDF.
            </p>

            {/* PDF Embed */}
            <div className="w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                src="/successstories.pdf"
                className="w-full h-full"
                title="Success Stories PDF"
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Filtering</h3>
            <p className="text-gray-600">Filter stories by region, technology, device type, and application category.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom PDF Export</h3>
            <p className="text-gray-600">Generate customized PDF documents with only the success stories that match your criteria.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive Database</h3>
            <p className="text-gray-600">Access our complete collection of success stories from projects worldwide.</p>
          </div>
        </div>
      </div>

      {/* PDF Builder Modal */}
      <PDFBuilderModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="Build Custom Success Stories PDF"
        onBuild={handleBuildPdf}
        defaultOptions={filters as Record<string, unknown>}
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Your custom PDF will include success stories matching the selected filters.
          </p>
        </div>
      </PDFBuilderModal>
    </div>
  );
}
