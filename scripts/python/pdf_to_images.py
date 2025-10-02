import os
from pdf2image import convert_from_path

PDFS = {
    "productcatalog": "public/data/product-catalog.pdf",
    "successstories": "public/data/successstories.pdf",
}

OUTPUT_DIR = "public/flipbooks"

def convert_pdf(name, pdf_path):
    out_dir = os.path.join(OUTPUT_DIR, name)
    os.makedirs(out_dir, exist_ok=True)
    pages = convert_from_path(pdf_path, dpi=150)  # 150dpi good balance quality/speed
    for i, page in enumerate(pages, start=1):
        out_file = os.path.join(out_dir, f"page-{i:03d}.jpg")
        page.save(out_file, "JPEG", quality=90)
        print(f"Saved {out_file}")

if __name__ == "__main__":
    for name, path in PDFS.items():
        if os.path.exists(path):
            print(f"Processing {name}…")
            convert_pdf(name, path)
        else:
            print(f"Warning: {path} not found, skipping {name}")
