import os
import pandas as pd
import json
from datetime import datetime
from github import Github

# === CONFIGURATION ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EXCEL_PATH = os.path.join(BASE_DIR, "jobhistory.xlsx")
OUTPUT_JSON = os.path.join(BASE_DIR, "runs-summary.json")

# GitHub push config
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
REPO_OWNER = "Klaratech"
REPO_NAME = "petromac-kiosk"
TARGET_PATH = "public/data/runs-summary.json"  # in the GitHub repo
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

# === MAIN ===

def main():
    print("📥 Reading Excel file...")
    if not os.path.exists(EXCEL_PATH):
        raise FileNotFoundError(f"❌ Excel file not found: {EXCEL_PATH}")

    df = pd.read_excel(EXCEL_PATH, sheet_name="MasterData_Operations", dtype=str)
    print(f"✅ Loaded {len(df)} rows")

    # Clean fields
    df["Country"] = df["Country"].str.strip()
    df = df[df["Year"].notna()]
    df["Year"] = df["Year"].astype(int)
    df["Successful"] = df["Successful"].fillna("1").astype(int)

    # Group data
    grouped = (
        df.groupby(["Country", "Year", "Successful"])
        .size()
        .reset_index(name="Count")
        .sort_values(["Country", "Year"])
    )

    # Save JSON
    result = grouped.to_dict(orient="records")
    with open(OUTPUT_JSON, "w") as f:
        json.dump(result, f, indent=2)

    print(f"📤 Wrote summary to: {OUTPUT_JSON}")
    print(f"✅ {len(result)} aggregated records written")

    # Push to GitHub
    push_to_github(OUTPUT_JSON, TARGET_PATH)

if __name__ == "__main__":
    main()