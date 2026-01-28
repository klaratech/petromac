import argparse
import shutil
from pathlib import Path
from datetime import date
import json

from pdf2image import convert_from_path
from pypdf import PdfReader

SUPPORTED_FORMATS = {"jpg", "jpeg", "png", "webp"}


def parse_args():
    parser = argparse.ArgumentParser(description="Build flipbook assets from a source PDF")
    parser.add_argument("--input", required=True, help="Path to source PDF")
    parser.add_argument("--out", required=True, help="Output directory (public/flipbooks/<docKey>)")
    parser.add_argument("--title", required=True, help="Title for manifest")
    parser.add_argument("--tags", help="Optional tags CSV to copy into output")
    parser.add_argument("--format", default="jpg", help="Image format: jpg|png|webp")
    parser.add_argument("--dpi", type=int, default=150, help="DPI for PDF rendering")
    parser.add_argument("--page-digits", type=int, default=4, help="Zero pad length for page filenames")
    parser.add_argument("--thumbs", action="store_true", help="Generate thumbnail images")
    parser.add_argument("--thumb-width", type=int, default=320, help="Thumbnail width in pixels")
    return parser.parse_args()


def ensure_empty_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)
    for item in path.iterdir():
        if item.is_file():
            item.unlink()


def save_image(image, out_path: Path, fmt: str):
    if fmt == "webp":
        image.save(out_path, "WEBP", quality=90)
    elif fmt in {"jpg", "jpeg"}:
        image.save(out_path, "JPEG", quality=90)
    else:
        image.save(out_path, fmt.upper())


def build_flipbook():
    args = parse_args()
    fmt = args.format.lower()
    if fmt not in SUPPORTED_FORMATS:
        raise ValueError(f"Unsupported format: {fmt}")

    source_pdf = Path(args.input)
    if not source_pdf.exists():
        raise FileNotFoundError(f"Source PDF not found: {source_pdf}")

    out_dir = Path(args.out)
    pages_dir = out_dir / "pages"
    thumbs_dir = out_dir / "thumbs"

    out_dir.mkdir(parents=True, exist_ok=True)
    ensure_empty_dir(pages_dir)
    if args.thumbs:
        ensure_empty_dir(thumbs_dir)

    shutil.copyfile(source_pdf, out_dir / "source.pdf")

    pdf_reader = PdfReader(str(source_pdf))
    page_count = len(pdf_reader.pages)

    pages = convert_from_path(str(source_pdf), dpi=args.dpi)

    if len(pages) != page_count:
        page_count = len(pages)

    for index, page in enumerate(pages, start=1):
        filename = f"{index:0{args.page_digits}d}.{fmt}"
        save_image(page, pages_dir / filename, fmt)

        if args.thumbs:
            thumb = page.copy()
            width, height = thumb.size
            if width > args.thumb_width:
                ratio = args.thumb_width / width
                thumb = thumb.resize((args.thumb_width, int(height * ratio)))
            save_image(thumb, thumbs_dir / filename, fmt)

    if args.tags:
        tags_path = Path(args.tags)
        if not tags_path.exists():
            raise FileNotFoundError(f"Tags file not found: {tags_path}")
        shutil.copyfile(tags_path, out_dir / "tags.csv")

    manifest = {
        "docKey": out_dir.name,
        "title": args.title,
        "pageCount": page_count,
        "pageDigits": args.page_digits,
        "pageExtension": fmt,
        "pagesPath": "pages",
        "sourcePdf": "source.pdf",
        "updatedAt": date.today().isoformat(),
    }

    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"✅ Built flipbook for {args.title} at {out_dir}")


if __name__ == "__main__":
    build_flipbook()
