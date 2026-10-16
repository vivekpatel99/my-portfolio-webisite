# Search baseline and invoice acquisition experiment (#372)

Prepared 14 October 2026. Status: **partial, blocked; drafts only**.
This report does not establish indexing, traffic, demand, conversion or revenue.
Keep [#372](https://github.com/vivekpatel99/my-portfolio-webisite/issues/372)
open with `Refs #372` until account and deployment verification is complete.

## Source and public delivery baseline

Checked source: `develop` commit `2dce0dcb9e87a73fbf9fa1aa872ac8794583e2bc`.
#361, #362 and #370 were closed. Their delivery commits are ancestors of that source:
`77d06a100385bca44e8a2006ddf9916a9c6fa574`,
`a843c7f1b422f907a489bee127e92a1e8476d79f`, and
`e380f216f1649c616a58a357c9b31dcb240ed3ac`, respectively.
Production commit SHA is **unconfirmed**. Public HTTP GETs and Chromium DOM
inspection were made on 14 October 2026; the HTTP capture timestamp is in the JSON.
[Sanitized response evidence](issue-372-live-evidence.json) records the exact
URLs, response hashes and bundle inspection scope. This is a point observation,
not a search-performance reporting period or a Googlebot crawl.

| Inspected live URL | HTTP and HTML observation | Rendered observation |
| --- | --- | --- |
| [Home](https://www.vivekapatel.com/) | 200; self canonical; no HTML h1 or `static-home` marker | JavaScript renders `Computer Vision & AI Engineer` |
| [Data Extraction Automation Sprint](https://www.vivekapatel.com/services/data-extraction-automation-sprint/) | 200; self canonical; service h1 present | Inquiry links lack service context; no project links found |
| [n8n invoice case study](https://www.vivekapatel.com/project/ai-invoice-processing-automation/) | 200; self canonical; case-study h1 present | Links to AI Workflow Buildout; inquiry link lacks project context |
| [Sitemap](https://www.vivekapatel.com/sitemap.xml) | 200; 20 URL entries, including all three inspected pages | Google submission, last read and processing status unavailable |
| [Robots](https://www.vivekapatel.com/robots.txt) | 200; allows `/` and names the sitemap | Does not establish indexing |

The main bundle `index-B9M2yT6j.js` and its seven discovered relative JavaScript
dependencies did not contain `generate_lead` or `inquiry_source`. These findings,
the missing static homepage, and missing service proof links show that the
observed delivery cannot be treated as the checked `develop` implementation.
String absence is bounded bundle evidence, not proof about every possible tag.
No analytics consent was granted and no real inquiry was submitted.

Before starting the experiment, the owner must authorize and verify a separate
production release containing #361/#362/#370, reconcile its exact SHA with the
delivered artifacts, and inspect its configured GA stream. This documentation
PR and its integration merge do not authorize that release.

## Account baseline and access limits

The default collaborative browser profile opened Search Console's public
sign-in landing page and Google Analytics redirected to Google sign-in.
No authenticated properties, exports or private business counts were available.
Every account-dependent value below is **blocked/unavailable**, not zero.

| Evidence needed | Current value | Requested reporting scope |
| --- | --- | --- |
| Home, service and project URL Inspection | Blocked: no property access | For each URL above: inspection timestamp, indexed status, last crawl, fetch/indexing permission, declared and Google-selected canonical; record live test separately |
| Search Console sitemap processing | Blocked: no property access | Exact submitted URL, status, last read, discovered pages and errors |
| Search impressions, clicks, CTR, average position | Blocked: no property access | Web search, 14 July–13 October 2026 inclusive; all countries/devices, per-page and page-filtered available queries |
| GA landing traffic and accepted-form events | Blocked: no property access or verified production emitter | Same requested dates, property timezone recorded; available landing-page views/sessions and `generate_lead` counts by bounded source/context |
| Accepted business inquiries, qualified inquiries, paid clients | Blocked: no private tally or confirmed qualification rule | Separate weekly aggregate counts; no visitor-to-lead matching |

These dates are a **requested** baseline period; no data for it was read. If the
property has shorter retention or newer instrumentation, record actual dates,
timezone, filters, incomplete dates and collection start. Do not backfill #370
events before its verified production activation. Do not turn omitted, hidden,
thresholded or unavailable query rows into zero metrics. Capture report totals
and available rows separately rather than summing queries to infer total demand.

Suggested properties, subject to owner confirmation: Search Console Domain
property `vivekapatel.com`, or the existing URL-prefix property
`https://www.vivekapatel.com/`; GA4 property and web stream that match the
production `VITE_GA_TRACKING_ID`. The actual property names/IDs are unknown.
Use existing read access or owner-supplied sanitized exports; no new property,
verification, sitemap submission or indexing request is part of this task.
Request a GA viewer report plus owner-confirmed stream settings, automatic form
measurement/history page-view behavior, create/modify-event rules, key-event
configuration and reporting availability for `inquiry_source`, `inquiry_type`
and `inquiry_id`. Do not request credentials or private lead content for the PR.

Google's [URL Inspection reference](https://support.google.com/webmasters/answer/9012289?hl=en)
distinguishes indexed results from a live indexability test. The
[Performance reference](https://support.google.com/webmasters/answer/7576553)
defines clicks, impressions, CTR and average position; these are property/page
observations, not market-wide search volume. The
[Sitemaps reference](https://support.google.com/webmasters/answer/7451001)
describes Google's processing state, which a successful HTTP fetch cannot prove.

## Proposed experiment: invoice extraction with human review

All choices here are proposals, not owner-confirmed qualification or publication
decisions. The owner operates the experiment; this task only prepares it.

- **Audience/problem:** finance and operations teams or bookkeepers manually
  transferring invoice PDFs/images into spreadsheets, needing reviewable fields
  and validation. Select this existing cluster from the published invoice work,
  not from assumed search demand.
- **Conversion page:** `https://www.vivekapatel.com/services/data-extraction-automation-sprint/`.
  Visitors can enter there or through the evidence link in each draft: the
  [n8n invoice case](https://www.vivekapatel.com/project/ai-invoice-processing-automation/)
  for LinkedIn, and [Invoice OCR case](https://www.vivekapatel.com/project/invoice-ocr-extraction/)
  for GitHub. Report landing traffic for all three pages separately, then the
  combined entry set if available without double-counting sessions.
- **Hypothesis:** one evidence-led LinkedIn post and one relevant owner-repository
  README note can prompt a qualified conversation about this workflow.
- **Observation:** six weeks from the first separately authorized publication
  after the deployment/account/qualification gates pass; baseline is the prior
  six complete weeks where instrumentation exists. Record actual start/end
  dates and timezone. Review at week three and six; wait at least 48 hours and
  check report completeness before final extraction. Do not assume equal
  exposure or treat a before/after change as causal evidence.
- **Exposure cap:** one LinkedIn post and one note in the owner's public invoice
  OCR repository; no paid ads, automated posting or unsolicited repository posts.
  All drafts need separate publication approval. Only marketplace drafts below
  are deferred to a later window, preserving one interpretable experiment.
- **Stop/review:** pause for a broken inquiry path, duplicate/sensitive telemetry,
  unsupported-claim complaint or source-tag loss. At week six, one manually
  qualified invoice inquiry supports another small trial, not an ROI claim.
  Traffic without inquiries prompts a landing/offer review; no observable traffic
  prompts distribution/access review, not a conclusion that demand is zero.
  If consent-limited GA and private counts disagree, report both and the gap.

### Referral links and measurable boundaries

| Draft channel | Landing link | Expected #370 source after verified deployment |
| --- | --- | --- |
| LinkedIn | https://www.vivekapatel.com/services/data-extraction-automation-sprint/?utm_source=linkedin | `linkedin` |
| Owner GitHub repository | https://www.vivekapatel.com/services/data-extraction-automation-sprint/?utm_source=github | `github` |
| Upwork (held) | https://www.vivekapatel.com/services/data-extraction-automation-sprint/?utm_source=upwork | `other_campaign` |
| Freelancer (held) | https://www.vivekapatel.com/services/data-extraction-automation-sprint/?utm_source=freelancer | `other_campaign` |
| FreelancerMap (held) | https://www.vivekapatel.com/services/data-extraction-automation-sprint/?utm_source=freelancermap | `other_campaign` |

Tagged evidence entry links in the active-window drafts:

- LinkedIn: https://www.vivekapatel.com/project/ai-invoice-processing-automation/?utm_source=linkedin
- GitHub: https://www.vivekapatel.com/project/invoice-ocr-extraction/?utm_source=github

One `utm_source` only. The current [event contract](../qa/issue-370-inquiry-analytics.md)
keeps a bounded source in document memory and discards campaign name, medium,
content, ID and arbitrary query/referrer data. Marketplace sources are pooled;
do not claim platform-specific conversions or experiment-ID attribution.
Record manual exposure dates/counts and other overlapping activity separately.
Even `linkedin`/`github` includes other traffic from those sources. Reloads,
new tabs, stripped tags, consent refusal and unrecognized referrer hosts limit
attribution; `direct` does not mean a typed URL. No visitor/lead identity join
or new telemetry collection is proposed.

Report four separate measures: (1) consented `generate_lead` event count,
(2) private aggregate accepted-inquiry count, (3) manually qualified invoice
inquiries, and (4) confirmed paid engagements. The application event means
backend acceptance, not notification delivery, qualification or revenue.
Break available GA events down by `inquiry_source`, `inquiry_type` and
`inquiry_id`; retain `none`/other context separately. Relevant contexts include
the sprint service, invoice projects and AI Workflow Buildout, but that last
service is broader than invoices. Context is not a landing-page/session join.
Never label all context events as invoice buyers or match GA rows to leads.

Provisional qualification requires a reachable buyer with a real invoice
workflow, fit with published in/out-of-scope service boundaries, access to
redacted samples/required fields, and budget/timing compatible with an agreed
scope. Missing details stay **pending**, not rejected or qualified. Confirm
these rules with the owner before counting. No arbitrary minimum budget is
imposed. A paid client is counted only after an agreed engagement and payment
are confirmed in the owner's business records. Publish only safe aggregate
counts; keep names, emails, invoice samples and deal details outside the repo.

## Channel drafts — not published

Claims below are limited to the public case studies and service scope. The n8n
case shows single-document intake, headers/line items, checks and reviewable
spreadsheet output; its combined multi-invoice PDF extension remained in
progress. No accuracy, time-saved, revenue or testimonial claims are added.
Links are draft destinations, not authorization to change profiles or posts.
The owner must check each platform's current linking rules before use.

### LinkedIn post

Invoice extraction needs a review path as well as a parser. In this n8n project,
I connected individual PDF/image intake to header and line-item extraction,
total checks and spreadsheet output with visible review states. The case study
shows the workflow and its limits:
https://www.vivekapatel.com/project/ai-invoice-processing-automation/?utm_source=linkedin

If your finance team is moving invoice data into spreadsheets by hand, I can
scope an extraction workflow around your fields, validation and handoff:
https://www.vivekapatel.com/services/data-extraction-automation-sprint/?utm_source=linkedin

### Upwork proposal paragraph (held)

Your invoice-to-spreadsheet workflow needs agreed fields and a way to review
exceptions. My n8n invoice case shows extraction, total checks and reviewable
spreadsheet output:
https://www.vivekapatel.com/project/ai-invoice-processing-automation/?utm_source=upwork
I would start by confirming redacted samples, required fields and your workbook
rules, then scope the extractor and validation. Service scope:
https://www.vivekapatel.com/services/data-extraction-automation-sprint/?utm_source=upwork
Keep communication within the platform where required; this is a draft for a
matching brief, not a claim that every invoice layout is already supported.

### Freelancer bid paragraph (held)

I can scope invoice data extraction and validation around your required fields
and spreadsheet handoff. This invoice OCR example extracts client fields from
a known invoice layout, traceable to the source file:
https://www.vivekapatel.com/project/invoice-ocr-extraction/?utm_source=freelancer
I would confirm sample layouts and acceptance checks before quoting. Scope:
https://www.vivekapatel.com/services/data-extraction-automation-sprint/?utm_source=freelancer

### FreelancerMap project-fit paragraph (held)

For a bounded invoice extraction engagement, I can map the current workflow,
build the extractor and add validation. This n8n case documents a spreadsheet
review handoff:
https://www.vivekapatel.com/project/ai-invoice-processing-automation/?utm_source=freelancermap
Scope and exclusions:
https://www.vivekapatel.com/services/data-extraction-automation-sprint/?utm_source=freelancermap
Project timing depends on the agreed inputs and handoff; availability is not
asserted by this draft.

### GitHub README note (active-window proposal; publication approval pending)

Suggested destination: the owner's public
[invoice-data-extraction-using-ocr](https://github.com/vivekpatel99/invoice-data-extraction-using-ocr)
repository. Its README was inspected; it describes invoice-image OCR and Excel
export. This is not the private n8n project repository and must not imply that
it implements that case study. Do not add promotional issues/comments to
third-party repositories.

Draft: “For an invoice OCR example extracting client fields from a known layout,
traceable to the source file, see
https://www.vivekapatel.com/project/invoice-ocr-extraction/?utm_source=github.
For a scoped extraction and validation engagement, see
https://www.vivekapatel.com/services/data-extraction-automation-sprint/?utm_source=github.”

## Remaining acceptance gates and review

Public delivery baseline and experiment/channel drafts are prepared. URL
Inspection, Google sitemap processing, query/landing metrics, deployed SHA,
live analytics settings and owner-confirmed qualification remain blocked.
No campaign ran and no outcome was measured. These prevent full acceptance
of #372 even after merging this preparatory documentation into `develop`.

Repository validation and the separate standards/specification review results
are recorded in the PR. This change adds documentation and sanitized public
evidence only. No external posts/profile edits, account changes or real leads
occurred.
