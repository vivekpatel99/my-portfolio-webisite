# Domain Migration QA - vivekapatel.com

Date: 2026-06-15

## Summary

The Hostinger domain migration to the new site is mostly working. Both the apex domain and `www` load the new website, the main production routes render, DNS/mail records survived the migration, and the local test/build suite passes.

The remaining issues are mostly SEO/social-preview cleanup and contact-form/email verification gaps. A final live contact-form test was intentionally not run because it would create a real Convex lead and may send a real email.

## Verified Working

| Area | Result |
|---|---|
| Apex domain | `https://vivekapatel.com/` loads the new site |
| WWW domain | `https://www.vivekapatel.com/` loads the new site |
| Production routes | `/contact`, `/legal`, `/data-policy`, `/project/social-media-app`, and unknown-route fallback render |
| SPA fallback | Hostinger returns `200` for app routes so React Router can handle them |
| Desktop browser check | No console errors in sampled routes |
| Mobile browser check | `390px` viewport passed with no horizontal overflow |
| Images in sampled pages | No broken loaded images found in sampled browser checks |
| Local tests | `npm test` passed: 4 files, 25 tests |
| Production build | `npm run build` passed |
| Robots | `https://www.vivekapatel.com/robots.txt` returns `200` |
| Sitemap | `https://www.vivekapatel.com/sitemap.xml` returns `200` |
| DNS nameservers | `ns1.dns-parking.com`, `ns2.dns-parking.com` |
| ProtonMail MX | `mail.protonmail.ch`, `mailsec.protonmail.ch` |
| ProtonMail SPF | `v=spf1 include:_spf.protonmail.ch ~all` |
| DMARC | `v=DMARC1; p=quarantine` |
| ProtonMail DKIM | All three Proton DKIM CNAMEs resolve |
| Google verification | Existing TXT verification record resolves |
| Website CNAME | `www.vivekapatel.com` points to Hostinger CDN |

## Open Issues

### 1. `/og-image.png` Returns 422

`https://www.vivekapatel.com/og-image.png` returns HTTP `422`.

The currently effective live meta image is the GitHub raw PNG and that URL returns `200`, but route code still references `/og-image.png`. This can break social previews if those route-specific tags become active or are read before hydration.

Relevant files:

- `src/pages/Contact.jsx`
- Other route/page Helmet metadata that references `/og-image.png`
- `index.html`

Recommended fix:

- Add a real `public/og-image.png`, or update all route meta tags to use an existing stable image URL.
- Recheck with `curl -I https://www.vivekapatel.com/og-image.png`.

### 2. Route-Specific SEO Meta Is Not Fully Effective

On live pages like `/contact` and `/legal`, the browser title and canonical update, but some metadata remains from the home/default page:

- `meta[name="description"]`
- `og:title`
- `og:url`
- `og:image`
- Twitter image/title fields in some cases

This means search/social previews may show home-page metadata for subpages.

Relevant files:

- `index.html`
- `src/App.jsx`
- `src/pages/Home.jsx`
- `src/pages/Contact.jsx`
- `src/pages/Legal.jsx`
- `src/pages/DataPolicy.jsx`
- `src/pages/Project.jsx`

Recommended fix:

- Make metadata ownership consistent.
- Avoid default global OG tags overriding route-specific Helmet tags.
- Verify hydrated production DOM for each important route.

### 3. Contact Empty Submit Uses Native Browser Validation First

The live contact form has `required` fields, so empty submit is blocked by native browser validation before the custom toast appears.

Observed:

- Focus moves to the `name` field.
- Browser validation message appears.
- The expected custom "Uh oh! Missing fields." toast does not appear in that live empty-submit path.

Relevant file:

- `src/pages/Contact.jsx`

Decision needed:

- Keep native validation as-is, or add `noValidate` to the form if the desired UX is always custom toast validation.

### 4. Convex Email Notification Payload Is Not Unit-Tested

Local Convex tests cover lead insert, validation, optional budget, rate limiting, unicode, and invalid input. They do not test the Resend email payload.

Missing assertions:

- `to`
- `from`
- `reply_to`
- subject
- body text
- missing `RESEND_API_KEY` behavior
- non-OK Resend response logging

Relevant files:

- `convex/leads.ts`
- `convex/leads.test.ts`
- `convex/lib/leadValidation.ts`

Recommended fix:

- Add tests around `sendContactEmail` or extract payload construction into a testable helper.

### 5. Hotmail / Final Email Delivery Not Yet Proven

The repo does not reveal the live Convex dashboard environment values for:

- `CONTACT_RECIPIENT_EMAIL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Local `.env.local` only showed:

- `CONVEX_DEPLOYMENT`
- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`

Because of that, the Hotmail/Outlook recipient and final email delivery cannot be proven from the repo alone.

Recommended live test:

1. Submit one clearly marked QA contact-form message using a real controlled sender email.
2. Confirm the lead appears in Convex.
3. Confirm the notification arrives at the expected mailbox.
4. Confirm the sender is acceptable.
5. Confirm `Reply-To` is the test sender email.
6. Reply to the email and confirm the reply reaches the test sender inbox.

### 6. Resend Sender DNS Risk

Current public SPF authorizes ProtonMail:

```text
v=spf1 include:_spf.protonmail.ch ~all
```

If production contact notifications send from `@vivekapatel.com` through Resend, Resend's required DNS records must be added. Keep SPF as one combined TXT record, not multiple SPF records.

Relevant files:

- `convex/leads.ts`
- `docs/convex-migration-notes.md`
- `docs/vivekapatel-domain-dns.md`

### 7. Convex Rate-Limit Query Can Be Improved

`submitLead` uses the `by_email` index, then filters by `createdAt`, then collects results. It works in tests but is not the ideal scalable query shape.

Relevant files:

- `convex/leads.ts`
- `convex/schema.ts`
- `convex/leads.test.ts`

Recommended fix:

- Consider a compound index such as `by_email_and_createdAt`.
- Add a time-window boundary test.

### 8. Playwright QA Artifacts Need Refresh

Existing Playwright QA files are useful but should not be trusted blindly after the Convex migration.

Notes:

- Some contact specs still stub old Supabase endpoints while the app now uses Convex.
- Full Playwright contact E2E can create a real lead/email.
- Some "BUG" tests are polarity traps where a passing test means the bug still exists.
- `@playwright/test` is not currently listed in `package.json`.

Relevant files:

- `playwright-output/qa.config.js`
- `playwright-output/qa-contact.spec.js`
- `playwright-output/qa-edge.spec.js`
- `playwright-output/qa-a11y.spec.js`

Recommended fix:

- Update Playwright specs for Convex.
- Separate passive production checks from tests that submit forms.
- Add a clearly named live-smoke mode for intentional email/lead tests.

### 9. Google Analytics Consent Wiring Needs Review

Sub-agent review found a likely issue where Google Analytics is mounted after consent but may not receive the required prop.

Relevant files:

- `src/components/Layout.jsx`
- `src/components/GoogleAnalytics.jsx`
- `playwright-output/qa-edge.spec.js`

Recommended fix:

- Review consent state wiring.
- Confirm GA script only loads after consent and actually loads when consent is accepted.

### 10. Production Test Plan Is Stale

`docs/PRODUCTION_TEST_PLAN.md` says it was last updated on `2025-11-27`, before this migration.

Recommended fix:

- Update it with the 2026-06-15 migration findings.
- Mark risky tests separately from passive tests.

## Not Run Intentionally

These were not run because they can create live external side effects:

- `npm run convex:smoke`
- Full production Playwright contact E2E
- Live contact-form happy-path submission

Run these only when the test sender email and expected recipient mailbox are confirmed.

## Suggested Next Fix Order

1. Fix `/og-image.png` or normalize all OG/Twitter image references.
2. Fix route-specific SEO metadata precedence.
3. Decide native vs custom contact-form validation UX.
4. Add tests for Resend payload and `reply_to`.
5. Confirm Convex production env vars and run one deliberate live email test.
6. Improve the Convex rate-limit index/query shape.
7. Refresh Playwright QA specs for Convex and the current production site.
8. Update `docs/PRODUCTION_TEST_PLAN.md`.
