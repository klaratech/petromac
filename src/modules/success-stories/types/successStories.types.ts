export interface SuccessStoriesFilters {
  area?: string[];
  country?: string[];
  wlco?: string[];
  category1?: string[];
  category2?: string[];
  device?: string[];
}

export interface CsvRow {
  area: string;
  country: string;
  wlco: string;
  category1: string;
  category2: string;
  device: string;
  page: number;
}

export interface OptionWithCount {
  value: string;
  count: number;
}

export interface PreviewResponse {
  match_count: number;
  total_pages: number;
  pages_1based: number[];
}
