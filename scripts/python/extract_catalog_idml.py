#!/usr/bin/env python3
"""Extract structured content from the Petromac catalog IDML.

Stage 1 of the HTML-catalog pipeline: parses the InDesign IDML package
(a zip of XML) and dumps every spread's text frames, spec tables and image
placements — with spread-relative geometry — into one raw JSON file.

This output is NOT the site's content model. It is the machine-readable
seed that gets curated into `catalog.json` (products, categories, specs).
Re-run it when a new IDML lands to diff what changed against the previous
edition before updating the curated model.

Usage:
    python3 scripts/python/extract_catalog_idml.py <catalog.idml> <out.json>

Stdlib only — no venv needed.
"""

from __future__ import annotations

import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

IDPKG = "{http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging}"


def parse_transform(s: str | None):
    """ItemTransform is a 2x3 affine matrix: a b c d tx ty."""
    if not s:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    parts = [float(x) for x in s.split()]
    return tuple(parts) if len(parts) == 6 else (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def compose(m1, m2):
    """Apply m1 (parent) after m2 (child): result maps child coords to parent's parent."""
    a1, b1, c1, d1, tx1, ty1 = m1
    a2, b2, c2, d2, tx2, ty2 = m2
    return (
        a1 * a2 + c1 * b2,
        b1 * a2 + d1 * b2,
        a1 * c2 + c1 * d2,
        b1 * c2 + d1 * d2,
        a1 * tx2 + c1 * ty2 + tx1,
        b1 * tx2 + d1 * ty2 + ty1,
    )


def apply(m, x, y):
    a, b, c, d, tx, ty = m
    return (a * x + c * y + tx, b * x + d * y + ty)


def frame_bounds(elem, m):
    """Bounds of a page item's PathGeometry in spread coordinates."""
    xs, ys = [], []
    for pt in elem.findall(".//PathPointType"):
        anchor = pt.get("Anchor")
        if anchor:
            x, y = (float(v) for v in anchor.split())
            X, Y = apply(m, x, y)
            xs.append(X)
            ys.append(Y)
    if not xs:
        return None
    return [min(xs), min(ys), max(xs), max(ys)]


def para_style(name: str) -> str:
    return name.split("/", 1)[-1] if name else ""


def extract_text(elem) -> tuple[str, list[str]]:
    """Concatenate Content/Br within an element, keeping InDesign footnotes
    separate. Returns (text, footnotes) — without this, superscript spec-table
    notes get silently merged into the cell text."""
    out: list[str] = []
    notes: list[str] = []

    def walk(node, in_footnote):
        for child in node:
            if child.tag == "Footnote":
                fn: list[str] = []

                def fwalk(n):
                    for c in n:
                        if c.tag == "Content":
                            fn.append(c.text or "")
                        elif c.tag == "Br":
                            fn.append(" ")
                        else:
                            fwalk(c)

                fwalk(child)
                note = re.sub(r"\s+", " ", "".join(fn)).strip()
                if note:
                    notes.append(note)
                continue
            if child.tag == "Content":
                out.append(child.text or "")
            elif child.tag == "Br":
                out.append("\n")
            else:
                walk(child, in_footnote)

    walk(elem, False)
    return "".join(out), notes


def parse_story(root):
    """Return (paragraphs, tables) for a Story element, in document order.

    Tables are emitted inline as {"table": rows} entries in the paragraph
    stream so their position relative to surrounding text is preserved.
    """
    blocks = []
    # Skip paragraph ranges that live inside table cells — parse_table
    # handles those; without this they'd duplicate as loose text blocks.
    in_cell = set()
    for cell in root.iter("Cell"):
        for pr in cell.iter("ParagraphStyleRange"):
            in_cell.add(id(pr))
    # ...and ranges inside footnotes, which extract_text reports separately.
    in_footnote = set()
    for fn in root.iter("Footnote"):
        for pr in fn.iter("ParagraphStyleRange"):
            in_footnote.add(id(pr))
    for prange in root.iter("ParagraphStyleRange"):
        if id(prange) in in_cell or id(prange) in in_footnote:
            continue
        style = para_style(prange.get("AppliedParagraphStyle", ""))
        # Text directly in this range (excluding any nested table cells)
        texts = []
        all_notes = []
        tables = []
        for child in prange:
            if child.tag == "CharacterStyleRange":
                table_el = child.find("Table")
                if table_el is not None:
                    tables.append(parse_table(table_el))
                    continue
                text, notes = extract_text(child)
                texts.append(text)
                all_notes.extend(notes)
        text = "".join(texts)
        paras = [p.strip() for p in text.split("\n") if p.strip()]
        for i, para in enumerate(paras):
            block = {"style": style, "text": para}
            # Footnote markers sit at the end of a paragraph, so when a
            # range holds several paragraphs the note belongs to the last.
            if all_notes and i == len(paras) - 1:
                block["notes"] = all_notes
            blocks.append(block)
        for t in tables:
            blocks.append({"style": style, "table": t})
    return blocks


def parse_table(table_el):
    """Return table as {rows, notes}: rows of cell strings, plus per-cell
    footnotes keyed "row:col"."""
    ncols = int(table_el.get("ColumnCount", "0"))
    cells = {}
    cell_notes = {}
    max_row = -1
    for cell in table_el.findall("Cell"):
        name = cell.get("Name", "0:0")  # "col:row"
        col_s, row_s = name.split(":")
        col, row = int(col_s), int(row_s)
        text, notes = extract_text(cell)
        cells[(row, col)] = re.sub(r"\s+", " ", text).strip()
        if notes:
            cell_notes[f"{row}:{col}"] = notes
        max_row = max(max_row, row)
    rows = []
    for r in range(max_row + 1):
        rows.append([cells.get((r, c), "") for c in range(ncols)])
    return {"rows": rows, "notes": cell_notes}


def walk_items(elem, m, frames, images, depth=0):
    """Recursively collect TextFrames and image Rectangles under `elem`."""
    for child in elem:
        tag = child.tag
        if tag in ("TextFrame", "Rectangle", "Group", "Polygon", "Oval"):
            cm = compose(m, parse_transform(child.get("ItemTransform")))
            if tag == "TextFrame":
                frames.append(
                    {
                        "story": child.get("ParentStory"),
                        "bounds": frame_bounds(child, cm),
                    }
                )
            elif tag == "Group":
                walk_items(child, cm, frames, images, depth + 1)
            else:  # Rectangle / Polygon / Oval — may hold a placed image
                link = child.find(".//Link")
                if link is not None:
                    uri = link.get("LinkResourceURI", "")
                    name = uri.rstrip("/").split("/")[-1]
                    # IDML percent-encodes URIs
                    name = re.sub(
                        r"%([0-9A-Fa-f]{2})",
                        lambda mo: chr(int(mo.group(1), 16)),
                        name,
                    )
                    images.append({"file": name, "bounds": frame_bounds(child, cm)})


def main():
    idml_path, out_path = sys.argv[1], sys.argv[2]
    zf = zipfile.ZipFile(idml_path)

    # Spread order from designmap.xml
    designmap = ET.fromstring(zf.read("designmap.xml"))
    spread_srcs = [
        el.get("src")
        for el in designmap
        if el.tag == f"{IDPKG}Spread" and el.get("src")
    ]

    # Hyperlink URL destinations (external links in the document)
    hyperlinks = []
    for dest in designmap.iter("HyperlinkURLDestination"):
        hyperlinks.append(
            {
                "name": dest.get("Name", ""),
                "url": dest.get("DestinationURL", ""),
            }
        )

    # Parse all stories up-front
    stories = {}
    for info in zf.namelist():
        if info.startswith("Stories/Story_"):
            root = ET.fromstring(zf.read(info))
            story_el = root.find("Story")
            if story_el is not None:
                stories[story_el.get("Self")] = parse_story(story_el)

    unmapped_styles: set[str] = set()
    seen_stories: set[str] = set()
    spreads_out = []
    for idx, src in enumerate(spread_srcs):
        root = ET.fromstring(zf.read(src))
        spread_el = root.find("Spread")
        if spread_el is None:
            continue

        pages = []
        for page in spread_el.findall("Page"):
            gb = [float(v) for v in page.get("GeometricBounds", "0 0 0 0").split()]
            pm = parse_transform(page.get("ItemTransform"))
            x0, y0 = apply(pm, gb[1], gb[0])  # bounds are "y1 x1 y2 x2"
            x1, y1 = apply(pm, gb[3], gb[2])
            pages.append(
                {"name": page.get("Name", ""), "bounds": [x0, y0, x1, y1]}
            )

        frames: list[dict] = []
        images: list[dict] = []
        walk_items(spread_el, (1.0, 0.0, 0.0, 1.0, 0.0, 0.0), frames, images)

        # Attach story content; drop empty frames. A threaded story can span
        # several frames (columns / continuation frames) — attach its blocks
        # only at the first frame that references it so text isn't duplicated.
        content_frames = []
        for fr in frames:
            if fr["story"] in seen_stories:
                continue
            blocks = stories.get(fr["story"], [])
            if not blocks:
                continue
            seen_stories.add(fr["story"])
            for b in blocks:
                if "text" in b and not b["style"]:
                    unmapped_styles.add("(none)")
            content_frames.append(
                {
                    "bounds": fr["bounds"],
                    "blocks": blocks,
                }
            )

        # Reading order: sort by page (x band), then y, then x
        def order_key(item):
            b = item["bounds"] or [0, 0, 0, 0]
            page_i = 0
            cx = (b[0] + b[2]) / 2
            for i, p in enumerate(pages):
                if p["bounds"][0] - 1 <= cx <= p["bounds"][2] + 1:
                    page_i = i
                    break
            return (page_i, round(b[1]), round(b[0]))

        content_frames.sort(key=order_key)
        images.sort(key=order_key)

        spreads_out.append(
            {
                "index": idx,
                "pages": [p["name"] for p in pages],
                "frames": content_frames,
                "images": images,
            }
        )

    out = {
        "source": idml_path.split("/")[-1],
        "hyperlinks": hyperlinks,
        "spreads": spreads_out,
    }
    with open(out_path, "w") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)

    n_frames = sum(len(s["frames"]) for s in spreads_out)
    n_tables = sum(
        1
        for s in spreads_out
        for fr in s["frames"]
        for b in fr["blocks"]
        if "table" in b
    )
    n_images = sum(len(s["images"]) for s in spreads_out)
    print(
        f"OK: {len(spreads_out)} spreads, {n_frames} text frames, "
        f"{n_tables} tables, {n_images} image placements, "
        f"{len(hyperlinks)} hyperlink destinations -> {out_path}"
    )
    if unmapped_styles:
        print(f"WARNING: blocks with unmapped styles: {sorted(unmapped_styles)}")


if __name__ == "__main__":
    main()
