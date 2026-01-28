'use client';

import { MultiSelect } from '@/shared/ui/inputs';
import type { SuccessStoriesFilters, SuccessStoriesOptions } from '../types';

interface SuccessStoriesFiltersProps {
  filters: SuccessStoriesFilters;
  options: SuccessStoriesOptions;
  onChange: (_filters: SuccessStoriesFilters) => void;
  dense?: boolean;
}

export default function SuccessStoriesFilters({
  filters,
  options,
  onChange,
  dense = false,
}: SuccessStoriesFiltersProps) {
  const updateFilter = (key: keyof SuccessStoriesFilters, value: string[]) => {
    onChange({
      ...filters,
      [key]: value.length > 0 ? value : undefined,
    });
  };

  return (
    <div className={dense ? 'space-y-3' : 'space-y-4'}>
      <div className={`grid ${dense ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
        <MultiSelect
          label="Area"
          options={options.areas}
          selected={filters.areas || []}
          onChange={(value) => updateFilter('areas', value)}
        />

        <MultiSelect
          label="Service Company"
          options={options.companies}
          selected={filters.companies || []}
          onChange={(value) => updateFilter('companies', value)}
        />

        <MultiSelect
          label="Technology"
          options={options.techs}
          selected={filters.techs || []}
          onChange={(value) => updateFilter('techs', value)}
        />
      </div>
    </div>
  );
}
