import Papa from 'papaparse';
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
const COMPANY_FIELD_CANDIDATES = ['WL Co', 'WLCO', 'wlco', 'wl co', 'company', 'Company'];
const DEVICE_FIELD_CANDIDATES = ['Device', 'device', 'Technology', 'Tech'];
const COUNTRY_FIELD_CANDIDATES = ['Country', 'country'];
const CATEGORY1_FIELD_CANDIDATES = ['Category 1', 'Category1', 'category1'];
const CATEGORY2_FIELD_CANDIDATES = ['Category 2', 'Category2', 'category2'];
const YEAR_FIELD_CANDIDATES = ['Year', 'year', '\ufeffYear'];

const MULTI_VALUE_DELIMITERS = [',', ';', '+'];
const KNOWN_AREAS = ['APAC', 'MENA', 'EUR', 'LAM', 'NAM', 'AFR'];

function normalizeHeader(header: string): string {
  return header.replace(/^\ufeff/, '').trim();
}

function pickField(row: Record<string, string>, candidates: string[]): string {
  for (const key of candidates) {
    const value = row[key];
    if (value != null && value !== '') {
      return value;
    }
  }
  return '';
}

function splitValues(rawValue: string): string[] {
  const trimmed = rawValue.trim();
  if (!trimmed) return [];

  let values = [trimmed];
  MULTI_VALUE_DELIMITERS.forEach((delimiter) => {
    values = values.flatMap((value) => value.split(delimiter));
  });

  return values.map((value) => value.trim()).filter(Boolean);
}

function normalizeArea(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return null;
  return KNOWN_AREAS.includes(normalized) ? normalized : null;
}

function normalizeCompany(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === 'SLB' || normalized === 'SCHLUMBERGER') return 'SLB';
  if (normalized === 'HAL' || normalized === 'HALLIBURTON') return 'HAL';
  if (normalized === 'BHI' || normalized === 'BAKER HUGHES') return 'BHI';
  return 'Other';
}

function normalizeTech(value: string): string | null {
  const normalized = value.toLowerCase().trim();
  if (!normalized) return null;

  if (normalized.includes('pathfinder')) return 'Pathfinder';
  if (normalized.includes('focus') && normalized.includes('oh')) return 'Focus-OH';
  if (normalized.includes('focus') && normalized.includes('ch')) return 'Focus-CH';
  if (normalized.includes('wireline express')) return 'Wireline Express';
  if (normalized.includes('thor')) return 'THOR';

  return null;
}

function normalizeMulti(rawValue: string, normalize: (_value: string) => string | null): string[] {
  const values = splitValues(rawValue);
  const normalized = values
    .map((value) => normalize(value))
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(normalized));
}

export function parseSuccessStoriesTagsCsv(csvText: string): SuccessStoryRow[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
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

      const areas = areaRaw ? normalizeMulti(areaRaw, normalizeArea) : [];
      const companies = companyRaw ? normalizeMulti(companyRaw, normalizeCompany) : [];
      const techs = techRaw ? normalizeMulti(techRaw, normalizeTech) : [];

      const yearValue = pickField(row, YEAR_FIELD_CANDIDATES);
      const year = Number.parseInt(yearValue || '0', 10);

      const storyRow: SuccessStoryRow = {
        page,
        areas,
        companies,
        techs,
      };

      if (areaRaw) storyRow.areaRaw = areaRaw;
      if (companyRaw) storyRow.companyRaw = companyRaw;
      if (techRaw) storyRow.techRaw = techRaw;

      const country = pickField(row, COUNTRY_FIELD_CANDIDATES);
      if (country) storyRow.country = country;

      const category1 = pickField(row, CATEGORY1_FIELD_CANDIDATES);
      if (category1) storyRow.category1 = category1;

      const category2 = pickField(row, CATEGORY2_FIELD_CANDIDATES);
      if (category2) storyRow.category2 = category2;

      if (year > 0) storyRow.year = year;

      return storyRow;
    })
    .filter((row) => row.page > 0);
}

export function buildValidationReport(rows: SuccessStoryRow[]): SuccessStoriesValidationReport {
  const unknownAreas = new Set<string>();
  const unknownCompanies = new Set<string>();
  const unknownTechnologies = new Set<string>();
  const invalidPages: number[] = [];

  rows.forEach((row) => {
    if (row.areaRaw && row.areas.length === 0) {
      unknownAreas.add(row.areaRaw);
    }

    if (row.techRaw && row.techs.length === 0) {
      unknownTechnologies.add(row.techRaw);
    }

    if (row.companyRaw && row.companies.length === 0) {
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

function matchesFilter(values: string[], selected: string[]): boolean {
  if (selected.length === 0) return true;
  return values.some((value) => selected.includes(value));
}

export function filterSuccessStories(
  data: SuccessStoryRow[],
  filters: SuccessStoriesFilters
): SuccessStoryRow[] {
  const { areas = [], companies = [], techs = [] } = filters;

  return data.filter((row) => {
    const matchesArea = matchesFilter(row.areas, areas);
    const matchesCompany = matchesFilter(row.companies, companies);
    const matchesTech = matchesFilter(row.techs, techs);

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

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function getAvailableOptions(
  data: SuccessStoryRow[],
  filters: SuccessStoriesFilters
): SuccessStoriesOptions {
  // For each dimension, count against data filtered by the OTHER dimensions
  // so the user sees how many stories each option would yield.
  const { areas: fAreas = [], companies: fCompanies = [], techs: fTechs = [] } = filters;
  const filteredForAreas = filterSuccessStories(data, { areas: [], companies: fCompanies, techs: fTechs });
  const filteredForCompanies = filterSuccessStories(data, { areas: fAreas, companies: [], techs: fTechs });
  const filteredForTechs = filterSuccessStories(data, { areas: fAreas, companies: fCompanies, techs: [] });

  const allAreas = uniqueSorted(data.flatMap((row) => row.areas));
  const allCompanies = uniqueSorted(data.flatMap((row) => row.companies));
  const allTechs = uniqueSorted(data.flatMap((row) => row.techs));

  const areas: OptionWithCount[] = allAreas.map((area) => ({
    value: area,
    count: countMatches(filteredForAreas, (row) => row.areas.includes(area)),
  }));

  const companies: OptionWithCount[] = allCompanies.map((company) => ({
    value: company,
    count: countMatches(filteredForCompanies, (row) => row.companies.includes(company)),
  }));

  const techs: OptionWithCount[] = allTechs.map((tech) => ({
    value: tech,
    count: countMatches(filteredForTechs, (row) => row.techs.includes(tech)),
  }));

  return { areas, companies, techs };
}

export function getTotalStoryCount(data: SuccessStoryRow[]): number {
  return new Set(data.map((row) => row.page)).size;
}
