import os
import pandas as pd
from datetime import datetime
from github import Github
from calendar import month_name
import json
from difflib import get_close_matches
from normalization_config import COUNTRY_NORMALIZATION, REGION_NORMALIZATION, SYSTEM_GROUPS, SUCCESS_VALUES, LOCATION_NORMALIZATION

# === CONFIGURATION ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EXCEL_PATH = os.path.join(BASE_DIR, "jobhistory.xlsx")
OUTPUT_CSV = os.path.join(BASE_DIR, "runs-summary.csv")
OUTPUT_FULL_JSON = os.path.join(BASE_DIR, "operations_data.json")
MASTER_COUNTRIES_JSON = os.path.join(BASE_DIR, "master_country_list.json")
KNOWN_CITIES_JSON = os.path.join(BASE_DIR, "known_cities.json")

FUZZY_MATCH_LOG = os.path.join(BASE_DIR, "fuzzy_matched_countries.txt")
UNKNOWN_COUNTRY_LOG = os.path.join(BASE_DIR, "unknown_countries.txt")
FUZZY_MATCHED_LOCATIONS_LOG = os.path.join(BASE_DIR, "fuzzy_matched_locations.txt")
UNKNOWN_LOCATIONS_LOG = os.path.join(BASE_DIR, "unknown_locations.txt")

# GitHub push config
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
REPO_OWNER = "Klaratech"
REPO_NAME = "petromac-kiosk"
TARGET_FULL_JSON = "public/data/operations_data.json"
TARGET_BRANCH = "main"

# === LOAD KNOWN COUNTRY + CITY DATA ===
with open(MASTER_COUNTRIES_JSON, "r") as f:
    known_d3_countries = json.load(f)

with open(KNOWN_CITIES_JSON, "r") as f:
    known_cities = json.load(f)

fuzzy_log = []
unknown_countries = []
location_fuzzy_log = []
unknown_locations = []

# === HELPERS ===

def push_to_github(local_path, github_path):
    if not GITHUB_TOKEN:
        print("⚠️ Skipping GitHub push: GITHUB_TOKEN not set")
        return
    print(f"📤 Pushing {os.path.basename(local_path)} to GitHub...")
    g = Github(GITHUB_TOKEN)
    repo = g.get_repo(f"{REPO_OWNER}/{REPO_NAME}")
    with open(local_path, "r") as f:
        content = f.read()
    try:
        existing = repo.get_contents(github_path)
        repo.update_file(
            path=github_path,
            message=f"🔄 Update {os.path.basename(local_path)} ({datetime.now().isoformat(timespec='seconds')})",
            content=content,
            sha=existing.sha,
            branch=TARGET_BRANCH,
        )
        print(f"✅ Updated {github_path}")
    except Exception:
        repo.create_file(
            path=github_path,
            message=f"➕ Create {os.path.basename(local_path)}",
            content=content,
            branch=TARGET_BRANCH,
        )
        print(f"✅ Created {github_path}")

def normalize_month(value):
    if pd.isna(value):
        return None
    value = str(value).strip().lower()
    try:
        num = int(value)
        if 1 <= num <= 12:
            return num
    except ValueError:
        pass
    for i, name in enumerate(month_name):
        if name and name.lower().startswith(value[:3]):
            return i
    return None

def normalize_country(value):
    value = str(value).strip()
    if value in COUNTRY_NORMALIZATION:
        return COUNTRY_NORMALIZATION[value]
    match = get_close_matches(value, known_d3_countries, n=1, cutoff=0.85)
    if match:
        fuzzy_log.append(f"🔁 Fuzzy matched country: '{value}' → '{match[0]}'")
        return match[0]
    unknown_countries.append(value)
    return value

def normalize_region(value):
    return REGION_NORMALIZATION.get(str(value).strip(), str(value).strip())

def normalize_success(value):
    return SUCCESS_VALUES.get(str(value).strip().lower(), 0)

def group_system(value):
    return SYSTEM_GROUPS.get(str(value).strip(), str(value).strip())

def normalize_location(value):
    value = str(value).strip()
    if value in LOCATION_NORMALIZATION:
        return LOCATION_NORMALIZATION[value]
    if value in known_cities:
        return value
    match = get_close_matches(value, known_cities, n=1, cutoff=0.85)
    if match:
        location_fuzzy_log.append(f"🔁 Fuzzy matched location: '{value}' → '{match[0]}'")
        return match[0]
    unknown_locations.append(value)
    return value

# === CORE LOGIC ===

def load_clean_data():
    print("📥 Reading Excel...")
    df = pd.read_excel(EXCEL_PATH, sheet_name="MasterData_Operations", dtype=str)
    print("🧹 Trimming to 'Remarks' column...")
    df.columns = df.columns.str.strip()
    if "Remarks" not in df.columns:
        raise ValueError("❌ 'Remarks' column not found")
    remarks_index = df.columns.get_loc("Remarks")
    df = df.iloc[:, :remarks_index + 1]
    print("✂️ Dropping final row (assumed marker)...")
    df = df.iloc[:-1]
    if "Month" in df.columns:
        print("🧮 Normalizing 'Month' column...")
        df["Month"] = df["Month"].apply(normalize_month)
    print("🧽 Replacing NaNs with 0 and standardizing key fields...")
    df = df.fillna(0)
    if "Region" in df.columns:
        df["Region"] = df["Region"].apply(normalize_region)
    if "Country" in df.columns:
        df["Country"] = df["Country"].apply(normalize_country)
    if "Location" in df.columns:
        df["Location"] = df["Location"].apply(normalize_location)
    if "Successful" in df.columns:
        df["Successful"] = df["Successful"].apply(normalize_success)
    if "System" in df.columns:
        df["System"] = df["System"].apply(group_system)
    return df

def write_anomaly_logs():
    if fuzzy_log:
        with open(FUZZY_MATCH_LOG, "w") as f:
            f.write("\n".join(fuzzy_log))
    if unknown_countries:
        with open(UNKNOWN_COUNTRY_LOG, "w") as f:
            f.write("\n".join(sorted(set(unknown_countries))))
    if location_fuzzy_log:
        with open(FUZZY_MATCHED_LOCATIONS_LOG, "w") as f:
            f.write("\n".join(location_fuzzy_log))
    if unknown_locations:
        with open(UNKNOWN_LOCATIONS_LOG, "w") as f:
            f.write("\n".join(sorted(set(unknown_locations))))

def main():
    df = load_clean_data()
    full_records = df.to_dict(orient="records")
    with open(OUTPUT_FULL_JSON, "w") as f:
        json.dump(full_records, f, indent=2)
    print(f"✅ Wrote operations data JSON to {OUTPUT_FULL_JSON}")
    push_to_github(OUTPUT_FULL_JSON, TARGET_FULL_JSON)
    write_anomaly_logs()

if __name__ == "__main__":
    main()