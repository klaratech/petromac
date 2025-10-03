import Papa from "papaparse";
import {
  normalizeArea,
  normalizeDevice,
  normalizeServiceCompany,
  type SuccessStoryRow,
} from "@/data/successStoriesOptions";

/**
 * Load and parse the success stories CSV file
 * Returns array of rows with normalized fields and page numbers
 */
export async function loadSuccessStoriesData(): Promise<SuccessStoryRow[]> {
  try {
    const response = await fetch("/data/successstories-summary.csv");
    if (!response.ok) {
      throw new Error("Failed to load success stories data");
    }

    const csvText = await response.text();
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows: SuccessStoryRow[] = parsed.data
      .map((row) => {
        const storyRow: SuccessStoryRow = {
          page: parseInt(row.Page || "0", 10),
          area: row.Area || "",
          company: row["WL Co"] || "",
          tech: row.Device || "",
        };
        
        const year = parseInt(row.Year || "0", 10);
        if (year > 0) storyRow.year = year;
        
        if (row.Country) storyRow.country = row.Country;
        if (row["Category 1"]) storyRow.category1 = row["Category 1"];
        if (row["Category 2"]) storyRow.category2 = row["Category 2"];
        
        return storyRow;
      })
      .filter((row) => row.page > 0); // Only include rows with valid page numbers

    return rows;
  } catch (error) {
    console.error("Error loading success stories data:", error);
    return [];
  }
}

export interface FilterSelections {
  areas: string[];
  companies: string[];
  techs: string[];
}

/**
 * Filter success stories data based on selected filters
 * Returns array of page numbers that match the filters
 * If a filter group is empty, it means "select all" for that group
 */
export function filterSuccessStories(
  data: SuccessStoryRow[],
  filters: FilterSelections
): number[] {
  const { areas, companies, techs } = filters;

  // If all filters are empty, return all pages
  if (areas.length === 0 && companies.length === 0 && techs.length === 0) {
    return data.map((row) => row.page);
  }

  const matchingRows = data.filter((row) => {
    // Normalize the row data
    const normalizedArea = normalizeArea(row.area);
    const normalizedCompany = normalizeServiceCompany(row.company);
    const normalizedTech = normalizeDevice(row.tech);

    // Check if row matches selected areas (if any selected)
    const matchesArea =
      areas.length === 0 || (normalizedArea && areas.includes(normalizedArea));

    // Check if row matches selected companies (if any selected)
    const matchesCompany =
      companies.length === 0 || companies.includes(normalizedCompany);

    // Check if row matches selected technologies (if any selected)
    const matchesTech =
      techs.length === 0 || (normalizedTech && techs.includes(normalizedTech));

    // Row must match all filter groups that have selections
    return matchesArea && matchesCompany && matchesTech;
  });

  // Return unique page numbers, sorted
  const pageNumbers = [...new Set(matchingRows.map((row) => row.page))];
  return pageNumbers.sort((a, b) => a - b);
}
