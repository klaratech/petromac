#!/usr/bin/env python3
"""Generic InDesign IDML reader — the parts that are not catalog- or
success-stories-specific.

An IDML package is a zip of XML. What we want out of it is, per spread:

  * the pages it holds, with their bounds in spread coordinates
  * every text frame, with its bounds and its paragraphs tagged by the
    PARAGRAPH STYLE the designer applied
  * every placed image, with its link filename and the bounds of the frame
    it sits in (i.e. the visible crop, not the asset's natural size)

That last point is what makes this worth having: the layout states outright
what the flattened PDF only implies. A page's figures, its captions and its
body copy are three different named styles and three sets of coordinates,
rather than something to be recovered from character counts and image
repetition. See docs/DECISIONS.md (Aug 2026).

Coordinates are spread coordinates, in points, origin at the spread centre.
`page_origin()` converts them to a page-relative origin so they can be handed
to a PDF renderer.

Stdlib only — no venv needed.
"""

from __future__ import annotations

import re
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field

IDPKG = "{http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging}"

Matrix = tuple[float, float, float, float, float, float]
Bounds = list[float]  # [x0, y0, x1, y1]


# --- geometry ---------------------------------------------------------------


def parse_transform(s: str | None) -> Matrix:
    """ItemTransform is a 2x3 affine matrix: a b c d tx ty."""
    if not s:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    parts = [float(x) for x in s.split()]
    return tuple(parts) if len(parts) == 6 else (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def compose(m1: Matrix, m2: Matrix) -> Matrix:
    """Apply m1 (parent) after m2 (child)."""
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


def apply(m: Matrix, x: float, y: float) -> tuple[float, float]:
    a, b, c, d, tx, ty = m
    return (a * x + c * y + tx, b * x + d * y + ty)


def frame_bounds(elem, m: Matrix) -> Bounds | None:
    """Bounds of a page item's OWN PathGeometry, in the coordinate space `m`
    maps into. For a placed image this is the FRAME — InDesign's crop — which
    is what the reader actually sees, not the asset's natural extent.

    Own geometry only, NOT `.//PathPointType`: a placed image nests an <Image>
    child carrying its own PathGeometry in the image's private space, and its
    ItemTransform is not composed here. Sweeping descendants mixed those raw
    anchors into the frame's box — page 37 of the success stories crops a TIF
    into an oval whose transform carries ty ≈ −36758, and its figure came out
    bounded y −36326..513, i.e. most of the page."""
    xs, ys = [], []
    for pt in elem.findall("Properties/PathGeometry//PathPointType"):
        anchor = pt.get("Anchor")
        if anchor:
            x, y = (float(v) for v in anchor.split())
            X, Y = apply(m, x, y)
            xs.append(X)
            ys.append(Y)
    if not xs:
        return None
    return [min(xs), min(ys), max(xs), max(ys)]


# --- text -------------------------------------------------------------------


def para_style(name: str) -> str:
    return name.split("/", 1)[-1] if name else ""


def extract_text(elem) -> tuple[str, list[str]]:
    """Concatenate Content/Br within an element, keeping InDesign footnotes
    separate. Without the split, superscript spec-table notes get silently
    merged into the cell text."""
    out: list[str] = []
    notes: list[str] = []

    def walk(node):
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
                walk(child)

    walk(elem)
    return "".join(out), notes


def parse_table(table_el) -> dict:
    """Return {rows, notes}: rows of cell strings, plus per-cell footnotes
    keyed "row:col"."""
    ncols = int(table_el.get("ColumnCount", "0"))
    cells: dict[tuple[int, int], str] = {}
    cell_notes: dict[str, list[str]] = {}
    max_row = -1
    for cell in table_el.findall("Cell"):
        col_s, row_s = cell.get("Name", "0:0").split(":")  # "col:row"
        col, row = int(col_s), int(row_s)
        text, notes = extract_text(cell)
        cells[(row, col)] = re.sub(r"\s+", " ", text).strip()
        if notes:
            cell_notes[f"{row}:{col}"] = notes
        max_row = max(max_row, row)
    rows = [[cells.get((r, c), "") for c in range(ncols)] for r in range(max_row + 1)]
    return {"rows": rows, "notes": cell_notes}


def _mark_bold(text: str) -> str:
    """Wrap a bold character run in ** markers, keeping surrounding
    whitespace outside the markers so adjacent runs join cleanly."""
    core = text.strip("\n").strip(" ")
    if not core:
        return text
    head = text[: len(text) - len(text.lstrip())]
    tail = text[len(text.rstrip()):]
    return f"{head}**{core}**{tail}"


def _merge_bold_runs(text: str) -> str:
    """InDesign splits one visual bold span across ranges mid-word
    ("Mi"/"ddle East") — collapse back-to-back markers into one span."""
    text = text.replace("****", "")
    return re.sub(r"\*\*( +)\*\*", r"\1", text)


def parse_story(root, bold_styles: frozenset[str] = frozenset()) -> list[dict]:
    """Return a story's blocks in document order, each {style, text} or
    {style, table}. Tables stay inline so their position relative to the
    surrounding copy is preserved.

    Paragraphs whose style is in `bold_styles` keep their bold character
    runs as **markers** in the text; every other style stays plain — the
    catalog pipeline and the figure extractor never ask for markers."""
    blocks: list[dict] = []
    # Paragraph ranges inside table cells are handled by parse_table, and ones
    # inside footnotes by extract_text — without these guards both duplicate
    # as loose text blocks.
    skip = set()
    for cell in root.iter("Cell"):
        for pr in cell.iter("ParagraphStyleRange"):
            skip.add(id(pr))
    for fn in root.iter("Footnote"):
        for pr in fn.iter("ParagraphStyleRange"):
            skip.add(id(pr))

    for prange in root.iter("ParagraphStyleRange"):
        if id(prange) in skip:
            continue
        style = para_style(prange.get("AppliedParagraphStyle", ""))
        texts, all_notes, tables = [], [], []
        for child in prange:
            if child.tag != "CharacterStyleRange":
                continue
            table_el = child.find("Table")
            if table_el is not None:
                tables.append(parse_table(table_el))
                continue
            text, notes = extract_text(child)
            if style in bold_styles and "Bold" in child.get("FontStyle", ""):
                text = _mark_bold(text)
            texts.append(text)
            all_notes.extend(notes)
        paras = [
            _merge_bold_runs(p.strip()) for p in "".join(texts).split("\n") if p.strip()
        ]
        for i, para in enumerate(paras):
            block = {"style": style, "text": para}
            # Footnote markers sit at the end of a paragraph, so when a range
            # holds several paragraphs the note belongs to the last.
            if all_notes and i == len(paras) - 1:
                block["notes"] = all_notes
            blocks.append(block)
        for t in tables:
            blocks.append({"style": style, "table": t})
    return blocks


# --- package ----------------------------------------------------------------


@dataclass
class Spread:
    index: int
    pages: list[dict] = field(default_factory=list)  # {name, bounds}
    frames: list[dict] = field(default_factory=list)  # {story, bounds, blocks}
    images: list[dict] = field(default_factory=list)  # {file, bounds}
    # Bare vector page items — no placed image, no text. The success-stories
    # layout composes infographics from these (page 29's "87% drag reduction"
    # arrow is a Polygon between two tool renders), so a figure extractor that
    # only sees images slices straight through them.
    shapes: list[dict] = field(default_factory=list)  # {kind, bounds, fill}


def _decode_uri(uri: str) -> str:
    name = uri.rstrip("/").split("/")[-1]
    # IDML percent-encodes link URIs, and the bytes are UTF-8 — decoding them
    # one character at a time turns "Petromac®" into mojibake.
    raw = re.sub(
        r"%([0-9A-Fa-f]{2})",
        lambda mo: chr(int(mo.group(1), 16)),
        name,
    )
    try:
        return raw.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return raw


def walk_items(
    elem, m: Matrix, frames: list[dict], images: list[dict], shapes: list[dict] | None = None
) -> None:
    """Recursively collect TextFrames, image-bearing shapes, and (when a list
    is given) bare vector shapes under `elem`."""
    for child in elem:
        tag = child.tag
        if tag not in ("TextFrame", "Rectangle", "Group", "Polygon", "Oval", "GraphicLine"):
            continue
        cm = compose(m, parse_transform(child.get("ItemTransform")))
        if tag == "TextFrame":
            frames.append({"story": child.get("ParentStory"), "bounds": frame_bounds(child, cm)})
        elif tag == "Group":
            walk_items(child, cm, frames, images, shapes)
        else:  # Rectangle / Polygon / Oval / GraphicLine — may hold a placed image
            link = child.find(".//Link")
            if link is not None:
                images.append(
                    {
                        "file": _decode_uri(link.get("LinkResourceURI", "")),
                        "bounds": frame_bounds(child, cm),
                    }
                )
            elif shapes is not None:
                shapes.append(
                    {
                        "kind": tag,
                        "bounds": frame_bounds(child, cm),
                        "fill": (child.get("FillColor") or "").split("/")[-1],
                    }
                )


class Package:
    """A parsed IDML package."""

    def __init__(self, path, bold_styles: frozenset[str] = frozenset()):
        self.path = path
        zf = zipfile.ZipFile(path)
        self.hyperlinks = []
        self.stories: dict[str, list[dict]] = {}
        for name in zf.namelist():
            if name.startswith("Stories/Story_"):
                st = ET.fromstring(zf.read(name)).find("Story")
                if st is not None:
                    self.stories[st.get("Self")] = parse_story(st, bold_styles)

        designmap = ET.fromstring(zf.read("designmap.xml"))
        for dest in designmap.iter("HyperlinkURLDestination"):
            self.hyperlinks.append(
                {"name": dest.get("Name", ""), "url": dest.get("DestinationURL", "")}
            )

        self.spreads: list[Spread] = []
        srcs = [el.get("src") for el in designmap
                if el.tag == f"{IDPKG}Spread" and el.get("src")]
        for idx, src in enumerate(srcs):
            spread_el = ET.fromstring(zf.read(src)).find("Spread")
            if spread_el is None:
                continue
            sp = Spread(index=idx)
            for page in spread_el.findall("Page"):
                gb = [float(v) for v in page.get("GeometricBounds", "0 0 0 0").split()]
                pm = parse_transform(page.get("ItemTransform"))
                x0, y0 = apply(pm, gb[1], gb[0])  # GeometricBounds is "y1 x1 y2 x2"
                x1, y1 = apply(pm, gb[3], gb[2])
                sp.pages.append({"name": page.get("Name", ""), "bounds": [x0, y0, x1, y1]})
            walk_items(spread_el, (1.0, 0.0, 0.0, 1.0, 0.0, 0.0), sp.frames, sp.images, sp.shapes)
            self.spreads.append(sp)

    def blocks(self, frame: dict) -> list[dict]:
        """The paragraph blocks of a frame's story."""
        return self.stories.get(frame["story"], [])

    def by_page(self) -> dict[int, tuple[Spread, dict]]:
        """Numbered page -> (spread, page). Pages named non-numerically (a
        section prefix, a roman-numeral front matter) are skipped."""
        out: dict[int, tuple[Spread, dict]] = {}
        for sp in self.spreads:
            for page in sp.pages:
                if page["name"].isdigit():
                    out[int(page["name"])] = (sp, page)
        return out


def page_origin(page: dict) -> tuple[float, float]:
    """Top-left of a page in spread coordinates — subtract it to get
    page-relative points, which is what a PDF renderer wants."""
    return page["bounds"][0], page["bounds"][1]
