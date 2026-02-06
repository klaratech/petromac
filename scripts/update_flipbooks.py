#!/usr/bin/env python3
import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD_SCRIPT = ROOT / "scripts" / "build_flipbook.py"

DEFAULT_SUCCESS_OUT = ROOT / "public" / "flipbooks" / "success-stories"
DEFAULT_CATALOG_OUT = ROOT / "public" / "flipbooks" / "catalog"

# Column mapping: xlsx "Kiosk" sheet → CSV output
XLSX_TO_CSV_COLUMNS = {
    "Year": "Year",
    "Area": "Area",
    "Country": "Country",
    "WL Co": "WL Co",
    "Category 1": "Category 1",
    "Category 2": "Category 2",
    "Kiosk v1": "Device",
    "Page": "Page",
}


def run(cmd: list[str]) -> None:
    subprocess.check_call(cmd)


def xlsx_to_tags_csv(xlsx_path: Path, output_csv: Path) -> None:
    """Convert Success Stories summary xlsx to tags CSV using polars."""
    import polars as pl

    df = pl.read_excel(
        str(xlsx_path),
        sheet_name="Kiosk",
        infer_schema_length=0,
    )

    # Strip whitespace from column names
    df = df.rename({col: col.strip() for col in df.columns})

    # Select and rename columns to match expected CSV format
    select_exprs = []
    for xlsx_col, csv_col in XLSX_TO_CSV_COLUMNS.items():
        if xlsx_col in df.columns:
            select_exprs.append(pl.col(xlsx_col).alias(csv_col))
        else:
            raise ValueError(f"Expected column '{xlsx_col}' not found in xlsx. Available: {df.columns}")

    df = df.select(select_exprs)

    # Filter to rows that have a valid page number (drops summary/formula rows)
    df = df.filter(pl.col("Page").is_not_null() & (pl.col("Page") != ""))
    df = df.with_columns(pl.col("Page").cast(pl.Int64, strict=False).alias("Page"))
    df = df.filter(pl.col("Page").is_not_null() & (pl.col("Page") > 0))

    # Replace nulls with empty string for CSV output
    df = df.fill_null("")

    df.write_csv(str(output_csv))
    print(f"Converted {xlsx_path.name} -> {output_csv.name} ({df.height} rows)")


def build_flipbook(input_pdf: Path, output_dir: Path, title: str, tags: Path | None) -> None:
    if not input_pdf.exists():
        raise FileNotFoundError(f"Source PDF not found: {input_pdf}")

    cmd = [
        sys.executable,
        str(BUILD_SCRIPT),
        "--input",
        str(input_pdf),
        "--out",
        str(output_dir),
        "--title",
        title,
    ]

    if tags:
        if not tags.exists():
            raise FileNotFoundError(f"Tags CSV not found: {tags}")
        cmd.extend(["--tags", str(tags)])

    run(cmd)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build flipbook bundles from local PDFs")
    parser.add_argument("--success-pdf", required=True, help="Path to success stories PDF")
    parser.add_argument("--catalog-pdf", required=True, help="Path to catalog PDF")
    parser.add_argument("--tags-xlsx", default=None, help="Path to success stories summary xlsx (preferred)")
    parser.add_argument("--tags", default=None, help="Path to success stories tags CSV (legacy fallback)")
    parser.add_argument("--skip-validate", action="store_true", help="Skip pnpm validation scripts")

    args = parser.parse_args()

    success_pdf = Path(args.success_pdf)
    catalog_pdf = Path(args.catalog_pdf)

    # Resolve tags: prefer xlsx, fall back to csv
    tags_csv_path = None
    tmp_csv = None

    if args.tags_xlsx:
        tags_xlsx = Path(args.tags_xlsx)
        if not tags_xlsx.exists():
            raise FileNotFoundError(f"Tags xlsx not found: {tags_xlsx}")
        # Convert xlsx to a temporary CSV
        tmp_csv = tempfile.NamedTemporaryFile(suffix=".csv", delete=False, mode="w")
        tmp_csv.close()
        tags_csv_path = Path(tmp_csv.name)
        xlsx_to_tags_csv(tags_xlsx, tags_csv_path)
    elif args.tags:
        tags_csv_path = Path(args.tags)

    try:
        print("Building Success Stories flipbook...")
        build_flipbook(success_pdf, DEFAULT_SUCCESS_OUT, "Success Stories", tags_csv_path)

        print("Building Catalog flipbook...")
        build_flipbook(catalog_pdf, DEFAULT_CATALOG_OUT, "Product Catalog", None)

        if not args.skip_validate:
            print("Validating flipbooks...")
            run(["pnpm", "run", "validate:flipbooks"])
            run(["pnpm", "run", "validate:successstories"])

        print("Done.")
    finally:
        # Clean up temp file
        if tmp_csv and tags_csv_path and tags_csv_path.exists():
            tags_csv_path.unlink()


if __name__ == "__main__":
    main()
