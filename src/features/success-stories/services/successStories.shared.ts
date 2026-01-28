import Papa from 'papaparse';
import {
  AREA_OPTIONS,
  SERVICE_COMPANY_OPTIONS,
  TECHNOLOGY_OPTIONS,
  normalizeArea,
  normalizeDevice,
  normalizeServiceCompany,
} from '../config/options';
import type {
  SuccessStoryRow,
  SuccessStoriesFilters,
  SuccessStoriesOptions,
  SuccessStoriesValidationReport,
  OptionWithCount,
} from '../types';

const PAGE_FIELD_CANDIDATES = [
  'Page',
  'page',
  'PAGE',
  'Page Number',
  'PageNumber',
  'page_number',
  'pageNo',
  'PageNo',
];

const AREA_FIELD_CANDIDATES = ['Area', 'area'];
const COMPANY_FIELD_CANDIDATES = ['WL Co', 'WLCO', 'wlco', 'wl co', 'company'];
const DEVICE_FIELD_CANDIDATES = ['Device', 'device', 'Technology'];
const COUNTRY_FIELD_CANDIDATES = ['Country', 'country'];
const CATEGORY1_FIELD_CANDIDATES = ['Category 1', 'Category1', 'category1'];
const CATEGORY2_FIELD_CANDIDATES = ['Category 2', 'Category2', 'category2'];
const YEAR_FIELD_CANDIDATES = ['Year', 'year'];

function pickField(row: Record<string, string>, candidates: string[]): string {
  for (const key of candidates) {
    const value = row[key];
    if (value != null && value !== '') {
      return value;
    }
  }
  return '';
}

export function parseSuccessStoriesCsv(csvText: string): SuccessStoryRow[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => (typeof value === 'string' ? value.trim() : value),
  });

  if (parsed.errors.length > 0) {
    throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
  }

  return parsed.data
    .map((row) => {
      const pageValue = pickField(row, PAGE_FIELD_CANDIDATES);
      const page = Number.parseInt(pageValue || '0', 10);

      const areaRaw = pickField(row, AREA_FIELD_CANDIDATES);
      const companyRaw = pickField(row, COMPANY_FIELD_CANDIDATES);
      const techRaw = pickField(row, DEVICE_FIELD_CANDIDATES);

      const normalizedArea = areaRaw ? normalizeArea(areaRaw) : null;
      const normalizedCompany = companyRaw ? normalizeServiceCompany(companyRaw) : null;
      const normalizedTech = techRaw ? normalizeDevice(techRaw) : null;

      const yearValue = pickField(row, YEAR_FIELD_CANDIDATES);
      const year = Number.parseInt(yearValue || '0', 10);

      return {
        page,
        areaRaw,
        companyRaw,
        techRaw,
        area: normalizedArea,
        company: normalizedCompany,
        tech: normalizedTech,
        country: pickField(row, COUNTRY_FIELD_CANDIDATES) || undefined,
        category1: pickField(row, CATEGORY1_FIELD_CANDIDATES) || undefined,
        category2: pickField(row, CATEGORY2_FIELD_CANDIDATES) || undefined,
        year: year > 0 ? year : undefined,
      } satisfies SuccessStoryRow;
    })
    .filter((row) => row.page > 0);
}

export function buildValidationReport(rows: SuccessStoryRow[]): SuccessStoriesValidationReport {
  const unknownAreas = new Set<string>();
  const unknownCompanies = new Set<string>();
  const unknownTechnologies = new Set<string>();
  const invalidPages: number[] = [];

  rows.forEach((row) => {
    if (!row.area && row.areaRaw) {
      unknownAreas.add(row.areaRaw);
    }

    if (!row.tech && row.techRaw) {
      unknownTechnologies.add(row.techRaw);
    }

    if (!row.company && row.companyRaw) {
      unknownCompanies.add(row.companyRaw);
    }

    if (!Number.isFinite(row.page) || row.page <= 0) {
      invalidPages.push(row.page);
    }
  });

  return {
    unknownAreas: Array.from(unknownAreas).sort(),
    unknownCompanies: Array.from(unknownCompanies).sort(),
    unknownTechnologies: Array.from(unknownTechnologies).sort(),
    invalidPages,
    missingPageRows: invalidPages.length,
  };
}

export function filterSuccessStories(
  data: SuccessStoryRow[],
  filters: SuccessStoriesFilters
): SuccessStoryRow[] {
  const { areas = [], companies = [], techs = [] } = filters;

  return data.filter((row) => {
    const matchesArea = areas.length === 0 || (row.area ? areas.includes(row.area) : false);
    const matchesCompany = companies.length === 0 || (row.company ? companies.includes(row.company) : false);
    const matchesTech = techs.length === 0 || (row.tech ? techs.includes(row.tech) : false);

    return matchesArea && matchesCompany && matchesTech;
  });
}

export function getFilteredPageNumbers(
  data: SuccessStoryRow[],
  filters: SuccessStoriesFilters
): number[] {
  const filtered = filterSuccessStories(data, filters);
  const uniquePages = new Set(filtered.map((row) => row.page));
  return Array.from(uniquePages).sort((a, b) => a - b);
}

function countMatches(
  data: SuccessStoryRow[],
  predicate: (_row: SuccessStoryRow) => boolean
): number {
  return data.reduce((acc, row) => (predicate(row) ? acc + 1 : acc), 0);
}

export function getAvailableOptions(
  data: SuccessStoryRow[],
  filters: SuccessStoriesFilters
): SuccessStoriesOptions {
  const filtered = filterSuccessStories(data, filters);

  const areas: OptionWithCount[] = AREA_OPTIONS.map((area) => ({
    value: area,
    count: countMatches(filtered, (row) => row.area === area),
  }));

  const companies: OptionWithCount[] = SERVICE_COMPANY_OPTIONS.map((company) => ({
    value: company,
    count: countMatches(filtered, (row) => row.company === company),
  }));

  const techs: OptionWithCount[] = TECHNOLOGY_OPTIONS.map((tech) => ({
    value: tech,
    count: countMatches(filtered, (row) => row.tech === tech),
  }));

  return { areas, companies, techs };
}

export function getTotalStoryCount(data: SuccessStoryRow[]): number {
  return new Set(data.map((row) => row.page)).size;
}
