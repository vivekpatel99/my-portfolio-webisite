# Contact field capture readiness

This bounded follow-up resolves investigation 2 in the
[preproduction report](2026-10-09-preproduction-331.md#follow-up-verification-work)
for [#331](https://github.com/vivekpatel99/my-portfolio-webisite/issues/331).
The contact-field probe now waits for the requested focus and rendered fill
instead of assuming that a 200ms sleep completes the focus transition.
Application source, CSS, dependencies, transport and design decisions are unchanged.
This is evidence for the field-readiness repair, not a new whole-candidate release verdict.

## Candidate and reproduction

Fetched `develop`: `d936f88b316fd0bbcb0661e5b794410ef710793c`.
Task branch: `codex/331-contact-field-qa`, targeting `develop`.
The primary checkout started clean on local `develop` at
`9c8bfa3645c31a0e646fc00f3fa2eb2110dd20a4`. That local branch contains a
preserved local commit and could not fast-forward, so the task branch starts
directly from fetched `origin/develop`. No worktree was created.

The production build used the explicit synthetic endpoint
`https://qa-contact-lifecycle.convex.cloud`, with Sentry and GA identifiers
empty. The preview ran at `http://127.0.0.1:4311`. Tests used Node 24.15.0 and
the Playwright 1.60.0 container's Chromium 148.0.7778.96 and WebKit 26.4 builds,
at 1440×900 and 390×844, with normal and reduced motion. The existing HTTP and
WebSocket guards remained active. No real lead, email or vendor transmission occurred.

Ten repetitions of the unchanged WebKit desktop normal-motion probe produced
**one failure and nine passes**. The failure matched the original report:
after keyboard focus moved to the description, the unfocused budget field's
fill was still sampled as RGB `[167,139,250]` instead of `[255,255,255]`.
The 200ms sleep did not reliably establish the rendered state.

A new regression delays the transition's start by 400ms in the test page only.
It failed with the old wait, reading the resting white fill when focused purple
was expected. It passes with the bounded visual-state retry. This tests the
readiness assumption without changing the authored 150ms transition.

## Repair and browser results

The probe retries only focus and fill assertions for up to ten seconds, then
uses that successful observation for the remaining checks. Expected RGB values
and the existing 8-bit alpha tolerance remain exact. The control count is also
checked so an empty observation cannot pass. Geometry, corner gradients,
filled-value text, keyboard selection, reduced-motion duration and zero-submit
assertions remain in place. Normal and delayed scenarios have separate artifacts.

| Check | Result |
| --- | --- |
| Full color-scheme matrix, both engines and widths, both motion preferences | 25 passed; seven shared-static-check skips |
| WebKit desktop normal-motion probe, after repair | Ten of ten repetitions passed |
| Delayed-transition regression, before / after | Failed / passed |
| Production build | Passed; 21 generated routes and 36 public links checked |
| Explicit correctness ESLint rules on changed JavaScript | Passed |
| Available Convex typecheck | Passed; no backend edits |
| `npm test -- --maxWorkers=2 --maxConcurrency=1` | 917 passed across 71 files |

The seven skips avoid repeating the same static-file check in seven other
profiles; that check passed in Chromium desktop normal motion. They are not
skipped field checks. All sixteen normal/delayed field journeys passed.
Mobile Chromium and WebKit resting/focused field captures were inspected.
The DOM/style observations establish the intended settled fill and corners,
not a complete theme review or a latency guarantee under arbitrary load.

Reproduce against a fresh local production preview, with an external artifact directory:

```sh
QA_COLOR_SCHEME_BASE_URL=http://127.0.0.1:4311 \
QA_COLOR_SCHEME_OUTPUT_DIR=/tmp/contact-field-readiness \
npx playwright test -c tests/qa/qa-color-scheme.config.js
```

## Broader verification and review

The first dependency-stale build could not resolve `@headlessui/react`.
Installing the existing lockfile fixed the environment; no package files changed.
The initial unit run passed 914 tests and failed three: the collection screenshot
ignore check hit Docker's Git ownership guard, and the visual-editor route test
and gallery derivative test timed out. Trusting `/work` only inside the disposable
container and rerunning those files passed all 41 tests.

A subsequent full unit run passed 916 tests and failed the self-contained
publication fixture's nested Vitest command at its existing command limit.
The final recovery serialized concurrent cases and ran without browser work:
all 917 tests passed across 71 files. It did not change assertions or timeouts.
Earlier failures are not recorded as passes.
Existing Browserslist and React/jsdom diagnostics remain visible.

Independent read-only Standards and Spec reviews found no actionable defects.
DESIGN FM-01's existing resting/focused reference and its confirmed budget-dropdown
decision are preserved. No confirmed product theme drift was established.

The collaborative browser returned: `Preview automation open failed: This host
is missing libraries T3's browser needs (libatk-1.0.so.0, libatk-bridge-2.0.so.0,
libXdamage.so.1, libatspi.so.0).` Verification used the documented Playwright
workflow. These resized desktop engines do not establish physical touch,
historical Safari or spoken screen-reader behavior.

Use `Refs #331`. Typography/action readiness investigations and the release
report's platform, environment and production gaps remain separate. No parent
or related issue was edited or closed; no production promotion was performed.
