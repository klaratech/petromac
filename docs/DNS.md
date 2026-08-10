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

## The zone, by purpose — 17 records (cleanup completed 10 Aug 2026)

Was 30 at the account migration. Removed the same day: six ChemiCloud
cPanel A records, `mail` + `webmail`, the legacy `default._domainkey`,
and four dead Skype/Lync records — 13 in all, plus the SPF trim.

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
- **ChemiCloud box** (172.232.197.9) — **ALL GONE, 10 Aug 2026.** The
  eight A records (`mail`, `webmail`, `cpanel`, `whm`, `ftp`, `webdisk`,
  `cpcalendars`, `cpcontacts`) and the legacy `default._domainkey` DKIM
  were deleted with the subscription cancellation. Kept here only for
  the lesson: the "legacy mail service lives here / do not cancel" note
  was an INFERENCE, never a finding. During the 28 Jul incident SMTP
  587/465 and IMAP 993 answered on that box and got written up as
  "mailboxes are in use" — but it is SHARED cPanel hosting and answers
  on those ports for every account, occupied or not. No cPanel mailbox
  was ever created, and the MX has only ever pointed at
  `petromac-co-nz.mail.protection.outlook.com`, so no inbound mail ever
  reached it. **Open ports are not evidence of use.**
- **Microsoft 365 mail**: MX → petromac-co-nz.mail.protection.outlook.com;
  `autodiscover` CNAME; `selector1/2._domainkey` CNAMEs (M365 DKIM);
  SPF TXT; `_dmarc` (p=quarantine, reports to it@petromac.co.nz);
  `MS=ms87700327` verification TXT.

  **SPF, trimmed 10 Aug 2026** — current value:
  `v=spf1 +mx +ip4:161.65.142.140 include:spf.protection.outlook.com ~all`

  Was:
  `v=spf1 +a +mx +ip4:172.232.206.251 include:relay.mailchannels.net +ip4:172.232.197.9 +ip4:161.65.142.140 +include:spf.protection.outlook.com ~all`

  Dropped `+a` (on a proxied apex it authorises Cloudflare's shared
  proxy range), both ChemiCloud IPs, and the mailchannels relay.
  **`ip4:161.65.142.140` is the HQ office IP and must never be removed** —
  it is what lets the HQ printers, which send direct from the office,
  pass SPF. Take it out and their mail keeps "sending" while landing in
  recipients' quarantine, with no bounce and no error.

  The trim was not just tidying. Those three entries were **shared
  infrastructure**: a shared cPanel box, a shared Milan reseller box and
  a shared outbound relay. An `ip4:`/`include:` for shared infrastructure
  authorises every other tenant on it to send as `@petromac.co.nz` and
  pass SPF — a live spoofing surface on a domain whose DMARC quarantines.
  That, plus the change being one reversible TXT edit with DMARC already
  reporting to it@, is why it was done immediately rather than staged.

- **SMTP2GO — Steve's home scanner** (the specific dependency; named
  here because "devices outside the office" was too vague to act on):
  `em588925` → return.smtp2go.net, `s588925._domainkey` →
  dkim.smtp2go.net, `link` → track.smtp2go.net. Keep as a group — the
  July round-2 incident was exactly these CNAMEs being deleted, which
  stopped that scanner sending with nothing pointing at DNS as the cause.
  `em588925` is the load-bearing one: SMTP2GO sends with its own
  return-path, which is why this scanner needs no SPF entry at all, and
  the DKIM record can look perfectly healthy while the return-path record
  is missing and nothing works.
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

## Verification questions — all resolved (10 Aug 2026)

Kept because the reasoning matters more than the answers.

1. **Which SMTP server do the office scanners use?** Resolved from two
   directions without ever opening a printer. There were always TWO
   scan-to-email paths, which is why this looked ambiguous for so long:
   **Steve's home scanner** goes via SMTP2GO (own return-path, needs no
   SPF entry), and the **HQ printers** depend on `ip4:161.65.142.140` —
   which is only meaningful if they send DIRECT from the office IP. A
   printer relaying through `mail.petromac.co.nz` would have needed
   `ip4:172.232.197.9` to matter instead, and the IT contact named the HQ
   IP as the one that counts. So neither path touched the ChemiCloud box.

   Why it stayed open so long: the 28 Jul round-1 restore brought back
   `mail`/`webmail` alongside everything else, so "office printers
   confirmed working after round 1" proved they worked _with_ those
   records present, not that they needed them. A confirming scan from an
   HQ printer is still worth doing — as confirmation, not as a gate.

2. ~~What are 172.232.206.251 and 161.65.142.140?~~ **Answered by reverse
   DNS, and the original guess was WRONG** — worth remembering, because
   the guess would have broken office mail:
   - `172.232.206.251` → `rs-mil.serverhostgroup.com`, ChemiCloud's Milan
     box. Removed.
   - `161.65.142.140` → `default-rdns.vocus.co.nz`, a NZ ISP. **The HQ
     office IP.** The earlier plan filed it with the ChemiCloud terms on
     the assumption that a similar-looking address meant similar
     ownership. Address ranges are not evidence of ownership; reverse DNS
     is.

3. ~~Skype/Lync records safe to delete?~~ Yes, all four — targets were
   NXDOMAIN. Deleted 10 Aug 2026.

4. ~~SPF opens with `+a +mx`~~ — `+a` dropped in the 10 Aug trim.

**SMTP2GO needs no SPF include** — it sends with its own return-path
(`em588925` → return.smtp2go.net) and is DKIM-signed. That is why
trimming SPF could not affect Steve's scanner, and it was the fear behind
the original "do not trim" note.

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
