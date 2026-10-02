# Issue #261: browser colors for the dark site

Issue: [#261](https://github.com/vivekpatel99/my-portfolio-webisite/issues/261), selected from [#267](https://github.com/vivekpatel99/my-portfolio-webisite/issues/267).
Base: current develop `920e45e95efb5c8f26b3b9840edf4e8e479347b0`.
Application and QA diff reviewed at `0497f85d8d57ce4e1ba2d0469e97c4edf30df933`.

The ordered queue, issue comments, open/merged PRs and occupied local branches were rechecked. Earlier entries already have implementations; some retain verification or owner gates. No existing implementation or claim for #261 was found. This thread claimed it before editing. The current T3 checkout was clean, a baseline was recorded outside the repository, and no worktree was created.

## Reproduction and change

A production build of develop reproduced `html` color-scheme `normal` and no theme-color meta. T3 independently confirmed both at 390×844 and 1440×900. Matched Chromium/WebKit baseline probes covered the 20 public routes, `404.html`, and missing page/service/project paths in both motion modes.

The fix declares `color-scheme: dark` on the existing global html rule and adds one `theme-color` meta with `#0C0D0D` to the root HTML. The static route generator inherits that head. The color matches the existing visible page background.

The first rendered comparison exposed a WebKit regression: inheriting dark changed the native contact select's fill. A local `color-scheme: normal` on the existing select restores its previous native appearance. Its authored colors, dimensions, arrow, options and behavior are retained. The textarea needs no exception. This additional CSS declaration is required by acceptance criterion 3.

## Acceptance evidence

| Criterion | Result |
| --- | --- |
| Computed html color-scheme is dark on every route | PASS: 24 paths × 8 browser/viewport/motion projects = 192 final route probes; matching baseline was normal. |
| Exact theme meta in built root and static HTML | PASS: rendered and served responses contain exactly one `#0C0D0D` tag; all 21 generated HTML files, including root and 404, match. |
| Select/textarea retain appearance at 390 and 1440 | PASS: all 64 matched control crops are pixel-identical, across default, select focus, textarea focus and populated states. |

[Recorded probes, geometry and pixel comparisons](assets/issue-261/verification.json).
[T3 baseline](assets/issue-261/t3-before.json) / [T3 final](assets/issue-261/t3-after.json).

All eight contact keyboard flows pass: email → budget; ArrowDown selects an option; Tab reaches the textarea; typed synthetic text persists; Tab reaches the submit control. No form submission or Convex mutation was made. No horizontal overflow was found. Actual reduced-motion media emulation is asserted; contact focus transitions are 0s under reduced motion.

Control geometry agrees within 0.001 CSS px. Two default select heights differ by approximately 0.000061 px from floating point measurements during route entrance. One baseline WebKit focus-background sample differs from the final computed sample; the corresponding captured pixels are identical. The report does not claim all intermediate computed samples are byte-identical.

Codex independently inspected the final source, contact crop images and T3 desktop/mobile rendering. T3 final control positions, dimensions, text colors and backgrounds exactly match its settled baseline. The native scrollbar now uses the dark scheme. T3 reports `document.hasFocus() === false`: active-element traversal and text entry were observed there, but it does not prove visible focus or native select keyboard changes. Actual keyboard changes and focused rendering are verified by the Chromium/WebKit matrix.

[Desktop rendered page](assets/issue-261/contact-desktop.png) · [Mobile rendered page](assets/issue-261/contact-mobile.png) · [Focused textarea](assets/issue-261/chromium-mobile-focused-textarea.png) · [WebKit select before](assets/issue-261/webkit-select-before.png) / [after](assets/issue-261/webkit-select-after.png).

## Checks and fresh review

- Production build passes, including generated image checks, sitemap, public-link checks and 21 static HTML files. Existing Browserslist age and entry-chunk size notices remain.
- Focused browser suite: **17 passed, 7 skipped**. The skips avoid repeating shared static-file validation across browser projects; no route or contact case was skipped.
- Local-only `npm run qa:seo` passes.
- QA JavaScript syntax, scoped ESLint (`no-undef`, `no-unused-vars`) and `git diff --check` pass. There is no repository ESLint configuration.
- **Standard unit validation is partial.** The initial unmodified baseline `npm test` had 742 passes and three timeouts while the build also ran. A limited-concurrency run (`npm test -- --maxWorkers=2`) had 744 passes and one existing publication test timeout at its 180-second deadline. That test also timed out alone. Its unchanged assertions subsequently passed in 175.07 seconds using a temporary external Vite transform that increased only that test's deadline to 300 seconds. Repository test budgets and assertions were not changed. This diagnostic pass does not make the standard full suite green.
- Separate implementation agent completed the scoped changes. Fresh isolated `/code-review` Standards and Spec agents reviewed the pinned application/QA diff. **Standards: PASS**, no actionable quality/architecture findings. **Spec: PASS**, acceptance fulfilled; standard unit validation remains partial as documented above. Codex separately inspected source and rendered evidence.

Keep #261 open until required CI and merge conditions pass. These local checks do not authorize a merge or release.

## Repeat the focused verification

Build and run a production preview on loopback port 4261. On a supported Playwright host:

```sh
npm run build
npm run preview -- --port 4261 --strictPort
QA_COLOR_SCHEME_OUTPUT_DIR=/absolute/path/outside/repository \
  npx playwright test -c tests/qa/qa-color-scheme.config.js
QA_LOCAL_ONLY=1 QA_PREVIEW_URL=http://127.0.0.1:4261 npm run qa:seo
```

For a matched baseline, use a production build of the pinned develop base and the same QA files with `QA_COLOR_SCHEME_PHASE=before`. Compare PNG pixels under the same browser runtime and viewport. The configuration requires all output to be outside the repository and routes requests through the existing local navigation guard.

This Ubuntu 26.04 host cannot launch the pinned Playwright WebKit package natively. The matrix used the repository's matching official runtime `mcr.microsoft.com/playwright:v1.60.0-noble` (digest `sha256:9bd26ad900bb5e0f4dee75839e957a89ae89c2b7ab1e76050e559790e946b948`), with the checkout mounted read-only, one worker, host networking to the local preview, and a separate artifact mount. Before and after used that same runtime. T3 supplied additional independent desktop/mobile rendered inspection.

## Limits

The existing Linux WebKit native select has a light fill and white populated text; the matched baseline has the same low-contrast state. This task preserves that appearance to meet criterion 3, rather than changing the established control design. It remains a separate contact-control limitation. Firefox, physical Safari/iOS, Windows/Linux native scrollbars beyond this captured runtime, mobile browser toolbar color and assistive-technology speech were not verified. No live contact request, deployment, merge or production verification was performed. The local unit timeout remains a validation limitation pending standard CI.
