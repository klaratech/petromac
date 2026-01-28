#!/usr/bin/env python3
import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD_SCRIPT = ROOT / "scripts" / "build_flipbook.py"

DEFAULT_SUCCESS_PDF = ROOT / "assets" / "source-pdfs" / "success-stories.pdf"
DEFAULT_CATALOG_PDF = ROOT / "assets" / "source-pdfs" / "catalog.pdf"
DEFAULT_TAGS = ROOT / "assets" / "tags" / "success-stories.csv"

DEFAULT_SUCCESS_OUT = ROOT / "public" / "flipbooks" / "success-stories"
DEFAULT_CATALOG_OUT = ROOT / "public" / "flipbooks" / "catalog"


def run(cmd: list[str]) -> None:
    subprocess.check_call(cmd)


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
    parser.add_argument("--success-pdf", default=str(DEFAULT_SUCCESS_PDF), help="Path to success stories PDF")
    parser.add_argument("--catalog-pdf", default=str(DEFAULT_CATALOG_PDF), help="Path to catalog PDF")
    parser.add_argument("--tags", default=str(DEFAULT_TAGS), help="Path to success stories tags CSV")
    parser.add_argument("--skip-validate", action="store_true", help="Skip pnpm validation scripts")

    args = parser.parse_args()

    success_pdf = Path(args.success_pdf)
    catalog_pdf = Path(args.catalog_pdf)
    tags_csv = Path(args.tags) if args.tags else None

    print("Building Success Stories flipbook...")
    build_flipbook(success_pdf, DEFAULT_SUCCESS_OUT, "Success Stories", tags_csv)

    print("Building Catalog flipbook...")
    build_flipbook(catalog_pdf, DEFAULT_CATALOG_OUT, "Product Catalog", None)

    if not args.skip_validate:
        print("Validating flipbooks...")
        run(["pnpm", "run", "validate:flipbooks"])
        run(["pnpm", "run", "validate:successstories"])

    print("Done.")


if __name__ == "__main__":
    main()
