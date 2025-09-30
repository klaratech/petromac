from fastapi import FastAPI, Form
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, List
from pypdf import PdfReader, PdfWriter
import pandas as pd
import io
import json
import os

app = FastAPI()

# ---------------------------
# CORS
# ---------------------------
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [o.strip() for o in allowed_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Constants / Globals
# ---------------------------
INDEX_CSV_PATH = os.getenv("INDEX_CSV_PATH", "public/successstories-summary.csv")
CATALOG_PDF_PATH = os.getenv("CATALOG_PDF_PATH", "public/successstories.pdf")

FILTER_COLUMNS: Dict[str, str] = {
    "year": "Year",
    "area": "Area",
    "country": "Country",
    "wlco": "WL Co",
    "category1": "Category 1",
    "category2": "Category 2",
    "device": "Device",
}

PAGE_COL_CANDIDATES: List[str] = [
    "page", "Page", "PAGE", "page_number", "Page Number",
    "PageNumber", "pageNo", "PageNo"
]

df_index: Optional[pd.DataFrame] = None


# ---------------------------
# Startup
# ---------------------------
@app.on_event("startup")
async def startup_event():
    """Load CSV and validate PDF presence."""
    global df_index

    if not os.path.exists(INDEX_CSV_PATH):
        raise FileNotFoundError(f"CSV index not found at {INDEX_CSV_PATH}")
    df_index = pd.read_csv(INDEX_CSV_PATH, dtype=str, keep_default_na=False)
    df_index = df_index.applymap(lambda x: x.strip() if isinstance(x, str) else x)
    print(f"[startup] Loaded CSV with {len(df_index)} rows from {INDEX_CSV_PATH}")

    if not os.path.exists(CATALOG_PDF_PATH):
        raise FileNotFoundError(f"Catalog PDF not found at {CATALOG_PDF_PATH}")
    print(f"[startup] Validated PDF exists at {CATALOG_PDF_PATH}")


# ---------------------------
# Helpers
# ---------------------------
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
        out = [str(v).strip() for v in vals if str(v).strip()]
    else:
        out = [v.strip() for v in str(vals).split(",") if v.strip()]
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
            if v.startswith("~"):   # substring
                mask = mask | series.str.contains(v[1:], na=False)
            else:                   # exact
                mask = mask | (series == v)
        work = work[mask]
    return work

def coerce_page_numbers(series: pd.Series) -> List[int]:
    return pd.to_numeric(series, errors="coerce").dropna().astype(int).tolist()


# ---------------------------
# Endpoints
# ---------------------------
@app.get("/options")
async def get_options():
    """Return unique sorted lists for UI dropdowns."""
    if df_index is None:
        return JSONResponse({"error": "CSV not loaded"}, status_code=500)

    options = {}
    for key, col in FILTER_COLUMNS.items():
        if col in df_index.columns:
            vals = df_index[col].astype(str)
            options[key] = sorted({v.strip() for v in vals if v and v.strip() and v.strip().lower() != "nan"})
        else:
            options[key] = []
    return JSONResponse(options)

@app.post("/extract")
async def extract(
    filters_json: str = Form(default="{}"),
    case_insensitive: bool = Form(default=True),
    preview: bool = Form(default=False),
    page_col: Optional[str] = Form(default=None),
):
    """
    Extract and stitch PDF pages based on filters.
    Use "~text" for substring search in any filter list value.
    """
    if df_index is None:
        return JSONResponse({"error": "CSV not loaded"}, status_code=500)

    # Parse filters
    try:
        raw_filters = json.loads(filters_json or "{}")
    except Exception as e:
        return JSONResponse({"error": f"Invalid filters_json: {e}"}, status_code=400)

    filters = {k: normalize_multi(raw_filters.get(k)) for k in FILTER_COLUMNS.keys()}

    # Apply filters
    try:
        filtered = apply_text_filters(df_index, filters, case_insensitive)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    # Detect page column
    try:
        page_col_name = detect_page_col(filtered if not filtered.empty else df_index, page_col)
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    # Collect filtered pages (1-based, preserve CSV order)
    filtered_pages_1b: List[int] = []
    if not filtered.empty and page_col_name in filtered.columns:
        filtered_pages_1b = coerce_page_numbers(filtered[page_col_name])

    # Load PDF lazily
    try:
        # Using context manager avoids file locking issues on some platforms
        with open(CATALOG_PDF_PATH, "rb") as f:
            reader = PdfReader(f)
            total_pages = len(reader.pages)
            if total_pages == 0:
                return JSONResponse({"error": "PDF has 0 pages"}, status_code=400)

            # Clamp weird values
            filtered_pages_1b = [p for p in filtered_pages_1b if 1 <= p <= total_pages]

            # Build final page list: cover (1-3) + filtered + last
            cover_count = min(3, total_pages)
            final_pages_1b: List[int] = list(range(1, cover_count + 1))

            seen = set(final_pages_1b)
            for p in filtered_pages_1b:
                if p not in seen:
                    final_pages_1b.append(p)
                    seen.add(p)

            if total_pages not in seen:
                final_pages_1b.append(total_pages)

            if preview:
                return JSONResponse({
                    "match_count": len(filtered),
                    "pages_1based": final_pages_1b,
                    "total_pages": total_pages
                })

            if not final_pages_1b:
                return JSONResponse({"error": "No valid pages to extract."}, status_code=400)

            # Write output
            writer = PdfWriter()
            for p in final_pages_1b:
                writer.add_page(reader.pages[p - 1])  # convert to 0-based

            out_buf = io.BytesIO()
            writer.write(out_buf)
            out_buf.seek(0)

            return StreamingResponse(
                out_buf,
                media_type="application/pdf",
                headers={"Content-Disposition": 'attachment; filename="extracted.pdf"'}
            )
    except Exception as e:
        return JSONResponse({"error": f"Failed to read or process PDF: {e}"}, status_code=400)

@app.get("/")
async def root():
    return {"message": "FastAPI Success Stories PDF Generator", "status": "ready"}

@app.get("/healthz")
def healthz():
    return {"ok": True, "rows": 0 if df_index is None else len(df_index)}


# Local dev
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)