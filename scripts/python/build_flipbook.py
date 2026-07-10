import argparse
import re
import shutil
import tempfile
import subprocess
from pathlib import Path
from datetime import date
import json

from pdf2image import convert_from_path
from pypdf import PdfReader

SUPPORTED_FORMATS = {"jpg", "jpeg", "png", "webp"}

# If an /ebook-quality copy is still heavier than this, re-compress at
# /screen quality. Applies to the catalog's single shipped PDF and to the
# success-stories email copy — both need to stay email-attachable.
EMAIL_PDF_AGGRESSIVE_THRESHOLD = 4 * 1024 * 1024  # 4 MB


def compress_pdf(source_pdf: Path, out_path: Path) -> bool:
    """Compress a PDF to roughly under 4 MB via Ghostscript.

    Tries /ebook quality first, drops to /screen if the result is still heavy.
    Text and vector graphics stay sharp; only raster images are downsampled.
    Returns False (with a warning) if Ghostscript isn't installed.
    """

    def run_gs(setting: str) -> None:
        subprocess.check_call([
            "gs", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS={setting}", "-dNOPAUSE", "-dQUIET", "-dBATCH",
            "-dDetectDuplicateImages=true",
            f"-sOutputFile={out_path}", str(source_pdf),
        ])

    try:
        run_gs("/ebook")
        if out_path.stat().st_size > EMAIL_PDF_AGGRESSIVE_THRESHOLD:
            run_gs("/screen")
    except FileNotFoundError:
        print(
            "⚠️  Ghostscript ('gs') not found — skipping email.pdf. "
            "Install it (e.g. `brew install ghostscript`) and re-run."
        )
        return False

    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"   {out_path.name}: {size_mb:.1f} MB (compressed)")
    return True


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
    parser.add_argument(
        "--pdf-name",
        default="source.pdf",
        help="Output filename for the shipped PDF in --pdf-only mode",
    )
    parser.add_argument(
        "--pdf-only",
        action="store_true",
        help=(
            "Ship ONE compressed, linearized PDF + a search index instead of "
            "rendering per-page images. Used by the catalog: the same <4 MB "
            "file serves the pdf.js viewer, downloads, and email."
        ),
    )
    return parser.parse_args()


def linearize_pdf(source_pdf: Path, out_path: Path) -> None:
    """Copy source -> out, linearized ('fast web view') if qpdf is present.

    Linearization lets the pdf.js viewer stream pages via HTTP range
    requests instead of downloading the whole file. Falls back to a plain
    copy (with a warning) if qpdf isn't installed — the viewer still works,
    it just can't stream as efficiently.
    """
    try:
        subprocess.check_call(
            ["qpdf", "--linearize", str(source_pdf), str(out_path)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        print(f"   {out_path.name}: linearized (qpdf)")
    except subprocess.CalledProcessError:
        # qpdf returns 3 for warnings but still writes a valid file.
        if out_path.exists():
            print(f"   {out_path.name}: linearized with warnings (qpdf)")
        else:
            shutil.copyfile(source_pdf, out_path)
            print(f"   {out_path.name}: copied (qpdf linearize failed)")
    except FileNotFoundError:
        shutil.copyfile(source_pdf, out_path)
        print("⚠️  qpdf not found — shipping a non-linearized PDF. Install it "
              "(e.g. `brew install qpdf`) so the viewer can stream pages.")


def build_pdf_document(args) -> None:
    """PDF-only build (catalog): ONE compressed, linearized PDF.

    A single <4 MB artifact serves the Download button and the emailed
    attachment (the browsing surface is the HTML catalog, built separately
    via `pnpm run data:catalog`). The full-resolution master stays archived
    in sources/_archive/.
    """
    source_pdf = Path(args.input)
    if not source_pdf.exists():
        raise FileNotFoundError(f"Source PDF not found: {source_pdf}")

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    pdf_name = args.pdf_name

    # Old artifacts from previous schemes (image flipbook / separate email
    # copy / previous PDF filename).
    stale_pages = out_dir / "pages"
    stale_manifest = out_dir / "manifest.json"
    stale_email = out_dir / "email.pdf"
    stale_search = out_dir / "search-index.json"
    if stale_search.exists():
        stale_search.unlink()
        print("   removed stale search-index.json (pdf.js viewer retired)")
    for old_pdf in out_dir.glob("*.pdf"):
        if old_pdf.name not in (pdf_name, "email.pdf"):
            old_pdf.unlink()
            print(f"   removed stale {old_pdf.name} (renamed scheme)")
    if stale_pages.exists():
        shutil.rmtree(stale_pages)
        print("   removed stale pages/ dir")
    if stale_manifest.exists():
        stale_manifest.unlink()
        print("   removed stale manifest.json")
    if stale_email.exists():
        stale_email.unlink()
        print("   removed stale email.pdf (single-PDF scheme)")

    # Compress first (gs), then linearize the compressed output (qpdf) so the
    # shipped file is both small and fast-web-view. If gs is missing, fall
    # back to linearizing the original so the build still produces something.
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        compressed = Path(tmp.name)
    try:
        if compress_pdf(source_pdf, compressed):
            linearize_pdf(compressed, out_dir / pdf_name)
        else:
            linearize_pdf(source_pdf, out_dir / pdf_name)
    finally:
        compressed.unlink(missing_ok=True)

    print(f"✅ Built PDF document for {args.title} at {out_dir}")


def ensure_empty_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)
    for item in path.iterdir():
        if item.is_file():
            item.unlink()


def save_image(image, out_path: Path, fmt: str):
    if fmt == "webp":
        # quality=80 + method=6 halves the payload vs quality=90 with no
        # visible difference at flipbook display sizes (pages render at
        # ~300-600 px, 2x zoom max, from a ~1240 px source).
        image.save(out_path, "WEBP", quality=80, method=6)
    elif fmt in {"jpg", "jpeg"}:
        image.save(out_path, "JPEG", quality=90)
    else:
        image.save(out_path, fmt.upper())


def build_flipbook():
    args = parse_args()

    if args.pdf_only:
        build_pdf_document(args)
        return

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

    # Small, email-friendly copy for the "Email PDF" feature.
    email_pdf_path = out_dir / "email.pdf"
    has_email_pdf = compress_pdf(source_pdf, email_pdf_path)

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

    if has_email_pdf:
        manifest["emailPdf"] = "email.pdf"

    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"✅ Built flipbook for {args.title} at {out_dir}")


if __name__ == "__main__":
    build_flipbook()
