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
     backgrounds, logos) — no guessing. The region maps are re-exported
     separately as shared assets (figures/maps/) with the manifest recording
     which one each page places — the site's sidebar shows the location map
     the printed page opens with.
  2. group the remaining placements into figures, led by the page's own
     "Fig.N" captions where it has them — and by the page's DECOR: the bare
     vector shapes and short text frames the layout composes infographics
     with (page 29's "87% drag reduction" arrow between two tool renders).
     Decor extends a figure's crop so nothing gets sliced mid-word; a shape
     that spans two placements welds them into one artwork.
  3. render each figure's REGION out of the export PDF, then trim uniform
     white margins (diagonal renders used to ship mostly empty box).
  4. rescue what the item pass cannot see: native InDesign TABLES and
     pasted vector charts render off their caption/frame geometry (page 49's
     Fig 3 trajectory and its Well 1-6 results table reached the site as
     nothing at all before).

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
#                                 column (exported separately — see REGION_RE)
#   Icon-* / icon-*               the category badges (the site renders
#                                 `categories` itself)
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

# The region world-map is furniture as a FIGURE but content as a LOCATION: the
# printed page opens with it, and the website sidebar shows it again (Aug 2026
# — it was simply dropped before, which read as "the map is missing"). Each
# page places exactly one of six shared assets, so they are exported once from
# Links/ into figures/maps/ and the manifest records which one each page uses.
REGION_RE = re.compile(r"^(AFR|APAC|EUR|LAM|MEA|NAM)\.png$", re.I)
MAP_MAX_W = 1200

# --- decor: the page elements a figure is composed WITH ----------------------
# The layout builds infographics out of more than placed images: page 29 sets
# a "87% drag reduction" arrow (a bare Polygon) plus two text frames BETWEEN
# two tool renders; page 36 places its photos on a black panel with "60 hrs /
# 22 hrs" labels; page 39 sets two ~110-char explainers under its pair. None
# of those are placed images, so a crop computed from images alone slices
# straight through them — that is exactly the "…duction" / "87…" clipping this
# rework removed. Short text frames and bare shapes that touch a figure are
# pulled INTO its bounds; one that touches TWO figures is a bridge, and the
# figures it bridges are one composite artwork.
#
# Sanity limits keep page furniture out: anything nearly page-wide is a band,
# anything nearly page-tall is a column rule, the page foot holds the "Learn
# more" strip. Prose, captions, headline/subtitle and the sidebar are excluded
# by style/length — they have their own roles.
DECOR_MAX_W_FRAC = 0.85
DECOR_MAX_H_FRAC = 0.65
FOOT_MARGIN = 50.0  # pt
ATTACH_PAD = 6.0  # pt — flush labels count as touching
BODY_STYLE = "Body TXT"
HEADLINE_STYLE = "Header Blue1"
SUBTITLE_STYLE = "header-Gray txt"
SIDEBAR_STYLES = {"Header RIGHT-Blue", "RIGHT-Body txt"}
REFERENCE_RE = re.compile(r"^\s*SPE[-\s]?\d", re.I)

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


def page_decor(pkg: Package, spread, captions: list[dict], page_bounds: list[float]) -> list[dict]:
    """Bare shapes and short text frames that may be part of a figure's
    artwork. See the DECOR block up top for why these exist at all."""
    W = page_bounds[2] - page_bounds[0]
    H = page_bounds[3] - page_bounds[1]
    cap_bounds = [c["bounds"] for c in captions]

    def sane(b: list[float]) -> bool:
        w, h = b[2] - b[0], b[3] - b[1]
        if w < 3 or h < 3:  # hairlines and zero-width rules
            return False
        if w > DECOR_MAX_W_FRAC * W or h > DECOR_MAX_H_FRAC * H:
            return False
        if w * h > 0.5 * W * H:
            return False
        if b[1] > page_bounds[3] - FOOT_MARGIN:  # the "Learn more" foot strip
            return False
        return True

    out: list[dict] = []
    for fr in spread.frames:
        b = fr["bounds"]
        if not b or b in cap_bounds or not sane(b):
            continue
        blocks = [bl for bl in pkg.blocks(fr) if bl.get("text")]
        if not blocks:
            continue
        text = " ".join(bl["text"] for bl in blocks)
        styles = {bl["style"] for bl in blocks}
        # Story prose is a keep-out, never decor — but only the styles the
        # build carries. A long default-style frame (page 28's "World
        # Records") reaches the site through its figure or not at all.
        if BODY_STYLE in styles and len(text) >= PROSE_MIN_CHARS:
            continue
        if styles & ({HEADLINE_STYLE, SUBTITLE_STYLE} | SIDEBAR_STYLES):
            continue
        if any(CAPTION_RE.match(bl["text"]) or bl["style"] == CAPTION_STYLE for bl in blocks):
            continue
        if any(REFERENCE_RE.match(bl["text"]) for bl in blocks):
            continue
        out.append({"bounds": b, "kind": "text", "what": f"text {text[:28]!r}"})
    for sh in spread.shapes:
        b = sh["bounds"]
        if b and sane(b):
            out.append(
                {"bounds": b, "kind": "shape", "what": f'{sh["kind"]} fill={sh["fill"] or "none"}'}
            )
    return out


def grow(box: list[float], pad: float) -> list[float]:
    return [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad]


def attach_decor(groups: list[dict], decor: list[dict]) -> list[dict]:
    """Fold decor into the figure groups it touches. Runs to a fixpoint:
    attaching the page-29 arrow is what brings its "87%" and "drag reduction"
    text frames into range on the next pass.

    Only SHAPES weld the groups they span into one: the page-29 arrow and the
    page-36 black panel are structural — the composition does not survive
    cutting them. TEXT only ever extends the one figure it belongs to most: a
    chart's title frame routinely reaches over the figure next door (pages 18
    and 31), and letting it weld collapsed three separate figures into one."""
    for g in groups:
        g.setdefault("decor", [])
    pending = list(decor)
    changed = True
    while changed:
        changed = False
        for d in list(pending):
            hits = [
                g for g in groups
                if inter_area(grow(g["ext"], ATTACH_PAD), d["bounds"]) > 0
            ]
            if not hits:
                continue
            if d["kind"] == "shape":
                keep, rest = hits[0], hits[1:]
                for g in rest:  # a bridge — the figures it spans are one artwork
                    keep["members"] += g["members"]
                    keep["decor"] += g["decor"]
                    keep["ext"] = union([keep["ext"], g["ext"]])
                    groups.remove(g)
            else:
                keep = max(hits, key=lambda g: inter_area(grow(g["ext"], ATTACH_PAD), d["bounds"]))
            keep["decor"].append(d)
            keep["ext"] = union([keep["ext"], d["bounds"]])
            pending.remove(d)
            changed = True
    return groups, pending


def group_page(
    items: list[dict], captions: list[dict], decor: list[dict], tables: list[dict], page: int
) -> list[dict]:
    """Figure groups for one page, in reading order, each with its caption.

    Geometry decides how many figures there are; decor that bridges placements
    welds them into one; captions only ever SPLIT a group, never merge two.
    That asymmetry is the whole design:

      * geometry alone over-merges when one placement is a big diagonal render
        whose bounding box has empty corners — page 48's tool swallows 60% of
        the log beneath it. The page's two captions say plainly that those are
        Fig.1 and Fig.2&3, so the caption split is trusted there.
      * captions alone under-count, because the layout does not caption
        everything. Page 19 carries two figures and one "Fig.2" line; letting
        the caption count decide collapsed them into one.
      * a caption split is VETOED when a shape straddles the would-be halves:
        page 29 captions its two tool renders separately, but the "87% drag
        reduction" arrow between them can only be cut in half by honouring
        that split — the page means them as one infographic.

    The split works on WELD UNITS, not raw placements. A shape that touches
    two placements ties them together — page 31's leader line runs from the
    circled section of the tool render down to its exploded-view inset — and
    caption distances are then judged for the tied pair as a whole. Judged
    one placement at a time, the inset sat closer to the chart caption below
    it than to its own figure's, and the veto then had no split it could
    honour without cutting the leader line.
    """
    clusters = [
        {"members": m, "ext": union([items[i]["bounds"] for i in m]), "decor": []}
        for m in cluster(items)
    ]
    clusters, loose = attach_decor(clusters, decor)

    groups: list[dict] = []
    for cl in clusters:
        # Weld members a shape physically connects.
        parent = {i: i for i in cl["members"]}

        def find(i: int) -> int:
            while parent[i] != i:
                parent[i] = parent[parent[i]]
                i = parent[i]
            return i

        for d in cl["decor"]:
            if d["kind"] != "shape":
                continue
            touched = [
                i for i in cl["members"]
                if inter_area(grow(items[i]["bounds"], ATTACH_PAD), d["bounds"]) > 0
            ]
            for i in touched[1:]:
                parent[find(i)] = find(touched[0])
        units: dict[int, list[int]] = {}
        for i in cl["members"]:
            units.setdefault(find(i), []).append(i)

        # Split the cluster when its units answer to different captions…
        buckets: dict[int | None, list[int]] = {}
        for mem in units.values():
            box = union([items[i]["bounds"] for i in mem])
            key = nearest_caption(box, captions) if len(captions) > 1 else None
            buckets.setdefault(key, []).extend(mem)
        # …unless a shape still straddles the split.
        if len(buckets) > 1 and cl["decor"]:
            boxes = {
                k: union([items[i]["bounds"] for i in mem]) for k, mem in buckets.items()
            }
            bridged = any(
                sum(1 for bb in boxes.values() if inter_area(grow(bb, ATTACH_PAD), d["bounds"]) > 0) > 1
                for d in cl["decor"]
                if d["kind"] == "shape"
            )
            if bridged:
                buckets = {None: cl["members"]}
        for mem in buckets.values():
            dec = [
                d for d in cl["decor"]
                if inter_area(grow(union([items[i]["bounds"] for i in mem]), ATTACH_PAD), d["bounds"]) > 0
            ]
            groups.append({"members": mem, "decor": dec, "caption": None, "order": None})

    # Honour SPLIT_GROUP: pull named links out into figures of their own.
    forced = set(SPLIT_GROUP.get(page, []))
    if forced:
        extra = []
        for g in groups:
            keep = [i for i in g["members"] if items[i]["file"] not in forced]
            for i in g["members"]:
                if items[i]["file"] in forced:
                    extra.append({"members": [i], "decor": [], "caption": None, "order": None})
            g["members"] = keep
        groups += extra

    groups = [g for g in groups if g["members"]]
    for g in groups:
        g["bounds"] = union(
            [items[i]["bounds"] for i in g["members"]] + [d["bounds"] for d in g["decor"]]
        )

    # A group whose crop holds TWO OR MORE caption frames is a composite
    # infographic (page 29 after the bridge weld): its labels are positional —
    # "0.35" under the left tool, "0.04" under the right — so they stay in the
    # pixels and no single caption is printed underneath. Erasing them and
    # printing one would lose the pairing; printing both would say the same
    # thing twice.
    for c in captions:
        c["fate"] = "lost"  # upgraded below as figures claim, swallow or join
    for g in groups:
        inside = [
            ci for ci, c in enumerate(captions) if inter_area(c["bounds"], g["bounds"]) > 0.5 * area(c["bounds"])
        ]
        g["composite"] = len(inside) >= 2
        g["swallowed"] = inside if g["composite"] else []
        for ci in g["swallowed"]:
            captions[ci]["fate"] = "pixels"

    # Each non-composite group takes the nearest caption that no closer group
    # has claimed; captions living inside a composite are off the market.
    taken = {ci for g in groups for ci in g["swallowed"]}
    claimed: set[int] = set(taken)
    ranked = []
    for gi, g in enumerate(groups):
        if g["composite"]:
            continue
        ci = nearest_caption(g["bounds"], captions) if captions else None
        d = box_distance(g["bounds"], captions[ci]["bounds"]) if ci is not None else 0.0
        ranked.append((d, gi, ci))
    for _d, gi, ci in sorted(ranked):
        if ci is not None and ci not in claimed:
            claimed.add(ci)
            captions[ci]["fate"] = "printed"
            groups[gi]["caption"] = captions[ci]["text"]
            groups[gi]["order"] = caption_number(captions[ci]["text"])

    # A caption nothing claimed still says something the page means. Three
    # cases, in order of how much of its subject already made it out:
    #   swallow — its frame sits inside a figure's crop (its subject does
    #             too): keep the pixels, like a composite's labels.
    #   join    — it abuts a figure whose crop holds its subject (page 35's
    #             Fig 3 names the eccentricity table set beside the Fig 4
    #             toolstring): append its text to that figure's caption.
    #   rescue  — its subject is NATIVE page art the item pass cannot see
    #             (page 49's Fig 3 trajectory chart is a pasted vector
    #             drawing): grow a region out of the loose decor around the
    #             caption and render that.
    for ci, cap in enumerate(captions):
        if ci in claimed:
            continue
        cb = cap["bounds"]
        host = next(
            (g for g in groups if inter_area(cb, g["bounds"]) > 0.5 * area(cb)), None
        )
        if host is not None:
            host["swallowed"].append(ci)
            cap["fate"] = "pixels"
            claimed.add(ci)
            continue
        host = next(
            (g for g in groups if inter_area(grow(g["bounds"], 15.0), cb) > 0), None
        )
        if host is not None and not host["composite"]:
            host["caption"] = (
                f'{host["caption"]} · {cap["text"]}' if host["caption"] else cap["text"]
            )
            host["swallowed"].append(ci)
            cap["fate"] = "printed"
            claimed.add(ci)
            continue
        seeds = [
            d for d in loose
            if inter_area(grow(d["bounds"], 40.0), cb) > 0 and d["bounds"][1] < cb[3]
        ]
        if not seeds:
            continue
        region = union([d["bounds"] for d in seeds])
        grown = True
        while grown:
            grown = False
            for d in loose:
                if d in seeds or inter_area(grow(region, ATTACH_PAD), d["bounds"]) <= 0:
                    continue
                seeds.append(d)
                region = union([region, d["bounds"]])
                grown = True
        if area(region) < 4000:  # a stray label is not a figure
            continue
        claimed.add(ci)
        cap["fate"] = "printed"
        groups.append({
            "members": [], "decor": seeds, "bounds": region,
            "caption": cap["text"], "order": caption_number(cap["text"]),
            "composite": False, "swallowed": [], "rescued": True,
        })

    # Native InDesign tables are content with no placed image behind them —
    # render any that no figure already covers as figures of their own.
    for tb in tables:
        b = tb["bounds"]
        if any(inter_area(b, g["bounds"]) > 0.3 * area(b) for g in groups):
            continue
        groups.append({
            "members": [], "decor": [], "bounds": list(b),
            "caption": None, "order": None,
            "composite": False, "swallowed": [], "table": True,
        })

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


def autocrop_white(im: Image.Image, pad: int = 12) -> Image.Image:
    """Trim uniform near-white margins off a rendered figure.

    A figure's frame is routinely far larger than its ink — the diagonal
    toolstring renders occupy a corner-to-corner sliver of an otherwise empty
    box — and shipping that emptiness makes the web page's figure cards read
    as sparse and misaligned. Only borders that are actually white are
    touched: a photo or a full-bleed texture keeps its edges, checked by
    sampling the outer ring before trusting a threshold bbox.
    """
    g = im.convert("L")
    ring = (
        list(g.crop((0, 0, im.width, 2)).getdata())
        + list(g.crop((0, im.height - 2, im.width, im.height)).getdata())
        + list(g.crop((0, 0, 2, im.height)).getdata())
        + list(g.crop((im.width - 2, 0, im.width, im.height)).getdata())
    )
    if not ring or sum(ring) / len(ring) < 250 or min(ring) < 235:
        return im
    bbox = g.point(lambda v: 0 if v >= 246 else 255).getbbox()
    if not bbox:
        return im
    x0 = max(0, bbox[0] - pad)
    y0 = max(0, bbox[1] - pad)
    x1 = min(im.width, bbox[2] + pad)
    y1 = min(im.height, bbox[3] + pad)
    if x0 <= 2 and y0 <= 2 and x1 >= im.width - 2 and y1 >= im.height - 2:
        return im
    return im.crop((x0, y0, x1, y1))


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


def export_region_maps(idml: Path, used: set[str]) -> dict[str, dict]:
    """Publish the region world-maps a page can reference.

    One shared asset per region, straight from the package's Links/ folder
    (they are plain PNGs there — no compositing to preserve, unlike figures).
    Trimmed of their empty margins and downscaled; returns code -> manifest
    entry."""
    links = idml.parent / "Links"
    (OUT / "maps").mkdir(exist_ok=True)
    out: dict[str, dict] = {}
    for code in sorted(used):
        src = links / f"{code}.png"
        if not src.exists():
            print(f"WARNING: region map {src.name} not in Links/ — skipped")
            continue
        im = Image.open(src).convert("RGBA")
        white = Image.new("RGBA", im.size, (255, 255, 255, 255))
        white.alpha_composite(im)
        flat = white.convert("RGB")
        bbox = flat.convert("L").point(lambda v: 0 if v >= 250 else 255).getbbox()
        if bbox:
            pad = round(0.02 * im.width)
            flat = flat.crop((
                max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                min(im.width, bbox[2] + pad), min(im.height, bbox[3] + pad),
            ))
        if flat.width > MAP_MAX_W:
            flat = flat.resize(
                (MAP_MAX_W, round(flat.height * MAP_MAX_W / flat.width)), Image.LANCZOS
            )
        name = f"maps/{code.lower()}.webp"
        flat.save(OUT / name, "WEBP", quality=80, method=6)
        out[code] = {
            "src": f"/flipbooks/success-stories/figures/{name}",
            "width": flat.width,
            "height": flat.height,
        }
    return out


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
    """Frames a figure must not swallow: the text the WEBSITE already carries.

    That is the story column ("Body TXT", when long enough to be story rather
    than a chart label), the challenge/solution/results sidebar, and the
    headline/subtitle — exactly build_case_studies.py's harvest. A long frame
    in the DEFAULT style is the opposite case: the build never carries those
    (page 28's "World Records" panel is the document's only one), so its only
    way onto the site is inside its figure's pixels — keeping it out just
    slices it mid-word."""
    cap_bounds = [c["bounds"] for c in captions]
    out = []
    for fr in spread.frames:
        if not fr["bounds"] or fr["bounds"] in cap_bounds:
            continue
        blocks = [b for b in pkg.blocks(fr) if b.get("text")]
        if not blocks:
            continue
        text = " ".join(b["text"] for b in blocks)
        styles = {b["style"] for b in blocks}
        carried = (BODY_STYLE in styles and len(text) >= PROSE_MIN_CHARS) or (
            styles & ({HEADLINE_STYLE, SUBTITLE_STYLE} | SIDEBAR_STYLES)
        )
        if carried:
            out.append(fr["bounds"])
    return out


def page_tables(pkg: Package, spread) -> list[dict]:
    """Frames holding a native InDesign TABLE. The build's narrative harvest
    has no representation for tables, and they are not placed images either —
    page 49's Well 1–6 results table reached the site as nothing at all. They
    render as (usually uncaptioned) figures instead."""
    out = []
    for fr in spread.frames:
        if fr["bounds"] and any("table" in bl for bl in pkg.blocks(fr)):
            out.append({"bounds": fr["bounds"]})
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
            f'<figcaption>{i + 1}. '
            + (
                "<em>composite — its labels stay in the artwork</em>"
                if f["composite"]
                else (f["caption"] or "<em>no caption in the layout</em>")
            )
            + f'<span>{f["width"]}&times;{f["height"]} &middot; {", ".join(f["links"])}'
            + (f' &middot; +{len(f["decor"])} decor' if f["decor"] else "")
            + "</span></figcaption></figure>"
            for i, f in enumerate(d["figures"])
        )
        flags = []
        if not d["figures"]:
            flags.append("NO FIGURES")
        if not d["region"]:
            flags.append("no region map on the page")
        if (
            any(f["caption"] is None and not f["composite"] for f in d["figures"])
            and d["n_captions"]
        ):
            flags.append("figure(s) without a caption on a captioned page")
        n_free = d["n_captions"] - sum(f["swallowed"] for f in d["figures"])
        if n_free > len(d["figures"]):
            flags.append(f'{d["n_captions"]} captions but {len(d["figures"])} figures')
        flag = f'<p class="flag">{" &middot; ".join(flags)}</p>' if flags else ""
        region = f' &middot; map: {d["region"]}' if d["region"] else ""
        rows.append(
            f'<section><h2>page {page} <span>{d["slug"]}{region}</span></h2>{flag}'
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
        region = next(
            (m.group(1).upper() for im in spread.images
             if im["bounds"] and (m := REGION_RE.match(im["file"]))),
            None,
        )
        captions = page_captions(pkg, spread)
        prose = prose_boxes(pkg, spread, captions)
        decor = page_decor(pkg, spread, captions, page_el["bounds"])
        tables = page_tables(pkg, spread)
        groups = group_page(items, captions, decor, tables, page)

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
            # Erase only the captions that PRINT under some figure — a copy
            # in the pixels would say the same thing twice. A caption whose
            # fate is "pixels" (composite labels, an unclaimed caption inside
            # its figure) survives: those pixels are its only appearance.
            # Composites skip erasing entirely — their labels are positional.
            if not g["composite"]:
                erase_captions(im, box, [c for c in captions if c["fate"] == "printed"])
            im = autocrop_white(im)
            if im.width > MAX_W:
                im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
            name = f"{page:04d}-{len(figures) + 1}.webp"
            im.save(OUT / name, "WEBP", quality=WEBP_QUALITY, method=6)
            caption = CAPTION_OVERRIDE.get(page, {}).get(len(figures) + 1, g["caption"])
            figures.append({
                "src": f"/flipbooks/success-stories/figures/{name}",
                "width": im.width, "height": im.height,
                "caption": caption,
                "composite": g["composite"],
                "swallowed": len(g["swallowed"]),
                "links": [items[i]["file"] for i in g["members"]],
                "decor": [d["what"] for d in g["decor"]],
            })
        data[page] = {
            "slug": slugs.get(page, f"page-{page}"),
            "figures": figures,
            "region": region,
            "n_captions": len(captions),
        }
        total += len(figures)

    maps = export_region_maps(idml, {d["region"] for d in data.values() if d["region"]})
    manifest = {
        str(p): {
            "figures": [
                {k: f[k] for k in ("src", "width", "height")} for f in d["figures"]
            ],
            "captions": [f["caption"] for f in d["figures"]],
            "map": maps.get(d["region"]),
        }
        for p, d in data.items()
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
    write_review(data, idml.name)

    nocap = sum(
        1 for d in data.values() for f in d["figures"]
        if f["caption"] is None and not f["composite"]
    )
    nofig = [p for p, d in data.items() if not d["figures"]]
    nomap = [p for p, d in data.items() if not d["region"]]
    mismatch = [
        p for p, d in data.items()
        if d["n_captions"] - sum(f["swallowed"] for f in d["figures"]) > len(d["figures"])
    ]
    print(f"wrote {total} figures across {len(pages)} pages -> {OUT.relative_to(REPO)}")
    print(f"  region maps: {len(maps)} exported; pages without one: {nomap or 'none'}")
    print(f"  figures with no caption in the layout: {nocap}")
    print(f"  pages with no figures at all:          {nofig or 'none'}")
    print(f"  pages with more captions than figures: {mismatch or 'none'}")
    print(f"  review: {(OUT / 'REVIEW.html').relative_to(REPO)}")


if __name__ == "__main__":
    main()
