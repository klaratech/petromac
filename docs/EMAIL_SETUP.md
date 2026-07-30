# Email Setup (Microsoft Graph)

All outbound mail — contact form + catalog/success-stories PDF sends — goes
through **Microsoft Graph**. No SMTP, no mailbox password, no license. There are
two sending identities:

- **As the shared mailbox `info@petromac.co.nz`** — the Entra app's
  **application** `Mail.Send` permission, saved to that mailbox's Sent Items.
  This is the public site's path and the fallback everywhere.
- **As the signed-in staff member** — `/api/staff/send-pdf` (a Next route, not
  the FastAPI backend) posts to Graph `/me/sendMail` with the **delegated**
  token captured at Microsoft sign-in, so a PDF a staffer emails from the kiosk
  comes from them and lands in their Sent Items. Falls back to `info@` when
  there is no staff session. See the "signed-in staff member" section below.

Why Graph (not SMTP): `info@` is a shared mailbox (can't do SMTP AUTH), and
Microsoft is retiring SMTP AUTH basic auth by end of Dec 2026 anyway. See
[DECISIONS.md](DECISIONS.md).

## One-time admin step (Entra portal)

The "Petromac Intranet" app already exists (staff sign-in). Add mail sending:

1. https://entra.microsoft.com → **Applications → App registrations →
   Petromac Intranet → API permissions**
2. **Add a permission → Microsoft Graph → Application permissions** (NOT
   Delegated) → search **`Mail.Send`** → add
3. **Grant admin consent for PETROMAC LTD** → confirm (green checks)

That's the entire Microsoft-side setup. Nothing in the M365 admin center,
no app password, no new user.

## Server environment (`/root/apps/petromac/.env-backend`)

The backend needs the Entra app credentials (same app as staff sign-in) plus
the sender/recipient config:

```env
ENTRA_TENANT_ID=<tenant id>
ENTRA_CLIENT_ID=<client id>
ENTRA_CLIENT_SECRET=<client secret>   # same secret as the frontend uses
MAIL_SENDER=info@petromac.co.nz       # mailbox mail is sent as
CONTACT_TO_EMAIL=info@petromac.co.nz  # where contact-form mail is delivered
ALLOWED_ORIGINS=https://www.petromac.co.nz,https://petromac.co.nz
# PDF-email recipient allowlist (unset => only CONTACT_TO_EMAIL allowed).
# `*` allows ANY domain — required for the public site, where visitors ask for
# the catalog at their own company address. Turnstile is what keeps that from
# being an open relay, so do not widen this without it.
ALLOWED_EMAIL_DOMAINS=*
# ALLOWED_EMAIL_RECIPIENTS=info@petromac.co.nz,marketing@petromac.co.nz
TURNSTILE_SECRET_KEY=<from the Cloudflare Turnstile widget>
```

Then `cd /root/apps/petromac && docker compose up -d`.

## What each endpoint does

- **Contact form** (`/api/contact`): delivers to `CONTACT_TO_EMAIL`; the
  submitter's address goes in `Reply-To`. Requires a valid **Cloudflare
  Turnstile** token.
- **PDF email** (`/api/email/send-pdf`): sends to the address the user entered,
  only if the recipient allowlist permits it. Also **Turnstile-verified** — it
  is a public endpoint that emails an attachment to an arbitrary address, so it
  needs the same bot gate as the contact form.
- **`/api/pdf/success-stories`**: builds the filtered success-stories PDF
  (extracts the selected pages and wraps them in the publication's own cover and
  back page). No Turnstile — it returns the file to the caller rather than
  emailing anyone.

Turnstile verification no-ops when `TURNSTILE_SECRET_KEY` is unset, which is how
local dev works. Client side, the widget is warmed on first interaction with the
form rather than on page load — see `TurnstileWidget.tsx`, which documents why
(page weight, and a hidden container deadlocks the challenge).

## How it works (code)

`backend/app/main.py` → `send_email()`:

1. `get_graph_token()` — client-credentials token (cached ~1 h) from
   `login.microsoftonline.com/{tenant}/oauth2/v2.0/token`, scope
   `https://graph.microsoft.com/.default`.
2. `POST https://graph.microsoft.com/v1.0/users/{MAIL_SENDER}/sendMail` with
   the HTML body + optional base64 PDF attachment, `saveToSentItems: true`.

## Verify / troubleshoot

Test on the server:

```bash
ssh klaratech-1 "docker logs --tail 120 petromac-backend"
```

- **AADSTS errors on token fetch** → wrong `ENTRA_*` values, or the client
  secret expired (rotate in the Entra app; 1Password note "Petromac Entra
  Client Secret").
- **403 `ErrorAccessDenied` on sendMail** → the `Mail.Send` _application_
  permission isn't consented (redo the admin step above), or `MAIL_SENDER`
  isn't a real mailbox in the tenant.
- **Contact form returns "not configured"** → `CONTACT_TO_EMAIL` unset.

## Send as the signed-in staff member — BUILT (Jul 2026)

`src/app/api/staff/send-pdf/route.ts` sends via Graph `/me/sendMail` using the
delegated token from the staff sign-in, falling back to `info@` when there is no
session. Requires `Mail.Send` **delegated** on the Entra app (alongside the
application permission above).

The delegated refresh token lives in an encrypted `petromac_staff_rt` httpOnly
cookie (`src/lib/auth/staffAuth.ts`), NOT in server memory. It used to be an
in-process store, which silently signed everyone out on every deploy and made
staff sends fall back to `info@` — the bug that looked like "the email says it
sends from info@ even though I'm logged in".
