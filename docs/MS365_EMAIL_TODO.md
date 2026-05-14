# MS365 Email TODO

Use one Microsoft 365 mailbox as the SMTP sender for:
- Contact form emails
- Catalog PDF emails
- Success Stories PDF emails

## Microsoft 365

1. Pick the sending mailbox.
2. Make sure the mailbox exists and can send mail.
3. In Microsoft 365 Admin Center, enable `Authenticated SMTP` for that mailbox.
4. If MFA is enabled on the mailbox, create an app password.
5. If your tenant blocks SMTP AUTH globally, enable SMTP AUTH for the tenant or use a mailbox exempted for SMTP AUTH.

Recommended sender:

```text
info@petromac.co.nz
```

## App Env

Historical checklist. For current setup, prefer [EMAIL_SETUP.md](EMAIL_SETUP.md).

Set these in local `.env.dev` and production `/root/apps/petromac/.env-backend`:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=info@petromac.co.nz
SMTP_PASS=your-ms365-password-or-app-password
CONTACT_FROM_EMAIL=info@petromac.co.nz
CONTACT_TO_EMAIL=info@petromac.co.nz
ALLOWED_ORIGINS=https://petromac.klaratech.it
ALLOWED_EMAIL_DOMAINS=petromac.com,petromac.co.nz
ALLOWED_EMAIL_RECIPIENTS=info@petromac.co.nz,marketing@petromac.co.nz
```

## What Each Setting Does

- `SMTP_*`: SMTP login used by all outbound mail.
- `CONTACT_FROM_EMAIL`: visible sender address.
- `CONTACT_TO_EMAIL`: inbox that receives contact form submissions.
- `ALLOWED_ORIGINS`: allowed website origin for email endpoints.
- `ALLOWED_EMAIL_DOMAINS`: who can receive PDF emails by domain.
- `ALLOWED_EMAIL_RECIPIENTS`: explicit PDF recipient allowlist.

## Behavior In This App

- Contact form:
  sends to `CONTACT_TO_EMAIL`
- Catalog PDF email:
  sends to the address entered by the user, but only if the allowlist permits it
- Success Stories PDF email:
  same behavior as catalog PDF email

## Quick Test

1. Restart the app after updating env vars.
2. Submit the contact form and confirm the message reaches `CONTACT_TO_EMAIL`.
3. Send a catalog PDF to an allowed address.
4. Send a success stories PDF to an allowed address.
5. Check EC2 logs if a send fails:

```bash
docker logs --tail 120 petromac-backend
```

## Common MS365 Failure Points

- SMTP AUTH disabled on the mailbox
- MFA enabled but no app password used
- Wrong sender mailbox in `SMTP_USER`
- Wrong port or host
- Recipient domain not included in `ALLOWED_EMAIL_DOMAINS`
