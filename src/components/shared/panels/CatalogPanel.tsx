'use client';

import type { CatalogFilters } from '@/modules/catalog/types/catalog.types';

export interface CatalogPanelProps {
  filters?: Partial<CatalogFilters>;
  onFiltersChange?: (_filters: CatalogFilters) => void;
  onRequestBuildPdf?: (_currentFilters: CatalogFilters) => void;
  dense?: boolean;
}

export default function CatalogPanel({
  filters = {},
  onFiltersChange: _onFiltersChange,
  onRequestBuildPdf,
  dense = false,
}: CatalogPanelProps) {
  const handleBuildPdf = () => {
    if (onRequestBuildPdf) {
      onRequestBuildPdf(filters as CatalogFilters);
    }
  };

  return (
    <div className={dense ? 'space-y-3' : 'space-y-4'}>
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          Catalog panel - filters and product search functionality will be implemented here.
        </p>
      </div>

      {/* Placeholder for future filter controls */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Filter controls (Product Line, Orientation, Deviation Class, Search) will be added here.</p>
      </div>

      {/* Action buttons */}
      {onRequestBuildPdf && (
        <div className="border-t border-gray-200 pt-3 flex justify-end">
          <button
            onClick={handleBuildPdf}
            className={`${
              dense ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
            } font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            Build PDF
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Note: This is a placeholder. Full implementation with product filtering similar to Success Stories panel will be added.
      </p>
    </div>
  );
}
