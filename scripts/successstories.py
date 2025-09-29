from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pypdf import PdfReader, PdfWriter
import pandas as pd
import io
import json
import os

app = FastAPI()

# --- CORS (restrict in production) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Constants ---
INDEX_CSV_PATH = os.getenv("INDEX_CSV_PATH", "successstories-summary.csv")

FILTER_COLUMNS = {
    "year": "Year",
    "area": "Area",
    "country": "Country",
    "wlco": "WL Co",
    "category1": "Category 1",
    "category2": "Category 2",
    "device": "Device",
}

PAGE_COL_CANDIDATES = [
    "page", "Page", "PAGE", "page_number", "Page Number",
    "PageNumber", "pageNo", "PageNo"
]


# --- Helpers ---
def detect_page_col(df: pd.DataFrame, user_col: Optional[str]) -> str:
    if user_col and user_col in df.columns:
        return user_col
    for c in PAGE_COL_CANDIDATES:
        if c in df.columns:
            return c
    raise ValueError(f"Could not find page column; available: {list(df.columns)}")


def normalize_multi(vals):
    if vals is None:
        return None
    if isinstance(vals, list):
        out = [str(v).strip() for v in vals if str(v).strip() != ""]
    else:
        out = [v.strip() for v in str(vals).split(",") if v.strip() != ""]
    return out or None


def apply_text_filters(df: pd.DataFrame, filters: dict, case_insensitive: bool) -> pd.DataFrame:
    work = df.copy()
    for key, values in filters.items():
        if not values:
            continue
        col = FILTER_COLUMNS[key]
        if col not in work.columns:
            raise ValueError(f"Index missing required column '{col}'. Available: {list(work.columns)}")
        series = work[col].astype(str)
        checks = values
        if case_insensitive:
            series = series.str.lower()
            checks = [v.lower() for v in values]
        mask = False
        for v in checks:
            if v.startswith("~"):  # substring search
                term = v[1:]
                mask = mask | series.str.contains(term, na=False)
            else:  # exact match
                mask = mask | (series == v)
        work = work[mask]
    return work


def coerce_page_numbers(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce").astype("Int64")


# --- API ---
@app.post("/extract")
async def extract(
    pdf_file: UploadFile = File(..., description="Upload the catalog PDF"),
    filters_json: str = Form(default="{}"),
    page_col: Optional[str] = Form(default=None),
    case_insensitive: bool = Form(default=True),
    preview: bool = Form(default=False),
):
    """
    Filters example:
    {
      "year": ["2024"],
      "area": ["Europe & Eurasia"],
      "country": ["Italy"],
      "wlco": ["SLB"],
      "category1": ["Well Access"],
      "category2": ["CMR"],
      "device": ["Helix"]
    }
    Use "~text" for substring search.
    """

    # --- Load PDF ---
    pdf_bytes = await pdf_file.read()

    # --- Load CSV index ---
    if not os.path.exists(INDEX_CSV_PATH):
        return JSONResponse({"error": f"CSV index not found at {INDEX_CSV_PATH}"}, status_code=500)
    df = pd.read_csv(INDEX_CSV_PATH)

    # --- Parse filters ---
    try:
        raw_filters = json.loads(filters_json or "{}")
    except Exception as e:
        return JSONResponse({"error": f"Invalid filters_json: {e}"}, status_code=400)

    filters = {k: normalize_multi(raw_filters.get(k)) for k in FILTER_COLUMNS.keys()}

    # --- Apply filters ---
    try:
        filtered = apply_text_filters(df, filters, case_insensitive)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    # --- Detect page column ---
    try:
        page_col_name = detect_page_col(filtered if not filtered.empty else df, page_col)
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    # --- Collect pages ---
    pages_1b = []
    if not filtered.empty and page_col_name in filtered.columns:
        pages_1b = coerce_page_numbers(filtered[page_col_name]).dropna().astype(int).tolist()

    # de-dup preserve order
    seen = set()
    ordered_unique = []
    for p in pages_1b:
        if p not in seen:
            seen.add(p)
            ordered_unique.append(p)

    # --- Build PDF ---
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as e:
        return JSONResponse({"error": f"Failed to read PDF: {e}"}, status_code=400)

    total = len(reader.pages)
    if total == 0:
        return JSONResponse({"error": "PDF has 0 pages"}, status_code=400)

    # Always include first 3 pages as cover
    cover_pages = [0, 1, 2] if total >= 3 else list(range(total))
    for p in cover_pages[::-1]:
        if p + 1 not in ordered_unique:
            ordered_unique.insert(0, p + 1)

    # Always include last page
    if total not in ordered_unique:
        ordered_unique.append(total)

    # Range check & convert to 0-based
    valid_zero = [p - 1 for p in ordered_unique if 1 <= p <= total]

    if preview:
        return JSONResponse({
            "match_count": len(filtered),
            "pages_1based": [i + 1 for i in valid_zero],
            "total_pages": total
        })

    if not valid_zero:
        return JSONResponse({"error": "No valid pages after filtering."}, status_code=400)

    writer = PdfWriter()
    for idx in valid_zero:
        writer.add_page(reader.pages[idx])

    out_buf = io.BytesIO()
    writer.write(out_buf)
    out_buf.seek(0)

    return StreamingResponse(
        out_buf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="extracted.pdf"'}
    )