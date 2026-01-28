// Hard-coded filter options for Success Stories
// These options are static and do not auto-generate from CSV

export const AREA_OPTIONS = ["APAC", "MENA", "EUR", "LAM", "NAM", "AFR"] as const;
export const SERVICE_COMPANY_OPTIONS = ["SLB", "HAL", "BHI", "Other"] as const;
export const TECHNOLOGY_OPTIONS = [
  "Pathfinder",
  "Focus-OH",
  "Focus-CH",
  "Wireline Express",
  "THOR"
] as const;

// Total flipbook pages (used to build image URLs)
export const SUCCESS_STORIES_TOTAL_PAGES = 47;

export type Area = typeof AREA_OPTIONS[number];
export type ServiceCompany = typeof SERVICE_COMPANY_OPTIONS[number];
export type Technology = typeof TECHNOLOGY_OPTIONS[number];

export interface SuccessStoryRow {
  page: number;          // page number in flipbook
  area: string;          // Area column from CSV
  company: string;       // WL Co column from CSV
  tech: string;          // Device column from CSV
  year?: number;
  country?: string;
  category1?: string;
  category2?: string;
}

/**
 * WHERE TO EDIT OPTIONS (Documentation)
 * 
 * To add/remove filter options, edit the arrays above (AREA_OPTIONS, 
 * SERVICE_COMPANY_OPTIONS, TECHNOLOGY_OPTIONS) and re-deploy.
 * 
 * DO NOT auto-generate options from CSV. The CSV is only used for 
 * mapping filter selections to page numbers.
 * 
 * To update options:
 * 1. Edit the const arrays above
 * 2. Update the normalization logic here if needed
 * 3. Run `pnpm run build` to verify
 * 4. Deploy
 */

/**
 * Normalize CSV device values to canonical technology names
 * Handles variations like "Wireline Express - FT" -> "Wireline Express"
 */
export function normalizeDevice(device: string): Technology | null {
  const normalized = device.toLowerCase().trim();
  
  if (normalized.includes("pathfinder")) return "Pathfinder";
  if (normalized.includes("focus") && normalized.includes("oh")) return "Focus-OH";
  if (normalized.includes("focus") && normalized.includes("ch")) return "Focus-CH";
  if (normalized.includes("wireline express")) return "Wireline Express";
  if (normalized.includes("thor")) return "THOR";
  
  return null;
}

/**
 * Normalize CSV service company values
 * Handles any variations and maps to canonical names
 */
export function normalizeServiceCompany(company: string): ServiceCompany {
  const normalized = company.toLowerCase().trim();
  
  if (normalized === "slb") return "SLB";
  if (normalized === "hal") return "HAL";
  if (normalized === "bhi") return "BHI";
  
  return "Other";
}

/**
 * Normalize CSV area values
 */
export function normalizeArea(area: string): Area | null {
  const normalized = area.toUpperCase().trim();
  
  if (AREA_OPTIONS.includes(normalized as Area)) {
    return normalized as Area;
  }
  
  return null;
}
