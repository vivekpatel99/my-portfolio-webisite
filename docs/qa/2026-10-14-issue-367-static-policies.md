# Policy pages without JavaScript — issue #367

The production build now includes readable `/legal/` and `/data-policy/` responses through the static rendering path introduced in #361. The browser pages and generated responses share `PrivacyPolicyContent` and `CookiePolicyContent`; there is no second copy of the policy facts.

The cookie response explains that consent controls need JavaScript and provides a native email link. This explanation also survives an entry-script failure. Once the application mounts, the existing consent button replaces the explanation and dispatches the existing event. Privacy and cookie pages retain their existing policy dates, cross-policy links, processor statements, and all original prose. A Babel text-node comparison with baseline `e3cd3f438e3ef901d19e1fd8cc8adeb8ccc20eaf` preserved all 53 privacy and 22 cookie text nodes in order. No consent storage, analytics, or telemetry implementation changed.

## Acceptance evidence

Production preview: `http://127.0.0.1:3368`, built with a synthetic Convex URL and exercised with the existing loopback network guards. Playwright 1.60.0 used Chromium 148.0.7778.96 and WebKit 26.4. WebKit ran in the cached CI image `mcr.microsoft.com/playwright:v1.60.0-noble` with a read-only source mount; its image digest was `sha256:9bd26ad900bb5e0f4dee75839e957a89ae89c2b7ab1e76050e559790e946b948`.

- Both HTTP responses contain one current H1, all policy sections and final paragraphs, contact email, and cross-policy links.
- Both policies pass JavaScript-disabled reading, full-content clipping checks, keyboard focus outlines, and native cross-policy navigation at 1440, 390, and 320px in both desktop and mobile Chromium/WebKit profiles.
- Blocked entry scripts preserve readable content and the honest static explanation. Delayed-entry tests compare every policy heading, paragraph, and list item before and after mount.
- Page and footer consent controls reopen the existing banner and return keyboard focus after rejection at all three widths. Existing unit tests also preserve stored analytics-on preferences and exercise mouse, Enter, Space, close, Reject, and Save Preferences.
- All 52 distinct browser cases have passing evidence: 26 Chromium and 26 WebKit. The first Docker WebKit run passed 22 cases; four cases hit connection or loading timeouts while the host ran heavy publication tests. A bounded six-case, one-worker rerun with `--ipc=host` covered every failed case and passed without changing assertions.

## Verification

All 1,058 unit tests passed across 78 files. The final run used `npm test -- --maxWorkers=1 --maxConcurrency=1 --testTimeout=15000` with task-local FFprobe on PATH, separately from browser/build work.

The production build passed and generated 21 routes including the 404 page. The real static generator test checks both policies and repeat-generation equality. Local SEO checks, scoped ESLint on changed JavaScript/JSX, and `git diff --check` passed. Existing source-based location checks now inspect the route wrappers and shared policy content together, keeping their EEA/GDPR and city-free assertions intact.

The checkout initially lacked npm dependencies and FFprobe. Lockfile dependencies were installed; FFprobe was supplied from a task-local static distribution. Initial media tests passed after that prerequisite was available. Earlier broad runs hit local publication, dev-server, and FFprobe timeouts under contention; final unit verification ran separately with bounded concurrency. No repository timeout configuration or assertions changed; the final local invocation allowed 15 seconds per ordinary unit test. Existing Browserslist and intentional error-boundary/jsdom diagnostics remain. There is no configured frontend typecheck or repository lint script, so scoped lint and production compilation do not claim such a gate.

Independent standards and specification reviews, including the location-guard follow-up, found no blockers. The implementation preserves TY-01's existing one-H1 reference and NV-01's existing keyboard/consent behavior; narrow wrapping follows the LY-01 proposed default. This is scoped policy acceptance, not a whole-site theme audit, native zoom audit, or production deployment verification.

## CI contact-harness follow-up

The first CI run on `5addbc6` passed application unit tests, production build, and policy browser coverage, but failed two contact QA shards. [Shard 1](https://github.com/vivekpatel99/my-portfolio-webisite/actions/runs/38527680905/job/115731805757) selected two homepage estimate links while the test expected the service CTA during navigation. [Shard 2](https://github.com/vivekpatel99/my-portfolio-webisite/actions/runs/38527680905/job/115731805794) reported a missing second synthetic mutation and an inactive main focus target. The original WebKit scenarios passed in repeated warm local runs; the missing-mutation symptom was not reproduced locally.

The follow-up changes only the contact test harness and this report. Service inquiries now wait for the exact service-specific destination, verify its accessible name, and verify the resulting contact URL and form. The Back helper recomputes its original receipt/retry/main focus priority while polling, instead of selecting one expectation from an early marker count. The fresh-success scenario now explicitly checks receipt focus. Mutation counts, draft values, history, payload, storage and outcome checks are preserved.

All 48 targeted contact cases have passing evidence in the pinned Playwright image across Chromium/WebKit, 1280/390px, and both motion preferences. The first matrix passed 45 cases; three mobile WebKit cases hit local image-fetch/loading timeouts. A bounded rerun of those three passed with identical assertions and timeouts. Scoped lint and diff checks passed. Independent standards and specification reviews found no blockers. No application or repository timeout configuration changed.

Disposable logs, configs, browser output and the FFprobe runtime are kept outside the repository until PR verification/monitoring finishes; task-owned servers and Docker containers are stopped when no longer needed. The current managed checkout was supplied at task start, and no additional worktree was created.
