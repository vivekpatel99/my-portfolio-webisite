# Issue 226 reduced-motion verification

The starting checkout matched canonical `develop` at
`8fe91fb930275289bfe1f8f1f1ec3d0083e226f4` and had no dirty files.
Issue [226](https://github.com/vivekpatel99/my-portfolio-webisite/issues/226)
remained reproducible on `/contact/`, `/legal/`, and `/data-policy/`.

Kiro Claude Opus 5.5 implemented a shared `usePageMotion` hook and a consent
entrance guard using the existing Framer Motion 10 `useReducedMotion` policy.
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

The checks cover fresh mounts with a preselected motion preference. Physical
devices, changing the OS preference while a page remains mounted, and the
deployed host were not tested. Integration acceptance, required CI, resolved
review threads, and merge remain separate conditions. This change does not
authorize deployment or issue closure.
