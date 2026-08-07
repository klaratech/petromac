# DNS — petromac.co.nz

Single source of truth: the **Cloudflare zone** (Rajesh's account). The
nameservers at Crazy Domains point to Cloudflare
(carol/harley.ns.cloudflare.com), so no other DNS list matters: the
panels at Crazy Domains and in ChemiCloud's cPanel are inert leftovers.
Changes are made via the dashboard or the scoped API token on
klaratech-1 (`/root/.cloudflare-token`, see the memory note). The other
Petromac admin has no Cloudflare access by design — their DNS requests
route through Rajesh.

## History (why it's like this)

- Pre-2018: hosted + DNS-managed at Crazy Domains directly.
- Until 27 Jul 2026: nameservers pointed at the hosting side
  (ns1-3.serverhostgroup.com — the platform behind the ChemiCloud
  WordPress hosting), so **the hosting side's zone was live** and the
  Crazy Domains panel was already inert (it had drifted: `portal`,
  `autoconfig`, `localhost` existed only in the panel).
- 27 Jul 2026: nameserver flip to Cloudflare for the website launch.
  The zone-import cleanup deleted non-web records it took for junk —
  athena, the ChemiCloud mail names, and two of the three SMTP2GO
  records — breaking Athena, server mail, and scan-to-email overnight.
  All were restored 28 Jul from the still-running old nameservers.
  **Lesson: non-web records are live infrastructure, never delete
  without verifying what uses them.**

## The zone, by purpose (28 Jul 2026 — 28 records)

- **Website**: apex + www → CNAME `fcb4d36c-….cfargotunnel.com`,
  proxied. Cloudflare Tunnel to klaratech-1. Do not touch.
- **Test site**: `test` → same tunnel CNAME, proxied (added 28 Jul 2026).
  Serves the staging build (containers :3016/:8013) — public for user
  feedback but noindex by build identity. See DEPLOY.md.
- **Athena**: `athena` A → 52.64.209.109 (AWS Sydney). Separate app,
  managed by the other admin. (Its LE cert renews on that box.)
- **ChemiCloud box** (172.232.197.9): `mail`, `webmail`, `cpanel`,
  `whm`, `ftp`, `webdisk`, `cpcalendars`, `cpcontacts` — all A records,
  DNS-only. Leftovers of the retired WordPress hosting. **RETIREMENT
  CLEARED, 7 Aug 2026.** The former "legacy mail service lives here /
  do not cancel" note was an INFERENCE, never a finding: during the
  28 Jul incident SMTP 587/465 and IMAP 993 answered on this box, and
  that got written up as "mailboxes are in use". cPanel answers on
  those ports on every account, occupied or not. Rajesh confirmed
  7 Aug 2026 that **no cPanel email account was ever created — company
  mail has always been Microsoft 365**, which the MX corroborates: it
  has only ever pointed at `petromac-co-nz.mail.protection.outlook.com`,
  so no inbound mail has ever reached this box. One dependency left to
  clear before cancelling — the office scanners (question 1 below).
  These eight A records get deleted with the subscription.
- **Microsoft 365 mail**: MX → petromac-co-nz.mail.protection.outlook.com;
  `autodiscover` CNAME; `selector1/2._domainkey` CNAMEs (M365 DKIM);
  SPF TXT (also authorises the ChemiCloud box, the mailchannels relay —
  cPanel's outbound path, a WordPress-era leftover — and two IPs; trim
  all of these WITH the ChemiCloud cancellation, see TODO); `_dmarc`
  (p=quarantine, reports to it@petromac.co.nz); `MS=ms87700327`
  verification TXT; legacy `default._domainkey` DKIM for the ChemiCloud
  mail service (delete with the rest).

  Current value, for reference:
  `v=spf1 +a +mx +ip4:172.232.206.251 include:relay.mailchannels.net +ip4:172.232.197.9 +ip4:161.65.142.140 +include:spf.protection.outlook.com ~all`
  → target after the trim: `v=spf1 +mx include:spf.protection.outlook.com ~all`

- **SMTP2GO** (in use — e.g. scan-to-email from devices outside the
  office): `em588925` → return.smtp2go.net, `s588925._domainkey` →
  dkim.smtp2go.net, `link` → track.smtp2go.net. Keep as a group.
- **Intune/Entra device enrollment**: `enterpriseenrollment`,
  `enterpriseregistration` CNAMEs.
- **Skype for Business (legacy)**: `lyncdiscover`, `sip` CNAMEs +
  `_sip._tls`, `_sipfederationtls._tcp` SRVs — cleanup candidates once
  confirmed unused.

Every record in the zone carries a descriptive Cloudflare comment
(added 28 Jul 2026) — what it is and, for the dangerous ones, why not to
delete it. Keep comments current when records change.

## Open verification questions (before any cleanup)

1. **Office scanners: which SMTP server is configured in them?** This is
   now the ONLY thing gating the ChemiCloud cancellation (7 Aug 2026).
   If a device reads `mail.petromac.co.nz`, repoint it at SMTP2GO
   (already live and proven for scan-to-email) or M365 first. Note that
   the 28 Jul round-1 restore brought back athena AND the mail records
   in one go, so "office printers confirmed working after round 1" does
   not isolate which record they actually needed. Worst case if the
   subscription is cancelled without checking: scan-to-email stops until
   the devices are repointed — recoverable, nothing is lost.
2. SPF: what are 172.232.206.251 and 161.65.142.140? The first sits in
   the same 172.232.x range as the ChemiCloud box, so it is most likely
   that platform's outbound IP — verify, then drop both with the rest of
   the ChemiCloud SPF terms.
3. Skype/Lync records: safe to delete?
4. SPF hygiene (noted 7 Aug 2026): the record opens with `+a +mx`. On a
   Cloudflare-**proxied** apex, `a` resolves to Cloudflare's shared proxy
   addresses, so that term authorises a range that has nothing to do with
   Petromac. Low practical risk (those proxies don't originate SMTP) but
   it is junk — drop `+a` in the same trim.

**SMTP2GO needs no SPF include here** — it sends with its own
return-path (`em588925` → return.smtp2go.net) and is DKIM-signed, so
trimming SPF down to the Microsoft include alone does NOT affect
scan-to-email. That was the fear behind the original "do not trim" note.

## Related gotchas

- Entra sign-in redirect URIs are matched character-for-character:
  `https://www.petromac.co.nz/auth/microsoft/callback` (with www) had
  to be added on 28 Jul — the apex variant alone caused AADSTS50011.
- DNSSEC: currently off everywhere (no DS at the .nz registry). Safe to
  enable later via Cloudflare (generate DS → paste at Crazy Domains).
