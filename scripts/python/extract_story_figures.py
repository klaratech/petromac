#!/usr/bin/env python3
"""Extract the FIGURES out of each success-story page, so the website can show
the charts and logs instead of re-rendering the whole PDF page.

Why: a story page used to print the extracted headline, challenge/solution/
results and narrative as text, and then show the published PDF page underneath
— which contains all of that text again as pixels. The figures are the only
part of the page the text cannot carry, so they are the only part worth
showing.

Run after `pnpm run data` (which regenerates source.pdf and the page webps),
and before `build_case_studies.py`, which folds this manifest into the story
JSON:

    python3 scripts/python/extract_story_figures.py

Outputs:
  public/flipbooks/success-stories/figures/NNNN-N.webp   the figures
  public/flipbooks/success-stories/figures/manifest.json page -> figures+captions
  public/flipbooks/success-stories/figures/REVIEW.html   human-readable check

REVIEW.html is the point of contact. Open it, look for anything wrong, and say
so — corrections go in CAPTION_OVERRIDE / DROP_FIGURE below.

Needs `pdfimages` (poppler) on PATH, plus Pillow.
"""

import base64
import csv
import hashlib
import io
import json
import re
import shutil
import subprocess
from collections import defaultdict
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[2]
BASE = REPO / "public/flipbooks/success-stories"
PDF = BASE / "source.pdf"
OUT = BASE / "figures"

# An image that appears on 3+ pages is furniture, not evidence: the category
# badge icons (Sensor Orientation, Sticking Prevention, …) and the small
# region world-map that sits above the challenge column. Both are driven by
# data we already hold (`categories`, `region`), so the site can render them
# properly rather than shipping a screenshot of them.
REPEAT_PAGES = 3

# The region world-map that sits top-left above the CHALLENGE column. It slips
# past the repeat filter because each one highlights a DIFFERENT country, so no
# two are byte-identical.
#
# Match it by its SLOT, not its dimensions. This was `MAP_DIMS = {(611, 337)}`
# and that was wrong: the map is 605, 611 or 620 wide depending on the page, so
# an exact-dims test caught 17 of the 35 pages that carry one and left the rest
# as a spurious Fig.1 — which then pushed every real caption down by one (page
# 15 is the clearest case). The height is exactly 337 on all 35, and it always
# sits at top~290 / left<=60, above the challenge column. Nothing else on any
# page lands in that slot.
MAP_TOP = (280, 300)
MAP_LEFT_MAX = 60
MAP_HEIGHT = 337


def is_region_map(w: int, h: int, top: int, left: int) -> bool:
    return h == MAP_HEIGHT and MAP_TOP[0] <= top <= MAP_TOP[1] and left <= MAP_LEFT_MAX

# Floor for "this is a figure, not a rule or a sliver". Deliberately LOW,
# because size is a bad discriminator here: page 16's two real log tracks are
# 77k and 74k px, SMALLER than the category icons at ~100-116k. What actually
# removes the furniture is the repeat filter (icons appear on 3+ pages) and
# is_region_map(), not the area.
MIN_AREA = 60_000

# Figures are shown at most ~900px wide on the page; 1200 keeps a retina
# margin without shipping 1500px originals.
MAX_W = 1200
WEBP_QUALITY = 82

# --- corrections, driven by REVIEW.html ------------------------------------
# page -> {figure index (1-based): "caption"}   overrides the auto-match
CAPTION_OVERRIDE: dict[int, dict[int, str]] = {}
# page -> [figure indexes to drop]  for anything that slips past the filters
DROP_FIGURE: dict[int, list[int]] = {}


def story_pages() -> list[int]:
    with open(BASE / "tags.csv") as fh:
        return [int(r["Page"]) for r in csv.DictReader(fh)]


def pdfimages_list(page: int) -> list[dict]:
    """Rows from `pdfimages -list`. An image and its soft mask SHARE an object
    id, which is the only reliable way to pair them back up."""
    out = subprocess.run(
        ["pdfimages", "-list", "-f", str(page), "-l", str(page), str(PDF)],
        capture_output=True, text=True, check=True,
    ).stdout
    rows = []
    for line in out.splitlines()[2:]:
        p = line.split()
        if len(p) < 14:
            continue
        rows.append({"num": int(p[1]), "type": p[2], "w": int(p[3]), "h": int(p[4]), "obj": p[11]})
    return rows


def dump_page(page: int, tmp: Path) -> dict[int, Path]:
    d = tmp / str(page)
    d.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["pdfimages", "-f", str(page), "-l", str(page), "-png", str(PDF), str(d / "i")],
        capture_output=True, check=True,
    )
    return {int(re.search(r"i-(\d+)\.png$", f.name).group(1)): f for f in sorted(d.glob("i-*.png"))}


def pdf_alias(tmp: Path) -> Path:
    """A symlink to source.pdf inside tmp — see positions()."""
    tmp.mkdir(parents=True, exist_ok=True)
    link = tmp / "src.pdf"
    if not link.exists():
        link.symlink_to(PDF.resolve())
    return link


def positions(page: int, tmp: Path) -> list[tuple[int, int]]:
    """Where each image actually SITS on the page. pdfimages lists images in
    PDF object order, which is not reading order — on page 11 the wide figure
    at the bottom of the page comes first in the file, so numbering by object
    order put it before the two tension profiles above it and every caption
    landed on the wrong figure.

    pdftohtml -xml lists images in the SAME order as pdfimages but with their
    placed top/left, so zipping the two gives each figure a position. (Verified
    on pages 7, 9, 11 and 31: same count, same order. Aspect ratios can differ
    by ~0.1 because InDesign scales some images non-uniformly, so do not match
    on aspect.)

    Reads the PDF through a symlink in tmp, which is not fussiness: `-stdout`
    only redirects the XML, and pdftohtml still writes every image it finds
    beside the INPUT file as source-<page>_<n>.png — ~250 stray PNGs dropped
    into public/ per run, untracked and ready to be committed by accident.
    cwd does not move them (the path comes from the input, not the working
    directory) and `-i` suppresses the <image> elements this function exists
    to read, so redirecting the input is the only lever left."""
    link = pdf_alias(tmp)
    out = subprocess.run(
        ["pdftohtml", "-xml", "-f", str(page), "-l", str(page), "-stdout", str(link)],
        capture_output=True, text=True, check=True,
    ).stdout
    return [(int(m[0]), int(m[1])) for m in
            re.findall(r'<image top="(\d+)" left="(\d+)"', out)]


def find_furniture(pages: list[int], tmp: Path) -> set[str]:
    """md5s of images that appear on REPEAT_PAGES or more pages."""
    seen: dict[str, set[int]] = defaultdict(set)
    for page in pages:
        for f in dump_page(page, tmp).values():
            seen[hashlib.md5(f.read_bytes()).hexdigest()].add(page)
    return {h for h, ps in seen.items() if len(ps) >= REPEAT_PAGES}


def captions_for(page: int) -> list[str]:
    """Figure captions live in the PDF's TEXT layer, not in the images — which
    is why they otherwise end up glued to the end of the narrative."""
    txt = subprocess.run(
        ["pdftotext", "-f", str(page), "-l", str(page), str(PDF), "-"],
        capture_output=True, text=True, check=True,
    ).stdout
    caps = []
    for line in txt.splitlines():
        line = " ".join(line.split())
        if re.match(r"^Fig\.?\s*\.?\s*\d", line) or re.match(r"^Figs?\s+\d+\s*&", line):
            caps.append(line)
    return caps


def match_captions(figs: int, caps: list[str], page: int) -> list[str | None]:
    """Captions are numbered and figures come out in page order, so Fig.N maps
    to figure N. Anything that does not parse cleanly is left unmatched rather
    than guessed at — REVIEW.html shows the gaps."""
    out: list[str | None] = [None] * figs
    for cap in caps:
        nums = [int(n) for n in re.findall(r"\d+", cap[:18])]
        for n in nums:
            if 1 <= n <= figs and out[n - 1] is None:
                out[n - 1] = cap
    for idx, cap in CAPTION_OVERRIDE.get(page, {}).items():
        if 1 <= idx <= figs:
            out[idx - 1] = cap
    return out


def extract(page: int, furniture: set[str], tmp: Path) -> list[dict]:
    rows = pdfimages_list(page)
    files = dump_page(page, tmp)
    pos = positions(page, tmp)

    smask_of = {}
    for i, r in enumerate(rows):
        if r["type"] == "smask":
            for prev in reversed(rows[:i]):
                if prev["obj"] == r["obj"] and prev["type"] == "image":
                    smask_of[prev["num"]] = r["num"]
                    break

    # Keepers, each carrying where it sits on the page.
    #
    # `drawn` dedupes by slot: a PDF may paint the same image at the same spot
    # many times over. Page 20 draws one 395x396 tile 16 times, which is why it
    # came out with 18 "figures" — they were one figure and a lot of repaints.
    # Keyed on placed position + size, so two genuinely different figures that
    # happen to share dimensions still both survive.
    keep = []
    drawn: set[tuple[int, int, int, int]] = set()
    for idx, r in enumerate(x for x in rows if x["type"] == "image"):
        src = files.get(r["num"])
        if src is None:
            continue
        if hashlib.md5(src.read_bytes()).hexdigest() in furniture:
            continue
        top, left = pos[idx] if idx < len(pos) else (10**6 + idx, 0)
        if is_region_map(r["w"], r["h"], top, left):
            continue
        if r["w"] * r["h"] < MIN_AREA:
            continue
        slot = (top, left, r["w"], r["h"])
        if slot in drawn:
            continue
        drawn.add(slot)
        keep.append((top, left, r))

    # READING ORDER, not object order. Figures within ~40px vertically are
    # treated as the same row and ordered left to right, which is how a reader
    # numbers a pair of side-by-side plots.
    keep.sort(key=lambda k: (round(k[0] / 40), k[1]))

    figs = []
    for n, (_top, _left, r) in enumerate(keep, start=1):
        if n in DROP_FIGURE.get(page, []):
            continue
        src = files[r["num"]]
        im = Image.open(src).convert("RGB")
        mi = smask_of.get(r["num"])
        if mi is not None and mi in files:
            mask = Image.open(files[mi]).convert("L").resize(im.size)
            rgba = im.convert("RGBA")
            rgba.putalpha(mask)
            # Flatten onto white — these are JPEG-sourced, and alpha over black
            # looks broken.
            im = Image.alpha_composite(Image.new("RGBA", im.size, (255,) * 4), rgba).convert("RGB")
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        name = f"{page:04d}-{len(figs) + 1}.webp"
        im.save(OUT / name, "WEBP", quality=WEBP_QUALITY, method=6)
        figs.append({"src": f"/flipbooks/success-stories/figures/{name}",
                     "width": im.width, "height": im.height})
    return figs


def thumb(path: Path, w: int = 360) -> str:
    """Inline the figures as data URIs so REVIEW.html is a single file that can
    be emailed or opened anywhere, not just from inside this folder."""
    im = Image.open(path).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=72)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def write_review(data: dict[int, dict]) -> None:
    rows = []
    for page in sorted(data):
        d = data[page]
        figs = "".join(
            f'<figure><img src="{thumb(OUT / Path(f["src"]).name)}" loading="lazy">'
            f'<figcaption>{i + 1}. {d["captions"][i] or "<em>no caption matched</em>"}'
            f'<span>{f["width"]}&times;{f["height"]}</span></figcaption></figure>'
            for i, f in enumerate(d["figures"])
        )
        flags = []
        if not d["figures"]:
            flags.append("NO FIGURES")
        if any(c is None for c in d["captions"]):
            flags.append(f"{sum(c is None for c in d['captions'])} figure(s) without a caption")
        if len(d["raw_captions"]) > len(d["figures"]):
            flags.append("more captions than figures")
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
<p class="sub">Every figure pulled from the PDF, numbered, with the caption matched to it.
Category icons and the region world-map are excluded automatically because they repeat across pages.
If a figure or caption is wrong, say which page and figure number and it goes into
CAPTION_OVERRIDE or DROP_FIGURE in scripts/python/extract_story_figures.py.</p>
{"".join(rows)}"""
    (OUT / "REVIEW.html").write_text(html)


def main() -> None:
    if not shutil.which("pdfimages"):
        raise SystemExit("pdfimages not found — brew install poppler")
    pages = story_pages()
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    tmp = Path("/tmp/story-figures")
    if tmp.exists():
        shutil.rmtree(tmp)

    furniture = find_furniture(pages, tmp)
    print(f"excluded {len(furniture)} repeated images (category icons + region maps)")

    slugs = {s["page"]: s["slug"] for s in json.loads(
        (REPO / "src/features/case-studies/content/case-studies.json").read_text())}

    data, total = {}, 0
    for page in pages:
        figs = extract(page, furniture, tmp)
        caps = captions_for(page)
        data[page] = {
            "slug": slugs.get(page, f"page-{page}"),
            "figures": figs,
            "captions": match_captions(len(figs), caps, page),
            "raw_captions": caps,
        }
        total += len(figs)

    manifest = {str(p): {"figures": d["figures"], "captions": d["captions"]} for p, d in data.items()}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
    write_review(data)
    shutil.rmtree(tmp, ignore_errors=True)

    nocap = sum(1 for d in data.values() for c in d["captions"] if c is None)
    nofig = [p for p, d in data.items() if not d["figures"]]
    print(f"wrote {total} figures across {len(pages)} pages -> {OUT.relative_to(REPO)}")
    print(f"  figures with no matched caption: {nocap}")
    print(f"  pages with no figures at all:    {nofig or 'none'}")
    print(f"  review: {(OUT / 'REVIEW.html').relative_to(REPO)}")


if __name__ == "__main__":
    main()
