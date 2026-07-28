from __future__ import annotations

import html
import io
import json
import base64
import threading
import time
import urllib.parse
import urllib.request
import os
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from pypdf import PdfReader, PdfWriter

ROOT_DIR = Path(__file__).resolve().parents[2]
PUBLIC_DIR = ROOT_DIR / "public"
OPERATIONS_DATA_PATH = PUBLIC_DIR / "data" / "operations_data.json"
COUNTRY_LABELS_PATH = PUBLIC_DIR / "data" / "country_labels.json"
# Email the small, compressed copies (email.pdf) — the full source.pdf can be
# 8-19 MB and bounces on many mail servers. email.pdf is built by
# scripts/python/build_flipbook.py; fall back to source.pdf if it hasn't been
# generated yet (run `pnpm run data:flipbooks`).
def _emailable_pdf(doc_key: str) -> Path:
    base = PUBLIC_DIR / "flipbooks" / doc_key
    email_pdf = base / "email.pdf"
    return email_pdf if email_pdf.exists() else base / "source.pdf"


# Catalog uses a single-PDF scheme (Jul 2026): the pipeline compresses each
# new catalog to <4 MB on ingest, so the shipped PDF is already email-sized.
# Success stories still keeps a separate compressed email.pdf (its source
# is full-res because the flipbook page images are rendered from it).
CATALOG_PDF_PATH = PUBLIC_DIR / "flipbooks" / "catalog" / "petromac-product-catalog.pdf"
SUCCESS_STORIES_PDF_PATH = _emailable_pdf("success-stories")

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
    # Behind cloudflared, CF-Connecting-IP is set by Cloudflare and cannot be
    # forged by the client. X-Forwarded-For is NOT trustworthy here: its
    # left-most entry is client-supplied, so keying rate limits on it lets an
    # attacker mint a fresh bucket per request. Only fall back to it (and
    # x-real-ip) for local/dev setups without the tunnel.
    cf_ip = headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    real_ip = headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    forwarded_for = headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return "unknown"


_RATE_LIMIT_PRUNE_THRESHOLD = 10_000


def check_rate_limit(key: str, limit: int, window_ms: int) -> tuple[bool, int]:
    now = time.time() * 1000
    with _rate_limit_lock:
        # The dict otherwise grows one entry per distinct client forever —
        # a slow memory leak. Prune expired windows once it gets large.
        if len(_rate_limit_state) > _RATE_LIMIT_PRUNE_THRESHOLD:
            expired = [k for k, (_, reset) in _rate_limit_state.items() if now >= reset]
            for k in expired:
                del _rate_limit_state[k]
        count, reset_at = _rate_limit_state.get(key, (0, now + window_ms))
        if now >= reset_at:
            count = 0
            reset_at = now + window_ms
        count += 1
        _rate_limit_state[key] = (count, reset_at)
        allowed = count <= limit
    retry_after = max(0, int((reset_at - now + 999) // 1000))
    return allowed, retry_after


def read_json_file(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


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


# --- Microsoft Graph email (app-only) ---
#
# Mail sends from the MAIL_SENDER shared mailbox (info@petromac.co.nz) using
# the Entra app's *application* Mail.Send permission — no SMTP, no license,
# no per-mailbox Send-As. Microsoft is retiring SMTP AUTH basic auth
# (end of Dec 2026), so this is also the long-term path. (Sending "as the
# signed-in staff member" from the kiosk would need delegated tokens
# persisted server-side — deferred; see TODO.)
GRAPH_SCOPE = "https://graph.microsoft.com/.default"
_graph_token: dict[str, object] = {"value": None, "expires_at": 0.0}
_graph_token_lock = threading.Lock()


def get_mail_sender() -> str:
    return os.getenv("MAIL_SENDER") or os.getenv("CONTACT_FROM_EMAIL") or ""


def is_email_configured() -> bool:
    return bool(
        os.getenv("ENTRA_TENANT_ID")
        and os.getenv("ENTRA_CLIENT_ID")
        and os.getenv("ENTRA_CLIENT_SECRET")
        and get_mail_sender()
    )


def verify_turnstile(token: str, remote_ip: str) -> bool:
    """Server-side Cloudflare Turnstile check. Enforced only when
    TURNSTILE_SECRET_KEY is set — dev/staging without keys keep working.
    Fails CLOSED on missing/invalid tokens, but OPEN on siteverify outages
    (a Cloudflare API blip shouldn't silence the contact form; honeypot,
    timing and rate limits still apply)."""
    secret = os.getenv("TURNSTILE_SECRET_KEY")
    if not secret:
        return True
    if not token:
        return False
    data = urllib.parse.urlencode(
        {"secret": secret, "response": token, "remoteip": remote_ip}
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        return bool(payload.get("success"))
    except Exception:
        return True


def _fetch_graph_token() -> str:
    tenant = os.getenv("ENTRA_TENANT_ID")
    data = urllib.parse.urlencode(
        {
            "client_id": os.getenv("ENTRA_CLIENT_ID", ""),
            "client_secret": os.getenv("ENTRA_CLIENT_SECRET", ""),
            "scope": GRAPH_SCOPE,
            "grant_type": "client_credentials",
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload


def get_graph_token() -> str:
    with _graph_token_lock:
        now = time.time()
        if _graph_token["value"] and now < float(_graph_token["expires_at"]):
            return str(_graph_token["value"])
        payload = _fetch_graph_token()
        token = payload["access_token"]
        # Refresh a minute before the real expiry.
        _graph_token["value"] = token
        _graph_token["expires_at"] = now + int(payload.get("expires_in", 3600)) - 60
        return token


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
    if not is_email_configured():
        raise RuntimeError(
            "Email not configured. Set ENTRA_TENANT_ID / ENTRA_CLIENT_ID / "
            "ENTRA_CLIENT_SECRET and MAIL_SENDER."
        )

    # text_body is accepted for API compatibility; Graph sends the HTML body.
    message: dict = {
        "subject": subject,
        "body": {"contentType": "HTML", "content": html_body},
        "toRecipients": [{"emailAddress": {"address": to_address}}],
    }
    if reply_to:
        message["replyTo"] = [{"emailAddress": {"address": reply_to}}]
    if attachment_name and attachment_bytes is not None:
        message["attachments"] = [
            {
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": attachment_name,
                "contentType": "application/pdf",
                "contentBytes": base64.b64encode(attachment_bytes).decode("ascii"),
            }
        ]

    sender = urllib.parse.quote(get_mail_sender())
    body = json.dumps({"message": message, "saveToSentItems": True}).encode("utf-8")
    req = urllib.request.Request(
        f"https://graph.microsoft.com/v1.0/users/{sender}/sendMail",
        data=body,
        headers={
            "Authorization": f"Bearer {get_graph_token()}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    # Graph returns 202 Accepted with an empty body on success.
    with urllib.request.urlopen(req, timeout=30):
        pass


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
    # Bound-check the RAW length before any per-element work — the model-level
    # max_length is the first line of defense, this is the second.
    if len(raw) > DEFAULT_MAX_PAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many pages selected. Max {DEFAULT_MAX_PAGES} pages allowed.",
        )
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
    areas: list[str] | None = Field(default=None, max_length=50)
    companies: list[str] | None = Field(default=None, max_length=50)
    techs: list[str] | None = Field(default=None, max_length=50)


class SendPdfRequest(BaseModel):
    email: EmailStr
    pdfType: str = Field(pattern="^(catalog|success-stories)$")
    pageNumbers: list[int] | None = Field(default=None, max_length=DEFAULT_MAX_PAGES)
    filters: FiltersModel | None = None


class SuccessStoriesPdfRequest(BaseModel):
    filters: FiltersModel | None = None
    mode: str = Field(default="download", pattern="^(preview|download)$")
    pageNumbers: list[int] | None = Field(default=None, max_length=DEFAULT_MAX_PAGES)


app = FastAPI(title="Petromac Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# The largest legitimate request is a contact-form post (~10 KB message);
# everything else is small JSON. Reject oversized bodies before FastAPI
# parses them — pydantic caps kick in only after the JSON is materialized.
MAX_REQUEST_BODY_BYTES = 64 * 1024


@app.middleware("http")
async def limit_request_body(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_REQUEST_BODY_BYTES:
                return JSONResponse({"detail": "Request body too large"}, status_code=413)
        except ValueError:
            return JSONResponse({"detail": "Invalid Content-Length"}, status_code=400)
    return await call_next(request)


@app.get("/health")
def healthcheck():
    return {"status": "ok"}


@app.get("/api/data/operations")
def get_operations_data():
    return read_json_file(OPERATIONS_DATA_PATH)


@app.get("/api/data/country-labels")
def get_country_labels():
    return read_json_file(COUNTRY_LABELS_PATH)


@app.post("/api/contact")
async def submit_contact(request: Request):
    if not is_origin_allowed(request):
        raise HTTPException(status_code=403, detail="Invalid origin")

    form = await request.form()
    name = str(form.get("name", "")).strip()
    email = str(form.get("email", "")).strip()
    message = str(form.get("message", "")).strip()
    company = str(form.get("company", "")).strip()
    try:
        timing = float(str(form.get("_timing", "0")))
    except ValueError:
        timing = 0.0

    if company:
        return {"ok": True}
    if timing < 3:
        return {"ok": True}
    # Name is optional on the form — only email + message are required.
    if len(message) < 10 or "@" not in email:
        return JSONResponse({"ok": False, "error": "Validation failed"}, status_code=400)
    # Upper bounds: keep outbound emails sane and reject junk payloads.
    if len(name) > 200 or len(email) > 320 or len(message) > 10_000:
        return JSONResponse({"ok": False, "error": "Validation failed"}, status_code=400)

    if not verify_turnstile(
        str(form.get("cf-turnstile-response", "")), get_client_ip(request.headers)
    ):
        return JSONResponse(
            {"ok": False, "error": "Verification failed. Please try again."},
            status_code=403,
        )

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

    display_name = name or "Website visitor"
    escaped_name = html.escape(display_name)
    escaped_email = html.escape(email)
    escaped_message = html.escape(message)
    send_email(
        to_address=contact_to_email,
        subject=f"Contact Form: {escaped_name}",
        text_body=f"From: {display_name} <{email}>\n\nMessage:\n{message}",
        html_body=(
            "<h2>New Contact Form Submission</h2>"
            f"<p><strong>Name:</strong> {escaped_name}</p>"
            f"<p><strong>Email:</strong> {escaped_email}</p>"
            "<p><strong>Message:</strong></p>"
            f"<p>{escaped_message.replace(chr(10), '<br>')}</p>"
        ),
        reply_to=email,
    )
    return {"ok": True}


@app.post("/api/pdf/success-stories")
async def success_stories_pdf(payload: SuccessStoriesPdfRequest, request: Request):
    if not is_origin_allowed(request):
        raise HTTPException(status_code=403, detail="Invalid origin")

    allowed, retry_after = check_rate_limit(
        f"pdf-success-stories:{get_client_ip(request.headers)}",
        PDF_RATE_LIMIT["limit"],
        PDF_RATE_LIMIT["window_ms"],
    )
    if not allowed:
        return JSONResponse(
            {"error": "Too many PDF requests. Please try again later."},
            status_code=429,
            headers={"Retry-After": str(retry_after)},
        )

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

    return {"success": True}
