# Contact social targets, issue #326

Verified on 7 October 2026 from `develop` commit `8a80ffb834ed9f28edf7eb497f8caa12bc8c4da7` in the dedicated `codex/issue-326` worktree. The inspected live issue had no blockers.

The LinkedIn and GitHub anchors previously matched their 24px icons. Each anchor now has 10px padding and a separate 2px purple keyboard focus outline. The icons, accessible names, destinations, `_blank` target, and `noopener noreferrer` relationship are preserved. This implements the confirmed standalone target requirement in DESIGN BT-01 while retaining its lightweight utility treatment.

## Measurements and captures

The production preview ran at `http://127.0.0.1:4407/contact/`. Playwright 1.60.0 used Chromium `148.0.7778.96` and WebKit `26.4` on macOS. Both engines passed at all three actual viewport sizes, with normal and reduced motion. Narrow contexts enabled touch input; these are current desktop engines with touch simulation, not physical mobile devices or historical Safari evidence.

| Actual viewport | Both anchors before | Both anchors after | Icon size | Target gap after | Document scroll width after | Captures |
| --- | --- | --- | --- | --- | --- | --- |
| 1440 × 900 | 24 × 24 | 44 × 44 | 24 × 24 | 24 | 1440 | [Before](assets/issue-326/before-1440.png), [after](assets/issue-326/after-1440.png) |
| 390 × 844 | 24 × 24 | 44 × 44 | 24 × 24 | 24 | 390 | [Before](assets/issue-326/before-390.png), [after](assets/issue-326/after-390.png) |
| 320 × 740 | 24 × 24 | 44 × 44 | 24 × 24 | 24 | 320 | [Before](assets/issue-326/before-320.png), [after](assets/issue-326/after-320.png) |

All dimensions are CSS pixels. [Raw measurements](assets/issue-326/measurements.json) include each anchor's rectangle and SVG dimensions. Hit testing at all four interior corners verified that the full bounds belong to each anchor, including padding. Targets stayed within the viewport without overlap, clipping, or horizontal overflow. The normal-motion baseline was captured in Chromium at each width; the candidate measurement matrix includes both engines and motion preferences.

Keyboard navigation from the Email platform link reached LinkedIn and then GitHub. Both showed a 2px outline. The narrow captures show [LinkedIn focus](assets/issue-326/focus-linkedin-320.png) and [GitHub focus](assets/issue-326/focus-github-320.png). Codex's in-app browser also reproduced 24px before, measured 44px after, and displayed the focused GitHub link in the surrounding layout.

Clicking each anchor's padding opened a native new tab at its configured profile URL, with `window.opener === null`; the contact page stayed open. Exact profile destinations were fulfilled with synthetic HTML, and the repository's local HTTP/WebSocket guards blocked other external traffic. No lead submission, email, real profile request, or telemetry record was created.

## Verification

- Baseline and candidate full unit suites passed, 68 files and 850 tests each.
- Targeted Contact suite passed, 56 tests.
- Baseline and candidate production builds passed, including static route generation and public-link validation.
- The browser regression failed at all three baseline widths with `Expected >= 44; Received 24`. The candidate passed all 12 cases. Actual [before output](assets/issue-326/regression-before.txt) and [after output](assets/issue-326/regression-after.txt) are retained.
- `git diff --check` and supplemental ESLint `no-undef` / `no-unreachable` checks passed on the owned JavaScript files.
- The repository has no ESLint configuration, lint script, or application typecheck script. Its normal ESLint invocation stopped for missing configuration. No configuration was added for this ticket. Existing dependency deprecation, stale Browserslist, and intentional error-boundary-test diagnostics remain disclosed.

To repeat the browser check, build and start a local production preview:

```sh
npm run build
node_modules/.bin/vite preview --host 127.0.0.1 --port 4407 --strictPort
```

With that server running, create an external output directory and run in another terminal:

```sh
QA_CONTACT_SOCIAL_BASE_URL=http://127.0.0.1:4407 \
QA_CONTACT_SOCIAL_OUTPUT_DIR=/absolute/external/task-directory \
node_modules/.bin/playwright test -c tests/qa/qa-contact-social-targets.config.js
```

The dedicated configuration checks loopback URLs and writes results outside the repository. Optional `QA_CONTACT_SOCIAL_CAPTURE_PHASE=after` creates empty-form captures and measurement JSON. This dedicated suite is run explicitly; it is not added to the production passive QA list.

## Independent review

The implement skill's separate standards and specification reviews found no actionable issues against the pinned baseline and exact precommit source diff. The comment review found no introduced comments or suppressions. The deslop pass retained the minimal two-anchor change with no extra React logic or abstraction.

Kiro's read-only review exited successfully using the tracked `portfolio_frontend_review` profile with requested `claude-opus-5.5` and high effort. It reported `claude-opus-5.5` in its session context; it could not independently attest the effort or profile, or the weights behind that model label. It found no blocking defects and passed the recorded acceptance evidence. Its [actual output](assets/issue-326/kiro-review.txt), [prompt](assets/issue-326/kiro-prompt.txt), [compressed reviewed source diff](assets/issue-326/reviewed-candidate.diff.gz), and [diff SHA256](assets/issue-326/reviewed-candidate-sha256.txt) are retained. The SHA256 identifies the uncompressed diff. Browser output removes terminal color codes and trailing spaces without changing diagnostic content.

Kiro's non-blocking observations were verified and dispositioned. Evidence was outside the original source-only diff and the report was not yet present when it inspected the directory; both are included in the delivered commit and checked by the task owner. The explicit preview and QA commands above address its setup observation. The suite remains separate from the CI allowlist, following the existing footer-targets precedent. Physical touch taps, historical engines, actual external servers, and WebKit before captures were not claimed. The full candidate unit suite completed with 850 passes after the review started. No extra Kiro call or shared settings change was needed.

All issue acceptance criteria are verified locally. Production deployment and physical-device verification are outside this ticket.
