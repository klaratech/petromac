'use client';

import { useState, useEffect, useRef } from 'react';

export interface OptionWithCount {
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

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder,
}: MultiSelectProps) {
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

  const listboxId = `${label.toLowerCase().replace(/\s+/g, '-')}-listbox`;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div
        ref={inputRef}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label={`${label} multiselect`}
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[38px] flex items-center"
      >
        <div className="flex-1 min-w-0">{renderSelectedDisplay()}</div>
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
          <div id={listboxId} role="listbox" aria-multiselectable="true" className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={selected.includes(option.value)}
                  className={`relative cursor-pointer px-3 py-2 ${
                    index === focusedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleOption(option.value)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(option.value)}
                      readOnly
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
}
