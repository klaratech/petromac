import os
import pandas as pd
from datetime import datetime
from github import Github

# === CONFIGURATION ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EXCEL_PATH = os.path.join(BASE_DIR, "jobhistory.xlsx")
OUTPUT_CSV = os.path.join(BASE_DIR, "runs-summary.csv")

# GitHub push config
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
REPO_OWNER = "Klaratech"
REPO_NAME = "petromac-kiosk"
TARGET_PATH = "public/data/runs-summary.csv"  # GitHub path
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

    print("🔍 Searching for 'add row above' marker...")
    end_index = df.apply(lambda row: row.astype(str).str.lower().str.contains("add row above").any(), axis=1)
    if end_index.any():
        cutoff = end_index.idxmax()
        df = df.iloc[:cutoff]
        print(f"✂️ Truncated at row {cutoff} (marker found)")
    else:
        print("⚠️ Marker 'add row above' not found — using full data")

    return df

# === MAIN ENTRY POINT ===

def main():
    df = load_clean_data()
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"✅ Wrote cleaned CSV to: {OUTPUT_CSV}")

    push_to_github(OUTPUT_CSV, TARGET_PATH)

if __name__ == "__main__":
    main()