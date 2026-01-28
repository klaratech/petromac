#!/usr/bin/env node

/**
 * CSV Options Generator for Success Stories
 * 
 * This utility reads the CSV file and generates a ready-to-paste
 * options object for the constants file. For maintenance use only.
 * 
 * Usage: node scripts/generate-options.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const FILTER_COLUMNS = {
  area: "Area", 
  country: "Country",
  wlco: "WL Co",
  category1: "Category 1",
  category2: "Category 2", 
  device: "Device",
};

function csvPath() {
  return path.join(process.cwd(), "assets", "tags", "success-stories.csv");
}

function generateOptions() {
  console.log('🔄 Reading CSV file...');
  
  const csvFilePath = csvPath();
  if (!fs.existsSync(csvFilePath)) {
    console.error('❌ CSV file not found at:', csvFilePath);
    process.exit(1);
  }

  const csv = fs.readFileSync(csvFilePath, "utf8");
  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => (typeof v === "string" ? v.trim() : v),
  });

  if (parsed.errors?.length) {
    console.error('❌ CSV parse errors:', parsed.errors);
    process.exit(1);
  }

  console.log(`✅ Loaded ${parsed.data.length} rows`);
  
  const options = {};
  
  for (const [filterKey, columnName] of Object.entries(FILTER_COLUMNS)) {
    const uniqueValues = new Set();
    
    for (const row of parsed.data) {
      const value = String(row[columnName] ?? "").trim();
      if (value && value !== "") {
        // Handle comma-separated values
        const values = value.split(",").map(v => v.trim()).filter(Boolean);
        values.forEach(v => uniqueValues.add(v));
      }
    }
    
    // Convert to sorted array
    options[filterKey] = Array.from(uniqueValues).sort((a, b) => {
      // For year, sort numerically in descending order
      if (filterKey === "year") {
        return parseInt(b) - parseInt(a);
      }
      // For others, sort alphabetically
      return a.localeCompare(b);
    });
    
    console.log(`📊 ${filterKey}: ${options[filterKey].length} unique values`);
  }

  // Generate current date
  const today = new Date().toISOString().split('T')[0];
  
  // Generate the ready-to-paste object
  const output = {
    LAST_UPDATED: today,
    SOURCE_VERSION: `csv-generated-${today}`,
    SUCCESS_STORIES_OPTIONS: options
  };

  console.log('\n🎯 Generated options object:');
  console.log('=====================================');
  console.log(JSON.stringify(output, null, 2));
  console.log('=====================================');
  
  console.log('\n📋 Copy the above and paste into src/constants/successStoriesOptions.ts');
  console.log('💡 Remember to update the arrays to use proper TypeScript array format');
  
  return options;
}

if (require.main === module) {
  generateOptions();
}

module.exports = { generateOptions };
