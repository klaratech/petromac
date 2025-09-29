'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { FilterPayload, PreviewResponse } from '@/types/pdf';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
  onClose: () => void;
}

interface CsvRow {
  area: string;
  country: string;
  wlco: string;
  category1: string;
  category2: string;
  device: string;
  page: number;
}

interface OptionWithCount {
  value: string;
  count: number;
}

interface MultiSelectProps {
  label: string;
  options: OptionWithCount[];
  selected: string[];
  onChange: (_value: string[]) => void;
  placeholder?: string;
}

const MultiSelect = ({ label, options, selected, onChange, placeholder }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string) => {
    onChange(selected.filter(item => item !== option));
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectAll = () => {
    onChange(filteredOptions.map(opt => opt.value));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        inputRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          toggleOption(filteredOptions[focusedIndex].value);
        }
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset focused index when search term changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchTerm]);

  const renderSelectedDisplay = () => {
    if (selected.length === 0) {
      return (
        <span className="text-gray-500">
          {placeholder || `Select ${label.toLowerCase()}...`}
        </span>
      );
    }

    if (selected.length === 1) {
      return (
        <div className="flex items-center">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm mr-1">
            {selected[0]}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeOption(selected[0]);
              }}
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center flex-wrap gap-1">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
          {selected[0]}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeOption(selected[0]);
            }}
            className="ml-1 text-blue-600 hover:text-blue-800"
          >
            ×
          </button>
        </span>
        {selected.length > 1 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
            +{selected.length - 1}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div
        ref={inputRef}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${label} multiselect`}
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[38px] flex items-center"
      >
        <div className="flex-1 min-w-0">
          {renderSelectedDisplay()}
        </div>
        <div className="flex-shrink-0 ml-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-80 rounded-md border border-gray-300 overflow-hidden">
          {/* Search box for long lists */}
          {options.length > 10 && (
            <div className="p-3 border-b border-gray-200">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={handleKeyDown}
              />
            </div>
          )}
          
          {/* Action buttons */}
          <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              disabled={filteredOptions.every(opt => selected.includes(opt.value))}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-800 disabled:text-gray-400"
              disabled={selected.length === 0}
            >
              Clear All
            </button>
          </div>
          
          {/* Options list */}
          <div 
            role="listbox" 
            aria-multiselectable="true"
            className="max-h-48 overflow-y-auto"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={selected.includes(option.value)}
                  className={`relative cursor-pointer px-3 py-2 ${
                    index === focusedIndex 
                      ? 'bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleOption(option.value)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(option.value)}
                      onChange={() => {}} // Controlled by parent click
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      tabIndex={-1}
                    />
                    <span className="text-sm text-gray-900 flex-1">{option.value}</span>
                    <span className="text-xs text-gray-500 ml-2">({option.count})</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Done button */}
          <div className="md:hidden sticky bottom-0 bg-white border-t border-gray-200 p-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function PdfBuilderModal({ onClose }: Props) {
  // State for cached data and filters
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [filters, setFilters] = useState<FilterPayload>({});
  const [email, setEmail] = useState('');
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Debounce filters to avoid excessive recomputation
  const debouncedFilters = useDebounce(filters, 200);

  // Load and cache CSV data on mount
  useEffect(() => {
    const loadCsvData = async () => {
      try {
        setIsLoadingData(true);
        
        // Try to load from localStorage first
        const cached = localStorage.getItem('success-stories-data');
        if (cached) {
          const parsedData = JSON.parse(cached) as CsvRow[];
          setCsvData(parsedData);
          setIsLoadingData(false);
          return;
        }

        // Fetch CSV data from public folder
        const response = await fetch('/successstories-summary.csv');
        if (!response.ok) {
          throw new Error('Failed to load CSV data');
        }
        
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const data: CsvRow[] = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return {
            area: values[headers.indexOf('Area')] || '',
            country: values[headers.indexOf('Country')] || '',
            wlco: values[headers.indexOf('WL Co')] || '',
            category1: values[headers.indexOf('Category 1')] || '',
            category2: values[headers.indexOf('Category 2')] || '',
            device: values[headers.indexOf('Device')] || '',
            page: parseInt(values[headers.indexOf('Page')]) || 0
          };
        }).filter(row => row.page > 0); // Filter out invalid rows

        // Cache the data
        localStorage.setItem('success-stories-data', JSON.stringify(data));
        setCsvData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadCsvData();
  }, []);

  // Load filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('success-stories-filters');
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch {
        // Ignore invalid saved filters
      }
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('success-stories-filters', JSON.stringify(filters));
  }, [filters]);

  // Compute filtered data and available options with cascading
  const { availableOptions, clearedSelections } = useMemo(() => {
    if (csvData.length === 0) {
      return { 
        filteredData: [], 
        availableOptions: {
          area: [],
          country: [],
          wlco: [],
          category1: [],
          category2: [],
          device: []
        },
        clearedSelections: []
      };
    }

    // Apply current filters to data
    let filtered = csvData;
    const clearedKeys: string[] = [];

    // Helper function to match values (including substring search with ~)
    const matchesFilter = (value: string, filterValues: string[], caseInsensitive = true) => {
      if (!filterValues || filterValues.length === 0) return true;
      
      return filterValues.some(filterValue => {
        const needle = caseInsensitive ? filterValue.toLowerCase() : filterValue;
        const haystack = caseInsensitive ? value.toLowerCase() : value;
        
        if (needle.startsWith('~')) {
          return haystack.includes(needle.slice(1));
        }
        return haystack === needle;
      });
    };

    // Apply each filter
    const fields: (keyof FilterPayload)[] = ['area', 'country', 'wlco', 'category1', 'category2', 'device'];
    
    for (const field of fields) {
      const selectedValues = debouncedFilters[field];
      if (selectedValues && selectedValues.length > 0) {
        filtered = filtered.filter(row => matchesFilter(row[field], selectedValues));
      }
    }

    // Compute available options from filtered data
    const computeOptions = (field: keyof CsvRow): OptionWithCount[] => {
      const counts = new Map<string, number>();
      
      filtered.forEach(row => {
        const value = row[field]?.toString().trim();
        if (value) {
          counts.set(value, (counts.get(value) || 0) + 1);
        }
      });

      return Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value));
    };

    const newOptions = {
      area: computeOptions('area'),
      country: computeOptions('country'),
      wlco: computeOptions('wlco'),
      category1: computeOptions('category1'),
      category2: computeOptions('category2'),
      device: computeOptions('device')
    };

    // Check for invalid selections and mark them for clearing
    const updatedFilters = { ...debouncedFilters };
    
    for (const field of fields) {
      const selectedValues = updatedFilters[field];
      if (selectedValues && selectedValues.length > 0) {
        const availableValues = newOptions[field].map(opt => opt.value);
        const validSelections = selectedValues.filter(val => availableValues.includes(val));
        
        if (validSelections.length !== selectedValues.length) {
          clearedKeys.push(field);
          if (validSelections.length > 0) {
            updatedFilters[field] = validSelections;
          } else {
            delete updatedFilters[field];
          }
        }
      }
    }

    return {
      filteredData: filtered,
      availableOptions: newOptions,
      clearedSelections: clearedKeys
    };
  }, [csvData, debouncedFilters]);

  // Auto-clear invalid selections and show notice
  useEffect(() => {
    if (clearedSelections.length > 0) {
      setFilters(prev => {
        const updated = { ...prev };
        clearedSelections.forEach(key => {
          const field = key as keyof FilterPayload;
          const availableValues = availableOptions[field].map(opt => opt.value);
          const currentValues = prev[field];
          if (currentValues && Array.isArray(currentValues)) {
            const validValues = currentValues.filter(val => availableValues.includes(val));
            if (validValues.length > 0) {
              updated[field] = validValues;
            } else {
              delete updated[field];
            }
          }
        });
        return updated;
      });

      setNotice('Some selections were cleared because no results remained.');
      setTimeout(() => setNotice(null), 3000);
    }
  }, [clearedSelections, availableOptions]);

  // Handle escape key and focus trap
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus the modal when it opens
    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const updateFilter = (key: keyof FilterPayload, value: string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined
    }));
  };

  const handlePreview = async () => {
    if (isPreviewing) return;
    
    try {
      setIsPreviewing(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('filters_json', JSON.stringify(filters));
      formData.append('case_insensitive', 'true');
      formData.append('preview', 'true');

      const response = await fetch('/api/successstories', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Preview failed');
      }

      const data: PreviewResponse = await response.json();
      setPreviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDownload = async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      
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

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extracted.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmail = async () => {
    if (isEmailing) return;
    
    setEmailError(null);
    
    if (!email.trim()) {
      setEmailError('Email address is required');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    try {
      setIsEmailing(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('action', 'email');
      formData.append('name', 'Kiosk User');
      formData.append('email', email.trim());
      formData.append('message', `PDF request with filters: ${JSON.stringify(filters)}`);

      const response = await fetch('/api/successstories', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Email sending failed');
      }

      // Show success message
      alert('PDF has been sent to your email address!');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email sending failed');
    } finally {
      setIsEmailing(false);
    }
  };

  if (isLoadingData) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleOverlayClick}
      >
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading filter options...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex">
          {/* Left side - Filters */}
          <div className="flex-1 px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
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

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
              <button
                onClick={handlePreview}
                disabled={isPreviewing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isPreviewing ? 'Loading...' : 'Preview'}
              </button>
              
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Download'}
              </button>
            </div>

            {/* Email Section */}
            <div className="border-t border-gray-200 pt-4">
              <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="flex gap-2">
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  onClick={handleEmail}
                  disabled={isEmailing || !email.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEmailing ? 'Sending...' : 'Email'}
                </button>
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            {/* Notice for auto-cleared selections */}
            {notice && (
              <div className="border-t border-gray-200 pt-4" role="status" aria-live="polite">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">{notice}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Preview */}
          <div className="w-[600px] border-l border-gray-200 bg-gray-50">
            <div className="p-4 h-full flex flex-col">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Preview</h3>
              
              {/* PDF Iframe */}
              <div className="flex-1 bg-white border border-gray-200 rounded-md overflow-hidden mb-3">
                <iframe
                  src="/successstories.pdf"
                  className="w-full h-full min-h-[600px]"
                  title="Success Stories PDF Preview"
                />
              </div>

              {/* Filter Preview Data (when available) */}
              {previewData && (
                <div className="bg-white border border-gray-200 rounded-md p-3 text-sm space-y-2">
                  <div className="text-xs font-medium text-gray-900 mb-2">Filtered Results:</div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Match count:</span>
                    <span className="font-medium">{previewData.match_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total pages:</span>
                    <span className="font-medium">{previewData.total_pages}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-600 text-xs">Pages to include:</span>
                    <div className="mt-1 max-h-20 overflow-y-auto">
                      <span className="text-xs font-mono">{previewData.pages_1based.join(', ')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
