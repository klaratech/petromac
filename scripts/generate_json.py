import os
import pandas as pd
import json

# === CONFIGURATION ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EXCEL_PATH = os.path.join(BASE_DIR, "jobhistory.xlsx")
OUTPUT_JSON = os.path.join(BASE_DIR, "runs-summary.json")

# === MAIN ===

def main():
    print("📥 Reading Excel file...")
    if not os.path.exists(EXCEL_PATH):
        raise FileNotFoundError(f"❌ Excel file not found: {EXCEL_PATH}")

    df = pd.read_excel(EXCEL_PATH, sheet_name="MasterData_Operations", dtype=str)

    print(f"✅ Loaded {len(df)} rows")

    # Clean relevant fields
    df["Country"] = df["Country"].str.strip()
    df["Year"] = df["Year"].astype(int)
    df["Successful"] = df["Successful"].fillna("1").astype(int)

    # Group data
    grouped = (
        df.groupby(["Country", "Year", "Successful"])
        .size()
        .reset_index(name="Count")
        .sort_values(["Country", "Year"])
    )

    # Convert to list of dicts and save
    result = grouped.to_dict(orient="records")
    with open(OUTPUT_JSON, "w") as f:
        json.dump(result, f, indent=2)

    print(f"📤 Wrote summary to: {OUTPUT_JSON}")
    print(f"✅ {len(result)} aggregated records written")

if __name__ == "__main__":
    main()