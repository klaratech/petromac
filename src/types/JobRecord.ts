export interface JobRecord {
  Region: string;
  Country: string;
  Location: string;
  Successful: number;
  System: string;
  /** Finer identity within a family — e.g. "Helix" / "Rocker" inside
   *  "Focus - CH". May be "" when a historical record couldn't be
   *  classified. See scripts/python/normalization_config.py. */
  Subsystem: string;
  Month: number;
  Year: number;
  "PathFinder Run (Y/N)": string; // <-- required for the year-wise chart
}