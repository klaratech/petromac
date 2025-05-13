import os
import pandas as pd
from datetime import datetime
from github import Github
from calendar import month_name
import json

# === CONFIGURATION ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EXCEL_PATH = os.path.join(BASE_DIR, "jobhistory.xlsx")
OUTPUT_CSV = os.path.join(BASE_DIR, "runs-summary.csv")
OUTPUT_COUNTRY_JSON = os.path.join(BASE_DIR, "country-stats.json")
OUTPUT_REGION_JSON = os.path.join(BASE_DIR, "region-stats.json")
OUTPUT_FULL_JSON = os.path.join(BASE_DIR, "operations_data.json")

# GitHub push config
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
REPO_OWNER = "Klaratech"
REPO_NAME = "petromac-kiosk"
TARGET_CSV_PATH = "public/data/runs-summary.csv"
TARGET_COUNTRY_JSON = "public/data/country-stats.json"
TARGET_REGION_JSON = "public/data/region-stats.json"
TARGET_FULL_JSON = "public/data/operations_data.json"
TARGET_BRANCH = "main"

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

    return df


def generate_stats(df):
    df["Successful"] = df["Successful"].fillna("1").astype(int)
    df["Unsuccessful"] = df["Successful"].apply(lambda x: 0 if x == 1 else 1)

    # Write full JSON with all records (for filtering)
    full_records = df.to_dict(orient="records")
    with open(OUTPUT_FULL_JSON, "w") as f:
        json.dump(full_records, f, indent=2)
    print(f"✅ Wrote full records to {OUTPUT_FULL_JSON}")

    # Country-level stats
    country = (
        df.groupby("Country")[["Successful", "Unsuccessful"]]
        .sum()
        .reset_index()
    )
    country["Total"] = country["Successful"] + country["Unsuccessful"]
    country.rename(columns={"Country": "id"}, inplace=True)
    country_records = country.to_dict(orient="records")
    with open(OUTPUT_COUNTRY_JSON, "w") as f:
        json.dump(country_records, f, indent=2)
    print(f"✅ Wrote country stats to {OUTPUT_COUNTRY_JSON}")

    # Region-level stats (if Region column exists)
    region_files = [OUTPUT_COUNTRY_JSON, OUTPUT_FULL_JSON]
    if "Region" in df.columns:
        region = (
            df.groupby("Region")[["Successful", "Unsuccessful"]]
            .sum()
            .reset_index()
        )
        region["Total"] = region["Successful"] + region["Unsuccessful"]
        region.rename(columns={"Region": "id"}, inplace=True)
        region_records = region.to_dict(orient="records")
        with open(OUTPUT_REGION_JSON, "w") as f:
            json.dump(region_records, f, indent=2)
        print(f"✅ Wrote region stats to {OUTPUT_REGION_JSON}")
        region_files.append(OUTPUT_REGION_JSON)

    return region_files

# === MAIN ENTRY POINT ===
def main():
    df = load_clean_data()
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"✅ Wrote cleaned CSV to: {OUTPUT_CSV}")

    push_to_github(OUTPUT_CSV, TARGET_CSV_PATH)

    generated = generate_stats(df)
    for json_file in generated:
        if json_file.endswith("country-stats.json"):
            push_to_github(json_file, TARGET_COUNTRY_JSON)
        elif json_file.endswith("region-stats.json"):
            push_to_github(json_file, TARGET_REGION_JSON)
        elif json_file.endswith("operations_data.json"):
            push_to_github(json_file, TARGET_FULL_JSON)

if __name__ == "__main__":
    main()
