# Python Scripts

This directory contains Python utility scripts for data processing and API services.

## Overview

- **generate_json.py** - Processes raw Excel data into sanitized JSON for the Next.js app
- **normalization_config.py** - Configuration for data normalization rules
- **validate_data.py** - Data validation utilities

## Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

**Note:** These scripts use [Polars](https://pola.rs/) for data processing, which provides faster performance compared to pandas.

## Local Setup

### 1. Create Virtual Environment

```bash
# From repository root
cd scripts/python

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

**Key Dependencies:**
- `polars` - High-performance DataFrame library (replaces pandas)
- `fastapi` - Web framework for successstories API
- `pypdf` - PDF manipulation
- `openpyxl` - Excel file reading

## Scripts

### generate_json.py

Processes the raw Excel file into sanitized JSON for public consumption.

**Input:**
- Excel file: `data/private/raw/jobhistory.xlsx`
- Reference data: `master_country_list.json`, `known_cities.json`

**Output:**
- Sanitized JSON: `public/data/operations_data.json`
- Processing logs: `*.log`, `*_matched_*.txt`, `unknown_*.txt`

**Usage:**

```bash
# Basic usage (uses default paths)
python generate_json.py

# With custom Excel path
EXCEL_PATH=/path/to/file.xlsx python generate_json.py

# With GitHub push (requires GITHUB_TOKEN)
GITHUB_TOKEN=your_token python generate_json.py
```

**Environment Variables:**

- `EXCEL_PATH` - Path to input Excel file (default: `data/private/raw/jobhistory.xlsx`)
- `GITHUB_TOKEN` - GitHub personal access token for automated pushes
- `REPO_OWNER` - GitHub repository owner (default: Klaratech)
- `REPO_NAME` - GitHub repository name (default: petromac-kiosk)
- `CHUNK_SIZE` - Processing chunk size (default: 10000)
- `MAX_RETRIES` - Maximum retry attempts (default: 3)

**Example:**

```bash
# Process data and push to GitHub
cd scripts/python
source venv/bin/activate
GITHUB_TOKEN=$YOUR_TOKEN python generate_json.py
```

## Data Flow

```
┌─────────────────────────────────────┐
│  data/private/raw/jobhistory.xlsx   │
│  (Private, not in git)              │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  generate_json.py    │
    │  - Normalizes data   │
    │  - Validates records │
    │  - Sanitizes output  │
    └──────────┬───────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  public/data/operations_data.json    │
│  (Public, served by Vercel CDN)      │
└──────────────────────────────────────┘
```

## GitHub Actions Integration

The `generate_json.py` script is automatically run via GitHub Actions:

- **Trigger**: Manual dispatch or weekly schedule (Sunday 2 AM UTC)
- **Workflow**: `.github/workflows/data-build.yaml`
- **Output**: Commits sanitized JSON back to repository

### Running via GitHub Actions

1. Go to repository **Actions** tab
2. Select **Data Build Pipeline** workflow
3. Click **Run workflow**
4. Choose whether to commit output (default: yes)

## Development

### Adding New Normalizations

Edit `normalization_config.py`:

```python
COUNTRY_NORMALIZATION = {
    "USA": "United States",
    "UK": "United Kingdom",
    # Add more mappings...
}
```

### Testing

```bash
# Run with test data
EXCEL_PATH=test_data.xlsx python generate_json.py

# Validate output
python validate_data.py public/data/operations_data.json
```

## Troubleshooting

### Missing Dependencies

```bash
pip install --upgrade -r requirements.txt
```

### File Not Found Errors

Ensure paths are correct relative to repository root:
- Input: `data/private/raw/jobhistory.xlsx`
- Output: `public/data/operations_data.json`

### GitHub Push Fails

- Verify `GITHUB_TOKEN` is valid
- Check token has `repo` scope
- Ensure repository permissions allow pushes

### Import Errors

Make sure you're in the correct directory:
```bash
cd scripts/python
python generate_json.py
```

## Security

- **Never commit** `.env` files with secrets
- Use GitHub Secrets for `GITHUB_TOKEN` in Actions
- Private data in `data/private/` is gitignored
- Sanitized output contains no sensitive information

## Logs

Scripts generate several log files:

- `generate_json.log` - Main processing log
- `fuzzy_matched_countries.txt` - Countries matched via fuzzy search
- `unknown_countries.txt` - Unmatched countries requiring review
- `fuzzy_matched_locations.txt` - Locations matched via fuzzy search
- `unknown_locations.txt` - Unmatched locations requiring review

Review these logs to improve normalization rules.
