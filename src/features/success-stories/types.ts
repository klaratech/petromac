export interface SuccessStoryRow {
  page: number;
  areaRaw?: string;
  companyRaw?: string;
  techRaw?: string;
  areas: string[];
  companies: string[];
  techs: string[];
  year?: number;
  country?: string;
  category1?: string;
  category2?: string;
}

export interface SuccessStoriesFilters {
  areas?: string[];
  companies?: string[];
  techs?: string[];
}

export interface OptionWithCount {
  value: string;
  count: number;
}

export interface SuccessStoriesOptions {
  areas: OptionWithCount[];
  companies: OptionWithCount[];
  techs: OptionWithCount[];
}

export interface SuccessStoriesValidationReport {
  unknownAreas: string[];
  unknownCompanies: string[];
  unknownTechnologies: string[];
  invalidPages: number[];
  missingPageRows: number;
}
