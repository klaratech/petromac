#!/usr/bin/env python3
"""Build the HTML-catalog content model from the raw IDML extraction.

Stage 2 of the catalog pipeline:

    extract_catalog_idml.py  ->  catalog_raw.json   (machine dump, scratch)
    build_catalog_content.py ->  src/features/catalog/content/catalog.json
                                 public/images/catalog/*.webp|*.svg

catalog_config.json is the curated layer: it maps spread ranges to products,
picks and captions images, and carries hand-written summaries plus text fixes.
The generated catalog.json is committed — the site build never needs the
InDesign source.

Image handling: PNG/JPG are resized (max 1600 px wide) and re-encoded as WebP
q80 with Pillow; SVGs are copied verbatim; PDF-compatible .ai charts are
rendered via pdftoppm (poppler) then WebP-encoded.

Usage:
    python3 scripts/python/build_catalog_content.py <raw.json> <links_dir>

Requires: Pillow, poppler (pdftoppm) for .ai charts.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONFIG_PATH = os.path.join(ROOT, "scripts/python/catalog_config.json")
OUT_JSON = os.path.join(ROOT, "src/features/catalog/content/catalog.json")
OUT_IMG_DIR = os.path.join(ROOT, "public/images/catalog")
IMG_URL_PREFIX = "/images/catalog"
MAX_WIDTH = 1600
WEBP_QUALITY = 80

HEADING_STYLES = {
    "Header Blue1",
    "Header Blue 2",
    "Heading 3",
    "Header RIGHT-Blue",
    "header-Gray txt",
}
MARKER_RE = re.compile(r"^(description|application)\s*:?\s*$", re.I)


def slugify(name: str) -> str:
    stem = os.path.splitext(name)[0]
    s = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")
    return re.sub(r"-+", "-", s)


def apply_replacements(text: str, replacements) -> str:
    for old, new in replacements:
        text = text.replace(old, new)
    return text


def clean_para(text: str) -> str:
    text = re.sub(r"^[•\-]\s*", "", text.strip())
    return re.sub(r"[ \t]+", " ", text)


def with_notes(text: str, notes) -> str:
    if notes:
        # Inline footnotes read naturally as a parenthetical.
        joined = "; ".join(n.rstrip(".") for n in notes)
        return f"{text.rstrip()} ({joined})"
    return text


def parse_blocks(spreads, spread_ids, drop_texts):
    """Classify a product's text blocks into description paragraphs,
    application bullets and spec tables, following the catalog's repeating
    Description:/Application: page template."""
    description: list[str] = []
    applications: list[str] = []
    tables: list[dict] = []
    for sid in spread_ids:
        spread = spreads[sid]
        mode = "description"  # template restarts on every page
        for frame in spread["frames"]:
            for block in frame["blocks"]:
                if "table" in block:
                    tables.append(block["table"])
                    continue
                text = block["text"].strip()
                style = block["style"]
                if style in HEADING_STYLES or style == "Foot note":
                    continue
                if text in drop_texts:
                    continue
                m = MARKER_RE.match(text)
                if m:
                    mode = m.group(1).lower()
                    continue
                # "…requirements Application:" — marker glued to a paragraph
                tail = re.search(r"\s*(Description|Application)\s*:\s*$", text)
                if tail:
                    text = text[: tail.start()].strip()
                para = with_notes(clean_para(text), block.get("notes"))
                if not para:
                    pass
                elif mode == "application":
                    applications.append(para)
                else:
                    description.append(para)
                if tail:
                    mode = tail.group(1).lower()
    return description, applications, tables


def shape_table(raw_table, replacements) -> dict:
    """Turn extractor rows into {title, rows:[{label, values, note?}]}."""
    rows = raw_table["rows"]
    notes = raw_table.get("notes", {})
    title = ""
    start = 0
    if rows and rows[0][0] and not any(c.strip() for c in rows[0][1:]):
        title = rows[0][0].strip().title()
        title = title.replace("Swl", "SWL").replace("Od", "OD").replace("Id", "ID")
        title = apply_replacements(title, replacements)
        start = 1
    shaped = []
    for r in range(start, len(rows)):
        cells = [apply_replacements(c, replacements) for c in rows[r]]
        row_notes = []
        for c in range(len(cells)):
            for n in notes.get(f"{r}:{c}", []):
                row_notes.append(apply_replacements(n, replacements))
        entry: dict = {"label": cells[0], "values": cells[1:] or [cells[0]]}
        if row_notes:
            entry["note"] = " ".join(row_notes)
        shaped.append(entry)
    return {"title": title, "rows": shaped}


def build_image(file_name: str, links_dir: str, built: dict) -> dict | None:
    """Produce a web derivative for one Links asset. Returns
    {src, width, height} or None if the asset can't be processed."""
    if file_name in built:
        return built[file_name]
    src_path = os.path.join(links_dir, file_name)
    if not os.path.exists(src_path):
        print(f"  MISSING LINK ASSET: {file_name}")
        built[file_name] = None
        return None
    ext = os.path.splitext(file_name)[1].lower()
    slug = slugify(file_name)
    os.makedirs(OUT_IMG_DIR, exist_ok=True)

    if ext == ".svg":
        out_name = f"{slug}.svg"
        out_path = os.path.join(OUT_IMG_DIR, out_name)
        with open(src_path, "rb") as fi, open(out_path, "wb") as fo:
            fo.write(fi.read())
        w, h = svg_dimensions(src_path)
        result = {"src": f"{IMG_URL_PREFIX}/{out_name}", "width": w, "height": h}
    elif ext in (".png", ".jpg", ".jpeg", ".ai"):
        if ext == ".ai":
            # Most .ai files are PDF-compatible; render the chart via poppler.
            tmp = tempfile.mktemp(suffix=".png")
            try:
                subprocess.run(
                    ["pdftoppm", "-png", "-r", "200", "-singlefile", src_path, tmp[:-4]],
                    check=True,
                    capture_output=True,
                )
            except subprocess.CalledProcessError as e:
                print(f"  AI RENDER FAILED (skipping): {file_name}: {e.stderr[:200]}")
                built[file_name] = None
                return None
            img = Image.open(tmp)
        else:
            img = Image.open(src_path)
        if img.width > MAX_WIDTH:
            img = img.resize(
                (MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)),
                Image.LANCZOS,
            )
        out_name = f"{slug}.webp"
        out_path = os.path.join(OUT_IMG_DIR, out_name)
        img.save(out_path, "WEBP", quality=WEBP_QUALITY)
        result = {
            "src": f"{IMG_URL_PREFIX}/{out_name}",
            "width": img.width,
            "height": img.height,
        }
    else:
        print(f"  UNSUPPORTED FORMAT (skipping): {file_name}")
        built[file_name] = None
        return None

    built[file_name] = result
    return result


def svg_dimensions(path: str) -> tuple[int, int]:
    head = open(path, "r", errors="ignore").read(2000)
    m = re.search(r'viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+) ([\d.]+)"', head)
    if m:
        return round(float(m.group(1))), round(float(m.group(2)))
    return 800, 600


def main():
    raw_path, links_dir = sys.argv[1], sys.argv[2]
    raw = json.load(open(raw_path))
    cfg = json.load(open(CONFIG_PATH))
    spreads = {s["index"]: s for s in raw["spreads"]}
    repl = cfg["replacements"]

    built_images: dict = {}
    products_out = []
    problems = 0
    for p in cfg["products"]:
        drop = set(p.get("drop", []))
        auto_desc, auto_apps, auto_tables = parse_blocks(spreads, p["spreads"], drop)
        description = p.get("description") or auto_desc
        applications = p.get("applications")
        if applications is None or (applications == [] and not p.get("description")):
            applications = auto_apps
        description = [apply_replacements(t, repl) for t in description]
        applications = [apply_replacements(t, repl) for t in applications]
        specs = [shape_table(t, repl) for t in auto_tables]

        images_out = []
        for img_cfg in p["images"]:
            meta = build_image(img_cfg["file"], links_dir, built_images)
            if meta is None:
                problems += 1
                continue
            entry = {
                **meta,
                "alt": img_cfg.get("alt", p["name"]),
                "role": img_cfg.get("role", "gallery"),
            }
            if img_cfg.get("caption"):
                entry["caption"] = img_cfg["caption"]
            images_out.append(entry)

        products_out.append(
            {
                "slug": p["slug"],
                "category": p["category"],
                "group": p.get("group", ""),
                "name": p["name"],
                "models": p["models"],
                "summary": apply_replacements(p["summary"], repl),
                "description": description,
                "applications": applications,
                "variants": p.get("variants", []),
                "specs": specs,
                "images": images_out,
            }
        )
        if not specs:
            print(f"  NOTE: {p['slug']} has no spec tables")

    out = {
        "edition": cfg["edition"],
        "source": raw["source"],
        "about": cfg["about"],
        "categories": cfg["categories"],
        "products": products_out,
    }
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)

    n_specs = sum(len(pr["specs"]) for pr in products_out)
    n_imgs = len([v for v in built_images.values() if v])
    print(
        f"OK: {len(products_out)} products, {n_specs} spec tables, "
        f"{n_imgs} images -> {os.path.relpath(OUT_JSON, ROOT)}"
    )
    if problems:
        print(f"WARNING: {problems} image(s) skipped — see notes above")
        sys.exit(1)


if __name__ == "__main__":
    main()
