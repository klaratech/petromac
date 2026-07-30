#!/usr/bin/env python3
"""Shrink the granted-patent PDFs in public/patent_pdfs/.

WHY THIS IS NOT THE USUAL GHOSTSCRIPT RECIPE
--------------------------------------------
`build_flipbook.py` compresses the catalog PDF with `gs -dPDFSETTINGS=/ebook`,
and that works because the catalog is a design document full of oversized
raster images. The patent PDFs are the opposite shape: patent offices issue
them as page scans already encoded with JPEG2000, which beats JPEG badly on
scanned text. Re-encoding them through pdfwrite makes them BIGGER — measured
Jul 2026: US11047191B1 went 7.3 MB -> 8.2 MB at /printer and 29 MB at 200 dpi.
Don't reach for /ebook here.

WHAT ACTUALLY HELPS
-------------------
The wins come from page-level rasterisation (`-sDEVICE=pdfimage8`), which
rebuilds each page as ONE grayscale image. That collapses the per-object
overhead these files carry — the worst offender, MY-169945-B.pdf, held 6,550
separate JPEG2000 objects (roughly one per WORD of the document) and weighed
58 MB for 75 pages.

Rasterising destroys any text layer, so it is only ever applied to files that
have none — i.e. scans that were never OCR'd, where there is no selectable
text to lose. A patent with a real text layer (BR-taxi.pdf has 95k extractable
characters) is left completely alone: a few MB is not worth making a legal
document unsearchable.

Safety rails: the page count must survive, the result must be meaningfully
smaller, and qpdf must still consider the file valid. Any failure leaves the
original in place.

Usage:
    python3 scripts/python/compress_patent_pdfs.py            # report only
    python3 scripts/python/compress_patent_pdfs.py --apply    # rewrite in place
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

PATENT_DIR = Path("public/patent_pdfs")

# Render DPI for rasterised pages. 200 dpi was compared against the originals
# page-by-page (body text and line-art figures) and is visually indistinguishable;
# 150 saves little more and starts to soften figure callouts.
RASTER_DPI = 200

# Above this many extractable characters the file has a genuine text layer and
# is never rasterised. Scans register 0; a stray watermark or stamp can add a
# few hundred, which is why this isn't just `> 0`.
TEXT_LAYER_CHARS = 500

# Don't churn a file (or git history) for a marginal win.
MIN_SAVING = 0.15


def run(cmd: list[str]) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(cmd, capture_output=True, check=False)


def text_char_count(pdf: Path) -> int:
    """Extractable, whitespace-stripped character count."""
    proc = run(["gs", "-sDEVICE=txtwrite", "-dNOPAUSE", "-dQUIET", "-dBATCH",
                "-sOutputFile=-", str(pdf)])
    return len(b"".join(proc.stdout.split()))


def page_count(pdf: Path) -> int:
    proc = run(["gs", "-q", "-dNODISPLAY", "-dNOSAFER", "-c",
                f"({pdf}) (r) file runpdfbegin pdfpagecount = quit"])
    try:
        return int(proc.stdout.strip())
    except ValueError:
        return -1


def rasterise(src: Path, dest: Path) -> bool:
    """One grayscale image per page, then linearize for fast web view."""
    with tempfile.TemporaryDirectory() as tmp:
        staged = Path(tmp) / "raster.pdf"
        if run(["gs", "-sDEVICE=pdfimage8", f"-r{RASTER_DPI}", "-dNOPAUSE",
                "-dQUIET", "-dBATCH", f"-sOutputFile={staged}", str(src)]).returncode:
            return False
        if not staged.exists():
            return False
        # qpdf may be absent; a non-linearized result is still a valid win.
        if run(["qpdf", "--linearize", str(staged), str(dest)]).returncode:
            shutil.copyfile(staged, dest)
        return dest.exists()


def mb(size: int) -> float:
    return size / (1024 * 1024)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true",
                        help="rewrite files in place (default: report only)")
    args = parser.parse_args()

    if not shutil.which("gs"):
        print("Ghostscript ('gs') not found — install it and re-run.", file=sys.stderr)
        return 1
    if not PATENT_DIR.is_dir():
        print(f"{PATENT_DIR} not found — run from the repo root.", file=sys.stderr)
        return 1

    before = after = 0
    changed = []

    for pdf in sorted(PATENT_DIR.glob("*.pdf")):
        original = pdf.stat().st_size
        before += original

        chars = text_char_count(pdf)
        if chars > TEXT_LAYER_CHARS:
            print(f"  keep     {pdf.name:<28} {mb(original):6.1f} MB  "
                  f"(text layer: {chars:,} chars)")
            after += original
            continue

        with tempfile.TemporaryDirectory() as tmp:
            candidate = Path(tmp) / pdf.name
            if not rasterise(pdf, candidate):
                print(f"  keep     {pdf.name:<28} {mb(original):6.1f} MB  (rasterise failed)")
                after += original
                continue

            new_size = candidate.stat().st_size
            saving = 1 - new_size / original
            pages_ok = page_count(candidate) == page_count(pdf)
            valid = run(["qpdf", "--check", str(candidate)]).returncode in (0, 3)

            if saving < MIN_SAVING or not pages_ok or not valid:
                reason = ("no gain" if saving < MIN_SAVING
                          else "page count changed" if not pages_ok else "invalid output")
                print(f"  keep     {pdf.name:<28} {mb(original):6.1f} MB  ({reason})")
                after += original
                continue

            print(f"  shrink   {pdf.name:<28} {mb(original):6.1f} MB -> "
                  f"{mb(new_size):5.1f} MB  ({saving:.0%})")
            after += new_size
            changed.append(pdf.name)
            if args.apply:
                shutil.copyfile(candidate, pdf)

    verb = "now" if args.apply else "would be"
    print(f"\n  {mb(before):.0f} MB {verb} {mb(after):.0f} MB "
          f"({1 - after / before:.0%} smaller, {len(changed)} file(s) rewritten)")
    if not args.apply and changed:
        print("  Re-run with --apply to write the changes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
