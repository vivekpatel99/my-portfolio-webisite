# Issue 226 reduced-motion verification

The starting checkout matched canonical `develop` at
`8fe91fb930275289bfe1f8f1f1ec3d0083e226f4` and had no dirty files.
Issue [226](https://github.com/vivekpatel99/my-portfolio-webisite/issues/226)
remained reproducible on `/contact/`, `/legal/`, and `/data-policy/`.

Kiro Claude Opus 5.5 implemented a shared `usePageMotion` hook and a consent
entrance guard, initially using Framer Motion 10 `useReducedMotion`.
The follow-up below replaces that mount-time snapshot with a live preference
subscription shared by both consumers.
Reduced motion keeps the opacity fade and sets all vertical offsets to zero.
Normal entrances retain their original offsets, duration, and easing.
Markup, copy, colors, and layout classes are unchanged.

Codex independently inspected the source diff and sampled local production
builds in Chromium and WebKit at 390 × 900 and 1440 × 900. Each browser context
enabled reduced motion before navigation. A MutationObserver sampled each
route root and consent banner on insertion, then at 100 and 300 ms.

| Target | Starting build | Fixed build |
| --- | --- | --- |
| Route root at mount | y = 20 px | x = y = 0, scale = 1 |
| Route root at 100 ms | y approximately 20.8 px | x = y = 0, scale = 1 |
| Route root at 300 ms | y approximately 2–3 px | x = y = 0, scale = 1 |
| Consent at mount | y = −10 px | x = y = 0, scale = 1 |
| Consent at 100 ms | y approximately −3.3 px | x = y = 0, scale = 1 |

The corrected motion regression suite explicitly asserts the emulated media
preference. Its reduced-motion route cases failed in all four projects on a
temporary build loading the four unchanged motion modules from the starting
commit. No checkout files were reverted for that comparison. The final suite
passed all 32 cases across both engines, widths, and motion preferences.
It checks mount, 100, 300, and 1000 ms, normal entrances, the retained
reduced-motion fade, readable final content, keyboard consent rejection, saved consent, and contact validation,
pending, failure, retry, and success feedback. Every case runs against one
synthetic production build, and contact submissions use an in-memory WebSocket
transport.
Non-loopback HTTP and other WebSockets are blocked.

Codex also inspected rendered pages through T3. Settled contact heading,
form, and consent rectangles matched the starting build exactly at both
widths. The accent remained `rgb(139, 92, 246)`. Policy pages had readable
content and no horizontal overflow. Keyboard Tab moved between contact
fields; Enter on an empty form showed three inline errors and a visible
toast, then focused the first invalid field.

Validation completed locally:

- 559 Vitest tests passed in 54 files.
- The production build generated 21 static routes and checked 36 public links.
- 32 motion regression checks passed.
- Relevant existing passive contact, accessibility, and keyboard-focus QA
  passed 128 checks, with four existing skips. Chromium ran contact and
  accessibility checks; Chromium and WebKit ran the focus checks.
- Scoped ESLint parsing and correctness rules, plus `git diff --check`, passed.
  The repository has no ESLint configuration, so this was a bounded check.

A fresh Kiro Opus 5.5 review of requirements and code quality identified two
testing gaps: a stale-preview dependency and missing CI coverage. Opus fixed
both, and a separate final review reported no actionable findings on either
axis. Codex inspected the final diff and reran all 559 unit tests, the build,
and the self-contained 32-case motion suite. The Kiro session display and
agent configurations selected `claude-opus-5.5`; backend model attestation was
not exposed by the CLI.

To rerun motion checks, run `npm run qa:motion`. It builds the current source
into a new temporary directory, previews it on `127.0.0.1:4267`, and prints the
directory path. It refuses an occupied port. `QA_MOTION_PORT` changes the port,
and `QA_MOTION_OUTPUT_DIR` selects an existing empty directory instead. Remove
the directory after inspection. CI runs the same script with a temporary
directory under `RUNNER_TEMP` that it deletes afterwards.

For baseline comparisons only, `QA_MOTION_BASE_URL` targets an existing
loopback preview and starts no server. Contact cases then pass only if that
build used `VITE_CONVEX_URL=https://qa-motion.convex.cloud`.

## Review follow-up: preference changes in the mounted app

GitHub review found that the locked Framer Motion 10.18 hook captures its
value in `useState` without updating the component when the media query changes.
Consent stays mounted while hidden, so its delayed appearance and reopening
could use a stale offset. This was reproduced before production edits in
Chromium and WebKit at both widths: all 24 new preference-change cases failed,
while the original 32 cases passed. After enabling reduced motion, the delayed
banner still mounted at y = -10 px and remained approximately -3.4 px at 100 ms.

Opus implemented `useReducedMotionPreference` with React 18
`useSyncExternalStore`, the standard reduced-motion media query, and change
listener cleanup. The page-motion hook and consent now share this live
preference. Without `matchMedia`, the fallback remains normal motion.
No markup, layout, copy, palette, fade, or normal entrance timing changed.

The expanded matrix passed all 56 cases. It covers both preference-change
directions before delayed consent, consent reopening through Manage Consent,
keyboard rejection and saved preferences, and subsequent client-side route
navigation. The existing initial-mount, contact feedback, and normal-motion
checks remain included. Four focused hook tests cover current preference,
both change directions, listener cleanup, and the absent-`matchMedia` fallback.
Codex inspected the final source and red failure samples independently and
ran the complete unit suite: 575 tests in 56 files passed on the follow-up base.

Preference changes were emulated in the browsers; physical devices, changing
an actual operating-system setting, and the deployed host were not tested.
Current-head CI and review-thread resolution remain merge gates. The user
subsequently authorized merging into `develop` when those gates pass;
production deployment remains outside the task.


## Compatibility follow-up

A later review identified a regression for legacy `MediaQueryList` objects
that expose `addListener`/`removeListener` without the modern event methods.
The original Framer hook and existing media-query consumers supported that API.
A focused legacy-only test failed with `TypeError: query.addEventListener is
not a function` before the production change; the four modern/fallback tests
still passed. Opus added the matching feature-detected listener fallback and
cleanup. All five hook tests and the Contact/consent targeted suite then passed
(52 tests in three files). This is an API simulation, not a test on an actual
old Safari binary. The normal and reduced-motion states and styling are unchanged.

During integration with the separately merged safe-contact-error fix, the
shared synthetic transport preserved develop's diagnostic fixture and optional
structured `errorData`, and the motion feedback assertion adopted the approved
safe failure text. Independent checks passed eight motion-feedback cases and
all five lifecycle cases; the extracted helper's actual values and wire messages
matched develop. Later base updates preserved the task patch, including the
published merge bringing in consent-storage handling. Final-head CI is the
required evidence for the combined integration tree.

## CI timing repair: route error focus assertion

CI run 36723545609 on head `f795eeb` failed 1 of 630 tests. The failure was in
the `RouteErrorBoundary.test.jsx` test that came in with develop (#244), not
the motion patch: `document.activeElement` was `<body>` when the test expected
the recovery heading. The same file passed 8/8 locally. The fallback moves focus
in a passive `useEffect`. After the first rejected `lazy()` import, React
commits the heading DOM first and runs passive effects in a later Scheduler
task. `findByRole` can resolve in that gap, and RTL's `setTimeout(0)` drain can
run before Scheduler's next `setImmediate` when the machine is busy. A temporary
diagnostic in the test blocked the commit and drain. The heading appeared while
`<body>` still had focus. The unfixed assertion failed 5/5 with the CI message,
and the fixed assertion passed 5/5. The navigate-to-lazy test only avoided the
race because the first test had already cached the rejected import. Run alone,
it took the same async path. Both focus assertions now use
`await waitFor(() => expect(document.activeElement).toBe(heading))`. No
production code changed. The focused file passed 8/8, the isolated navigation
test passed, and the full `npm test` suite passed 630/630 locally. Final-head CI
is still required.
