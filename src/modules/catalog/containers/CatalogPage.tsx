'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CatalogPanel } from '@/components/shared/panels';
import type { CatalogFilters } from '../types/catalog.types';
import CircularGallery from '@/components/kiosk/CircularGallery';

const models = [
  { name: 'TTB-S75', file: '/models/ttbs75.glb' },
  { name: 'CP-12', file: '/models/cp12.glb' },
  { name: 'CP-8', file: '/models/cp8.glb' },
  { name: 'Helix', file: '/models/helix.glb' },
];

export default function CatalogPage() {
  const [filters, setFilters] = useState<CatalogFilters>({});

  const handleRequestBuildPdf = (_currentFilters: CatalogFilters) => {
    // Redirect to flipbook page
    window.location.href = '/catalog/flipbook';
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

      {/* View Catalog Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          href="/catalog/flipbook"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          View Full Catalog
        </Link>
      </div>
    </div>
  );
}
