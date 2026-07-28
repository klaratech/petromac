# Email Setup (Microsoft Graph)

All outbound mail — contact form + catalog/success-stories PDF sends — goes
through **Microsoft Graph** using the Entra app's **application** `Mail.Send`
permission. It sends **as the shared mailbox** `info@petromac.co.nz` (and
saves to its Sent Items). No SMTP, no mailbox password, no license.

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
# PDF-email recipient allowlist (unset => only CONTACT_TO_EMAIL allowed):
ALLOWED_EMAIL_DOMAINS=petromac.co.nz,petromac.com
# ALLOWED_EMAIL_RECIPIENTS=info@petromac.co.nz,marketing@petromac.co.nz
```

Then `cd /root/apps/petromac && docker compose up -d`.

## What each endpoint does

- **Contact form** (`/api/contact`): delivers to `CONTACT_TO_EMAIL`; the
  submitter's address goes in `Reply-To`.
- **Catalog / Success-stories PDF email** (`/api/email/send-pdf`,
  `/api/pdf/success-stories`): sends to the address the user entered, only if
  the recipient allowlist permits it.

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

## Future: send as the signed-in staff member (kiosk)

Deferred. Sending kiosk emails as the signed-in staffer (rather than `info@`)
needs their _delegated_ Graph token persisted + refreshed server-side. The
app already reserved `Mail.Send` _delegated_ for this. See TODO.md.
