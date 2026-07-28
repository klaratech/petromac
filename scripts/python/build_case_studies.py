#!/usr/bin/env python3
"""Build src/features/case-studies/content/case-studies.json from the
success-stories flipbook (source.pdf + tags.csv).

Run after a new success-stories PDF edition lands (pnpm run data first so
the flipbook pages + tags.csv are current):

    python3 scripts/python/build_case_studies.py

NEW STORIES in a new edition: add a slug to NEW_SLUG for each new page
(the script fails loudly on an unmapped page) and re-run. Existing slugs
are FROZEN — indexed URLs and next.config.ts redirects depend on them.
Review titles for parsing gloms (see TITLE_OVERRIDE).
"""

import csv
import json
import re
from pathlib import Path

from pypdf import PdfReader

REPO = Path(__file__).resolve().parents[2]
BASE = REPO / "public/flipbooks/success-stories"
JSON_OUT = REPO / "src/features/case-studies/content/case-studies.json"

WIDE = 42  # chars — sidebar column is ~28-33, narrative 45-95

TAG_WORDS = {
    "sensor orientation", "sticking prevention", "well access: deviation",
    "well access: ledges", "well access: washouts", "well access",
    "deviation", "ledges", "washouts", "sensor", "orientation",
    "sticking", "prevention", "efficiency", "data quality",
}


def dehyphen(text: str) -> str:
    # "permeabil -\nity" / "log -\nging" / "sam-\npling" -> joined
    text = re.sub(r"([A-Za-z]) ?-\s*\n\s*([a-z])", r"\1\2", text)
    return text


def clean_join(lines: list[str]) -> str:
    text = dehyphen("\n".join(lines))
    return re.sub(r"\s+", " ", text).strip()


def split_sentences_to_paras(text: str) -> list[str]:
    """The PDF loses paragraph breaks; keep it as one block per section."""
    return [text] if text else []


def extract_page(reader: PdfReader, page_no: int) -> dict:
    raw = reader.pages[page_no - 1].extract_text() or ""
    lines = [l.strip() for l in raw.split("\n")]
    lines = [l for l in lines if l and not l.lower().startswith("learn more")]

    # locate section markers
    def find(marker: str) -> int:
        for i, l in enumerate(lines):
            if l.strip().upper() == marker:
                return i
        return -1

    i_ch, i_so, i_re = find("CHALLENGE"), find("SOLUTION"), find("RESULTS")

    headline_lines = [
        l for l in lines[: i_ch if i_ch >= 0 else 0]
        if l.lower() not in TAG_WORDS
    ]
    headline = clean_join(headline_lines)

    challenge = clean_join(lines[i_ch + 1 : i_so]) if 0 <= i_ch < i_so else ""
    solution = clean_join(lines[i_so + 1 : i_re]) if 0 <= i_so < i_re else ""

    results = ""
    narrative: list[str] = []
    trailing: list[str] = []
    if i_re >= 0:
        rest = lines[i_re + 1 :]
        # results = leading narrow lines; narrative starts at first wide line
        j = 0
        while j < len(rest) and len(rest[j]) <= WIDE:
            j += 1
        results = clean_join(rest[:j])
        # narrative = wide lines; trailing narrow lines at the end are
        # captions/refs/tag chips
        k = len(rest)
        while k > j and (len(rest[k - 1]) <= WIDE or rest[k - 1].lower() in TAG_WORDS):
            k -= 1
        narrative_text = clean_join(rest[j:k])
        narrative = split_sentences_to_paras(narrative_text)
        trailing = [
            l for l in rest[k:]
            if l.lower() not in TAG_WORDS and len(l) > 8
        ]

    return {
        "page": page_no,
        "headline": headline,
        "challenge": challenge,
        "solution": solution,
        "results": results,
        "narrative": narrative,
        "trailing": trailing,  # subtitle / figure captions / SPE refs — review
    }




PAGE_W, PAGE_H = 1241, 1754

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

# Title overrides where PDF text-order glommed extra content.
TITLE_OVERRIDE = {
    22: "Cement evaluation without centralizers to 85° deviation in KSA",
    38: "PathFinder ensures cost-effective critical data acquisition in CCS",
}

# p22's narrative ended up inside the glommed headline — restore it.
P22_NARRATIVE = (
    "Operators in the Middle East routinely require cement evaluation in very "
    "highly deviated wellbores. IBC-CBL in extended reach wells can quickly "
    "become inefficient and expensive due to difficulties in logging tool "
    "conveyance. Traditional methods of centralizing the IBC-CBL using in-line "
    "and slip-over centralizers caused excessive drag. This makes it "
    "challenging to descend past 60° deviation via gravity. Operators had to "
    "resort to pipe or tractor conveyed logging for higher deviations. Pipe "
    "conveyed logging is operationally complex, time consuming and risky, "
    "whereas tractor conveyance can sometimes be limited by force output in "
    "long laterals. To overcome this, the centralizers were replaced by "
    "centralizing Tool Taxis, and tool strings now routinely descend on "
    "gravity to >85° deviation, with eccentricity, ECCE, well within "
    "tolerances. Track record includes horizontal logging of IBC-CBL over "
    "20kft, with an ECCE below 0.2”."
)

COUNTRY_FIX = {"KSA": "Saudi Arabia", "UAE": "United Arab Emirates"}


def meta_description(story: dict, title: str) -> str:
    """~155-char description from the challenge (falls back to narrative)."""
    src = story["challenge"] or (story["narrative"][0] if story["narrative"] else title)
    text = re.sub(r"\s+", " ", src).strip()
    if len(text) <= 158:
        return text
    cut = text[:158]
    return cut[: cut.rfind(" ")].rstrip(",.;:") + "…"


def main() -> None:
    reader = PdfReader(BASE / "source.pdf")
    rows = list(csv.DictReader(open(BASE / "tags.csv")))
    stories = []
    for row in rows:
        story = extract_page(reader, int(row["Page"]))
        story["tags"] = {
            "year": row["Year"], "area": row["Area"], "country": row["Country"],
            "wlco": row["WL Co"],
            "categories": [c for c in (row["Category 1"], row["Category 2"]) if c],
            "device": row["Device"],
        }
        story["image"] = f"/flipbooks/success-stories/pages/{int(row['Page']):04d}.webp"
        stories.append(story)
    out = []
    for s in stories:
        page = s["page"]
        slug = KEEP_SLUG.get(page) or NEW_SLUG[page]
        title = TITLE_OVERRIDE.get(page, s["headline"])
        narrative = s["narrative"]
        if page == 22:
            narrative = [P22_NARRATIVE]
        tags = s["tags"]
        country = COUNTRY_FIX.get(tags["country"], tags["country"])
        out.append(
            {
                "slug": slug,
                "page": page,
                "title": title,
                "metaDescription": meta_description(s, title),
                "country": country,
                "region": tags["area"],
                "year": int(tags["year"]) if tags["year"] else None,
                "wirelineCompany": tags["wlco"],
                "device": tags["device"],
                "categories": tags["categories"],
                "challenge": [s["challenge"]] if s["challenge"] else [],
                "solution": [s["solution"]] if s["solution"] else [],
                "results": [s["results"]] if s["results"] else [],
                "narrative": narrative,
                "image": {"src": s["image"], "width": PAGE_W, "height": PAGE_H},
            }
        )
    # sanity: slugs unique, all pages covered
    slugs = [o["slug"] for o in out]
    assert len(slugs) == len(set(slugs)) == 46, "slug collision or missing page"
    JSON_OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {JSON_OUT.relative_to(REPO)}: {len(out)} stories")
    print("kept slugs:", len([p for p in KEEP_SLUG]), "new slugs:", len(NEW_SLUG))


if __name__ == "__main__":
    main()
