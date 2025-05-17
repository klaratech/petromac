export interface JobRecord {
  Region: string;
  Country: string;
  Location: string;
  Successful: number;
  System: string;
  Month: number;
  Year: number; // <-- required for the year-wise chart
}