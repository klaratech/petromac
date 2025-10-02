import os
import json
import requests
import polars as pl
from difflib import get_close_matches
from normalization_config import COUNTRY_NORMALIZATION, LOCATION_NORMALIZATION

# === CONFIGURATION ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EXCEL_PATH = os.path.join(BASE_DIR, "jobhistory.xlsx")
MASTER_COUNTRY_LIST_PATH = os.path.join(BASE_DIR, "master_country_list.json")
KNOWN_CITIES_PATH = os.path.join(BASE_DIR, "known_cities.json")
UNMATCHED_COUNTRIES_LOG = os.path.join(BASE_DIR, "unmatched_countries.txt")
UNMATCHED_LOCATIONS_LOG = os.path.join(BASE_DIR, "unmatched_locations.txt")


# === HELPERS ===

def fetch_countries_from_world_atlas() -> set:
    print("🌍 Fetching countries from World Atlas (countries-110m)...")
    url = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()
    geometries = data["objects"]["countries"]["geometries"]
    names = {g["properties"]["name"].strip() for g in geometries}
    #if "Bahrain" in names:
    #    print("✅ Bahrain found in TopoJSON")
    #else:
    #    print("❌ Bahrain not found")
    print(f"✅ Fetched {len(names)} names from countries-110m.json")
    return names


def fetch_countries_from_topojson_world() -> set:
    print("🌐 Fetching countries from TopoJSON world-countries...")
    url = "https://raw.githubusercontent.com/topojson/world-atlas/master/world/50m.json"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        geometries = data.get("objects", {}).get("countries", {}).get("geometries", [])
        names = {
            g["properties"]["name"].strip()
            for g in geometries
            if "properties" in g and "name" in g["properties"]
        }
        print(f"✅ Fetched {len(names)} names from topojson/world/50m.json")
        return names
    except Exception as e:
        print(f"⚠️ Failed to fetch from topojson/world/50m.json: {e}")
        return set()


def normalize_country(raw: str) -> str:
    raw = raw.strip()
    return COUNTRY_NORMALIZATION.get(raw, raw)


def normalize_location(raw: str) -> str:
    raw = raw.strip()
    return LOCATION_NORMALIZATION.get(raw, raw)


def generate_master_country_list() -> set:
    atlas = fetch_countries_from_world_atlas()
    topo = fetch_countries_from_topojson_world()
    merged = atlas.union(topo)

    # Patch in known missing countries
    merged.add("Bahrain")

    merged_sorted = sorted(merged)
    with open(MASTER_COUNTRY_LIST_PATH, "w") as f:
        json.dump(merged_sorted, f, indent=2)
    print(f"✅ Saved merged country list ({len(merged_sorted)} entries) to {MASTER_COUNTRY_LIST_PATH}")
    return merged


def extract_country_and_city_lists(df: pl.DataFrame, master_countries: set):
    print("🔍 Extracting and normalizing countries and locations...")

    # --- Countries ---
    unmatched_countries = []
    raw_countries = df["Country"].drop_nulls().cast(pl.Utf8).str.strip_chars().to_list()

    normalized_set = set()
    for raw in sorted(set(raw_countries)):
        norm = normalize_country(raw)
        if norm in master_countries:
            normalized_set.add(norm)
        else:
            match = get_close_matches(norm, master_countries, n=1, cutoff=0.88)
            if match:
                print(f"🔁 Fuzzy matched: {raw} → {match[0]}")
                normalized_set.add(match[0])
            else:
                unmatched_countries.append(raw)

    if unmatched_countries:
        with open(UNMATCHED_COUNTRIES_LOG, "w") as f:
            f.write("\n".join(sorted(unmatched_countries)))
        print(f"🟠 {len(unmatched_countries)} unmatched countries written to {UNMATCHED_COUNTRIES_LOG}")
    else:
        print("✅ All countries matched successfully")

    # --- Locations ---
    if "Location" in df.columns:
        locations = df["Location"].drop_nulls().cast(pl.Utf8).str.strip_chars().to_list()
        unmatched_locations = []

        city_dict = {}
        for loc in sorted(set(locations)):
            norm = normalize_location(loc)
            city_dict[loc] = norm
            if norm == loc:
                unmatched_locations.append(loc)

        with open(KNOWN_CITIES_PATH, "w") as f:
            json.dump(city_dict, f, indent=2)

        if unmatched_locations:
            with open(UNMATCHED_LOCATIONS_LOG, "w") as f:
                f.write("\n".join(sorted(unmatched_locations)))
            print(f"🟡 {len(unmatched_locations)} unmatched locations written to {UNMATCHED_LOCATIONS_LOG}")
        else:
            print("✅ All locations matched or normalized")
    else:
        print("⚠️ No 'Location' column found")


# === MAIN ===

def main():
    print("📥 Loading Excel sheet...")
    df = pl.read_excel(EXCEL_PATH, sheet_name="MasterData_Operations")
    df = df.select([pl.col(c).alias(c.strip()) for c in df.columns])

    if "Country" not in df.columns:
        raise ValueError("❌ 'Country' column not found in Excel")

    master_country_set = generate_master_country_list()
    extract_country_and_city_lists(df, master_country_set)


if __name__ == "__main__":
    main()
