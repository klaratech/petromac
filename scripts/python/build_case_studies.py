#!/usr/bin/env python3
"""Build src/features/case-studies/content/case-studies.json from the
success-stories InDesign package + tags.csv.

Run after a new success-stories edition lands (drop the whole InDesign package
folder into sources/success-stories/, run `pnpm run data` so the flipbook pages
and tags.csv are current, then extract_story_figures.py for the figures):

    python3 scripts/python/build_case_studies.py

READS THE IDML, NOT THE PDF (rewritten Aug 2026)
------------------------------------------------
The story text used to be recovered from `source.pdf` with pypdf, which meant
guessing at structure the layout already states. The sidebar was separated from
the story column by measuring line length (`WIDE = 42` characters); the
headline was "everything before the word CHALLENGE" minus a hand-written list
of tag words; figure captions had to be found with a regex and then subtracted
back out of the narrative, because extraction swept them into it mid-sentence.
Two pages needed their title hard-coded and one needed its entire narrative
pasted into the script, because text-order glommed them together.

The IDML carries named paragraph styles, consistently across all 46 pages, so
all of that is now a lookup:

    Header Blue1        headline
    header-Gray txt     subtitle (42 of 46 pages — previously lost entirely)
    Body TXT            the story column
    Header RIGHT-Blue   CHALLENGE / SOLUTION / RESULTS markers
    RIGHT-Body txt      the sidebar copy under each marker
    Pie de Foto         figure captions (extract_story_figures.py's job)

The narrative also keeps its real paragraph breaks now; the PDF route
collapsed each story into one block.

NEW STORIES in a new edition: add a slug to NEW_SLUG for each new page (the
script fails loudly on an unmapped page) and re-run. Existing slugs are FROZEN
— indexed URLs and the redirects in src/lib/redirects.ts depend on them.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from idml import Package  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
BASE = REPO / "public/flipbooks/success-stories"
SOURCES = REPO / "sources/success-stories"
JSON_OUT = REPO / "src/features/case-studies/content/case-studies.json"
# Written by extract_story_figures.py — run that first. Optional: without it
# stories carry no figures rather than the build failing.
FIGURES = BASE / "figures/manifest.json"

HEADLINE = "Header Blue1"
SUBTITLE = "header-Gray txt"
BODY = "Body TXT"
DEFAULT = "$ID/NormalParagraphStyle"
SIDEBAR_HEAD = "Header RIGHT-Blue"
SIDEBAR_BODY = "RIGHT-Body txt"
CAPTION_STYLE = "Pie de Foto"
CAPTION_RE = re.compile(r"^\s*Figs?\.?\s*\.?\s*\d", re.I)
# Three stories (pages 5, 9, 10) cite the SPE paper they were written up in,
# set in a 73pt frame in the default style — too small and too short to pass
# the prose tests, but a published reference is worth keeping, and the PDF-text
# pipeline carried it. Picked up by its own pattern and appended.
REFERENCE_RE = re.compile(r"^\s*SPE[-\s]?\d", re.I)

# Page 18 styles its histogram's axis labels and stats row "Body TXT", exactly
# like the story column, and page 42 labels the parts of a diagram the same
# way ("Other Roller Device", "Roller getting hung-up on ledge"). So a frame
# qualifies as prose on EITHER test, and it needs both:
#
#   width — the story column runs the full ~371pt measure. Page 11's opening
#           is one short sentence in such a frame, so a length test alone
#           dropped it.
#   length — pages 33 and 42 continue the story in narrow 154-182pt columns
#           beside the figures. A width test alone dropped those.
#
# Nothing that is actually furniture passes either: the widest chart label is
# 115pt and the longest holds ~100 characters.
PROSE_MIN_WIDTH = 200.0
PROSE_MIN_CHARS = 150

# Sidebar markers. Page 30 alone adds a fourth, LEARNINGS. It used to fold
# into results (mirroring the PDF-text pipeline), which silently dropped the
# printed page's own section header — the 20 Aug 2026 print-vs-live review
# caught it, so it is a real field now and the template renders the panel.
SECTIONS = {
    "CHALLENGE": "challenge",
    "SOLUTION": "solution",
    "RESULTS": "results",
    "LEARNINGS": "learnings",
}

# Pull-quote banner: page 30 closes with "PATHFINDER ELIMINATES THE RISK OF
# TOOLSTRING HOLDUP…" set in its own default-styled frame. Default style is
# otherwise decor (the World Records panel reaches the site through its
# figure), but an all-caps statement of this length is copy, and it reached
# the site through nothing at all. ≥10 words and ≥60% capital letters — the
# "Learn more" footer and the Fig-prefixed default captions both fail it.
CALLOUT_MIN_WORDS = 10
CALLOUT_CAPS_RATIO = 0.6

PAGE_W, PAGE_H = 1241, 1754


# --- text repair ------------------------------------------------------------


def join_split_words(blocks: list[str]) -> list[str]:
    """Rejoin a paragraph that was typed with a hyphen and a hard break.

    Page 18's sidebar holds "...the need for the centra-" and "lizers" as two
    paragraphs. That is in the source copy, not an artifact of extraction.
    """
    out: list[str] = []
    for b in blocks:
        if out and out[-1].endswith("-"):
            out[-1] = out[-1][:-1] + b.lstrip()
        else:
            out.append(b)
    return out


def merge_soft_breaks(blocks: list[str]) -> list[str]:
    """Rejoin a sentence split across two paragraphs by a stray break.

    Page 5's RESULTS holds "Orientation of the probe to the" and "high side
    caused the tool weight to 'peel'…" as two paragraphs — a return typed
    mid-sentence in the source copy. A paragraph that starts lowercase while
    the previous one carries no sentence-final punctuation is a continuation,
    not a paragraph."""
    out: list[str] = []
    for b in blocks:
        if (
            out
            and b[:1].islower()
            and not out[-1].rstrip().endswith((".", "!", "?", ":", ";"))
        ):
            out[-1] = out[-1].rstrip() + " " + b
        else:
            out.append(b)
    return out


def build_vocabulary(texts: list[str]) -> Counter:
    return Counter(w.lower() for t in texts for w in re.findall(r"[A-Za-z]{2,}", t))


def load_dictionary() -> frozenset[str]:
    """The system word list, for recognising a broken word by its halves.

    The document's own vocabulary can only vouch for a joined form that some
    OTHER page spells correctly. "gra-vity" is copy-pasted across four sibling
    pages and whole "gravity" appears nowhere, so a document-internal test
    can never catch it — a dictionary says immediately that "gravity" is a
    word and "vity" is not."""
    try:
        with open("/usr/share/dict/words") as fh:
            return frozenset(w.strip().lower() for w in fh)
    except OSError:
        return frozenset()


def fix_stray_hyphens(text: str, vocab: Counter, hyphenated: Counter, words: frozenset[str]) -> str:
    """Repair hyphens typed into the middle of a word.

    The copy carries a number of these — "smoo-thly", "devia-ted",
    "gra-vity", "qua-lity" — sitting alongside a great many legitimate
    compounds ("stick-slip", "slip-over", "open-hole"), so neither joining
    everything nor joining nothing is right. Two tests, either joins:

      * the document's own evidence: the hyphenated form occurs exactly once
        and the joined form appears elsewhere in the document. Catches
        document-specific vocabulary ("over-balance" beside "overbalance").
      * the dictionary's evidence: the joined form is a word and the halves
        are NOT both words themselves. Catches systematic typos the document
        repeats ("gra-vity" four times over) while leaving every real
        compound alone — "stick-slip", "re-run" and "slip-over" all split
        into two words, "stickslip" is not a word at all.
    """

    def repl(m: re.Match) -> str:
        token = m.group(0)
        joined = token.replace("-", "")
        a, b = token.split("-", 1)
        if hyphenated[token.lower()] == 1 and vocab[joined.lower()] > 0:
            return joined
        if (joined.lower() in words or vocab[joined.lower()] > 0) and not (
            a.lower() in words and b.lower() in words
        ):
            return joined
        return token

    return re.sub(r"\b[A-Za-z]{2,}-[a-z]{2,}\b", repl, text)


def fix_broken_words(text: str, vocab: Counter, words: frozenset[str]) -> str:
    """Repair "recove- ry": a line-end hyphenation whose break survived as a
    space inside the paragraph (join_split_words only sees breaks that fall on
    a paragraph boundary). When the two halves spell a word, join them; when
    they don't — "Litho- Scanner" is a tool name, hyphen intended — keep the
    hyphen and drop the stray space."""

    def repl(m: re.Match) -> str:
        a, b = m.group(1), m.group(2)
        joined = a + b
        if joined.lower() in words or vocab[joined.lower()] > 0:
            return joined
        return f"{a}-{b}"

    return re.sub(r"\b(\w+)- (\w+)\b", repl, text)


def fix_quote_jam(text: str) -> str:
    """"‘gemco’centralizers" — a quoted word typed with no space after the
    closing quote. The pattern requires BOTH quotes so possessives
    ("Petromac’s") are untouched."""
    return re.sub(r"([‘'])([^‘’']+)([’'])(\w)", r"\1\2\3 \4", text)


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


# --- extraction -------------------------------------------------------------


def frame_text(pkg: Package, frame: dict) -> str:
    return " ".join(b["text"] for b in pkg.blocks(frame) if b.get("text"))


def extract_page(pkg: Package, spread) -> dict:
    """Pull one story out of a spread by paragraph style."""
    seen_stories: set[str] = set()
    frames = []
    for fr in sorted(spread.frames, key=lambda f: (f["bounds"] or [0, 0])[1]):
        # A threaded story spans several frames but parse_story returns all of
        # its blocks at once, so only take it at the first frame that holds it.
        if fr["story"] in seen_stories or not fr["bounds"]:
            continue
        blocks = [b for b in pkg.blocks(fr) if b.get("text")]
        if not blocks:
            continue
        seen_stories.add(fr["story"])
        frames.append((fr, blocks))

    headline = subtitle = ""
    callout = ""
    # The story column in order, headings included: ("p", text) paragraphs
    # interleaved with ("h", text) mid-story subheads (page 39's "Sampling in
    # Sticky Boreholes" is a Header Blue1 paragraph INSIDE the body story —
    # skipping non-body styles dropped it).
    tokens: list[tuple[str, str]] = []
    references: list[str] = []
    sections: dict[str, list[str]] = {
        "challenge": [], "solution": [], "results": [], "learnings": []
    }

    for fr, blocks in frames:
        styles = {b["style"] for b in blocks}
        width = fr["bounds"][2] - fr["bounds"][0]
        total = sum(len(b["text"]) for b in blocks)

        if not headline:
            for b in blocks:
                if b["style"] == HEADLINE:
                    headline = b["text"]
                    break
        if not subtitle:
            for b in blocks:
                if b["style"] == SUBTITLE:
                    subtitle = b["text"]
                    break

        for b in blocks:
            if REFERENCE_RE.match(b["text"]) and b["text"] not in references:
                references.append(b["text"])

        if SIDEBAR_HEAD in styles:
            current: str | None = None
            for b in blocks:
                if b["style"] == SIDEBAR_HEAD:
                    current = SECTIONS.get(b["text"].strip().upper())
                elif b["style"] == SIDEBAR_BODY and current:
                    sections[current].append(b["text"])
            continue

        # The story column, including the narrow continuation columns some
        # pages set beside their figures.
        if BODY in styles and (width >= PROSE_MIN_WIDTH or total >= PROSE_MIN_CHARS):
            for b in blocks:
                if b["style"] == CAPTION_STYLE or CAPTION_RE.match(b["text"]):
                    continue
                if b["style"] == HEADLINE and b["text"].strip() != headline.strip():
                    tokens.append(("h", b["text"]))
                elif b["style"] in (BODY, DEFAULT):
                    tokens.append(("p", b["text"]))
            continue

        # An all-caps statement in a default-styled frame of its own is a
        # closing banner, not decor (page 30).
        if not callout and styles == {DEFAULT}:
            text = " ".join(b["text"] for b in blocks).strip()
            letters = [c for c in text if c.isalpha()]
            if (
                len(text.split()) >= CALLOUT_MIN_WORDS
                and letters
                and sum(c.isupper() for c in letters) / len(letters) >= CALLOUT_CAPS_RATIO
                and not REFERENCE_RE.match(text)
            ):
                callout = text

    # Word/sentence repairs run over each unbroken paragraph run so heading
    # positions survive them, then headings become index markers.
    narrative: list[str] = []
    subheads: list[dict] = []
    run: list[str] = []

    def flush() -> None:
        nonlocal run
        narrative.extend(merge_soft_breaks(join_split_words(run)))
        run = []

    for kind, text in tokens:
        if kind == "h":
            flush()
            subheads.append({"before": None, "text": text})
            subheads[-1]["before"] = len(narrative)
        else:
            run.append(text)
    flush()
    # A heading that landed at the same index as a later one, or past the
    # end, still renders fine — "before" clamps in the template.
    # The reference lives in its own tiny frame, but the story reads straight
    # into it: "Further details of this operation can be found in" +
    # "SPE-184773-MS." are one sentence on the printed page (4, 5, 9, 10).
    # A last paragraph that dangles on "in" takes the first reference.
    if narrative and references and re.search(r"\bin\s*$", narrative[-1]):
        narrative[-1] = narrative[-1].rstrip() + " " + references.pop(0)

    return {
        "headline": headline,
        "subtitle": subtitle,
        "callout": callout,
        "narrative": narrative + references,
        "subheads": subheads,
        "references": list(dict.fromkeys(re.findall(r"SPE-\d+-MS", " ".join(narrative + references)))),
        **{k: merge_soft_breaks(join_split_words(v)) for k, v in sections.items()},
    }


# --- slugs ------------------------------------------------------------------

# Duplicate pages -> the existing slug they keep (URL equity preserved).
KEEP_SLUG = {
    4: "high-side-sampling",
    5: "formation-testing-5000psi-overbalance",
    6: "expanding-logging-program",
    7: "holefinder-success-in-azerbaijan-2",
    8: "tlc-unable-to-pass-ledge",
    9: "successful-open-hole-wireline-logging-to-79-deviation-in-uae",
    10: "sonic-centralization",
    11: "stick-slip",
    12: "image-tool-rotation",
    13: "oriented-coring-avoids-wellbore-damage-in-the-gulf-of-mexico",
    14: "elimination-of-pcl-saves-8-days-of-rig-time-in-mexico",
    15: "positive-orientation-provides-100-fmi-image-coverage-in-iraq",
    16: "ngi-logged-over-2400m-section-at-67-deviation-in-new-zealand",
    17: "smooth-mril-xl-logging-at-extreme-deviations-in-mexico",
    18: "cast-cbl-successfully-deployed-to-82-deviation-in-norway",
    19: "hermes-drag-planner-convinces-client-to-run-mdt-in-nigeria",
    20: "high-quality-x-y-density-data-in-deviated-wellbores-in-new-zealand",
    21: "slim-tool-taxis-facilitate-logging-a-highly-deviated-6-hole-section-on-wireline",
    22: "cement-evaluation-without-gemco-centralizers-to-85-deviation-in-ksa",
    23: "oriented-hrsct-optimum-sidewall-core-recovery-in-mexico",
    24: "mril-d-conveyance-in-highly-deviated-casings-in-malaysia",
}

# New-story slugs (25) — readable, trimmed from the headline.
NEW_SLUG = {
    25: "world-record-20kft-tractoring-with-cement-evaluation-tool-in-ksa",
    26: "world-record-longest-open-hole-tractor-logging-operation-in-ksa",
    27: "supercombo-on-wireline-saves-over-20-hours-of-rig-time-in-ksa",
    28: "tractor-assist-of-super-combos-replaces-drill-pipe-conveyance-in-ksa",
    29: "cbl-descends-2500m-tangent-at-67-degrees-in-mexico",
    30: "pathfinder-success-story-new-zealand",
    31: "high-performance-equipment-ultra-low-drag-in-angola",
    32: "oriented-sidewall-coring-avoids-wellbore-damage-in-oman",
    33: "18-inch-washout-navigated-in-vertical-well-in-peru",
    34: "27-hours-rig-time-saved-differential-sticking-prevented-in-kuwait",
    35: "rocker-deploys-ultrasonic-cement-imaging-through-inaccessible-completions-in-ksa",
    36: "efficient-logging-saves-38-hours-of-rig-time-in-ksa",
    37: "reliable-wireline-packer-deployment-in-complex-completions",
    38: "pathfinder-cost-effective-data-acquisition-in-ccs",
    39: "petromac-proven-in-carbon-capture",
    40: "high-quality-imaging-in-demanding-offshore-wells",
    41: "reliable-data-acquisition-in-200c-geothermal-wells",
    42: "data-and-sample-acquisition-in-fractured-washed-out-wells",
    43: "compact-reliable-centralization-for-high-resolution-imaging",
    44: "helix-centraliser-cement-evaluation-through-tight-restrictions",
    45: "critical-data-acquisition-in-a-research-well",
    46: "tool-taxis-and-pathfinder-gravity-descent-in-guyana",
    47: "eliminate-toolstring-hold-up-on-severe-rathole-ledges",
    48: "ora-cmr-orientation-reduces-cable-damage-risk-on-tlc-in-guyana",
    49: "ultra-low-drag-centralization-720k-cost-savings-cement-evaluation",
}

COUNTRY_FIX = {"KSA": "Saudi Arabia", "UAE": "United Arab Emirates"}


def meta_description(story: dict, title: str) -> str:
    """~155-char description from the challenge (falls back to narrative)."""
    src = (
        (story["challenge"][0] if story["challenge"] else "")
        or (story["narrative"][0] if story["narrative"] else title)
    )
    text = clean(src)
    if len(text) <= 158:
        return text
    cut = text[:158]
    return cut[: cut.rfind(" ")].rstrip(",.;:") + "…"


def find_idml() -> Path:
    idmls = sorted(SOURCES.rglob("*.idml"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not idmls:
        raise SystemExit(
            f"No .idml under {SOURCES.relative_to(REPO)} — drop the InDesign "
            "package folder there (see sources/README.md)."
        )
    return idmls[0]


def main() -> None:
    idml = find_idml()
    print(f"Source: {idml.relative_to(REPO)}")
    pkg = Package(idml)
    by_page = pkg.by_page()

    rows = list(csv.DictReader(open(BASE / "tags.csv")))
    figures = json.loads(FIGURES.read_text()) if FIGURES.exists() else {}
    if not figures:
        print("WARNING: no figures manifest — run extract_story_figures.py first")

    raw = {}
    for row in rows:
        page = int(row["Page"])
        if page not in by_page:
            raise SystemExit(f"page {page} in tags.csv but not in the IDML")
        raw[page] = extract_page(pkg, by_page[page][0])

    # Vocabulary for hyphen repair, built from the whole document so a word
    # broken on one page can be recognised from its use on another.
    everything = [
        t for s in raw.values()
        for t in ([s["headline"], s["subtitle"]] + s["narrative"]
                  + s["challenge"] + s["solution"] + s["results"])
    ]
    vocab = build_vocabulary(everything)
    hyphenated = Counter(
        m.lower() for t in everything for m in re.findall(r"\b[A-Za-z]{2,}-[a-z]{2,}\b", t)
    )

    words = load_dictionary()

    def fix(text: str) -> str:
        text = fix_broken_words(clean(text), vocab, words)
        return fix_quote_jam(fix_stray_hyphens(text, vocab, hyphenated, words))

    # SPE papers link to their DOI when the document itself carries the link —
    # the IDML's hyperlink table has https://doi.org/10.2118/<number>-MS for
    # the papers the printed page links. Matched by paper number; a reference
    # with no matching link stays plain text.
    doi_by_number = {}
    for h in pkg.hyperlinks:
        m = re.search(r"doi\.org/10\.2118/(\d+)-MS", h["url"])
        if m:
            doi_by_number[m.group(1)] = h["url"].strip()

    out = []
    for row in rows:
        page = int(row["Page"])
        s = raw[page]
        slug = KEEP_SLUG.get(page) or NEW_SLUG[page]
        country = COUNTRY_FIX.get(row["Country"], row["Country"])
        fig = figures.get(str(page), {})
        page_figures = [
            {**f, "caption": c or None}
            for f, c in zip(fig.get("figures", []), fig.get("captions", []))
        ]
        story = {
            k: [fix(p) for p in s[k]]
            for k in ("narrative", "challenge", "solution", "results", "learnings")
        }
        title = fix(s["headline"])
        out.append(
            {
                "slug": slug,
                "page": page,
                "title": title,
                "subtitle": fix(s["subtitle"]) or None,
                "metaDescription": meta_description(story, title),
                "country": country,
                "region": row["Area"],
                "year": int(row["Year"]) if row["Year"] else None,
                "wirelineCompany": row["WL Co"],
                "device": row["Device"],
                "categories": [c for c in (row["Category 1"], row["Category 2"]) if c],
                "references": [
                    {
                        "label": label,
                        "href": doi_by_number.get(label.split("-")[1]),
                    }
                    for label in s["references"]
                ],
                "challenge": story["challenge"],
                "solution": story["solution"],
                "results": story["results"],
                "learnings": story["learnings"],
                "narrative": story["narrative"],
                "narrativeSubheads": [
                    {"before": h["before"], "text": fix(h["text"])} for h in s["subheads"]
                ],
                "callout": fix(s["callout"]) or None,
                "image": {
                    "src": f"/flipbooks/success-stories/pages/{page:04d}.webp",
                    "width": PAGE_W,
                    "height": PAGE_H,
                },
                # The region world-map the printed page opens with (shared
                # asset, one of six, exported by extract_story_figures.py).
                # Carries the map's own region CODE: page 7 is tagged
                # Area=EUR in tags.csv while the layout places the MEA map,
                # and the sidebar caption must not contradict the image.
                "regionMap": fig.get("map"),
                "figures": page_figures,
            }
        )

    slugs = [o["slug"] for o in out]
    assert len(slugs) == len(set(slugs)) == 46, "slug collision or missing page"
    missing = [o["page"] for o in out if not o["title"]]
    assert not missing, f"pages with no headline: {missing}"
    JSON_OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")

    no_sub = [o["page"] for o in out if not o["subtitle"]]
    thin = [o["page"] for o in out if not o["narrative"]]
    paras = sum(len(o["narrative"]) for o in out)
    print(f"wrote {JSON_OUT.relative_to(REPO)}: {len(out)} stories, {paras} narrative paragraphs")
    print(f"  pages with no subtitle:  {no_sub or 'none'}")
    print(f"  pages with no narrative: {thin or 'none'}")


if __name__ == "__main__":
    main()
