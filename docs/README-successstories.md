# Success Stories Options Management

This document explains how to maintain the success stories filter options in the Petromac Kiosk application.

## Overview

The success stories filtering system uses **static, hard-coded options** for optimal performance. The filter options (year, area, country, etc.) are defined in constants rather than being computed from the CSV at runtime.

## Architecture

### Static Mode (Default)
- **File**: `src/constants/successStoriesOptions.ts`
- **API Response Time**: < 10ms
- **Performance**: Excellent (no CSV parsing)
- **Cache**: 24 hours

### Dynamic Mode (Debugging)
- **Environment Variable**: `OPTIONS_MODE=dynamic`
- **Source**: Computed from CSV at runtime
- **Performance**: Slower (requires CSV parsing)
- **Cache**: 1 hour

## Files Structure

```
src/
├── constants/
│   └── successStoriesOptions.ts    # Static options constants
├── app/api/successstories/
│   └── route.ts                    # API endpoint
└── types/
    └── pdf.ts                      # TypeScript types

scripts/
└── generate-options.js             # Maintenance utility

public/
├── successstories-summary.csv      # Source data
└── successstories.pdf              # PDF document
```

## Maintaining Options

When the CSV data changes, follow this workflow:

### 1. Update the CSV
- Replace `public/successstories-summary.csv` with new data
- Ensure the column headers remain: `Year,Area,Country,WL Co,Category 1,Category 2,Device,Page`

### 2. Generate New Options
```bash
# Run the generator utility
node scripts/generate-options.js

# This will output a ready-to-paste JSON object
```

### 3. Update Constants
```bash
# Edit the constants file
vi src/constants/successStoriesOptions.ts

# Update the arrays with the generated values
# Update LAST_UPDATED and SOURCE_VERSION
```

### 4. Validate Changes
```typescript
// The system validates on startup:
// ✅ All arrays contain only strings
// ✅ No empty or whitespace-only values  
// ✅ No duplicates
// ✅ All FILTER_COLUMNS keys exist
```

### 5. Deploy
```bash
# Commit and deploy
git add .
git commit -m "Update success stories options"
git push
```

## Environment Variables

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `OPTIONS_MODE` | `static`, `dynamic` | `static` | Options source mode |

## API Endpoints

### GET /api/successstories
Returns filter options with metadata:

```json
{
  "year": ["2024", "2023", ...],
  "area": ["AFR", "APAC", ...],
  "country": ["Angola", "Australia", ...],
  "wlco": ["BHI", "HAL", "SLB"],
  "category1": [...],
  "category2": [...], 
  "device": [...],
  "_metadata": {
    "last_updated": "2024-12-29",
    "source_version": "manual-v1.0",
    "mode": "static"
  }
}
```

### POST /api/successstories
Handles PDF generation and email functionality (unchanged).

## Startup Validation

The system performs validation on startup:

```
✅ options: year(10), area(6), country(21), wlco(3), category1(7), category2(8), device(5) — last_updated=2024-12-29, source=manual-v1.0
```

If validation fails, the service will not start:
```
❌ Static options validation failed: year: contains duplicate values
❌ Missing keys in static options: category3
```

## Troubleshooting

### Options Not Loading
1. Check startup logs for validation errors
2. Verify all required keys exist in constants
3. Check for duplicate or invalid values

### Slow Response Times
1. Confirm `OPTIONS_MODE=static` (default)
2. Check if dynamic mode is accidentally enabled
3. Verify constants are properly imported

### Development/Testing
```bash
# Switch to dynamic mode for debugging
export OPTIONS_MODE=dynamic

# Switch back to static mode
unset OPTIONS_MODE
# or
export OPTIONS_MODE=static
```

## Migration from Dynamic

The old dynamic system has been replaced but remains available for debugging:

- **Old**: CSV parsed on every request
- **New**: Static constants, instant response
- **Fallback**: Set `OPTIONS_MODE=dynamic` to use old behavior

## Performance Comparison

| Mode | Response Time | Cold Start | Memory |
|------|---------------|------------|--------|
| Static | < 10ms | Instant | Low |
| Dynamic | 100-500ms | Slow | Higher |

## Best Practices

1. **Always validate** generated options before deploying
2. **Test both modes** when making changes
3. **Update metadata** (date and version) with each change
4. **Backup old constants** before major updates
5. **Monitor startup logs** for validation issues

## Example Workflow

```bash
# 1. CSV updated
cp new-data.csv public/successstories-summary.csv

# 2. Generate options
node scripts/generate-options.js > temp-options.json

# 3. Review and update constants
# (copy from temp-options.json to successStoriesOptions.ts)

# 4. Test locally
npm run dev
# Check startup logs: ✅ options: year(10), area(6), ...

# 5. Deploy
git commit -am "Update success stories options"
git push
