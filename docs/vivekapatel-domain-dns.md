# Exact DNS Backup For `vivekapatel.com`

## Review Result

- A review sub-agent checked the screenshot against the browser-extracted DNS list.
- No mismatch was found in the screenshot-visible records.
- The screenshot only shows part of the DNS list, so this document uses the full browser-extracted DNS table below as the source of truth.
- Do not click **Reset DNS records**.

## DNS Records Baseline

| Type | Name | Priority | Content | TTL |
|---|---|---:|---|---:|
| CNAME | `protonmail._domainkey` | 0 | `protonmail.domainkey.dmuz5dbu7zxykgsukfzvie2wzb3i5tawc2ypvbk3uuuwqdmgoap2a.domains.proton.ch` | 300 |
| CNAME | `protonmail3._domainkey` | 0 | `protonmail3.domainkey.dmuz5dbu7zxykgsukfzvie2wzb3i5tawc2ypvbk3uuuwqdmgoap2a.domains.proton.ch` | 300 |
| CNAME | `protonmail2._domainkey` | 0 | `protonmail2.domainkey.dmuz5dbu7zxykgsukfzvie2wzb3i5tawc2ypvbk3uuuwqdmgoap2a.domains.proton.ch` | 300 |
| CNAME | `www` | 0 | `www.vivekapatel.com.cdn.hstgr.net` | 300 |
| CNAME | `autodiscover` | 0 | `autodiscover.mail.hostinger.com` | 300 |
| CNAME | `autoconfig` | 0 | `autoconfig.mail.hostinger.com` | 300 |
| TXT | `_dmarc` | 0 | `"v=DMARC1; p=quarantine"` | 3600 |
| ALIAS | `@` | 0 | `vivekapatel.com.cdn.hstgr.net` | 300 |
| TXT | `@` | 0 | `"google-site-verification=SdSH8vr_Cvk2tKzeXP1VuCFmxIbFCP8-MmMO5HR58YY"` | 14400 |
| TXT | `@` | 0 | `"protonmail-verification=2226faea23e19c005470947a7117ff7940ad5cb5"` | 14400 |
| TXT | `@` | 0 | `"v=spf1 include:_spf.protonmail.ch ~all"` | 14400 |
| MX | `@` | 10 | `mail.protonmail.ch` | 14400 |
| MX | `@` | 20 | `mailsec.protonmail.ch` | 14400 |

## Nameservers

Document the current nameservers exactly:

- `ns1.dns-parking.com`
- `ns2.dns-parking.com`

## Resend Sending DNS Records

These records were provided on 2026-06-15 for enabling email sending through Resend/Amazon SES. Add them as new records only. Do not replace the existing Proton Mail records at `@`.

| Purpose | Type | Name | Priority | Content | TTL |
|---|---|---|---:|---|---|
| Resend DKIM | TXT | `resend._domainkey` | 0 | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDBWVfJ7rNn6Y1Y6FfD2aR/gsNLLVYiZPLdxHNfFvIaNFWO77O9fMa+jTy7LfQzJqVOtDosvme9YLSCqYfphrzdY6li+N0/UjC4qiHVgZAJscTDvxJkpDq3p87ouJR9/LwdeiGMe5od0x1eEeGiUNo5chYY/4v+8TJAHoCo/zNfCQIDAQAB` | Auto / Hostinger default |
| Resend bounce/feedback MX | MX | `send` | 10 | `feedback-smtp.eu-west-1.amazonses.com` | 3600 |
| Resend SPF for `send` subdomain | TXT | `send` | 0 | `v=spf1 include:amazonses.com ~all` | 3600 |

Important:

- Keep the existing root SPF record exactly as `v=spf1 include:_spf.protonmail.ch ~all` unless Resend explicitly instructs changing the root domain.
- These Resend records are scoped to `resend._domainkey` and `send`, so they should not interrupt Proton Mail receiving at `@`.
- If Hostinger does not offer `Auto` TTL for the DKIM TXT record, use its default TTL or `3600`.

Applied and verified on 2026-06-15:

- Hostinger hPanel showed all three records after creation.
- Google DNS-over-HTTPS returned `Status: 0` for all three records.
- `resend._domainkey.vivekapatel.com` resolved to the DKIM TXT value above.
- `send.vivekapatel.com` resolved to `MX 10 feedback-smtp.eu-west-1.amazonses.com`.
- `send.vivekapatel.com` resolved to TXT `v=spf1 include:amazonses.com ~all`.

## Switching Guidance

- Preserve all Proton Mail, Google verification, DMARC, SPF, MX, DKIM, `autodiscover`, and `autoconfig` records exactly.
- Treat only these as website-pointing records:
  - `ALIAS @ -> vivekapatel.com.cdn.hstgr.net`
  - `CNAME www -> www.vivekapatel.com.cdn.hstgr.net`
- When connecting `vivekapatel.com` to the new Hostinger site, let Hostinger's domain connection flow update the website-pointing records if needed.
- Do not manually overwrite working email records during the website switch.

## Post-Switch Verification

Checked on 2026-06-15 after connecting `vivekapatel.com` to the new Hostinger site:

- Hostinger Websites now shows `vivekapatel.com` on the new site row.
- The old site was moved by Hostinger to `vivekapatel-com-409447.hostingersite.com`.
- Hostinger shows the domain may take 15 minutes to 24 hours to be fully online after DNS changes.
- `https://vivekapatel.com/` loads with page title `Vivek Patel - Computer Vision & AI Engineer`.
- `https://www.vivekapatel.com/` loads with page title `Vivek Patel - Computer Vision & AI Engineer`.
- The Proton Mail, Google verification, DMARC, SPF, MX, DKIM, `autodiscover`, and `autoconfig` records were still present after the switch.
- The DNS page also showed `A ftp -> 82.25.102.113`, TTL `1800`, after the switch. This record was not part of the original backup table above.

## Assumptions

- The target is still the same domain, `vivekapatel.com`.
- Email should continue working with Proton Mail.
- Google Search Console verification should remain active.
- The documentation should be Markdown only.
