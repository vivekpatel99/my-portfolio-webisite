# Portfolio release preparation — 12 October 2026

## Decision

**Hold production release pending fresh hosted CI, integration, and explicit owner approval.**
Local verification passed after correcting gallery labels. The initial CI run did
not pass; the next complete run passed on `65bb900`. A later proposal-rate fix
requires another complete run on the final head. This report records a
snapshot, not an authorization to merge or proof of deployment.

[PR #355](https://github.com/vivekpatel99/my-portfolio-webisite/pull/355) targets
`develop`. Audit inputs were:

- Candidate before review fixes: `96489dafdf3a9127149b9c003d1af74af9ea9054`.
- Integration base: `25fe635b496cd56db926bb02c54a3b958b5234bf`.
- Production base: `9b7e637024703be7ffebd088beb052e8178a2fbf`.

Review covered the complete unreleased production candidate, including existing
changes on `develop`, with source review focused on frontend, publication,
Convex validation, and build/CI/deployment configuration. The final PR head also
contains the fixes and coverage described below. Re-read its exact head/base,
aggregate checks, mergeability, and paginated review threads before any merge.

## Findings and corrections

### Overview images were labeled as delivery evidence

Two independent reviewers confirmed that project cover diagrams carried
`PROJECT EVIDENCE`, contrary to the confirmed distinction in DESIGN.md IM-01 and
SH-02. Articles now identify the overview source explicitly. The inline stage,
single-image cover, and lightbox show `PROJECT OVERVIEW` for that source;
screenshots and video retain `PROJECT EVIDENCE`. Generic galleries retain their
existing evidence default.

Five unit cases cover classification, selection changes, lightbox behavior,
single-image rendering, prerendered/no-JavaScript output, and all public article
covers. Browser QA also switches between a real screenshot and its overview.
A fresh read-only review of the five-file fix found no blockers.
All 12 public project covers were observed with the overview label in the fresh
build at both manual smoke-test viewports.

### Earlier CI needs a clean, complete run

[Run 38235444771](https://github.com/vivekpatel99/my-portfolio-webisite/actions/runs/38235444771)
failed on the pre-fix candidate:

- WebKit passive shard 2: footer Portfolio keyboard activation left the page at
  its bottom. The anchor assertion measured about 3,713 px of drift. The cause
  remains unconfirmed. Five repetitions of the original case passed against
  that run's downloaded production artifact. The test now exercises five
  Portfolio activations without weakening the position or focus assertions;
  all four local browser projects passed (20 activations). The fragment spec
  forces a 1280×720 viewport in each context; these are not four distinct
  viewport checks.
- Telemetry QA was cancelled after the runner spent its 15-minute job budget
  pulling the pinned Playwright image. Tests did not execute in that job.

No speculative runtime scrolling change was made. A fresh hosted run must pass
both jobs and the aggregate gate. A repeated anchor failure requires renewed
investigation, not automatic retries or relaxed assertions.

### Proposal helper retained an independent hourly rate

Automated review of `65bb900` found that the proposal-linking skill still
exported a hardcoded €45/hour. An isolated copy reproduced the mismatch when
only `HOURLY_RATE_EUR` changed to 67. `SITE_RATE` now re-exports the shared
formatted label. The skill instructions and README describe that dependency,
and its existing rate assertion follows the configured amount. The same isolated
€67 check passes after the fix; the actual configured amount remains 45.
The helper remains isolated from publication data and case-study enumeration.

[Run 38240649449](https://github.com/vivekpatel99/my-portfolio-webisite/actions/runs/38240649449)
passed every CI job on `65bb900`, including both WebKit shards and telemetry.
This clears hosted CI for `65bb900`, but does not validate the later
proposal-rate fix. Recheck CI on the final pushed head.

## Verification completed locally

| Check | Result and limits |
| --- | --- |
| Unit suite | 75 files; 1,000 tests passed. |
| Production build | Passed; 21 prerendered outputs including 404, 39 public links checked. |
| Passive browser matrix | 943 passed, 29 skipped, zero failures/flaky results; Chromium and WebKit desktop/mobile projects. Run used the corrected build before the later repeated-anchor test enhancement. |
| Enhanced Portfolio anchor case | Passed in all four projects after the enhancement; five activations per project at the spec's fixed 1280×720 viewport. |
| Shared rate propagation | Earlier isolated €67 probe passed full build, 121 focused tests, SEO QA, and rendered UI; actual configured rate remains €45/hour. |
| Public route smoke | All 20 routes below rendered at 1440×900 and 320×740, with one H1, footer, no horizontal document overflow, and no broken loaded images. Scrolled through each page. Offscreen lazy thumbnails were recorded as deferred, rather than failed. |
| Gallery state | Unit and browser tests cover media selection and overview/evidence labels inline and in the lightbox; parent also observed a decoded real screenshot after selecting image 2. |
| Source/publication/backend review | No additional material defect reported by the independent source reviewer. Public projection has 12 completed stories, no ongoing stories, three featured. No schema/API-signature migration identified. |
| Consent/telemetry review | Independent reviewer passed 54 synthetic installed-SDK checks across Chromium/WebKit. Hosted telemetry job still requires a complete new run. |

The 29 passive skips comprise pointer/device-specific cases, unsupported WebKit
forced-colors emulation, cases reserved for the fake-Sentry server, the explicitly
disabled live contact submission, and the existing Google Analytics TODO. They
are not 29 completed checks. Contact lifecycle, motion, telemetry, and Apache
have separate hosted jobs; the aggregate gate must include all of them.

### Route inventory

Each row passed the structural smoke checks at both viewports. This table does
not certify a full aesthetic review of every hover, focus, long-text, and loading
state under every design rule.

| Route | Desktop and narrow smoke | Article cover |
| --- | --- | --- |
| `/` | Passed | — |
| `/contact` | Passed | — |
| `/legal` | Passed | — |
| `/data-policy` | Passed | — |
| `/case-studies` | Passed | — |
| `/services/data-extraction-automation-sprint` | Passed | — |
| `/services/computer-vision-production-optimization` | Passed | — |
| `/services/ai-workflow-buildout` | Passed | — |
| `/project/n8n-openai-data-extraction` | Passed | Overview |
| `/project/invoice-ocr-extraction` | Passed | Overview |
| `/project/yolo-computer-vision-optimization` | Passed | Overview |
| `/project/ai-invoice-processing-automation` | Passed | Overview |
| `/project/ai-project-planning-assistant` | Passed | Overview |
| `/project/browser-search-to-spreadsheet` | Passed | Overview |
| `/project/depth-based-distance-estimation` | Passed | Overview |
| `/project/healthcare-document-intelligence` | Passed | Overview |
| `/project/n8n-python-ai-agents` | Passed | Overview |
| `/project/python-ci-workflow-automation` | Passed | Overview |
| `/project/resumable-listing-data-extraction` | Passed | Overview |
| `/project/sports-video-analytics-yolo` | Passed | Overview |

The automated matrix additionally covers gallery/lightbox navigation, keyboard,
zoom, swipe, focus return, collection Load more and return state, no-JavaScript
public navigation, contact validation/drafts/recovery, consent, cursor behavior,
and testimonial controls. Synthetic transports avoid real lead creation.

## Deployment checks and remaining limits

- `main` triggers Hostinger production deployment. The repository has CI and
  issue-lifecycle workflows, with no separate deployment workflow checked in.
  Deployment documentation specifies `npm run build`, `dist`, and Node 24.
- A read-only comparison of the earlier CI artifact with the current live site's
  JavaScript found one actual Convex endpoint in each, and they matched. The
  live homepage returned HTTP 200. Endpoint values and secret contents were not
  printed. This does not verify future Hostinger environment settings or the
  deployed Convex function revision.
- CI's nonempty baked-Convex-URL validation passed on the earlier candidate.
  Confirm it again on the final release head.
- Local Docker was unavailable, so the Apache/HTTPS suite was not rerun locally.
  Its hosted job passed on the earlier candidate and must pass on the final one.
  Vite preview alone does not establish Hostinger rewrite/404 behavior.
- Local checks ran on Node 26.11.1; hosted CI and documented hosting use Node 24.
  Hosted success is required to cover that difference.
- Kiro Opus 5.5 reviewed source and extracted static output only: its delegated
  session could not access the browser. Parent browser verification and the
  automated matrix supply the rendered coverage described above.
- Modern Playwright WebKit is not proof of native Safari 14 compatibility.
  No new claim of Safari 14 acceptance is made.
- Original client delivery claims, legal/compliance accuracy, and every design
  state in `docs/theme-review.md` were not independently recertified here.
  Current collection has no ongoing-story state to inspect on public routes.
- No live contact submission, production backend deployment, publication
  mutation, or production merge was performed.
- Static review also noted the existing JavaScript-dependent `404.html` shell;
  a useful no-JavaScript invalid-route page remains an improvement opportunity.

## Release procedure

1. Pass all required checks and resolve substantive review threads on the exact
   final PR #355 head. Verify remote commit and PR base/head.
2. Merge into `develop` only when authorized, then verify its exact integrated
   head and aggregate CI. Preserve unrelated local work.
3. Prepare the `develop` → `main` release PR for that tested integrated head.
   Recheck the complete release diff, required CI, and review threads.
4. Obtain explicit owner approval to release. Main merge deploys the website;
   neither this report nor a green integration PR grants that approval.
5. After the approved deployment, verify the live build, public routes, assets,
   pricing/SEO, consent, and passive contact behavior separately. Record the
   deployed revision and retain the previous main revision for rollback via the
   documented reviewed-revert procedure.

## Local preservation and cleanup

The existing development server on port 3000 is retained for owner testing.
Pre-existing dirty and untracked files are outside this change and are preserved.
Task-only production previews and temporary copies are disposable after their
verification is captured and PR delivery is confirmed.

One focused test was accidentally run from the primary checkout and overwrote
an existing ignored `playwright-output/qa-results.json`. The previous report was
not backed up and could not be restored. The new `.last-run.json` and its empty
`test-results` directory were removed; the overwritten report was retained.
This is a local evidence-preservation gap, not a production artifact change.

## Follow-up findings on production release PR #356

The complete release CI passed on `f9700647` before its automated review raised
two valid findings. Both are repaired through a follow-up PR into develop;
release CI and review threads must be rechecked on the resulting final head.

- Direct service loads recreated the prerendered body with a lazy-route fallback
  containing only title and summary. While the service chunk was delayed, rate,
  timeline and scope disappeared. The pending service renderer now uses the
  same full `ServiceDetailContent` as the loaded page, retaining its metadata,
  navigation, accessible loading status, and back-link focus handoff. Generic
  loading and lazy-route retry/error behavior stay in place. This fixes content
  availability without introducing full-app hydration.
- The contact proof list contained a separator span directly under its `ul`.
  It now uses a decorative hidden list item with the same styles, while the two
  achievement items remain accessible.

The strengthened held-chunk regression failed on the old production artifact
because engagement details were absent. The fixed build passed all 60 service
loading browser cases across Chromium/WebKit desktop/mobile, including focus,
retry/error, unknown routes, consent, and no-JavaScript coverage. The contact
list regression failed before its markup change and all 77 contact tests passed
afterward. The combined unit suite passed 1,001 tests. The combined isolated
production build passed with 21 outputs and 39 public links checked; hosted CI
is still required on the follow-up and final release heads. No valid contact request was submitted.
