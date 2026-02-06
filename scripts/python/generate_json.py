import os
import polars as pl
from datetime import datetime
from calendar import month_name
import json
from difflib import get_close_matches
from functools import lru_cache
import logging
import sys
import time
from pathlib import Path
from typing import Optional, Dict, Any
import re
from normalization_config import COUNTRY_NORMALIZATION, REGION_NORMALIZATION, SYSTEM_GROUPS, SUCCESS_VALUES, LOCATION_NORMALIZATION

# === LOGGING SETUP ===
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'generate_json.log')),
        logging.StreamHandler(sys.stdout)
    ]
)

# === CONFIGURATION CLASS ===
class Config:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    REPO_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))

    # File paths
    EXCEL_PATH = os.getenv('EXCEL_PATH', os.path.join(REPO_ROOT, "data", "private", "raw", "jobhistory.xlsx"))
    OUTPUT_FULL_JSON = os.path.join(REPO_ROOT, "public", "data", "operations_data.json")
    MASTER_COUNTRIES_JSON = os.path.join(BASE_DIR, "master_country_list.json")
    KNOWN_CITIES_JSON = os.path.join(BASE_DIR, "known_cities.json")

    # Log files
    FUZZY_MATCH_LOG = os.path.join(BASE_DIR, "fuzzy_matched_countries.txt")
    UNKNOWN_COUNTRY_LOG = os.path.join(BASE_DIR, "unknown_countries.txt")
    FUZZY_MATCHED_LOCATIONS_LOG = os.path.join(BASE_DIR, "fuzzy_matched_locations.txt")
    UNKNOWN_LOCATIONS_LOG = os.path.join(BASE_DIR, "unknown_locations.txt")

    # GitHub config
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    REPO_OWNER = os.getenv("REPO_OWNER", "Klaratech")
    REPO_NAME = os.getenv("REPO_NAME", "petromac-kiosk")
    TARGET_FULL_JSON = "public/data/operations_data.json"
    TARGET_BRANCH = "main"

    # Processing config
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "10000"))
    MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))

# === BACKWARD COMPATIBILITY ===
BASE_DIR = Config.BASE_DIR
EXCEL_PATH = Config.EXCEL_PATH
OUTPUT_FULL_JSON = Config.OUTPUT_FULL_JSON
MASTER_COUNTRIES_JSON = Config.MASTER_COUNTRIES_JSON
KNOWN_CITIES_JSON = Config.KNOWN_CITIES_JSON
FUZZY_MATCH_LOG = Config.FUZZY_MATCH_LOG
UNKNOWN_COUNTRY_LOG = Config.UNKNOWN_COUNTRY_LOG
FUZZY_MATCHED_LOCATIONS_LOG = Config.FUZZY_MATCHED_LOCATIONS_LOG
UNKNOWN_LOCATIONS_LOG = Config.UNKNOWN_LOCATIONS_LOG
GITHUB_TOKEN = Config.GITHUB_TOKEN
REPO_OWNER = Config.REPO_OWNER
REPO_NAME = Config.REPO_NAME
TARGET_FULL_JSON = Config.TARGET_FULL_JSON
TARGET_BRANCH = Config.TARGET_BRANCH
SKIP_GITHUB_PUSH = os.getenv("SKIP_GITHUB_PUSH", "false").lower() == "true"

# === VALIDATION FUNCTIONS ===
def validate_environment() -> bool:
    """Validate required environment and files exist"""
    required_files = [EXCEL_PATH, MASTER_COUNTRIES_JSON, KNOWN_CITIES_JSON]
    missing_files = [f for f in required_files if not os.path.exists(f)]

    if missing_files:
        logging.error(f"Missing required files: {missing_files}")
        return False

    if not GITHUB_TOKEN:
        logging.warning("GITHUB_TOKEN not set - GitHub push will be skipped")

    logging.info("Environment validation passed")
    return True

def validate_github_token(token: str) -> bool:
    """Validate GitHub token format"""
    if not token:
        return False
    return token.startswith(('ghp_', 'github_pat_')) and len(token) >= 40

def validate_processed_data(df: pl.DataFrame) -> bool:
    """Validate the processed data meets quality standards"""
    if df.is_empty():
        logging.error("Processed data is empty")
        return False

    required_columns = ['Country', 'System', 'Year', 'Successful']
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        logging.error(f"Missing required columns: {missing_cols}")
        return False

    if 'Year' in df.columns:
        years = df['Year'].cast(pl.Int64, strict=False)
        invalid_years = years.filter((years < 1990) | (years > 2030)).len()
        if invalid_years > 0:
            logging.warning(f"Found {invalid_years} records with invalid years")

    logging.info(f"Data validation passed: {df.height} records")
    return True

def generate_metrics(df: pl.DataFrame) -> Dict[str, Any]:
    """Generate processing metrics"""
    metrics = {
        "total_records": df.height,
        "timestamp": datetime.now().isoformat(),
        "countries": df['Country'].n_unique() if 'Country' in df.columns else 0,
        "systems": df['System'].n_unique() if 'System' in df.columns else 0,
        "success_rate": float(df['Successful'].mean()) if 'Successful' in df.columns else 0,
    }

    if 'Year' in df.columns:
        years = df['Year'].cast(pl.Int64, strict=False).drop_nulls()
        metrics["date_range"] = {
            "min_year": int(years.min()) if years.len() > 0 else None,
            "max_year": int(years.max()) if years.len() > 0 else None
        }

    return metrics

# === LOAD KNOWN COUNTRY + CITY DATA ===
def load_reference_data():
    """Load reference data with error handling"""
    try:
        with open(MASTER_COUNTRIES_JSON, "r") as f:
            countries = json.load(f)
        logging.info(f"Loaded {len(countries)} known countries")

        with open(KNOWN_CITIES_JSON, "r") as f:
            cities = json.load(f)
        logging.info(f"Loaded {len(cities)} known cities")

        return countries, cities
    except Exception as e:
        logging.error(f"Failed to load reference data: {e}")
        raise

known_d3_countries, known_cities = load_reference_data()

fuzzy_log = []
unknown_countries = []
location_fuzzy_log = []
unknown_locations = []

# === HELPERS ===

def push_to_github(local_path: str, github_path: str) -> bool:
    """Push file to GitHub with error handling"""
    if SKIP_GITHUB_PUSH:
        logging.info("SKIP_GITHUB_PUSH=true, skipping GitHub push")
        return True

    if not GITHUB_TOKEN:
        logging.warning("Skipping GitHub push: GITHUB_TOKEN not set")
        return True

    try:
        from github import Github
        logging.info(f"Pushing {os.path.basename(local_path)} to GitHub...")
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(f"{REPO_OWNER}/{REPO_NAME}")

        with open(local_path, "r") as f:
            content = f.read()

        try:
            existing = repo.get_contents(github_path)
            repo.update_file(
                path=github_path,
                message=f"Update {os.path.basename(local_path)} ({datetime.now().isoformat(timespec='seconds')})",
                content=content,
                sha=existing.sha,
                branch=TARGET_BRANCH,
            )
            logging.info(f"Updated {github_path}")
        except Exception:
            repo.create_file(
                path=github_path,
                message=f"Create {os.path.basename(local_path)}",
                content=content,
                branch=TARGET_BRANCH,
            )
            logging.info(f"Created {github_path}")

        return True
    except Exception as e:
        logging.error(f"GitHub push failed: {e}")
        return False

def push_to_github_with_retry(local_path: str, github_path: str, max_retries: int = None) -> bool:
    """Push to GitHub with exponential backoff retry"""
    if max_retries is None:
        max_retries = Config.MAX_RETRIES

    for attempt in range(max_retries):
        if push_to_github(local_path, github_path):
            return True

        if attempt < max_retries - 1:
            wait_time = 2 ** attempt
            logging.warning(f"Retrying GitHub push in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
            time.sleep(wait_time)

    logging.error(f"Failed to push to GitHub after {max_retries} attempts")
    return False

def normalize_month(value):
    if value is None:
        return None
    value = str(value).strip().lower()
    if value in ("", "0", "none", "null"):
        return None
    try:
        num = int(float(value))
        if 1 <= num <= 12:
            return num
    except (ValueError, OverflowError):
        pass
    for i, name in enumerate(month_name):
        if name and name.lower().startswith(value[:3]):
            return i
    return None

@lru_cache(maxsize=1000)
def normalize_country(value):
    value = str(value).strip()
    if value in COUNTRY_NORMALIZATION:
        return COUNTRY_NORMALIZATION[value]
    match = get_close_matches(value, known_d3_countries, n=1, cutoff=0.85)
    if match:
        fuzzy_log.append(f"Fuzzy matched country: '{value}' -> '{match[0]}'")
        return match[0]
    unknown_countries.append(value)
    return value

@lru_cache(maxsize=500)
def normalize_region(value):
    return REGION_NORMALIZATION.get(str(value).strip(), str(value).strip())

@lru_cache(maxsize=100)
def normalize_success(value):
    return SUCCESS_VALUES.get(str(value).strip().lower(), 0)

@lru_cache(maxsize=500)
def group_system(value):
    return SYSTEM_GROUPS.get(str(value).strip(), str(value).strip())

@lru_cache(maxsize=1000)
def normalize_location(value):
    value = str(value).strip()
    if value in LOCATION_NORMALIZATION:
        return LOCATION_NORMALIZATION[value]
    if value in known_cities:
        return value
    match = get_close_matches(value, known_cities, n=1, cutoff=0.85)
    if match:
        location_fuzzy_log.append(f"Fuzzy matched location: '{value}' -> '{match[0]}'")
        return match[0]
    unknown_locations.append(value)
    return value

# === CORE LOGIC ===

def load_clean_data() -> Optional[pl.DataFrame]:
    """Load and clean data with comprehensive error handling"""
    try:
        logging.info("Reading Excel...")
        if not os.path.exists(EXCEL_PATH):
            raise FileNotFoundError(f"Excel file not found: {EXCEL_PATH}")

        df = pl.read_excel(
            EXCEL_PATH,
            sheet_name="MasterData_Operations",
            infer_schema_length=0,  # read all as strings
        )
        logging.info(f"Loaded {df.height} rows from Excel")

        # Strip whitespace from column names
        logging.info("Trimming to 'Remarks' column...")
        df = df.rename({col: col.strip() for col in df.columns})

        if "Remarks" not in df.columns:
            raise ValueError("'Remarks' column not found")

        remarks_index = df.columns.index("Remarks")
        df = df.select(df.columns[:remarks_index + 1])

        logging.info("Dropping final row (assumed marker)...")
        df = df.head(df.height - 1)

        logging.info("Dropping first 4 columns...")
        df = df.select(df.columns[4:])

        # Apply normalizations using map_elements for Python functions
        if "Month" in df.columns:
            logging.info("Normalizing 'Month' column...")
            df = df.with_columns(
                pl.col("Month").map_elements(normalize_month, return_dtype=pl.Int64).alias("Month")
            )

        logging.info("Replacing nulls with 0 and standardizing key fields...")
        df = df.fill_null("0")

        if "Region" in df.columns:
            logging.info("Normalizing regions...")
            df = df.with_columns(
                pl.col("Region").map_elements(normalize_region, return_dtype=pl.String).alias("Region")
            )

        if "Country" in df.columns:
            logging.info("Normalizing countries...")
            df = df.with_columns(
                pl.col("Country").map_elements(normalize_country, return_dtype=pl.String).alias("Country")
            )

        if "Location" in df.columns:
            logging.info("Normalizing locations...")
            df = df.with_columns(
                pl.col("Location").map_elements(normalize_location, return_dtype=pl.String).alias("Location")
            )

        if "Successful" in df.columns:
            logging.info("Normalizing success values...")
            df = df.with_columns(
                pl.col("Successful").map_elements(normalize_success, return_dtype=pl.Int64).alias("Successful")
            )

        if "System" in df.columns:
            logging.info("Grouping systems...")
            df = df.with_columns(
                pl.col("System").map_elements(group_system, return_dtype=pl.String).alias("System")
            )

        logging.info(f"Data processing completed: {df.height} records")
        return df

    except Exception as e:
        logging.error(f"Failed to load and clean data: {e}")
        return None

def write_anomaly_logs():
    """Write anomaly logs with error handling"""
    try:
        if fuzzy_log:
            with open(FUZZY_MATCH_LOG, "w") as f:
                f.write("\n".join(fuzzy_log))
            logging.info(f"Wrote {len(fuzzy_log)} fuzzy country matches")

        if unknown_countries:
            with open(UNKNOWN_COUNTRY_LOG, "w") as f:
                f.write("\n".join(sorted(set(unknown_countries))))
            logging.warning(f"Found {len(set(unknown_countries))} unknown countries")

        if location_fuzzy_log:
            with open(FUZZY_MATCHED_LOCATIONS_LOG, "w") as f:
                f.write("\n".join(location_fuzzy_log))
            logging.info(f"Wrote {len(location_fuzzy_log)} fuzzy location matches")

        if unknown_locations:
            with open(UNKNOWN_LOCATIONS_LOG, "w") as f:
                f.write("\n".join(sorted(set(unknown_locations))))
            logging.warning(f"Found {len(set(unknown_locations))} unknown locations")

    except Exception as e:
        logging.error(f"Failed to write anomaly logs: {e}")

def main():
    """Main function with comprehensive error handling and monitoring"""
    start_time = time.time()
    logging.info("Starting data processing...")

    # Validate environment
    if not validate_environment():
        logging.error("Environment validation failed")
        sys.exit(1)

    try:
        # Load and process data
        df = load_clean_data()
        if df is None:
            logging.error("Failed to load data")
            sys.exit(1)

        # Validate processed data
        if not validate_processed_data(df):
            logging.error("Data validation failed")
            sys.exit(1)

        # Generate metrics
        metrics = generate_metrics(df)
        logging.info(f"Processing metrics: {metrics}")

        # Convert to records and save
        full_records = df.to_dicts()

        with open(OUTPUT_FULL_JSON, "w") as f:
            json.dump(full_records, f, indent=2)

        logging.info(f"Wrote {len(full_records)} records to {OUTPUT_FULL_JSON}")

        # Push to GitHub with retry
        success = push_to_github_with_retry(OUTPUT_FULL_JSON, TARGET_FULL_JSON)

        # Write anomaly logs
        write_anomaly_logs()

        # Calculate and log execution time
        elapsed = time.time() - start_time
        logging.info(f"Processing completed successfully in {elapsed:.2f}s")

        # Exit with appropriate code
        sys.exit(0 if success else 1)

    except Exception as e:
        logging.error(f"Fatal error in main: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
