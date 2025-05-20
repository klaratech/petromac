export interface JobRecord {
  Region: string;
  Country: string;
  Location: string;
  Successful: number;
  System: string;
  Month: number;
  Year: number;
  "PathFinder Run (Y/N)": string; // <-- required for the year-wise chart
}