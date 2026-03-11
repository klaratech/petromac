# Microsoft 365 / Entra Setup For Staff Sign-In

This guide sets up Microsoft sign-in for Petromac intranet and kiosk so staff identity can carry into kiosk-assisted workflows.

## Goal

After setup:

- team members can sign in on `/intranet`
- that signed-in identity persists into `/intranet/kiosk`
- later phases can use that identity for `send from my Outlook` workflows

## What You Are Creating

You need an **Entra app registration** for the Petromac website.

The app will:

- sign staff members in with Microsoft 365
- return them to the Petromac intranet
- later request delegated Microsoft Graph access for mailbox actions

## Phase 1 Permissions

Add these **delegated** Microsoft Graph permissions:

- `openid`
- `profile`
- `email`
- `offline_access`
- `User.Read`

## Phase 2 Permission For Send-As-Me

Add this **delegated** Microsoft Graph permission now as well, so you do not need to revisit consent later:

- `Mail.Send`

## Admin Console Steps

### 1. Open Entra Admin Center

Go to:

- [https://entra.microsoft.com](https://entra.microsoft.com)

### 2. Register The Application

Go to:

- `Applications`
- `App registrations`
- `New registration`

Use:

- **Name**: `Petromac Intranet Kiosk`
- **Supported account types**: `Accounts in this organizational directory only`

Redirect URIs:

- Platform: `Web`
- Add:
  - `https://petromac.klaratech.it/auth/microsoft/callback`
  - `http://localhost:3000/auth/microsoft/callback`

Click `Register`.

### 3. Copy The Core IDs

From the app overview page, copy:

- `Application (client) ID`
- `Directory (tenant) ID`

You will map them to:

- `ENTRA_CLIENT_ID`
- `ENTRA_TENANT_ID`

### 4. Create A Client Secret

Go to:

- `Certificates & secrets`
- `Client secrets`
- `New client secret`

Create one and copy the value immediately.

Map it to:

- `ENTRA_CLIENT_SECRET`

### 5. Add API Permissions

Go to:

- `API permissions`
- `Add a permission`
- `Microsoft Graph`
- `Delegated permissions`

Add:

- `openid`
- `profile`
- `email`
- `offline_access`
- `User.Read`
- `Mail.Send`

Then click:

- `Grant admin consent`

### 6. Optional Domain Restriction

If you want only Petromac staff emails to sign in, set:

- `STAFF_ALLOWED_EMAIL_DOMAINS=petromac.co.nz,petromac.com`

This is enforced by the app after Microsoft sign-in succeeds.

## App Environment Variables

Set these in:

- local `.env.dev`
- EC2 `/opt/petromac/.env.prod`

```env
ENTRA_TENANT_ID=your-tenant-id
ENTRA_CLIENT_ID=your-client-id
ENTRA_CLIENT_SECRET=your-client-secret
STAFF_SESSION_SECRET=a-long-random-secret-at-least-32-characters
STAFF_ALLOWED_EMAIL_DOMAINS=petromac.co.nz,petromac.com
```

Generate `STAFF_SESSION_SECRET` with something high entropy, for example:

```bash
openssl rand -base64 48
```

## Vercel

If you later expose intranet/staff sign-in via Vercel as well, add the Vercel callback URL to the same Entra app:

- `https://petromac.vercel.app/auth/microsoft/callback`

Do not add this unless you intend to run the intranet/staff flow on Vercel.

## Current App Behavior

After the env vars are set:

- `/intranet` shows a `Sign in with Microsoft` action
- successful sign-in creates a secure staff session cookie
- `/intranet/kiosk` shows the active staff identity in the kiosk shell

## Next Phase

The next implementation phase will use the Microsoft identity to support:

- `Send from my Outlook`
- mail saved in the staff member's `Sent Items`
- personal sender identity for catalog and success-story sends
