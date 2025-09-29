import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import Papa from "papaparse";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Filters = {
  year?: string[];
  area?: string[];
  country?: string[];
  wlco?: string[];
  category1?: string[];
  category2?: string[];
  device?: string[];
};

const FILTER_COLUMNS: Record<string, string> = {
  year: "Year",
  area: "Area",
  country: "Country",
  wlco: "WL Co",
  category1: "Category 1",
  category2: "Category 2",
  device: "Device",
};

const PAGE_COL_CANDIDATES = [
  "page", "Page", "PAGE",
  "page_number", "Page Number", "PageNumber",
  "pageNo", "PageNo",
];

// -------- Cold-start cache --------
let CSV_ROWS: Record<string, string>[] | null = null;
let PDF_BYTES: Uint8Array | null = null;
let PAGE_COL: string | null = null;
let OPTIONS_CACHE: Record<string, string[]> | null = null;

function csvPath() {
  return path.join(process.cwd(), "public", "successstories-summary.csv");
}

function pdfPath() {
  return path.join(process.cwd(), "public", "successstories.pdf");
}

function loadCsvOnce() {
  if (CSV_ROWS) return;
  const csv = fs.readFileSync(csvPath(), "utf8");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
    transform: (v: string) => (typeof v === "string" ? v.trim() : v),
  });
  if (parsed.errors?.length) {
    throw new Error("CSV parse error: " + parsed.errors[0].message);
  }
  CSV_ROWS = parsed.data;
  // detect page col
  const cols = new Set(Object.keys(CSV_ROWS[0] || {}).map((c) => c.trim()));
  PAGE_COL = PAGE_COL_CANDIDATES.find((c) => cols.has(c)) || null;
  if (!PAGE_COL) throw new Error("Could not find a page column in CSV");
}

function loadPdfOnce() {
  if (PDF_BYTES) return;
  PDF_BYTES = fs.readFileSync(pdfPath());
}

function buildOptionsOnce() {
  if (OPTIONS_CACHE) return;
  if (!CSV_ROWS) loadCsvOnce();
  
  OPTIONS_CACHE = {};
  
  for (const [filterKey, columnName] of Object.entries(FILTER_COLUMNS)) {
    const uniqueValues = new Set<string>();
    
    for (const row of CSV_ROWS!) {
      const value = String(row[columnName] ?? "").trim();
      if (value && value !== "") {
        // Handle comma-separated values
        const values = value.split(",").map(v => v.trim()).filter(Boolean);
        values.forEach(v => uniqueValues.add(v));
      }
    }
    
    // Convert to sorted array
    OPTIONS_CACHE[filterKey] = Array.from(uniqueValues).sort((a, b) => {
      // For year, sort numerically in descending order
      if (filterKey === "year") {
        return parseInt(b) - parseInt(a);
      }
      // For others, sort alphabetically
      return a.localeCompare(b);
    });
  }
}

function normalizeMulti(v: unknown): string[] | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function applyFilters(rows: Record<string,string>[], filters: Filters, caseInsensitive: boolean) {
  let w = rows;
  for (const [key, uiValues] of Object.entries(filters)) {
    const values = normalizeMulti(uiValues);
    if (!values?.length) continue;
    const col = FILTER_COLUMNS[key];
    if (!col) continue;
    w = w.filter((row) => {
      const raw = String(row[col] ?? "");
      const hay = caseInsensitive ? raw.toLowerCase() : raw;
      return values.some((val) => {
        const needle = caseInsensitive ? val.toLowerCase() : val;
        if (needle.startsWith("~")) {
          return hay.includes(needle.slice(1));
        }
        return hay === needle;
      });
    });
  }
  return w;
}

function coercePages1b(rows: Record<string,string>[], pageCol: string): number[] {
  const out: number[] = [];
  for (const r of rows) {
    const v = Number(String(r[pageCol] ?? "").trim());
    if (Number.isFinite(v) && v > 0) out.push(v);
  }
  return out;
}

// GET /api/successstories - Returns filter options
export async function GET(_req: NextRequest) {
  try {
    buildOptionsOnce();
    
    if (!OPTIONS_CACHE) {
      return new Response(JSON.stringify({ error: "Options not initialized" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(OPTIONS_CACHE), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST /api/successstories - Handles PDF generation and email
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const action = form.get("action") as string;

    // Handle email functionality
    if (action === "email") {
      const name = form.get("name") as string;
      const email = form.get("email") as string;
      const message = form.get("message") as string;

      if (!name || !email || !message) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
        subject: `Contact Form Submission from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
        html: `
          <h3>Contact Form Submission</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong> ${message}</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle PDF generation functionality
    loadCsvOnce();
    loadPdfOnce();
    if (!CSV_ROWS || !PDF_BYTES || !PAGE_COL) {
      return new Response(JSON.stringify({ error: "Server not initialized" }), { status: 500 });
    }

    const filters_json = form.get("filters_json") as string | null;
    const preview = (form.get("preview") ?? "false").toString() === "true";
    const case_insensitive = (form.get("case_insensitive") ?? "true").toString() === "true";

    const filters: Filters = filters_json ? JSON.parse(filters_json) : {};

    // 1) Filter rows
    const filtered = applyFilters(CSV_ROWS, filters, case_insensitive);

    // 2) Build page list (1-based)
    const srcPdf = await PDFDocument.load(PDF_BYTES!);
    const total = srcPdf.getPageCount();
    if (total === 0) {
      return new Response(JSON.stringify({ error: "PDF has 0 pages" }), { status: 400 });
    }

    const cover = [1, 2, 3].filter((p) => p <= total);
    const selected = coercePages1b(filtered, PAGE_COL!).filter((p) => p >= 1 && p <= total);

    // de-dup, preserving order
    const seen = new Set<number>();
    const finalPages1b: number[] = [];
    for (const p of [...cover, ...selected, total]) {
      if (!seen.has(p)) {
        seen.add(p);
        finalPages1b.push(p);
      }
    }

    if (preview) {
      return new Response(
        JSON.stringify({
          match_count: filtered.length,
          pages_1based: finalPages1b,
          total_pages: total,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (finalPages1b.length === 0) {
      return new Response(JSON.stringify({ error: "No valid pages to extract." }), { status: 400 });
    }

    // 3) Assemble output PDF
    const outPdf = await PDFDocument.create();
    const indices0b = finalPages1b.map((p) => p - 1);
    const copied = await outPdf.copyPages(srcPdf, indices0b);
    copied.forEach((p) => outPdf.addPage(p));
    const outBytes = await outPdf.save();

    return new Response(Buffer.from(outBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="extracted.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
