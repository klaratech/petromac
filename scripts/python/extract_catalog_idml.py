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

The IDML parsing itself lives in `idml.py`, shared with the success-stories
pipeline. Stdlib only — no venv needed.
"""

from __future__ import annotations

import json
import sys

from idml import Package


def main():
    idml_path, out_path = sys.argv[1], sys.argv[2]
    pkg = Package(idml_path)

    unmapped_styles: set[str] = set()
    seen_stories: set[str] = set()
    spreads_out = []

    for sp in pkg.spreads:
        # Attach story content; drop empty frames. A threaded story can span
        # several frames (columns / continuation frames) — attach its blocks
        # only at the first frame that references it so text isn't duplicated.
        content_frames = []
        for fr in sp.frames:
            if fr["story"] in seen_stories:
                continue
            blocks = pkg.blocks(fr)
            if not blocks:
                continue
            seen_stories.add(fr["story"])
            for b in blocks:
                if "text" in b and not b["style"]:
                    unmapped_styles.add("(none)")
            content_frames.append({"bounds": fr["bounds"], "blocks": blocks})

        # Reading order: sort by page (x band), then y, then x
        def order_key(item):
            b = item["bounds"] or [0, 0, 0, 0]
            page_i = 0
            cx = (b[0] + b[2]) / 2
            for i, p in enumerate(sp.pages):
                if p["bounds"][0] - 1 <= cx <= p["bounds"][2] + 1:
                    page_i = i
                    break
            return (page_i, round(b[1]), round(b[0]))

        content_frames.sort(key=order_key)
        images = sorted(sp.images, key=order_key)

        spreads_out.append(
            {
                "index": sp.index,
                "pages": [p["name"] for p in sp.pages],
                "frames": content_frames,
                "images": images,
            }
        )

    out = {
        "source": idml_path.split("/")[-1],
        "hyperlinks": pkg.hyperlinks,
        "spreads": spreads_out,
    }
    with open(out_path, "w") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)

    n_frames = sum(len(s["frames"]) for s in spreads_out)
    n_tables = sum(
        1 for s in spreads_out for fr in s["frames"] for b in fr["blocks"] if "table" in b
    )
    n_images = sum(len(s["images"]) for s in spreads_out)
    print(
        f"OK: {len(spreads_out)} spreads, {n_frames} text frames, "
        f"{n_tables} tables, {n_images} image placements, "
        f"{len(pkg.hyperlinks)} hyperlink destinations -> {out_path}"
    )
    if unmapped_styles:
        print(f"WARNING: blocks with unmapped styles: {sorted(unmapped_styles)}")


if __name__ == "__main__":
    main()
