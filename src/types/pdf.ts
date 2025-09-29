export type FilterPayload = {
  area?: string[];
  country?: string[];
  wlco?: string[];
  category1?: string[];
  category2?: string[];
  device?: string[];
};

export type OptionsResponse = {
  area: string[];
  country: string[];
  wlco: string[];
  category1: string[];
  category2: string[];
  device: string[];
  _metadata?: {
    last_updated: string;
    source_version: string;
    mode: string;
  };
};

export type PreviewResponse = {
  match_count: number;
  pages_1based: number[];
  total_pages: number;
};
