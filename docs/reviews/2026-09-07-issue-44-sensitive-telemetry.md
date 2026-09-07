# Issue #44 sensitive-region telemetry verification

## Outcome

The contact form now uses one reusable `data-sensitive-telemetry` boundary. The shared telemetry helpers identify events from that boundary, Sentry drops matching UI breadcrumbs and error events, and Replay blocks and ignores the marked DOM subtree while continuing to mask all text, inputs, and media. Telemetry from outside a marked region keeps the existing consent-gated reporting path.

No Gate 3 or Gate 4 component, inquiry context, analytics provider, fingerprinting, session-recording expansion, contact-form redesign, Convex function, or production system was added or changed.

## Verification

| Check | Result |
| --- | --- |
| Baseline `npm test` on remote `main` (`6b73717`) | 19 files, 160 tests passed |
| Focused telemetry/contact unit tests | 3 files, 24 tests passed |
| Full `npm test` | 20 files, 164 tests passed |
| `npm run build` | Passed; 2,006 modules transformed and eight static routes generated |
| Local-only SEO | Passed; JSON-LD present and no failing finding |
| Passive preview Playwright, desktop and mobile | 157 passed, five intentional skips, zero failures |
| Synthetic privacy browser case | Passed at both browser projects; synthetic name, email, and free text were absent from observed telemetry request bodies, and no Convex mutation occurred |
| Codex browser, 1280 x 720 | Contact boundary present; synthetic invalid email stayed on-page and produced local validation only |
| Codex browser, 390 x 844 | Responsive form and validation remained usable; synthetic invalid email stayed on-page and no valid submission was made |
| `git diff --check` | Passed |

The browser suite was run with `QA_LOCAL_ONLY=1` and both QA targets set to `http://127.0.0.1:3000`. The live-contact project remained skipped, so no valid contact details, lead mutation, email, or production request was created.

## Remaining manual checks

Before merge, use a controlled non-production Sentry project with a configured DSN to inspect one allowed error outside the contact boundary, confirm a marked interaction produces no breadcrumb or Replay DOM detail, and confirm consent revocation stops later telemetry. The local repository has no Sentry DSN, so the adapter hooks and payload boundary are covered deterministically in unit tests while the passive browser run proves the form marker, synthetic-value handling, and no-submit constraint.

Viv retains final manual verification, merge, and deployment authority.
