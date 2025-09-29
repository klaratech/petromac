'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FilterPayload, OptionsResponse, PreviewResponse } from '@/types/pdf';

interface Props {
  onClose: () => void;
}

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (_value: string[]) => void;
  placeholder?: string;
}

const MultiSelect = ({ label, options, selected, onChange, placeholder }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectAll = () => {
    onChange([...options]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate">
          {selected.length === 0 
            ? placeholder || `Select ${label.toLowerCase()}...`
            : `${selected.length} selected`
          }
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md border border-gray-300 overflow-auto">
          <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-600 hover:text-blue-800"
              disabled={selected.length === options.length}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-800"
              disabled={selected.length === 0}
            >
              Clear All
            </button>
          </div>
          
          {options.map((option) => (
            <div
              key={option}
              className="relative cursor-pointer hover:bg-gray-50 px-3 py-2"
              onClick={() => toggleOption(option)}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                />
                <span className="text-sm text-gray-900">{option}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function PdfBuilderModal({ onClose }: Props) {
  const [options, setOptions] = useState<OptionsResponse>({
    year: [],
    area: [],
    country: [],
    wlco: [],
    category1: [],
    category2: [],
    device: []
  });
  
  const [filters, setFilters] = useState<FilterPayload>({});
  const [email, setEmail] = useState('');
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Load filter options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/options`);
        if (!response.ok) {
          throw new Error('Failed to load filter options');
        }
        const data: OptionsResponse = await response.json();
        setOptions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load options');
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

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

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Preview failed');
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

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('PDF generation failed');
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
      
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          filters
        }),
      });

      if (!response.ok) {
        throw new Error('Email sending failed');
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

  if (isLoadingOptions) {
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
                options={options.area}
                selected={filters.area || []}
                onChange={(value) => updateFilter('area', value)}
              />
              
              <MultiSelect
                label="Country"
                options={options.country}
                selected={filters.country || []}
                onChange={(value) => updateFilter('country', value)}
              />
              
              <MultiSelect
                label="WL Co"
                options={options.wlco}
                selected={filters.wlco || []}
                onChange={(value) => updateFilter('wlco', value)}
              />
              
              <MultiSelect
                label="Category 1"
                options={options.category1}
                selected={filters.category1 || []}
                onChange={(value) => updateFilter('category1', value)}
              />
              
              <MultiSelect
                label="Category 2"
                options={options.category2}
                selected={filters.category2 || []}
                onChange={(value) => updateFilter('category2', value)}
              />
              
              <MultiSelect
                label="Device"
                options={options.device}
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
