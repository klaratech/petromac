import type { FeatureCollection, Geometry } from 'geojson';
import type { JobRecord } from '@/types/JobRecord';

export type CountryStats = [string, number];

export interface ProcessedMapData {
  filteredData: JobRecord[];
  isPathfinderOnly: boolean;
}

export interface YearlyStats {
  year: string;
  count: number;
}

export interface MapRendererProps {
  worldData: FeatureCollection<Geometry, { name?: string }> | null;
  countryMap: Map<string, number>;
  selectedCountry: string | null;
  onCountryClick: (_countryName: string | null) => void;
  isLoading: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  gRef: React.RefObject<SVGGElement | null>;
}

export interface YearlyStatsChartProps {
  countryName: string;
  yearlyStats: YearlyStats[];
  onClose: () => void;
}

export interface CountryChartProps {
  countries: CountryStats[];
  countryLabels: Record<string, string>;
  selectedCountry: string | null;
  onCountryClick: (_countryName: string | null) => void;
}
