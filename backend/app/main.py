from __future__ import annotations

import html
import io
import json
import os
import smtplib
import threading
import time
import uuid
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from pypdf import PdfReader, PdfWriter

ROOT_DIR = Path(__file__).resolve().parents[2]
PUBLIC_DIR = ROOT_DIR / "public"
DATA_DIR = ROOT_DIR / "data"
EMAIL_LOG_PATH = DATA_DIR / "email-log.jsonl"
EMAIL_CONFIG_PATH = DATA_DIR / "email-config.json"
OPERATIONS_DATA_PATH = PUBLIC_DIR / "data" / "operations_data.json"
COUNTRY_LABELS_PATH = PUBLIC_DIR / "data" / "country_labels.json"
CATALOG_PDF_PATH = PUBLIC_DIR / "flipbooks" / "catalog" / "source.pdf"
SUCCESS_STORIES_PDF_PATH = PUBLIC_DIR / "flipbooks" / "success-stories" / "source.pdf"

CONTACT_RATE_LIMIT = {"limit": 3, "window_ms": 60_000}
EMAIL_RATE_LIMIT = {"limit": 3, "window_ms": 60_000}
PDF_RATE_LIMIT = {"limit": 5, "window_ms": 60_000}
DEFAULT_MAX_PAGES = 60

_rate_limit_lock = threading.Lock()
_rate_limit_state: dict[str, tuple[int, float]] = {}


def parse_env_list(value: str | None) -> list[str]:
    return [item.strip() for item in (value or "").split(",") if item.strip()]


def get_allowed_origins() -> list[str]:
    configured = parse_env_list(
        os.getenv("ALLOWED_ORIGINS")
        or os.getenv("NEXT_PUBLIC_BASE_URL")
        or "http://localhost:3000"
    )
    return configured


def get_client_ip(headers) -> str:
    forwarded_for = headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return "unknown"


def check_rate_limit(key: str, limit: int, window_ms: int) -> tuple[bool, int]:
    now = time.time() * 1000
    with _rate_limit_lock:
        count, reset_at = _rate_limit_state.get(key, (0, now + window_ms))
        if now >= reset_at:
            count = 0
            reset_at = now + window_ms
        count += 1
        _rate_limit_state[key] = (count, reset_at)
        allowed = count <= limit
    retry_after = max(0, int((reset_at - now + 999) // 1000))
    return allowed, retry_after


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def read_json_file(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json_file(path: Path, payload: dict) -> None:
    ensure_data_dir()
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")


def get_email_config() -> dict[str, str | None]:
    if not EMAIL_CONFIG_PATH.exists():
        return {"currentEvent": None}
    return read_json_file(EMAIL_CONFIG_PATH)


def set_email_config(current_event: str | None) -> dict[str, str | None]:
    payload = {"currentEvent": current_event}
    write_json_file(EMAIL_CONFIG_PATH, payload)
    return payload


def read_email_log() -> list[dict]:
    if not EMAIL_LOG_PATH.exists():
        return []
    with EMAIL_LOG_PATH.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def append_email_log(
    *,
    recipient_email: str,
    email_type: str,
    filters_applied: dict[str, list[str]] | None = None,
) -> None:
    ensure_data_dir()
    config = get_email_config()
    payload = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "recipientEmail": recipient_email,
        "emailType": email_type,
    }
    if filters_applied:
        payload["filtersApplied"] = filters_applied
    if config.get("currentEvent"):
        payload["eventTag"] = config["currentEvent"]
    with EMAIL_LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload) + "\n")


def is_origin_allowed(request: Request) -> bool:
    allowed_origins = get_allowed_origins()
    if not allowed_origins:
        return True

    raw = request.headers.get("origin") or request.headers.get("referer")
    if not raw:
        return False

    try:
        incoming = urlparse(raw).hostname
    except ValueError:
        return False

    if not incoming:
        return False

    for allowed in allowed_origins:
        try:
            if urlparse(allowed).hostname == incoming:
                return True
        except ValueError:
            continue
    return False


def is_recipient_allowed(email: str, default_recipient: str | None = None) -> bool:
    allowed_recipients = parse_env_list(os.getenv("ALLOWED_EMAIL_RECIPIENTS"))
    allowed_domains = [domain.lower() for domain in parse_env_list(os.getenv("ALLOWED_EMAIL_DOMAINS"))]

    if not allowed_recipients and not allowed_domains:
        return default_recipient is not None and email == default_recipient

    if email in allowed_recipients:
        return True

    if "@" not in email:
        return False
    domain = email.split("@", 1)[1].lower()
    return domain in allowed_domains


def allowlists_configured() -> bool:
    return bool(
        parse_env_list(os.getenv("ALLOWED_EMAIL_RECIPIENTS"))
        or parse_env_list(os.getenv("ALLOWED_EMAIL_DOMAINS"))
    )


def get_from_address() -> str:
    return os.getenv("CONTACT_FROM_EMAIL") or os.getenv("SMTP_USER") or ""


def create_smtp_client():
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "465"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")

    if not host or not user or not password:
        raise RuntimeError("SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.")

    client = smtplib.SMTP(host, port, timeout=30)
    if port == 587:
        client.starttls()
    client.login(user, password)
    return client


def send_email(
    *,
    to_address: str,
    subject: str,
    html_body: str,
    text_body: str,
    reply_to: str | None = None,
    attachment_name: str | None = None,
    attachment_bytes: bytes | None = None,
) -> None:
    message = EmailMessage()
    message["From"] = get_from_address()
    message["To"] = to_address
    message["Subject"] = subject
    if reply_to:
        message["Reply-To"] = reply_to
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    if attachment_name and attachment_bytes is not None:
        message.add_attachment(
            attachment_bytes,
            maintype="application",
            subtype="pdf",
            filename=attachment_name,
        )

    with create_smtp_client() as client:
        client.send_message(message)


def build_filtered_filename(filters: dict[str, list[str]] | None = None) -> str:
    parts = ["petromac", "successstories"]

    for key in ("areas", "companies", "techs"):
        values = (filters or {}).get(key) or []
        normalized = "-".join(
            value.lower().strip().replace(" ", "-")
            for value in values
            if value.strip()
        )
        normalized = "".join(
            ch for ch in normalized if ch.isalnum() or ch == "-"
        ).strip("-")
        if normalized:
            parts.append(normalized)

    parts.append(datetime.now(timezone.utc).date().isoformat())
    return "_".join(parts) + ".pdf"


def build_catalog_filename() -> str:
    return f"petromac_catalog_{datetime.now(timezone.utc).date().isoformat()}.pdf"


def normalize_page_numbers(raw: list[int] | None) -> list[int]:
    if not raw:
        return []
    numbers = sorted({int(value) for value in raw if int(value) > 0})
    return numbers


def build_success_stories_pdf(page_numbers: list[int] | None) -> tuple[bytes, int]:
    normalized = normalize_page_numbers(page_numbers)
    with SUCCESS_STORIES_PDF_PATH.open("rb") as handle:
        reader = PdfReader(handle)
        total_pages = len(reader.pages)

        if not normalized:
            return SUCCESS_STORIES_PDF_PATH.read_bytes(), total_pages

        if len(normalized) > DEFAULT_MAX_PAGES:
            raise HTTPException(status_code=400, detail=f"Too many pages selected. Max {DEFAULT_MAX_PAGES} pages allowed.")

        writer = PdfWriter()
        for page_number in normalized:
            index = page_number - 1
            if 0 <= index < total_pages:
                writer.add_page(reader.pages[index])

        buffer = io.BytesIO()
        writer.write(buffer)
        return buffer.getvalue(), total_pages


class FiltersModel(BaseModel):
    areas: list[str] | None = None
    companies: list[str] | None = None
    techs: list[str] | None = None


class SendPdfRequest(BaseModel):
    email: EmailStr
    pdfType: str = Field(pattern="^(catalog|success-stories)$")
    pageNumbers: list[int] | None = None
    filters: FiltersModel | None = None


class SuccessStoriesPdfRequest(BaseModel):
    filters: FiltersModel | None = None
    mode: str = Field(default="download", pattern="^(preview|download)$")
    pageNumbers: list[int] | None = None


class EmailConfigRequest(BaseModel):
    currentEvent: str | None = None


app = FastAPI(title="Petromac Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck():
    return {"status": "ok"}


@app.get("/api/data/operations")
def get_operations_data():
    return read_json_file(OPERATIONS_DATA_PATH)


@app.get("/api/data/country-labels")
def get_country_labels():
    return read_json_file(COUNTRY_LABELS_PATH)


@app.get("/api/email-log")
def get_email_log():
    return read_email_log()


@app.get("/api/email-config")
def get_email_config_endpoint():
    return get_email_config()


@app.post("/api/email-config")
def set_email_config_endpoint(payload: EmailConfigRequest):
    value = payload.currentEvent.strip() if payload.currentEvent else None
    return set_email_config(value or None)


@app.post("/api/contact")
async def submit_contact(request: Request):
    if not is_origin_allowed(request):
        raise HTTPException(status_code=403, detail="Invalid origin")

    form = await request.form()
    name = str(form.get("name", "")).strip()
    email = str(form.get("email", "")).strip()
    message = str(form.get("message", "")).strip()
    company = str(form.get("company", "")).strip()
    timing = float(str(form.get("_timing", "0")))

    if company:
        return {"ok": True}
    if timing < 3:
        return {"ok": True}
    if len(name) < 2 or len(message) < 10 or "@" not in email:
        return JSONResponse({"ok": False, "error": "Validation failed"}, status_code=400)

    allowed, retry_after = check_rate_limit(
        f"contact:{get_client_ip(request.headers)}",
        CONTACT_RATE_LIMIT["limit"],
        CONTACT_RATE_LIMIT["window_ms"],
    )
    if not allowed:
        return JSONResponse(
            {"ok": False, "error": "Too many submissions. Please try again later."},
            status_code=429,
            headers={"Retry-After": str(retry_after)},
        )

    contact_to_email = os.getenv("CONTACT_TO_EMAIL")
    if not contact_to_email:
        return JSONResponse(
            {"ok": False, "error": "Email service is not configured. Please try again later."},
            status_code=500,
        )

    escaped_name = html.escape(name)
    escaped_email = html.escape(email)
    escaped_message = html.escape(message)
    send_email(
        to_address=contact_to_email,
        subject=f"Contact Form: {escaped_name}",
        text_body=f"From: {name} <{email}>\n\nMessage:\n{message}",
        html_body=(
            "<h2>New Contact Form Submission</h2>"
            f"<p><strong>Name:</strong> {escaped_name}</p>"
            f"<p><strong>Email:</strong> {escaped_email}</p>"
            "<p><strong>Message:</strong></p>"
            f"<p>{escaped_message.replace(chr(10), '<br>')}</p>"
        ),
        reply_to=email,
    )
    append_email_log(recipient_email=email, email_type="contact")
    return {"ok": True}


@app.post("/api/pdf/success-stories")
async def success_stories_pdf(payload: SuccessStoriesPdfRequest, request: Request):
    if not is_origin_allowed(request):
        raise HTTPException(status_code=403, detail="Invalid origin")

    pdf_bytes, _total_pages = build_success_stories_pdf(payload.pageNumbers)
    headers = {
        "Content-Type": "application/pdf",
        "Content-Disposition": (
            'inline; filename="success-stories-preview.pdf"'
            if payload.mode == "preview"
            else f'attachment; filename="{build_filtered_filename(payload.filters.model_dump(exclude_none=True) if payload.filters else None)}"'
        ),
    }
    if payload.mode == "preview":
        headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return Response(content=pdf_bytes, headers=headers, media_type="application/pdf")


@app.post("/api/email/send-pdf")
async def send_pdf(payload: SendPdfRequest, request: Request):
    if not is_origin_allowed(request):
        raise HTTPException(status_code=403, detail="Invalid origin")

    allowed, retry_after = check_rate_limit(
        f"email-send-pdf:{get_client_ip(request.headers)}",
        EMAIL_RATE_LIMIT["limit"],
        EMAIL_RATE_LIMIT["window_ms"],
    )
    if not allowed:
        return JSONResponse(
            {"error": "Too many requests. Please try again later."},
            status_code=429,
            headers={"Retry-After": str(retry_after)},
        )

    if not allowlists_configured():
        raise HTTPException(
            status_code=500,
            detail="Email allowlist not configured. Set ALLOWED_EMAIL_DOMAINS or ALLOWED_EMAIL_RECIPIENTS in the environment.",
        )

    recipient = str(payload.email)
    if not is_recipient_allowed(recipient, os.getenv("CONTACT_TO_EMAIL")):
        raise HTTPException(status_code=403, detail="Recipient not allowed")

    filters = payload.filters.model_dump(exclude_none=True) if payload.filters else None

    if payload.pdfType == "catalog":
        pdf_bytes = CATALOG_PDF_PATH.read_bytes()
        filename = build_catalog_filename()
        subject = "Petromac Product Catalog"
    else:
        pdf_bytes, _ = build_success_stories_pdf(payload.pageNumbers)
        filename = build_filtered_filename(filters)
        subject = "Petromac Success Stories"

    send_email(
        to_address=recipient,
        subject=subject,
        text_body=(
            "Thank you for your interest in Petromac.\n\n"
            f"Please find attached the {'Product Catalog' if payload.pdfType == 'catalog' else 'Success Stories'} you requested.\n\n"
            "Visit https://www.petromac.com for more information."
        ),
        html_body=(
            '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
            '<h2 style="color: #1e40af;">Thank you for your interest in Petromac</h2>'
            f"<p>Please find attached the {'Product Catalog' if payload.pdfType == 'catalog' else 'Success Stories'} you requested.</p>"
            '<p>For more information about our wireline logging solutions, please visit our website or contact us directly.</p>'
            '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />'
            '<p style="color: #6b7280; font-size: 14px;"><strong>Petromac</strong><br />'
            'Wireline Logging Solutions<br />'
            '<a href="https://www.petromac.com" style="color: #1e40af;">www.petromac.com</a></p>'
            '</div>'
        ),
        attachment_name=filename,
        attachment_bytes=pdf_bytes,
    )

    append_email_log(
        recipient_email=recipient,
        email_type=payload.pdfType,
        filters_applied=filters,
    )
    return {"success": True}
