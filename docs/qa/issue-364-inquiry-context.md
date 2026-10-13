# Inquiry context (#364)

Service detail and public project article inquiry links now carry one validated
identifier: `/contact/?service=<id>` or `/contact/?project=<slug>`. Both SPA
links and generated static article/service links use the same public lookup.
Unknown, withdrawn, duplicate or mixed identifiers fall back to ordinary
contact behavior. Labels and description seeds come from public content;
arbitrary query text is ignored.

A completely empty description receives an editable “I'd like to discuss
<public name>.” line and a visible “Inquiry about <public name>” cue. Existing
name, email and budget values are preserved. A populated description or pending
send preserves the existing draft and its original context. Context stays in
document memory, outside the unchanged lead payload; no draft browser-storage
persistence or hidden form fields were added.

Success clears the context with the submitted fields. Returning to that
completed contact history entry retains the receipt and empty fields. A fresh
CTA visit, including the same service/project, can seed a new inquiry. Failures
keep the context for retry. React Router's existing entry key distinguishes the
two navigation cases; no private form data is added to history state.

The cue uses ordinary readable prose inside the existing sensitive form region.
DESIGN.md FM-01's existing field, label, validation and feedback behavior is
preserved. Desktop (1280px) and mobile (390px) visual inspection found no
horizontal overflow or new field boundaries.

Verification includes public-identifier tests for every current service and
published project, SPA/static project CTA tests, editable seed and unchanged
payload tests, draft/remount/success/failure tests, and a synthetic Chromium
desktop/WebKit mobile journey. The browser journey covers service and project
arrival, preserving an edited draft through another CTA, pending navigation,
successful return, and a fresh same-service inquiry. All browser submissions
use an in-memory Convex transport; no real lead was sent.

The production build and targeted ESLint syntax/control-flow checks passed.
Apache HTTPS QA verifies each static service's exact contextual estimate URL,
alongside directory redirects, canonical metadata, content, sitemap entries,
and real 404 responses for unknown services. Its old bare-contact assertion
was updated after reproducing the CI failure locally.
The full unit suite and browser lifecycle regression checks are delivery gates
recorded in the associated PR. Local prerequisites included FFmpeg tools and
the repository's pinned Playwright container for WebKit libraries.

This changes inquiry context only. Consent and success measurement are handled
separately in #370. Production deployment remains a separate release decision.
