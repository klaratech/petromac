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
- **Athena**: `athena` A → 52.64.209.109 (AWS Sydney). Separate app,
  managed by the other admin. (Its LE cert renews on that box.)
- **ChemiCloud box** (172.232.197.9): `mail`, `webmail`, `cpanel`,
  `whm`, `ftp`, `webdisk`, `cpcalendars`, `cpcontacts` — all A records,
  DNS-only. Legacy mail service lives here. **Do not cancel the
  ChemiCloud subscription** until it's confirmed nothing sends/reads
  mail through this box (see TODO).
- **Microsoft 365 mail**: MX → petromac-co-nz.mail.protection.outlook.com;
  `autodiscover` CNAME; `selector1/2._domainkey` CNAMEs (M365 DKIM);
  SPF TXT (currently also authorises the ChemiCloud box + mailchannels
  - two unverified IPs — see TODO before trimming); `_dmarc`
    (p=quarantine, reports to it@petromac.co.nz); `MS=ms87700327`
    verification TXT; legacy `default._domainkey` DKIM for the
    ChemiCloud mail service.
- **SMTP2GO** (in use — e.g. scan-to-email from devices outside the
  office): `em588925` → return.smtp2go.net, `s588925._domainkey` →
  dkim.smtp2go.net, `link` → track.smtp2go.net. Keep as a group.
- **Intune/Entra device enrollment**: `enterpriseenrollment`,
  `enterpriseregistration` CNAMEs.
- **Skype for Business (legacy)**: `lyncdiscover`, `sip` CNAMEs +
  `_sip._tls`, `_sipfederationtls._tcp` SRVs — cleanup candidates once
  confirmed unused.

## Open verification questions (before any cleanup)

1. Office scanners: which SMTP server is configured in them?
2. SPF: what are 172.232.206.251 and 161.65.142.140?
3. Skype/Lync records: safe to delete?

## Related gotchas

- Entra sign-in redirect URIs are matched character-for-character:
  `https://www.petromac.co.nz/auth/microsoft/callback` (with www) had
  to be added on 28 Jul — the apex variant alone caused AADSTS50011.
- DNSSEC: currently off everywhere (no DS at the .nz registry). Safe to
  enable later via Cloudflare (generate DS → paste at Crazy Domains).
