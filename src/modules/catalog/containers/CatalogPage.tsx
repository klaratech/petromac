'use client';

import { useState } from 'react';
import { CatalogPanel } from '@/components/shared/panels';
import { PDFBuilderModal } from '@/components/shared/pdf';
import type { CatalogFilters } from '../types/catalog.types';
import CircularGallery from '@/components/CircularGallery';

const models = [
  { name: 'TTB-S75', file: '/models/ttbs75.glb' },
  { name: 'CP-12', file: '/models/cp12.glb' },
  { name: 'CP-8', file: '/models/cp8.glb' },
  { name: 'Helix', file: '/models/helix.glb' },
];

export default function CatalogPage() {
  const [filters, setFilters] = useState<CatalogFilters>({});
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const handleRequestBuildPdf = (currentFilters: CatalogFilters) => {
    setFilters(currentFilters);
    setIsPdfModalOpen(true);
  };

  const handleBuildPdf = async (_options: Record<string, unknown>) => {
    // Placeholder - actual catalog PDF build logic will be implemented
    // For now, return a static catalog URL
    return '/catalog.pdf';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
          <p className="mt-2 text-gray-600">
            Browse our complete product catalog and build custom documentation
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Filters Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Filter Products</h2>
            <CatalogPanel
              filters={filters}
              onFiltersChange={setFilters}
              onRequestBuildPdf={handleRequestBuildPdf}
            />
          </div>

          {/* Right: 3D Model Gallery */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Models</h2>
            <div className="h-[600px]">
              <CircularGallery models={models} onClose={() => {}} />
            </div>
          </div>
        </div>
      </div>

      {/* PDF Builder Modal */}
      <PDFBuilderModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="Build Custom Catalog PDF"
        onBuild={handleBuildPdf}
        defaultOptions={filters as Record<string, unknown>}
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Your custom catalog will include products matching the selected filters.
          </p>
        </div>
      </PDFBuilderModal>
    </div>
  );
}
