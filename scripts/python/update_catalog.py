#!/usr/bin/env python3
"""One-command catalog rebuild: pnpm run data:catalog

Finds the newest .idml under sources/catalog/ (any subfolder — drop the
whole InDesign package folder in, no renaming), expects a `Links` folder
next to it, then runs:

    extract_catalog_idml.py  (IDML -> raw spread dump, temp file)
    build_catalog_content.py (raw + catalog_config.json -> catalog.json + images)

After a new edition drops, re-run this and review the git diff of
src/features/catalog/content/catalog.json. New/renamed products or images
need catalog_config.json updates first — the builder warns about anything
it can't map.
"""

import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SOURCES = os.path.join(ROOT, "sources/catalog")
SCRIPTS = os.path.dirname(os.path.abspath(__file__))


def main():
    idmls = []
    for dirpath, _dirnames, filenames in os.walk(SOURCES):
        for f in filenames:
            if f.lower().endswith(".idml"):
                p = os.path.join(dirpath, f)
                idmls.append((os.path.getmtime(p), p))
    if not idmls:
        print(f"No .idml found under {SOURCES} — drop the InDesign package folder there.")
        sys.exit(1)
    idmls.sort(reverse=True)
    idml = idmls[0][1]
    links = os.path.join(os.path.dirname(idml), "Links")
    if not os.path.isdir(links):
        print(f"No Links folder next to {idml} — copy the full InDesign package.")
        sys.exit(1)

    print(f"Source: {os.path.relpath(idml, ROOT)}")
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        raw_path = tmp.name
    try:
        subprocess.run(
            [sys.executable, os.path.join(SCRIPTS, "extract_catalog_idml.py"), idml, raw_path],
            check=True,
        )
        subprocess.run(
            [sys.executable, os.path.join(SCRIPTS, "build_catalog_content.py"), raw_path, links],
            check=True,
        )
    finally:
        os.unlink(raw_path)


if __name__ == "__main__":
    main()
