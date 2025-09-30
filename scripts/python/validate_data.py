import os
import json
import requests
import pandas as pd
from normalization_config import COUNTRY_NORMALIZATION, REGION_NORMALIZATION
import topojson as tp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "operations_data.json")

UNKNOWN_COUNTRIES_PATH = os.path.join(BASE_DIR, "unknown_countries.txt")
D3_MISMATCH_PATH = os.path.join(BASE_DIR, "d3_mismatched_countries.txt")
UNKNOWN_LOCATIONS_PATH = os.path.join(BASE_DIR, "unknown_locations.txt")


def load_operations_data():
    print("📂 Loading operations_data.json...")
    with open(DATA_PATH, "r") as f:
        return json.load(f)


def get_d3_country_names():
    print("🌍 Fetching D3 topojson country list...")
    url = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
    response = requests.get(url)
    data = response.json()
    objects = data["objects"]["countries"]
    geometries = objects.get("geometries", [])
    d3_names = sorted(set(
        g.get("properties", {}).get("name", "").strip()
        for g in geometries if "properties" in g
    ))
    return set(d3_names)


def load_known_cities():
    print("🏙️  Loading known cities list...")
    # You can replace this with a local file or API
    known_city_set = set()

    try:
        # Example: simple static list
        url = "https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json"
        response = requests.get(url)
        cities_data = response.json()
        known_city_set = set(entry['name'].strip() for entry in cities_data)
        print(f"✅ Loaded {len(known_city_set):,} city names.")
    except Exception as e:
        print(f"⚠️ Failed to load city data: {e}")

    return known_city_set


def validate_countries(df: pd.DataFrame):
    print("🔍 Validating countries...")

    df["Country"] = df["Country"].astype(str).str.strip()
    known_normalized = set(COUNTRY_NORMALIZATION.values())
    all_countries = set(df["Country"].dropna())

    unknown = sorted(c for c in all_countries if c not in known_normalized)

    if unknown:
        print(f"🟠 {len(unknown)} countries not in COUNTRY_NORMALIZATION")
        with open(UNKNOWN_COUNTRIES_PATH, "w") as f:
            for c in unknown:
                f.write(c + "\n")
        print(f"✅ Wrote unknown countries to {UNKNOWN_COUNTRIES_PATH}")
    else:
        print("✅ All countries covered in normalization")

    return all_countries


def validate_d3_matches(all_countries):
    d3_names = get_d3_country_names()
    mismatched = sorted(c for c in all_countries if c not in d3_names)

    if mismatched:
        print(f"🔴 {len(mismatched)} countries not recognized by D3/topojson")
        with open(D3_MISMATCH_PATH, "w") as f:
            for c in mismatched:
                f.write(c + "\n")
        print(f"✅ Wrote D3 mismatches to {D3_MISMATCH_PATH}")
    else:
        print("✅ All countries match D3 topojson naming")


def validate_locations(df: pd.DataFrame, known_cities: set):
    print("🔍 Validating location field against city list...")
    df["Location"] = df["Location"].astype(str).str.strip()
    all_locations = set(df["Location"].dropna())
    unknown = sorted(loc for loc in all_locations if loc not in known_cities)

    if unknown:
        print(f"🟡 {len(unknown)} location values not found in city list")
        with open(UNKNOWN_LOCATIONS_PATH, "w") as f:
            for loc in unknown:
                f.write(loc + "\n")
        print(f"✅ Wrote unknown locations to {UNKNOWN_LOCATIONS_PATH}")
    else:
        print("✅ All locations matched known cities")


import os
import pandas as pd
import json

def generate_city_normalization_template(
    excel_path: str,
    output_path: str,
    sheet_name: str = "MasterData_Operations",
    location_column: str = "Location"
):
    print("📥 Reading Excel file...")
    df = pd.read_excel(excel_path, sheet_name=sheet_name, dtype=str)
    df.columns = df.columns.str.strip()

    if location_column not in df.columns:
        raise ValueError(f"❌ Column '{location_column}' not found in sheet '{sheet_name}'")

    print("🧽 Extracting and cleaning unique city names...")
    cities = df[location_column].dropna().astype(str).str.strip()
    unique_cities = sorted(set(cities))

    # Map each raw city name to itself (template for manual correction)
    normalization_dict = {city: city for city in unique_cities}

    print(f"✍ Writing normalization template with {len(normalization_dict)} entries to {output_path}...")
    with open(output_path, "w") as f:
        json.dump(normalization_dict, f, indent=2)
    print("✅ Done.")

# === USAGE ===

if __name__ == "__main__":
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    EXCEL_PATH = os.path.join(BASE_DIR, "jobhistory.xlsx")
    OUTPUT_PATH = os.path.join(BASE_DIR, "known_cities.json")
    generate_city_normalization_template(EXCEL_PATH, OUTPUT_PATH)


def main():
    records = load_operations_data()
    df = pd.DataFrame(records)

    countries = validate_countries(df)
    validate_d3_matches(countries)

    city_set = load_known_cities()
    if city_set:
        validate_locations(df, city_set)
    
    url = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
    response = requests.get(url)
    topology = response.json()

    countries = [feature['properties']['name'] for feature in topology['objects']['countries']['geometries']]
    with open("countries-d3.json", "w") as f:
        json.dump(sorted(set(countries)), f)

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    EXCEL_PATH = os.path.join(BASE_DIR, "jobhistory.xlsx")
    OUTPUT_PATH = os.path.join(BASE_DIR, "known_cities.json")
    generate_known_cities_json(EXCEL_PATH, OUTPUT_PATH)


if __name__ == "__main__":
    main()

# Sample code to extract D3-compatible country names from TopoJSON
  # Or handle as raw TopoJSON

