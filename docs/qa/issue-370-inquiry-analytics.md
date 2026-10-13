# Confirmed inquiry analytics (#370)

## Event contract

The application queues `generate_lead` once when `submitLead` resolves
successfully. Google's [recommended event reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#generate_lead)
defines this as initial lead acquisition. Here it means the backend accepted
the inquiry. It does not prove notification email delivery, a qualified client,
a signed contract, or revenue. No monetary value is invented.

`useContactDraft` captures measurement at the start of a valid submission and
completes it at the existing identity-guarded success boundary. The document
owns this lifecycle even when Contact unmounts. Invalid fields, CTA clicks,
pending sends, duplicate submits, failures and receipt re-presentation emit
none. A successful retry or later successful inquiry gets its own event.
There is no delayed replay after a later consent grant, reload, or tab close.

| Parameter | Allowed value |
| --- | --- |
| `inquiry_source` | `google`, `bing`, `linkedin`, `github`, `other_campaign`, `other_referral`, `direct` |
| `inquiry_type` | `service`, `project`, `none` |
| `inquiry_id` | Validated public service ID or published project slug; omitted for `none` |
| `page_path` | `/contact/` even if acceptance happens on another route |
| `page_location` | `https://www.vivekapatel.com/contact/` |
| `page_title` | The static contact SEO title |
| `page_referrer` | Empty string |
| `campaign_source` | Same bounded document-entry category as `inquiry_source` |
| `campaign_medium`, `campaign_name`, `campaign_id`, `campaign_term`, `campaign_content` | `not_collected` |
| `send_to` | The configured GA stream ID |

The event contains no name, email, budget, project description, context label,
arbitrary path/query/hash/referrer, submission payload, request ID, or error.
The serializer builds allowed fields explicitly and does not spread form data.
Transport exceptions are swallowed without diagnostic output and cannot turn
an accepted inquiry into a failed submission. Existing sensitive form and
receipt attributes and Sentry protections remain in place.

## Consent and attribution boundaries

Measurement requires the production GA component to be active, a configured
stream, a callable transport and explicit analytics consent at both submission
start and completion. Rejection before completion invalidates a captured
measurement even when consent is regranted before acceptance. Cross-tab
rejection, preference removal and storage clearing invalidate pending
measurements too. Unreadable consent fails closed. Unmounting/disabling the
configured GA transport also invalidates its pending measurements.
An external preference change supersedes an earlier in-memory consent choice
retained after a failed storage write, protecting subsequent submissions too.

At module initialization, the entry URL/referrer is reduced to a category in
document memory, without a storage write or telemetry call. A single
`utm_source` is trimmed and compared case-insensitively with the four listed
sources; unrecognized or duplicate values become `other_campaign`. Without
that parameter, exact `google.com`, `bing.com`, `linkedin.com` and `github.com`
referrer hosts (optionally prefixed by `www.`) identify the corresponding
source. Other external/invalid referrers become `other_referral`; absent or
same-site referrers become `direct`. Raw values are not retained. Country
domains, shortened links and unlisted subdomains intentionally fall into
`other_referral` rather than guessing their origin.

The source stays constant across SPA navigation for this document. Reloads,
new tabs, stripped campaign tags, missing referrers and privacy controls limit
attribution. `direct` is absence of recognized external acquisition evidence,
not proof that a visitor typed the URL. Selected service/project context is
captured from the preserved draft at submission start and is independent of
acquisition source. It is revalidated against the public catalog; unknown or
withdrawn identifiers are omitted. No cross-session matching or lead identity
is added to the backend or browser storage.

Page-view config now uses canonical known public routes and static titles;
unknown paths become `/not-found/`. Query/hash-only changes do not request an
extra page view. Referrer and campaign overrides prevent those application
calls from inheriting arbitrary URL strings. See Google's
[configuration reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
for override behavior. This intentionally reduces ordinary GA campaign and
referrer detail: use `inquiry_source` for this bounded app attribution, not as
a claim about GA's native source/medium or channel-group calculations.

## Observed configuration and separate live verification

Source inspected from `develop` prerequisite `e3cd3f4`, with this change added:

- `GoogleAnalytics.jsx` loads gtag from `VITE_GA_TRACKING_ID` only in production,
  with consent, away from localhost/127.0.0.1. The ID is not hardcoded.
- The original app sent route `config` calls for page views. Repository search
  found no other application `generate_lead`, `form_submit` or `form_start`
  emitters or Tag Manager container. This change adds one success emitter.
- No repository variable names were returned by the available GitHub variable
  listing. Build/environment and GA administration values were not exposed or
  assumed from that result.
- GA4 stream settings, enhanced measurement, event creation/modification rules,
  key-event settings and actual production stream collection were not inspected.
  Synthetic transport evidence below is app acceptance evidence only.

Before relying on live counts, the stream owner must separately inspect the
actual deployed stream: ensure no existing custom rule/tag synthesizes
`generate_lead` from clicks, page views or form interactions; check enhanced
form measurement and history page-view settings for duplicate/sensitive data;
and register the bounded event dimensions if needed for reports. Google's
[enhanced measurement reference](https://support.google.com/analytics/answer/9216061)
describes automatic `form_start`/`form_submit` interactions; those are not
backend acceptance signals and must not be counted as this success metric.
Disable automatic form interaction collection if it would capture sensitive
form metadata. A live owner review is a separate gate, not claimed complete by
this app implementation, and no production release or real lead is performed.

Qualified-client attribution remains a later manual/business decision: review
an accepted inquiry and its actual outcome in the business workflow. This
event does not join a GA visitor to a private lead, emit qualification events,
or establish email, sales, or revenue attribution.

## Verification

Synthetic unit and browser checks cover exactly-once success, original context
capture, unknown/private identifiers, sanitized metadata, pending navigation,
failed retry, invalid input, missing/development transport, rejection,
withdrawal/regrant, cross-tab removal, unreadable storage and telemetry errors.
Browser checks use the repository's offline Convex WebSocket mock and a fake GA
sink at the real submission seam in Chromium desktop and WebKit mobile; external
requests are blocked. Production component configuration is checked separately
in unit tests. No live GA delivery or real lead is used as test evidence.

Local verification on 13 October 2026: all 1,090 tests in 79 files passed;
the production build generated 21 routes and checked 39 public links;
syntax/control ESLint and diff checks passed; eight new offline lifecycle
scenarios passed across Chromium desktop and WebKit mobile. Independent
standards and specification reviews found no blockers, including the
failed-storage/cross-tab withdrawal regression.
