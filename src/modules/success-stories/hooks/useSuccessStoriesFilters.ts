'use client';

import { useState, useEffect } from 'react';
import type { SuccessStoriesFilters } from '../types/successStories.types';

const STORAGE_KEY = 'success-stories-filters';

export function useSuccessStoriesFilters(initialFilters?: Partial<SuccessStoriesFilters>) {
  const [filters, setFilters] = useState<SuccessStoriesFilters>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...JSON.parse(saved), ...initialFilters };
        } catch {
          // Ignore parse errors
        }
      }
    }
    return initialFilters || {};
  });

  // Save filters to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    }
  }, [filters]);

  const updateFilter = <K extends keyof SuccessStoriesFilters>(
    key: K,
    value: SuccessStoriesFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value && Array.isArray(value) && value.length > 0 ? value : undefined,
    }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
  };
}
