import type { Area, ServiceCompany, Technology } from './config/options';

export interface SuccessStoryRow {
  page: number;
  areaRaw: string;
  companyRaw: string;
  techRaw: string;
  area: Area | null;
  company: ServiceCompany | null;
  tech: Technology | null;
  year?: number;
  country?: string;
  category1?: string;
  category2?: string;
}

export interface SuccessStoriesFilters {
  areas?: Area[];
  companies?: ServiceCompany[];
  techs?: Technology[];
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
