# Microsoft 365 / Entra Setup For Staff Sign-In

> **Status: DONE (Jul 2026).** App "Petromac Intranet" is registered and live in
> production; `/intranet` is gated behind sign-in. This guide remains as the
> runbook for re-setup or secret rotation. Server config lives in
> `/root/apps/petromac/.env-frontend`; the tunnel needs the `/api/staff/.*`
> ingress exception (see DEPLOY.md).

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
  - `https://www.petromac.co.nz/auth/microsoft/callback`
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

Create one and copy the **Value** immediately (shown once; the "Secret ID"
column is just a reference identifier, not the credential).

Map it to:

- `ENTRA_CLIENT_SECRET`

> Current secret (created Jul 2026, 24-month expiry ≈ Jul 2028): stored in
> 1Password as secure note **"Petromac Entra Client Secret"**. Set a renewal
> reminder — sign-in fails silently when the secret expires; create a new
> secret here and update `ENTRA_CLIENT_SECRET` on the server.

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
- production `/root/apps/petromac/.env-frontend`

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

---

# Other Entra app registrations in the Petromac tenant

There is now more than one. **They are deliberately separate, and the reason
matters more than the list.** An app registration is one identity: its redirect
URIs, its secret and its permissions are shared by everything that uses it. Two
apps on one registration means a secret rotation on one takes the other down, a
new Graph scope for one grants it to both, and you cannot revoke one party's
access without breaking the other.

| Registration                              | Serves                                                                    | Auth style                | Secret?                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------- |
| `Petromac App` (a.k.a. Petromac Intranet) | The website — `/intranet` staff sign-in **and** send-as-me mail via Graph | Web (confidential client) | **Yes** — 1Password "Petromac Entra Client Secret", expires ~Jul 2028 |
| `Athena Test`                             | Athena TEST, built by the external dev team                               | SPA + PKCE                | **No** — none needed, none created                                    |
| `Athena Prod`                             | Athena PRODUCTION at `athena.petromac.co.nz`                              | SPA + PKCE                | **No**                                                                |

## Athena (added 10 Aug 2026)

The dev team originally asked for the WEBSITE's client ID and tenant ID, having
found `Petromac App` in the portal. They were given a separate registration
instead.

- **Name**: `Athena Test`
- **Supported account types**: `My organization only` (single tenant).
  NOTE the website's registration is set to _All Microsoft account users_,
  which is looser than this guide's own instruction above. It is not currently
  exploitable — `STAFF_ALLOWED_EMAIL_DOMAINS` rejects non-Petromac accounts
  after authentication (`src/lib/auth/entra.ts`) — but it is a weaker outer
  door than intended and worth tightening.
- **Platform**: `Single-page application`, redirect URI
  `https://test.athena.digitaltwins.com.bo/assets/auth/blank.html`
- **Implicit grant**: both boxes left UNCHECKED, deliberately. SPA + PKCE uses
  the authorization code flow; ticking "Access tokens" / "ID tokens" opts into
  the deprecated implicit flow. Old tutorials still tell you to tick them.
- **Delegated Graph permissions**: `openid`, `profile`, `email`, `User.Read`,
  `offline_access`. Admin consent granted, so staff get no consent prompt.
  **No `Mail.Send`** — the website has it because it sends PDFs as the
  signed-in user; Athena has no reason to, and it is the permission that makes
  a leaked credential expensive.
- **`offline_access` is not optional padding.** SPAs need refresh tokens now
  that browsers block third-party cookies — the old hidden-iframe silent
  renewal fails, and without it users are re-prompted constantly.
- **No client secret.** PKCE, so there is nothing to store or rotate. If a
  future change needs a confidential client, create the secret on the ATHENA
  registration, never reuse the website's.

### Athena Prod (registered 10 Aug 2026)

Same shape as `Athena Test` — single tenant, SPA + PKCE, no secret — with one
difference that is the whole point of registering it separately:

- **Redirect URI**: `https://athena.petromac.co.nz/assets/auth/blank.html`

Production stays on the PETROMAC domain. Test runs on the dev team's own
`digitaltwins.com.bo`, which is fine for test, but a production login that
round-trips through a vendor's domain is a different security posture.
`athena.petromac.co.nz` was already live (A → 52.64.209.109, AWS Sydney) when
this was registered, so nothing had to move — the point is that it STAYS there.

**Watch the path, not just the host.** Redirect URIs match character for
character, so the bare origin `https://athena.petromac.co.nz` does NOT match
`https://athena.petromac.co.nz/assets/auth/blank.html`. The prod registration
was initially created with the bare origin and corrected before use; the
symptom would have been `AADSTS50011`.

Two registrations rather than one shared across environments means test and
production hold different credentials, and the dev team need not hold a
production one long-term.

### `domitila@petromac.co.nz` — the dev team's identity

An **unlicensed** member account created 10 Aug 2026 so the Athena developers
can test the sign-in flow end to end.

- **Unlicensed is free.** A licence buys a mailbox and Office apps; the identity
  itself costs nothing. It has no mailbox — set alternate contact info and MFA
  at first sign-in or the account cannot be recovered.
- First sign-in / password change / MFA enrolment: `https://myaccount.microsoft.com`.
  Do NOT send them `portal.office.com` — with no licence there is nothing there
  and it errors confusingly.
- It is the **owner** of `Athena Test` and `Athena Prod`, so the dev team can
  add redirect URIs and settings without an admin. Owners can also create
  secrets and add owners; they CANNOT grant admin consent, which is the brake.
- Preferred over making the developers' personal accounts owners. Gonzalo and
  Eloy were in the directory as guests on personal gmail/hotmail addresses;
  a personal-address guest is not offboarded when someone changes jobs, and a
  tenant account you control can be reset or disabled in one action.

**Two consequences to keep in view:**

1. **It is a `@petromac.co.nz` account, so it can also sign in to the website's
   `/intranet`** — including `/intranet/kiosk/datacheck`, which serves the full
   33-column operations dataset. The site gates on email DOMAIN
   (`STAFF_ALLOWED_EMAIL_DOMAINS`, `src/lib/auth/entra.ts`), not on a user list.
   That is a side effect of the domain check rather than a decision. To narrow
   it: _Enterprise applications → Petromac App → Properties → Assignment
   required: Yes_, then assign actual staff.
2. **It is shared**, so sign-in logs attribute everything to `domitila` rather
   than to a person. Accepted trade for a small vendor team; worth revisiting if
   the team grows.

**Consent settings that make the "admin consent" promise true.** The dev team
was told new permissions still require admin consent. That holds because
_Enterprise applications → Consent and permissions → User consent settings_ is
set to **"Allow user consent for apps from verified publishers, for selected
permissions"** — users can self-consent only to the 5 low-impact scopes
(`openid`, `profile`, `email`, `offline_access`, `User.Read`), which is exactly
what Athena already has. Anything beyond that needs an admin. If that setting
is ever moved to the unrestricted option, the promise silently stops being true.

### Owners

Ownership of `Athena Test` and `Athena Prod` is held by
**`domitila@petromac.co.nz`**, not by the developers' personal accounts —
see above for why. Giving the dev team ownership at all is reasonable:
they are building it, and it saves a round trip for every redirect-URI change.
Know what it grants: an owner can add redirect URIs, add permissions, create
client secrets, add further owners, and delete the app. They CANNOT grant admin
consent (that needs an admin role), which is the main brake.

Two rules:

1. **Never add them to `Petromac App`.** That one holds `Mail.Send` and a live
   secret.
2. **Remove them when the engagement ends.** Owner access outlives a contract
   unless someone takes it away.

Also add a second INTERNAL owner to every registration. An app owned by one
person becomes unmanageable when that account goes — the same lesson already
recorded for Search Console properties in the Tech Standards vault.
