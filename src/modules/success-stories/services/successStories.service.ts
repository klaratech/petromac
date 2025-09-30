import type { CsvRow, SuccessStoriesFilters, OptionWithCount } from '../types/successStories.types';

export class SuccessStoriesService {
  private static cachedData: CsvRow[] | null = null;

  /**
   * Load and cache CSV data from public folder
   */
  static async loadData(): Promise<CsvRow[]> {
    // Return cached data if available
    if (this.cachedData) {
      return this.cachedData;
    }

    // Try to load from localStorage first
    const cached = localStorage.getItem('success-stories-data');
    if (cached) {
      try {
        const parsedData = JSON.parse(cached) as CsvRow[];
        this.cachedData = parsedData;
        return parsedData;
      } catch {
        // Ignore parse errors and fetch fresh data
      }
    }

    // Fetch CSV data from public folder
    const response = await fetch('/successstories-summary.csv');
    if (!response.ok) {
      throw new Error('Failed to load CSV data');
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const data: CsvRow[] = lines
      .slice(1)
      .map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          area: values[headers.indexOf('Area')] || '',
          country: values[headers.indexOf('Country')] || '',
          wlco: values[headers.indexOf('WL Co')] || '',
          category1: values[headers.indexOf('Category 1')] || '',
          category2: values[headers.indexOf('Category 2')] || '',
          device: values[headers.indexOf('Device')] || '',
          page: parseInt(values[headers.indexOf('Page')]) || 0,
        };
      })
      .filter(row => row.page > 0); // Filter out invalid rows

    // Cache the data
    localStorage.setItem('success-stories-data', JSON.stringify(data));
    this.cachedData = data;
    return data;
  }

  /**
   * Filter data based on provided filters
   */
  static filterData(data: CsvRow[], filters: SuccessStoriesFilters): CsvRow[] {
    let filtered = data;

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

    if (filters.area && filters.area.length > 0) {
      filtered = filtered.filter(row => matchesFilter(row.area, filters.area!));
    }
    if (filters.country && filters.country.length > 0) {
      filtered = filtered.filter(row => matchesFilter(row.country, filters.country!));
    }
    if (filters.wlco && filters.wlco.length > 0) {
      filtered = filtered.filter(row => matchesFilter(row.wlco, filters.wlco!));
    }
    if (filters.category1 && filters.category1.length > 0) {
      filtered = filtered.filter(row => matchesFilter(row.category1, filters.category1!));
    }
    if (filters.category2 && filters.category2.length > 0) {
      filtered = filtered.filter(row => matchesFilter(row.category2, filters.category2!));
    }
    if (filters.device && filters.device.length > 0) {
      filtered = filtered.filter(row => matchesFilter(row.device, filters.device!));
    }

    return filtered;
  }

  /**
   * Compute available options with counts from filtered data
   */
  static computeOptions(
    data: CsvRow[],
    field: keyof CsvRow
  ): OptionWithCount[] {
    const counts = new Map<string, number>();

    data.forEach(row => {
      const value = row[field]?.toString().trim();
      if (value) {
        counts.set(value, (counts.get(value) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }

  /**
   * Get all available filter options based on current filters (cascading)
   */
  static getAvailableOptions(data: CsvRow[], filters: SuccessStoriesFilters) {
    const filteredData = this.filterData(data, filters);

    return {
      area: this.computeOptions(filteredData, 'area'),
      country: this.computeOptions(filteredData, 'country'),
      wlco: this.computeOptions(filteredData, 'wlco'),
      category1: this.computeOptions(filteredData, 'category1'),
      category2: this.computeOptions(filteredData, 'category2'),
      device: this.computeOptions(filteredData, 'device'),
    };
  }
}
