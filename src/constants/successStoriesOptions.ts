// Success Stories Filter Options - Static Constants
// Generated from successstories-summary.csv
// Last updated: 2024-12-29
// Source: Manual extraction from CSV data

export const LAST_UPDATED = "2024-12-29";
export const SOURCE_VERSION = "manual-v1.0";

export const SUCCESS_STORIES_OPTIONS = {
  area: [
    "AFR",
    "APAC", 
    "EUR",
    "LAM",
    "MENA",
    "NAM"
  ],
  
  country: [
    "Angola",
    "Australia",
    "Azerbaijan",
    "China",
    "Gulf of Mexico",
    "Guyana", 
    "Iraq",
    "Japan",
    "KSA",
    "Kuwait",
    "Malaysia",
    "Mexico",
    "New Zealand",
    "Nigeria",
    "Norway",
    "Oman",
    "Peru",
    "Trinidad",
    "UAE",
    "USA",
    "Vietnam"
  ],
  
  wlco: [
    "BHI",
    "HAL",
    "SLB"
  ],
  
  category1: [
    "Centralization",
    "Operational Efficiency",
    "Sensor Orientation",
    "Sticking Prevention",
    "Well Access",
    "Well Access: Deviation",
    "Well Access: Ledges"
  ],
  
  category2: [
    "Centralization",
    "Operational Efficiency", 
    "Sensor Orientation",
    "Sticking Prevention",
    "Well Access",
    "Well Access: Deviation",
    "Well Access: Ledges",
    "Well Access:Deviation"
  ],
  
  device: [
    "Focus - CH",
    "Focus - OH", 
    "Pathfinder",
    "Wireline Express",
    "Wireline Express - FT"
  ]
} as const;

// Type for the options structure
export type SuccessStoriesOptions = typeof SUCCESS_STORIES_OPTIONS;

// Validation function to ensure data integrity
export function validateOptions(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check each category
  for (const [key, values] of Object.entries(SUCCESS_STORIES_OPTIONS)) {
    const valueArray = values as readonly string[];
    
    if (!Array.isArray(valueArray)) {
      errors.push(`${key}: must be an array`);
      continue;
    }
    
    // Check for valid strings
    for (const value of valueArray) {
      if (typeof value !== 'string') {
        errors.push(`${key}: contains non-string value: ${value}`);
      } else if (value.trim() !== value) {
        errors.push(`${key}: contains value with leading/trailing spaces: "${value}"`);
      } else if (value.trim() === '') {
        errors.push(`${key}: contains empty string`);
      }
    }
    
    // Check for duplicates
    const uniqueValues = new Set(valueArray);
    if (uniqueValues.size !== valueArray.length) {
      errors.push(`${key}: contains duplicate values`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Get summary stats for logging
export function getOptionsSummary() {
  return Object.entries(SUCCESS_STORIES_OPTIONS)
    .map(([key, values]) => `${key}(${values.length})`)
    .join(', ');
}
