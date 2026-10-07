# Portable native-budget QA

Issue [#330](https://github.com/vivekpatel99/my-portfolio-webisite/issues/330) uses the inspected `develop` baseline `8a80ffb834ed9f28edf7eb497f8caa12bc8c4da7` on 7 October 2026. The task worktree started clean. The production application and QA project configuration are unchanged.

## Stable fixture

The baseline failed all eight contact cases at the nonempty budget assertion. `ArrowDown` followed by Tab left the budget value empty on this macOS host.

The fixture now uses `selectOption('< €5k')` to establish a committed value through input and change events. It asserts that the exact value persists, React sets `data-filled="true"`, and focus stays on the select. Real keyboard traversal still checks email, budget, description, and the submit button. `selectOption` does not simulate opening, navigating, or committing an operating system's native menu.

Each captured state verifies control bounds, no horizontal overflow, transparent control backgrounds, unchanged x position, width and height within 0.5 CSS px, expected resting or focused frame colors, eight corner gradients, placeholder or filled text colors, native select `color-scheme: normal`, and motion-specific focus transition duration. Alpha comparisons allow at most one 8-bit step because both engines serialize the authored resting alpha 0.025 as 0.024. RGB remains exact. Native submit-event and Convex mutation counters remain zero.

These assertions preserve the existing form reference under DESIGN.md FM-01. The native control's local normal scheme remains intentional. No product styling or behavior changed.

## Results

Host macOS 27.0.1, build 26A434. Playwright 1.60.0 uses Chromium 148.0.7778.96 and WebKit 26.4. The matrix uses headless desktop engines with resized viewports; it does not establish physical mobile-device or historical Safari behavior.

| Engine | Viewport | Motion | Contact result |
| --- | --- | --- | --- |
| Chromium | 390 × 844 | Normal | Pass |
| Chromium | 390 × 844 | Reduced | Pass |
| Chromium | 1440 × 900 | Normal | Pass |
| Chromium | 1440 × 900 | Reduced | Pass |
| WebKit | 390 × 844 | Normal | Pass |
| WebKit | 390 × 844 | Reduced | Pass |
| WebKit | 1440 × 900 | Normal | Pass |
| WebKit | 1440 × 900 | Reduced | Pass |

The full color suite has 17 passes, seven unchanged duplicate static-file skips, zero failures, and no retries. Every route and contact case runs. [Recorded values, geometry deltas, states, engine versions, and native input](assets/issue-330/verification.json) contain only synthetic QA data.

The production build passed with the existing Browserslist database notice. The full unit suite passed 68 files and 850 tests with two workers. Its first sandboxed run could not bind loopback preview servers; the network-enabled run passed. Scoped ESLint with `no-undef` and `no-unused-vars`, JavaScript syntax, and `git diff --check` passed. The repository has no lint or frontend typecheck script. No TypeScript or Convex source changed.

External negative probes confirmed the new assertions fail for a DOM value change without React state and for a blocked synthetic submit event. The probes preserve the subject assertions and do not modify repository source.

## Check native keyboard commitment separately

Use the same local production preview with external navigation and WebSockets blocked. Use empty or synthetic inquiry fields. Do not activate submit.

1. Record the actual operating system, browser engine and version, viewport, motion preference, and input mechanism.
2. Focus Email Address, then press the platform's traversal key to reach Budget Range.
3. Press Space to open the native menu. Observe the highlighted option.
4. Press ArrowDown. Observe the new highlight before continuing.
5. Press Return to commit. Verify the collapsed control displays the chosen label and React's filled state is true.
6. Press the platform's traversal key. Verify Project Description has focus and the committed value persists.
7. Record the actual value, focus, submit events, and mutation attempts. A highlighted option alone is insufficient evidence of commitment.

This check passed using native macOS input through Codex computer control in headed Chromium 148.0.7778.96 at 1440 × 900 with normal motion. The observed sequence was Email focus, Tab, Space, ArrowDown, Return, Tab, with accessibility observations between menu navigation and commitment. The committed value was `< €5k`, the collapsed label was `< €5,000`, `data-filled` was true, focus reached `description`, and there were zero submit events and zero POSTs. [Committed choice and textarea focus](assets/issue-330/native-keyboard.png) show the final state.

A separate headed Playwright `keyboard.press` diagnostic on Chromium 148 and WebKit 26.4 did not commit a value with Space, ArrowDown, Enter, and traversal. Both returned an empty value. Those unsuccessful diagnostics are recorded, not counted as passes. Current automated WebKit proves the stable committed-value fixture; native-input WebKit and physical Safari or iOS commitment remain unverified. Repeat this manual check on any additional platform whose native key behavior is claimed.

## Repeat the stable matrix

Build once and start a production preview on an available loopback port. Store output outside the repository.

```sh
npm ci
npm run build
npm run preview -- --port 4411 --strictPort
QA_COLOR_SCHEME_BASE_URL=http://127.0.0.1:4411 \
  QA_COLOR_SCHEME_OUTPUT_DIR=/absolute/external/qa-output \
  npx playwright test -c tests/qa/qa-color-scheme.config.js
```

## Independent review

The immutable precommit review snapshot is `91d2f36b1a17d0d1a91f9ea877ac4fe01d7efecf`, compared with the inspected baseline. The final documentation adds this review disposition without changing the tested fixture or evidence.

### Standards

An isolated reviewer found no actionable standards or architecture defects. The fixture follows FM-01's existing form reference and retains the local QA boundary. The comment review retained both platform explanations because current runtime evidence supports them.

### Spec

A separate isolated reviewer found no acceptance gaps. The reviewer checked the exact committed value and React state, focus progression, strengthened visual and geometry assertions, zero submissions, eight project results, native input record, and deliberate negative probes.

### Kiro review pending

The requested Kiro configuration is the tracked `portfolio_frontend_review` read-only profile with `claude-opus-5.5` and high effort. Automatic approval review rejected the launch twice because it did not accept authorization to transmit repository paths, issue details, commit identifiers, and synthetic QA evidence to the external Kiro service. Kiro did not run; no served model or Kiro findings are claimed. The implementation is delivered as a draft PR pending that requested review and remote CI. This limitation is a delivery gate, even though the issue's browser acceptance passed.

No merge or production release is authorized by these checks.
