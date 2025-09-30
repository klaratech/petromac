'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import MultiSelect from './MultiSelect';
import type { SuccessStoriesFilters, CsvRow, OptionWithCount } from '@/modules/success-stories/types/successStories.types';
import { SuccessStoriesService } from '@/modules/success-stories/services/successStories.service';

export interface SuccessStoriesPanelProps {
  filters?: Partial<SuccessStoriesFilters>;
  onFiltersChange?: (_filters: SuccessStoriesFilters) => void;

  /**
   * Optional hook to trigger building a PDF using current filters.
   * Panels should not own the builder; they only signal intent.
   */
  onRequestBuildPdf?: (_currentFilters: SuccessStoriesFilters) => void;

  dense?: boolean; // compact layout for kiosk embed
}

export default function SuccessStoriesPanel({
  filters: externalFilters = {},
  onFiltersChange,
  onRequestBuildPdf,
  dense = false,
}: SuccessStoriesPanelProps) {
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [localFilters, setLocalFilters] = useState<SuccessStoriesFilters>(externalFilters);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Use external filters if provided, otherwise use local state
  const filters = onFiltersChange ? externalFilters : localFilters;

  // Debounce filters to avoid excessive recomputation
  const debouncedFilters = useDebounce(filters, 200);

  // Load CSV data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        const data = await SuccessStoriesService.loadData();
        setCsvData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Compute filtered data and available options
  const { filteredData, availableOptions, clearedSelections } = useMemo(() => {
    if (csvData.length === 0) {
      return {
        filteredData: [],
        availableOptions: {
          area: [],
          country: [],
          wlco: [],
          category1: [],
          category2: [],
          device: [],
        },
        clearedSelections: [],
      };
    }

    const filtered = SuccessStoriesService.filterData(csvData, debouncedFilters);
    const options = SuccessStoriesService.getAvailableOptions(csvData, debouncedFilters);

    // Check for invalid selections and mark them for clearing
    const clearedKeys: string[] = [];
    const fields: (keyof SuccessStoriesFilters)[] = ['area', 'country', 'wlco', 'category1', 'category2', 'device'];

    for (const field of fields) {
      const selectedValues = debouncedFilters[field];
      if (selectedValues && selectedValues.length > 0) {
        const availableValues = options[field].map((opt: OptionWithCount) => opt.value);
        const validSelections = selectedValues.filter(val => availableValues.includes(val));

        if (validSelections.length !== selectedValues.length) {
          clearedKeys.push(field);
        }
      }
    }

    return {
      filteredData: filtered,
      availableOptions: options,
      clearedSelections: clearedKeys,
    };
  }, [csvData, debouncedFilters]);

  // Auto-clear invalid selections and show notice
  useEffect(() => {
    if (clearedSelections.length > 0) {
      const updatedFilters = { ...debouncedFilters };
      clearedSelections.forEach(key => {
        const field = key as keyof SuccessStoriesFilters;
        const availableValues = availableOptions[field].map(opt => opt.value);
        const currentValues = debouncedFilters[field];
        if (currentValues && Array.isArray(currentValues)) {
          const validValues = currentValues.filter(val => availableValues.includes(val));
          if (validValues.length > 0) {
            updatedFilters[field] = validValues;
          } else {
            delete updatedFilters[field];
          }
        }
      });

      updateFilters(updatedFilters);
      setNotice('Some selections were cleared because no results remained.');
      setTimeout(() => setNotice(null), 3000);
    }
  }, [clearedSelections]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilters = (newFilters: SuccessStoriesFilters) => {
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else {
      setLocalFilters(newFilters);
    }
  };

  const updateFilter = (key: keyof SuccessStoriesFilters, value: string[]) => {
    updateFilters({
      ...filters,
      [key]: value.length > 0 ? value : undefined,
    });
  };

  const handleBuildPdf = () => {
    if (onRequestBuildPdf) {
      onRequestBuildPdf(filters);
    }
  };

  if (isLoadingData) {
    return (
      <div className={`flex items-center justify-center ${dense ? 'p-4' : 'p-8'}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading filter options...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${dense ? 'p-4' : 'p-8'}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={dense ? 'space-y-3' : 'space-y-4'}>
      {notice && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3" role="status" aria-live="polite">
          <p className="text-sm text-yellow-800">{notice}</p>
        </div>
      )}

      <div className={`grid ${dense ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-3'}`}>
        <MultiSelect
          label="Area"
          options={availableOptions.area}
          selected={filters.area || []}
          onChange={(value) => updateFilter('area', value)}
        />

        <MultiSelect
          label="Country"
          options={availableOptions.country}
          selected={filters.country || []}
          onChange={(value) => updateFilter('country', value)}
        />

        <MultiSelect
          label="WL Co"
          options={availableOptions.wlco}
          selected={filters.wlco || []}
          onChange={(value) => updateFilter('wlco', value)}
        />

        <MultiSelect
          label="Category 1"
          options={availableOptions.category1}
          selected={filters.category1 || []}
          onChange={(value) => updateFilter('category1', value)}
        />

        <MultiSelect
          label="Category 2"
          options={availableOptions.category2}
          selected={filters.category2 || []}
          onChange={(value) => updateFilter('category2', value)}
        />

        <MultiSelect
          label="Device"
          options={availableOptions.device}
          selected={filters.device || []}
          onChange={(value) => updateFilter('device', value)}
        />
      </div>

      {/* Results summary */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{filteredData.length}</span> {filteredData.length === 1 ? 'result' : 'results'} found
        </p>
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
    </div>
  );
}
