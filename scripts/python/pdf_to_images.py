import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

DOCS = [
    {
        "key": "success-stories",
        "input": ROOT / "assets/source-pdfs/success-stories.pdf",
        "output": ROOT / "public/flipbooks/success-stories",
        "title": "Success Stories",
        "tags": ROOT / "assets/tags/success-stories.csv",
    },
    {
        "key": "catalog",
        "input": ROOT / "assets/source-pdfs/catalog.pdf",
        "output": ROOT / "public/flipbooks/catalog",
        "title": "Product Catalog",
        "tags": None,
    },
]


def run():
    for doc in DOCS:
        cmd = [
            sys.executable,
            str(ROOT / "scripts/build_flipbook.py"),
            "--input",
            str(doc["input"]),
            "--out",
            str(doc["output"]),
            "--title",
            doc["title"],
        ]
        if doc["tags"]:
            cmd.extend(["--tags", str(doc["tags"])])

        print(f"Processing {doc['key']}...")
        subprocess.check_call(cmd)


if __name__ == "__main__":
    run()
