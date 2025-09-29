export type FilterPayload = {
  year?: string[];
  area?: string[];
  country?: string[];
  wlco?: string[];
  category1?: string[];
  category2?: string[];
  device?: string[];
};

export type OptionsResponse = {
  year: string[];
  area: string[];
  country: string[];
  wlco: string[];
  category1: string[];
  category2: string[];
  device: string[];
};

export type PreviewResponse = {
  match_count: number;
  pages_1based: number[];
  total_pages: number;
};
