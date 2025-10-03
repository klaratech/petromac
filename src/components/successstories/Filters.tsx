"use client";

import { useState, useRef, useEffect } from "react";
import {
  AREA_OPTIONS,
  SERVICE_COMPANY_OPTIONS,
  TECHNOLOGY_OPTIONS,
} from "@/data/successStoriesOptions";

export interface FiltersState {
  areas: string[];
  companies: string[];
  techs: string[];
}

interface FiltersProps {
  value: FiltersState;
  onChange: (_next: FiltersState) => void;
}

export function Filters({ value, onChange }: FiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Success Stories</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MultiSelectDropdown
          label="Area"
          options={[...AREA_OPTIONS]}
          selected={value.areas}
          onChange={(areas) => onChange({ ...value, areas })}
        />
        <MultiSelectDropdown
          label="Service Company"
          options={[...SERVICE_COMPANY_OPTIONS]}
          selected={value.companies}
          onChange={(companies) => onChange({ ...value, companies })}
        />
        <MultiSelectDropdown
          label="Technology"
          options={[...TECHNOLOGY_OPTIONS]}
          selected={value.techs}
          onChange={(techs) => onChange({ ...value, techs })}
        />
      </div>
      {(value.areas.length > 0 || value.companies.length > 0 || value.techs.length > 0) && (
        <button
          onClick={() => onChange({ areas: [], companies: [], techs: [] })}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

interface MultiSelectDropdownProps {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (_selected: string[]) => void;
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((_s) => _s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const displayText = selected.length === 0 
    ? `Select ${label}` 
    : `${selected.length} selected`;

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-left text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label} filter`}
      >
        <span className={selected.length === 0 ? "text-gray-500" : "text-gray-900"}>
          {displayText}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-6">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div role="listbox" aria-multiselectable="true" className="py-1">
            {options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggleOption(option)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                  <span className={isSelected ? "font-medium text-gray-900" : "text-gray-700"}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
