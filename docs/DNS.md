# DNS — petromac.co.nz

Single source of truth: the **Cloudflare zone in the company account**
`it@petromac.co.nz` (account id `43946db6e32f3f8ba31aa5bbabbb83d0`),
migrated there from Rajesh's personal account on **10 Aug 2026**.
Nameservers at Crazy Domains are `mina.ns.cloudflare.com` +
`rudy.ns.cloudflare.com` (they were carol/harley before the migration —
a zone move between accounts reassigns them, which is why the registrar
had to be touched at all).

The registrar's own "DNS Settings" tab is now **empty** (10 Aug 2026).
It previously held a 28-record fossil of the WPEngine/HostGator era that
no resolver ever consulted. It was emptied deliberately: had delegation
ever returned to the registrar, that zone would have served dead
HostGator IPs and an old SPF missing the HQ office IP — printers
quarantined, site on 2019 infrastructure, all silently. An empty zone
fails loudly instead. **Only the Name Servers tab there matters now, and
it must keep reading mina + rudy.**

Changes are made via the dashboard or the scoped API token at
`/root/.cloudflare-token` on klaratech-1 (reissued in the company account
10 Aug 2026; the previous one was scoped to the personal account and died
with the migration). Zone ID `abfdf2f79af48877bb5b2bac2f5f684e`. Three
things about that token that cost time if you don't know them:

- It is **account-owned**, so it lives under _Manage Account → API
  Tokens_, NOT _My Profile → API Tokens_. Deliberate: it belongs to
  Petromac rather than to Rajesh's login.
- It is **IP-locked to klaratech-1's IPv4 AND IPv6** (46.225.75.202 and
  2a01:4f8:c2c:335d::1). Anywhere else gets error 9109 "Cannot use the
  access token from location". Both are listed because the box is
  dual-stack and prefers IPv6 outbound — with only the IPv4 listed,
  every call failed.
- **Test it with a zone query, never `/user/tokens/verify`** — that
  endpoint is for user tokens and always returns `success:false` for an
  account-owned one, which reads as a broken token but isn't.

It is scoped to this zone only and deliberately does NOT cover the
Cloudflare Tunnel or Web Analytics, which are account-level: a leak
cannot take the website down. The tunnel's own token is a separate
secret at `/etc/cloudflared/petromac-token.env`. The other Petromac
admin's DNS requests still route through Rajesh.

## History (why it's like this)

- Pre-2018: hosted + DNS-managed at Crazy Domains directly.
- Until 27 Jul 2026: nameservers pointed at the hosting side
  (ns1-3.serverhostgroup.com — the platform behind the ChemiCloud
  WordPress hosting), so **the hosting side's zone was live** and the
  Crazy Domains panel was already inert (it had drifted: `portal`,
  `autoconfig`, `localhost` existed only in the panel).
- 10 Aug 2026: **zone migrated to the company Cloudflare account**
  (it@petromac.co.nz). A move between accounts is a delete-and-re-add, so
  the nameservers changed (carol/harley → mina/rudy) and the registrar
  had to be updated. The registrar's dormant DNS zone was emptied the
  same day. Two traps this surfaced, both now in the record: Cloudflare
  Tunnel records are **account-scoped**, so a new tunnel had to exist on
  klaratech-1 before the swap (see DEPLOY.md); and a
  `*.cfargotunnel.com` CNAME **only routes when PROXIED** — served
  DNS-only it resolves to nothing at all, because that hostname has no
  public A record.
- 27 Jul 2026: nameserver flip to Cloudflare for the website launch.
  The zone-import cleanup deleted non-web records it took for junk —
  athena, the ChemiCloud mail names, and two of the three SMTP2GO
  records — breaking Athena, server mail, and scan-to-email overnight.
  All were restored 28 Jul from the still-running old nameservers.
  **Lesson: non-web records are live infrastructure, never delete
  without verifying what uses them.**

## The zone, by purpose (30 records; audited 28 Jul, re-verified at the

## 10 Aug 2026 account migration)

**Pending cleanup:** 11 of these are queued for deletion (the four dead
Skype/Lync records, the six ChemiCloud cPanel A records, and the legacy
`default._domainkey`), taking the zone to 19. `mail` and `webmail` are
deliberately NOT in that list until someone reads the SMTP host out of an
office printer — see question 1 below.

- **Website**: apex + www → CNAME `d2265986-….cfargotunnel.com`,
  **proxied** (tunnel `petromac-prod` in the company account; the
  pre-migration tunnel was `fcb4d36c-…` in the personal account). Do not
  touch — and in particular never set these DNS-only, which takes the
  site down instantly and completely.
- **Test site**: `test` → same tunnel CNAME, proxied (added 28 Jul 2026;
  repointed at the new tunnel 10 Aug 2026).
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
  → target after the trim (CORRECTED 10 Aug 2026 — keeps the HQ IP):
  `v=spf1 +mx +ip4:161.65.142.140 include:spf.protection.outlook.com ~all`

  The earlier target dropped `+ip4:161.65.142.140` along with the
  ChemiCloud terms, on the assumption it was another ChemiCloud address.
  It is not: reverse DNS puts it on Vocus NZ, and it is the HQ office
  IP (question 2 below). SMTP2GO covers devices sending from OUTSIDE the
  office with its own return-path and DKIM; it does nothing for a device
  sending direct from the office, which is what this term authorises.

- **SMTP2GO** (in use — e.g. scan-to-email from devices outside the
  office): `em588925` → return.smtp2go.net, `s588925._domainkey` →
  dkim.smtp2go.net, `link` → track.smtp2go.net. Keep as a group.
- **Intune/Entra device enrollment**: `enterpriseenrollment`,
  `enterpriseregistration` CNAMEs.
- **Search Console verification**: apex TXT
  `google-site-verification=m10EeI5HB9Fett6Js7GL60fuhOhJ4UKx-OXA36Xw2Zg`.
  **DO NOT DELETE — this record IS the verification** for both Search
  Console properties; deleting it silently unverifies them and reporting
  stops. It was missing from this inventory until the 7 Aug 2026 audit
  found it in the zone, which is precisely how the 27 Jul incident
  happened: an undocumented live record read as junk by a cleanup.
- **Skype for Business (legacy)**: `lyncdiscover`, `sip` CNAMEs +
  `_sip._tls`, `_sipfederationtls._tcp` SRVs — **DEAD, safe to delete
  (confirmed 7 Aug 2026)**. `webdir.online.lync.com` and
  `sipdir.online.lync.com` both return NXDOMAIN, so `lyncdiscover`, `sip`
  and `_sip._tls` are dangling. `_sipfederationtls._tcp` →
  `sipfed.online.lync.com` still resolves, but with no Skype/SfB
  deployment it does nothing. No takeover risk (Microsoft owns lync.com);
  delete all four as housekeeping.
- **CAA**: none. Any CA may currently issue for petromac.co.nz. Cheap
  hardening whenever someone is in the dashboard anyway — see TODO.

Every record in the zone carries a descriptive Cloudflare comment
(added 28 Jul 2026) — what it is and, for the dangerous ones, why not to
delete it. Keep comments current when records change.

**Audited 7 Aug 2026** — 156 candidate subdomains swept plus every record
type on the apex. Result: no strays beyond the two items now listed above
(the undocumented Search Console TXT, and the dead Lync records); every
non-Lync CNAME resolves, so there is no subdomain-takeover exposure; and
`portal` / `autoconfig` / `localhost` do NOT resolve, confirming that the
WordPress-era drift only ever existed in the inert Crazy Domains panel.
Caveat on method: this was DNS probing, not a zone dump — Certificate
Transparency was not reachable from that environment, so a record whose
name matched none of the 156 probes would not have surfaced. **The
Cloudflare dashboard is still the authoritative list.**

## Open verification questions (before any cleanup)

1. **Office scanners: which SMTP server is configured in them?** Largely
   answered 10 Aug 2026: the IT contact says what the HQ printers need is
   the SPF `ip4` term for the HQ IP (161.65.142.140), i.e. they send
   direct from the office rather than through `mail.petromac.co.nz`. That
   unblocks the ChemiCloud cancellation, but does NOT license the SPF trim
   as originally written — see question 2. Still worth reading the SMTP
   host out of one printer's config to confirm it is not
   `mail.petromac.co.nz`, since that is a 30-second check that removes the
   last doubt. Was the ONLY thing gating the cancellation (7 Aug 2026).
   If a device reads `mail.petromac.co.nz`, repoint it at SMTP2GO
   (already live and proven for scan-to-email) or M365 first. Note that
   the 28 Jul round-1 restore brought back athena AND the mail records
   in one go, so "office printers confirmed working after round 1" does
   not isolate which record they actually needed. Worst case if the
   subscription is cancelled without checking: scan-to-email stops until
   the devices are repointed — recoverable, nothing is lost.
2. ~~SPF: what are 172.232.206.251 and 161.65.142.140?~~ **ANSWERED
   10 Aug 2026 by reverse DNS — and the guess in the second half of this
   question was WRONG, so read the correction:**
   - `172.232.206.251` → PTR `rs-mil.serverhostgroup.com`. ChemiCloud's
     own platform (`serverhostgroup.com` is the host behind the
     WordPress account), a Milan reseller box. This is what made it look
     "registered in Italy" — it is NOT ours; klaratech-1 is Hetzner.
     **Drop it with the ChemiCloud trim.**
   - `161.65.142.140` → PTR `default-rdns.vocus.co.nz`, a New Zealand
     ISP. **This is the HQ office IP, and it must STAY in SPF.** The IT
     contact confirmed it 10 Aug 2026 and called it the record that
     matters for the HQ printers. This question originally said to
     "drop both with the rest of the ChemiCloud SPF terms", which would
     have stopped mail from every device sending direct from the office.
3. ~~Skype/Lync records: safe to delete?~~ **ANSWERED 7 Aug 2026: yes,
   all four — their targets are NXDOMAIN.** See the zone list above.
4. SPF hygiene (noted 7 Aug 2026): the record opens with `+a +mx`. On a
   Cloudflare-**proxied** apex, `a` resolves to Cloudflare's shared proxy
   addresses, so that term authorises a range that has nothing to do with
   Petromac. Low practical risk (those proxies don't originate SMTP) but
   it is junk — drop `+a` in the same trim.

**SMTP2GO needs no SPF include here** — it sends with its own
return-path (`em588925` → return.smtp2go.net) and is DKIM-signed, so
trimming SPF down to the Microsoft include alone does NOT affect
scan-to-email. That was the fear behind the original "do not trim" note.

## Cloudflare Tunnel — what the DNS records depend on (10 Aug 2026)

The three website records are not ordinary CNAMEs; they are the DNS half
of a Cloudflare Tunnel, and two properties of tunnels bite hard:

1. **Tunnels are account-scoped.** A `<id>.cfargotunnel.com` hostname
   only resolves inside the account that owns the tunnel. Moving the zone
   to another account does NOT bring the tunnel with it, so a new tunnel
   had to be created in the company account and a second `cloudflared`
   installed on klaratech-1 before the nameserver swap.
2. **They only route when PROXIED.** `cfargotunnel.com` hostnames have no
   public A record, so a DNS-only tunnel record hands the client a name it
   cannot connect to. This happened on 10 Aug: the three records were
   observed serving the bare CNAME on an authoritative query and the site
   was unreachable; with the orange cloud on they return flattened
   anycast (104.21.x / 172.67.x) and no CNAME at all.

**How to check proxy status properly** — `dig @mina.ns.cloudflare.com <host> A`.
Flattened anycast + no CNAME = proxied and correct. A bare
`*.cfargotunnel.com` CNAME = DNS-only and broken. Do NOT diagnose this from
`curl` alone: during the same migration, a stale local resolver entry and
Tailscale MagicDNS (`100.100.100.100`) each produced convincing false
"site is down" readings on a machine where the site was in fact fine. If
`dig` succeeds and `curl` fails, suspect your own egress first, and check
the Cloudflare **Audit Log** to see whether a record actually changed.

**On klaratech-1 there are now TWO cloudflared services** (see DEPLOY.md):
the original `cloudflared.service`, which still fronts n8n.thatha.online,
antra.group, trailandtide.it and klaratech.it and must keep running; and
`cloudflared-petromac.service` for the new tunnel. Never run
`cloudflared service install` on that box — it overwrites the original
unit and takes all of those domains down together.

## Related gotchas

- Entra sign-in redirect URIs are matched character-for-character:
  `https://www.petromac.co.nz/auth/microsoft/callback` (with www) had
  to be added on 28 Jul — the apex variant alone caused AADSTS50011.
- DNSSEC: currently off everywhere (no DS at the .nz registry). Safe to
  enable later via Cloudflare (generate DS → paste at Crazy Domains).
