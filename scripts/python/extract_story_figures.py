#!/usr/bin/env python3
"""Extract the FIGURES out of each success-story page, so the website can show
the charts and logs instead of re-rendering the whole PDF page.

Why: a story page used to print the extracted headline, challenge/solution/
results and narrative as text, and then show the published PDF page underneath
— which contains all of that text again as pixels. The figures are the only
part of the page the text cannot carry, so they are the only part worth
showing.

HOW IT WORKS (rewritten Aug 2026 — was pdfimages-based, see below)
------------------------------------------------------------------
The InDesign package tells us where every figure is. For each story page the
IDML gives the placed images with their FRAME bounds (the visible crop) and
the caption frames with theirs, both tagged by the paragraph style the
designer applied. So:

  1. drop furniture by LINK FILENAME (region maps, category icons, page
     backgrounds, logos) — no guessing
  2. group the remaining placements into figures, led by the page's own
     "Fig.N" captions where it has them
  3. render each figure's REGION out of the export PDF

Rendering the region rather than pulling the asset out of `Links/` is
deliberate: it keeps InDesign's crop, the compositing of figures built from
several placements, drop shadows, and vector overlays. It also picks up the
five story pages whose figures are placed `.ai`/`.pdf` artwork — those export
as vector page content and are INVISIBLE to `pdfimages`, so pages 19, 20, 21,
30 and 34 were shipping without their logs and graphs entirely.

What this replaced: five heuristics that reverse-engineered the layout from
the flattened PDF — repeat-count-plus-area for icons, a slot match for the
region world-map (605/611/620px wide, so exact dims failed), same-slot repeat
dedup, a MIN_AREA floor that could not be raised because page 16's real log
tracks are smaller than the category icons, and an orphan-mask test for alpha
channels that pdfimages reports as images. Every one of them was recovering
something the IDML states outright. See docs/DECISIONS.md (Aug 2026).

Run after `pnpm run data` (which regenerates source.pdf and the page webps),
and before `build_case_studies.py`, which folds this manifest into the story
JSON:

    python3 scripts/python/extract_story_figures.py

Outputs:
  public/flipbooks/success-stories/figures/NNNN-N.webp   the figures
  public/flipbooks/success-stories/figures/manifest.json page -> figures+captions
  public/flipbooks/success-stories/figures/REVIEW.html   human-readable check

REVIEW.html is the point of contact. Open it, look for anything wrong, and say
so — corrections go in CAPTION_OVERRIDE / DROP_FIGURE / SPLIT_GROUP below.

Needs `pdftoppm` (poppler) on PATH, plus Pillow.
"""

from __future__ import annotations

import base64
import csv
import io
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from idml import Package  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
BASE = REPO / "public/flipbooks/success-stories"
SOURCES = REPO / "sources/success-stories"
OUT = BASE / "figures"

# Captions are set in "Pie de Foto" on most pages, but not all: pages 18, 24
# and 28 leave some in the default style, so style alone misses them and their
# text ends up rendered INTO the figure as pixels — the exact duplication this
# pipeline exists to remove. The "Fig.N" prefix is the reliable marker, so a
# block counts as a caption if either test passes. Callout labels inside
# artwork share the default style but never carry the prefix.
CAPTION_STYLE = "Pie de Foto"
CAPTION_RE = re.compile(r"^\s*Figs?\.?\s*\.?\s*\d", re.I)

# A text frame this long is prose — the story column, the challenge/solution
# sidebar, or a pull-out list — and a figure region must never contain it.
# Chart furniture (axis titles, "Number of Points", a stats row under a
# histogram) sits well below the threshold and stays inside its figure, which
# is why this is a length test and not a style test: page 18's chart labels are
# styled "Body TXT" exactly like the story column.
PROSE_MIN_CHARS = 150
# ...but never trim away more than this much of a figure. If a long text frame
# overlaps a figure that heavily it is furniture inside the artwork, not prose
# the figure has run into. Note a text frame is often WIDER than the text drawn
# in it, so an aggressive value cuts real artwork: at 0.45 page 28 lost two
# columns off its runs table to a bullet list whose frame merely reached over
# them.
MAX_TRIM = 0.35
# Neighbouring figures get a far gentler trim. Their boxes overlap constantly —
# diagonal renders have big empty corners — so squaring them off cuts into the
# artwork rather than separating it (page 17 lost its histogram, page 31 came
# out a sliver). This shaves a minor intrusion and otherwise leaves the crop
# alone, accepting that a figure may show a corner of its neighbour, exactly as
# the printed page does.
SOFT_TRIM = 0.15

# Furniture, by link filename. This is the whole exclusion list — it replaces
# the repeat-count, slot-match, MIN_AREA and orphan-mask heuristics at once,
# because the layout names these assets:
#   AFR/APAC/EUR/LAM/MEA/NAM.png  the region world-map above the challenge
#                                 column (the site renders `region` itself)
#   Icon-* / icon-*               the category badges (ditto `categories`)
#   Background-* / Logo-*         page furniture
# Note there is deliberately NO rule for `*-MASK.png`. Those are alpha mattes
# for vector art, and under the old pdfimages route they extracted as a white
# silhouette on solid black and had to be dropped. Here the mask's FRAME marks
# where a real figure sits — page 11's Fig.3 is one — and rendering that region
# composites it correctly.
FURNITURE = re.compile(
    r"^(AFR|APAC|EUR|LAM|MEA|NAM)\.png$"
    r"|^Icon-|^icon-"
    r"|^Background-"
    r"|^Logo-",
    re.I,
)

# Render resolution. 400 dpi sits above the PDF's 300 ppi embedded rasters
# (so they survive the downscale to MAX_W crisply) and gives vector artwork
# real detail. Figures are never upscaled past what this yields.
DPI = 400
PAD = 2.0  # pt of breathing room around a figure

# Figures are shown at most ~900px wide on the page; 1200 keeps a retina
# margin without shipping larger originals.
MAX_W = 1200
WEBP_QUALITY = 82

# --- corrections, driven by REVIEW.html ------------------------------------
# page -> {figure index (1-based): "caption"}   overrides the auto-match
CAPTION_OVERRIDE: dict[int, dict[int, str]] = {}
# page -> [figure indexes to drop]  for anything that slips past the filters
DROP_FIGURE: dict[int, list[int]] = {}
# page -> [link filenames to keep as their own figure] when the grouping
# merges two things the page means to be read separately
SPLIT_GROUP: dict[int, list[str]] = {}


# --- geometry helpers -------------------------------------------------------


def gap(a: list[float], b: list[float], axis: int) -> float:
    """Signed gap between two boxes along an axis (0=x, 1=y). Negative means
    they overlap on that axis."""
    lo, hi = axis, axis + 2
    return max(a[lo], b[lo]) - min(a[hi], b[hi])


def overlap_frac(a: list[float], b: list[float], axis: int) -> float:
    """Overlap along one axis as a fraction of the SHORTER box's extent."""
    lo, hi = axis, axis + 2
    ov = min(a[hi], b[hi]) - max(a[lo], b[lo])
    shorter = min(a[hi] - a[lo], b[hi] - b[lo])
    return ov / shorter if shorter > 0 else 0.0


def area(b: list[float]) -> float:
    return max(0.0, b[2] - b[0]) * max(0.0, b[3] - b[1])


def inter_area(a: list[float], b: list[float]) -> float:
    w = min(a[2], b[2]) - max(a[0], b[0])
    h = min(a[3], b[3]) - max(a[1], b[1])
    return (w if w > 0 else 0) * (h if h > 0 else 0)


def union(boxes: list[list[float]]) -> list[float]:
    return [
        min(b[0] for b in boxes), min(b[1] for b in boxes),
        max(b[2] for b in boxes), max(b[3] for b in boxes),
    ]


def box_distance(a: list[float], b: list[float]) -> float:
    dx = max(0.0, gap(a, b, 0))
    dy = max(0.0, gap(a, b, 1))
    return (dx * dx + dy * dy) ** 0.5


# --- grouping ---------------------------------------------------------------

# A composite figure is built from placements that either sit ON each other or
# are stacked flush in a column. Side-by-side placements are NOT merged, no
# matter how close: "Fig.1 | Fig.2" across the page width is the single most
# common layout in this document (pages 7, 11, 31, 43, 48), and merging on
# horizontal adjacency destroys it.
# 0.45 separates the two populations cleanly. Genuine composites — the Array
# Sonic pair on pages 9/10 (70%), page 17's three-part illustration (53% and
# 71%), page 35's cutaway (95%) — all sit well above it; placements that merely
# graze each other, like page 46's log passing behind a tool render (37%) or
# page 43's histogram and photo (11%), sit well below.
MERGE_OVERLAP = 0.45   # of the smaller placement's area
STACK_GAP = 8.0        # pt — flush enough to be one artwork
STACK_ALIGN = 0.90     # x-extents must agree this closely


def should_merge(a: list[float], b: list[float]) -> bool:
    if inter_area(a, b) >= MERGE_OVERLAP * min(area(a), area(b)):
        return True
    stacked = 0 <= gap(a, b, 1) <= STACK_GAP
    return stacked and overlap_frac(a, b, 0) >= STACK_ALIGN


def cluster(items: list[dict]) -> list[list[int]]:
    """Transitively merge placements into figure groups."""
    groups = [[i] for i in range(len(items))]
    merged = True
    while merged:
        merged = False
        for i in range(len(groups)):
            for j in range(i + 1, len(groups)):
                if any(
                    should_merge(items[a]["bounds"], items[b]["bounds"])
                    for a in groups[i] for b in groups[j]
                ):
                    groups[i] += groups[j]
                    del groups[j]
                    merged = True
                    break
            if merged:
                break
    return groups


def caption_number(text: str) -> float:
    """Leading figure number, for ordering. "Figs 2 & 3" sorts as 2."""
    m = re.match(r"^\s*Figs?\.?\s*\.?\s*(\d+)", text, re.I)
    return float(m.group(1)) if m else 1e6


def nearest_caption(box: list[float], captions: list[dict]) -> int | None:
    """Index of the caption a placement belongs to.

    Captions are usually below their figure but are sometimes set into it
    (pages 10 and 17), so proximity decides, with a penalty for a caption
    sitting clearly ABOVE — that direction is almost never a caption/figure
    relationship here.
    """
    best, best_score = None, float("inf")
    for ci, cap in enumerate(captions):
        cb = cap["bounds"]
        score = box_distance(box, cb)
        score += 0.5 * abs((cb[0] + cb[2]) / 2 - (box[0] + box[2]) / 2)
        if cb[3] < box[1] + 20:  # caption ends above the figure's top
            score += 300
        if score < best_score:
            best, best_score = ci, score
    return best


def group_page(items: list[dict], captions: list[dict], page: int) -> list[dict]:
    """Figure groups for one page, in reading order, each with its caption.

    Geometry decides how many figures there are; captions only ever SPLIT a
    group, never merge two. That asymmetry is the whole design:

      * geometry alone over-merges when one placement is a big diagonal render
        whose bounding box has empty corners — page 48's tool swallows 60% of
        the log beneath it. The page's two captions say plainly that those are
        Fig.1 and Fig.2&3, so the caption split is trusted there.
      * captions alone under-count, because the layout does not caption
        everything. Page 19 carries two figures and one "Fig.2" line; letting
        the caption count decide collapsed them into one.
    """
    groups: list[dict] = []
    for members in cluster(items):
        # Split a merged cluster when its members answer to different captions.
        buckets: dict[int | None, list[int]] = {}
        for i in members:
            key = nearest_caption(items[i]["bounds"], captions) if len(captions) > 1 else None
            buckets.setdefault(key, []).append(i)
        for mem in buckets.values():
            groups.append({"members": mem, "caption": None, "order": None})

    # Each group takes the nearest caption that no closer group has claimed.
    claimed: set[int] = set()
    ranked = []
    for gi, g in enumerate(groups):
        box = union([items[i]["bounds"] for i in g["members"]])
        ci = nearest_caption(box, captions) if captions else None
        d = box_distance(box, captions[ci]["bounds"]) if ci is not None else 0.0
        ranked.append((d, gi, ci))
    for _d, gi, ci in sorted(ranked):
        if ci is not None and ci not in claimed:
            claimed.add(ci)
            groups[gi]["caption"] = captions[ci]["text"]
            groups[gi]["order"] = caption_number(captions[ci]["text"])

    # Honour SPLIT_GROUP: pull named links out into figures of their own.
    forced = set(SPLIT_GROUP.get(page, []))
    if forced:
        extra = []
        for g in groups:
            keep = [i for i in g["members"] if items[i]["file"] not in forced]
            for i in g["members"]:
                if items[i]["file"] in forced:
                    extra.append({"members": [i], "caption": None, "order": g["order"]})
            g["members"] = keep
        groups += extra

    groups = [g for g in groups if g["members"]]
    for g in groups:
        g["bounds"] = union([items[i]["bounds"] for i in g["members"]])

    # Reading order: rows of ~20pt, then left to right. Deliberately NOT the
    # caption's Fig number — a page can mix captioned and uncaptioned figures
    # (page 19), which leaves nothing to interleave them by. The layout numbers
    # its figures in reading order anyway, so the two agree where both exist.
    groups.sort(key=lambda g: (round(g["bounds"][1] / 20), g["bounds"][0]))
    return groups


# --- rendering --------------------------------------------------------------


def render_region(pdf: Path, page: int, box: list[float], origin: tuple[float, float]) -> Image.Image:
    """Crop-render a region of a PDF page at DPI."""
    scale = DPI / 72.0
    x = (box[0] - origin[0] - PAD) * scale
    y = (box[1] - origin[1] - PAD) * scale
    w = (box[2] - box[0] + 2 * PAD) * scale
    h = (box[3] - box[1] + 2 * PAD) * scale
    with tempfile.TemporaryDirectory() as tmp:
        stem = Path(tmp) / "r"
        subprocess.run(
            ["pdftoppm", "-f", str(page), "-l", str(page), "-r", str(DPI),
             "-x", str(max(0, round(x))), "-y", str(max(0, round(y))),
             "-W", str(round(w)), "-H", str(round(h)),
             "-png", "-singlefile", str(pdf), str(stem)],
            capture_output=True, check=True,
        )
        with Image.open(stem.with_suffix(".png")) as im:
            return im.convert("RGB")


def erase_captions(im: Image.Image, box: list[float], captions: list[dict]) -> None:
    """Paint out any caption text that falls inside a figure's crop.

    Some figures are composed with their caption set into the artwork (pages
    17 and 48). Rendering the region bakes that text into the image, and the
    site then prints the same caption again underneath — the exact
    story-twice problem this whole pipeline exists to remove. Cropping it away
    would cut into the artwork, so it gets filled with the surrounding
    background colour instead, sampled rather than assumed white so a figure
    on a tint does not gain a white scar.
    """
    scale = DPI / 72.0
    for cap in captions:
        cb = cap["bounds"]
        if inter_area(cb, box) <= 0:
            continue
        x0 = round((max(cb[0], box[0]) - box[0] + PAD) * scale)
        y0 = round((max(cb[1], box[1]) - box[1] + PAD) * scale)
        x1 = round((min(cb[2], box[2]) - box[0] + PAD) * scale)
        y1 = round((min(cb[3], box[3]) - box[1] + PAD) * scale)
        if x1 - x0 < 2 or y1 - y0 < 2:
            continue
        pad = 3
        x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
        x1, y1 = min(im.width, x1 + pad), min(im.height, y1 + pad)
        # Sample a ring just outside the box; if it is not flat, leave the
        # caption alone rather than smearing a wrong colour over the figure.
        ring = []
        for xx in range(x0, x1, max(1, (x1 - x0) // 24)):
            for yy in (max(0, y0 - 2), min(im.height - 1, y1 + 1)):
                ring.append(im.getpixel((min(xx, im.width - 1), yy)))
        if not ring:
            continue
        avg = tuple(sum(c[i] for c in ring) // len(ring) for i in range(3))
        spread = max(max(c[i] for c in ring) - min(c[i] for c in ring) for i in range(3))
        if spread > 24:
            continue
        im.paste(avg, (x0, y0, x1, y1))


# --- inputs -----------------------------------------------------------------


def find_package() -> tuple[Path, Path]:
    """Newest .idml under sources/success-stories/, with the export PDF beside
    it. Mirrors update_catalog.py — drop the whole InDesign package folder in,
    no renaming."""
    idmls = sorted(SOURCES.rglob("*.idml"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not idmls:
        raise SystemExit(
            f"No .idml under {SOURCES.relative_to(REPO)} — drop the InDesign "
            "package folder there (see sources/README.md)."
        )
    idml = idmls[0]
    pdfs = sorted(idml.parent.glob("*.pdf"), key=lambda p: p.stat().st_size, reverse=True)
    if not pdfs:
        raise SystemExit(f"No export PDF next to {idml.name} — copy the full package.")
    return idml, pdfs[0]


def story_pages() -> list[int]:
    with open(BASE / "tags.csv") as fh:
        return [int(r["Page"]) for r in csv.DictReader(fh)]


def page_captions(pkg: Package, spread) -> list[dict]:
    """Caption frames on a spread, each joined into one string.

    A caption that wraps to several lines is several blocks in one frame
    (page 10's Fig.2 is three), so join per frame, not per block.
    """
    caps = []
    for fr in spread.frames:
        if not fr["bounds"]:
            continue
        blocks = [b for b in pkg.blocks(fr) if b.get("text")]
        if not blocks:
            continue
        is_caption = any(
            b.get("style") == CAPTION_STYLE or CAPTION_RE.match(b["text"]) for b in blocks
        )
        if is_caption:
            caps.append({"bounds": fr["bounds"], "text": " ".join(b["text"] for b in blocks)})
    caps.sort(key=lambda c: caption_number(c["text"]))
    return caps


def prose_boxes(pkg: Package, spread, captions: list[dict]) -> list[list[float]]:
    """Frames a figure must not swallow — the story column, the sidebar, and
    pull-out lists."""
    cap_bounds = [c["bounds"] for c in captions]
    out = []
    for fr in spread.frames:
        if not fr["bounds"] or fr["bounds"] in cap_bounds:
            continue
        text = " ".join(b["text"] for b in pkg.blocks(fr) if b.get("text"))
        if len(text) >= PROSE_MIN_CHARS:
            out.append(fr["bounds"])
    return out


def clip_to_artwork(box: list[float], keep_out: list[list[float]]) -> list[float]:
    """Pull a figure's bounds back off any text it overlaps.

    Two things end up inside a figure's bounding box without belonging to it:

      * PROSE. Placements routinely run underneath the text — page 46's log is
        a wide TIF whose left third sits behind the challenge/solution sidebar
        — so the union of a figure's frames can reach into the story column
        even though nothing of the figure is visible there.
      * The figure's own CAPTION, where the layout tucks it inside the frame
        rather than below it (pages 6, 11, 17, 18). The site prints the caption
        under the figure, so leaving it in the pixels prints it twice.

    Trims on whichever single edge costs the least area, and gives up rather
    than eat the figure (MAX_TRIM), which is what keeps a legend or a stats row
    that lives *inside* the artwork from cutting it in half.
    """
    box = list(box)
    for pb, limit in sorted(keep_out, key=lambda kv: -inter_area(kv[0], box)):
        if inter_area(pb, box) <= 0:
            continue
        base = area(box)
        if base <= 0:
            break
        # Cut back by PAD as well, since render_region pads outward again —
        # without it every trim leaves a two-point sliver of the thing it was
        # supposed to remove, which is enough to show the top of a caption.
        options = [
            [max(box[0], pb[2] + PAD), box[1], box[2], box[3]],  # cut from the left
            [box[0], box[1], min(box[2], pb[0] - PAD), box[3]],  # cut from the right
            [box[0], max(box[1], pb[3] + PAD), box[2], box[3]],  # cut from the top
            [box[0], box[1], box[2], min(box[3], pb[1] - PAD)],  # cut from the bottom
        ]
        options = [o for o in options if o[2] - o[0] > 1 and o[3] - o[1] > 1]
        if not options:
            continue
        best = max(options, key=area)
        if (base - area(best)) / base <= limit:
            box = best
    return box


# --- review -----------------------------------------------------------------


def thumb(path: Path, w: int = 360) -> str:
    """Inline the figures as data URIs so REVIEW.html is a single file that can
    be emailed or opened anywhere, not just from inside this folder."""
    im = Image.open(path).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=72)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def write_review(data: dict[int, dict], source: str) -> None:
    rows = []
    for page in sorted(data):
        d = data[page]
        figs = "".join(
            f'<figure><img src="{thumb(OUT / Path(f["src"]).name)}" loading="lazy">'
            f'<figcaption>{i + 1}. {f["caption"] or "<em>no caption in the layout</em>"}'
            f'<span>{f["width"]}&times;{f["height"]} &middot; {", ".join(f["links"])}</span>'
            f"</figcaption></figure>"
            for i, f in enumerate(d["figures"])
        )
        flags = []
        if not d["figures"]:
            flags.append("NO FIGURES")
        if any(f["caption"] is None for f in d["figures"]) and d["n_captions"]:
            flags.append("figure(s) without a caption on a captioned page")
        if d["n_captions"] > len(d["figures"]):
            flags.append(f'{d["n_captions"]} captions but {len(d["figures"])} figures')
        flag = f'<p class="flag">{" &middot; ".join(flags)}</p>' if flags else ""
        rows.append(
            f'<section><h2>page {page} <span>{d["slug"]}</span></h2>{flag}'
            f'<div class="figs">{figs}</div></section>'
        )
    html = f"""<meta charset="utf-8"><title>Story figures — review</title>
<style>
body{{font:15px/1.6 -apple-system,system-ui,sans-serif;margin:0;padding:28px;background:#f8fafc;color:#0f172a}}
h1{{font-size:22px;margin:0 0 4px}}.sub{{color:#64748b;margin:0 0 24px;max-width:70ch}}
section{{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-bottom:18px}}
h2{{font-size:15px;margin:0 0 10px}}h2 span{{color:#64748b;font-weight:400}}
.flag{{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:6px 10px;border-radius:6px;font-size:13px;margin:0 0 12px}}
.figs{{display:flex;flex-wrap:wrap;gap:16px}}
figure{{margin:0;max-width:260px;border:1px solid #e2e8f0;border-radius:8px;padding:8px;background:#fff}}
figure img{{max-width:100%;max-height:210px;display:block;margin:0 auto}}
figcaption{{font-size:12px;color:#334155;margin-top:8px}}
figcaption span{{display:block;color:#94a3b8;font-size:11px;margin-top:4px}}
</style>
<h1>Success story figures — review</h1>
<p class="sub">Every figure built from <code>{source}</code>, numbered, with the caption the layout gives it.
Region maps, category icons, backgrounds and logos are excluded by link filename.
Figures are rendered as page regions, so composites and vector artwork come out whole.
If a figure or caption is wrong, say which page and figure number and it goes into
CAPTION_OVERRIDE / DROP_FIGURE / SPLIT_GROUP in scripts/python/extract_story_figures.py.</p>
{"".join(rows)}"""
    (OUT / "REVIEW.html").write_text(html)


# --- main -------------------------------------------------------------------


def main() -> None:
    if not shutil.which("pdftoppm"):
        raise SystemExit("pdftoppm not found — brew install poppler")

    idml, pdf = find_package()
    print(f"Source: {idml.relative_to(REPO)}")
    pkg = Package(idml)
    by_page = pkg.by_page()

    pages = story_pages()
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    slug_path = REPO / "src/features/case-studies/content/case-studies.json"
    slugs: dict[int, str] = {}
    if slug_path.exists():
        slugs = {s["page"]: s["slug"] for s in json.loads(slug_path.read_text())}

    data: dict[int, dict] = {}
    total = 0
    for page in pages:
        if page not in by_page:
            raise SystemExit(f"page {page} in tags.csv but not in the IDML")
        spread, page_el = by_page[page]
        origin = (page_el["bounds"][0], page_el["bounds"][1])

        items = [
            im for im in spread.images
            if im["bounds"] and not FURNITURE.search(im["file"])
        ]
        captions = page_captions(pkg, spread)
        prose = prose_boxes(pkg, spread, captions)
        groups = group_page(items, captions, page)

        # A figure's crop must not show its neighbour. Bounding boxes overlap
        # freely in this layout — page 48's diagonal tool render reaches right
        # across the log below it — so rendering each group's raw box printed
        # the log inside Fig.1 as well as Fig.2. Every other group is a
        # keep-out region, on the same least-area trim as prose and captions.
        boxes = [g["bounds"] for g in groups]
        fixed = [(c["bounds"], MAX_TRIM) for c in captions] + [(p, MAX_TRIM) for p in prose]

        figures = []
        for n, g in enumerate(groups, start=1):
            if n in DROP_FIGURE.get(page, []):
                continue
            others = [(b, SOFT_TRIM) for j, b in enumerate(boxes) if j != n - 1]
            box = clip_to_artwork(g["bounds"], fixed + others)
            im = render_region(pdf, page, box, origin)
            erase_captions(im, box, captions)
            if im.width > MAX_W:
                im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
            name = f"{page:04d}-{len(figures) + 1}.webp"
            im.save(OUT / name, "WEBP", quality=WEBP_QUALITY, method=6)
            caption = CAPTION_OVERRIDE.get(page, {}).get(len(figures) + 1, g["caption"])
            figures.append({
                "src": f"/flipbooks/success-stories/figures/{name}",
                "width": im.width, "height": im.height,
                "caption": caption,
                "links": [items[i]["file"] for i in g["members"]],
            })
        data[page] = {
            "slug": slugs.get(page, f"page-{page}"),
            "figures": figures,
            "n_captions": len(captions),
        }
        total += len(figures)

    manifest = {
        str(p): {
            "figures": [
                {k: f[k] for k in ("src", "width", "height")} for f in d["figures"]
            ],
            "captions": [f["caption"] for f in d["figures"]],
        }
        for p, d in data.items()
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
    write_review(data, idml.name)

    nocap = sum(1 for d in data.values() for f in d["figures"] if f["caption"] is None)
    nofig = [p for p, d in data.items() if not d["figures"]]
    mismatch = [p for p, d in data.items() if d["n_captions"] > len(d["figures"])]
    print(f"wrote {total} figures across {len(pages)} pages -> {OUT.relative_to(REPO)}")
    print(f"  figures with no caption in the layout: {nocap}")
    print(f"  pages with no figures at all:          {nofig or 'none'}")
    print(f"  pages with more captions than figures: {mismatch or 'none'}")
    print(f"  review: {(OUT / 'REVIEW.html').relative_to(REPO)}")


if __name__ == "__main__":
    main()
