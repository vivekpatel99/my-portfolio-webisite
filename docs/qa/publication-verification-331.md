# Publication verification follow-up for #331

This handles the first follow-up investigation in the [9 October preproduction report](2026-10-09-preproduction-331.md): local publication fixture failures. The starting and fetched `develop` SHA was `847a779239043b9399faf682b28449ab733874d3`. Application source is unchanged from that SHA; this PR changes QA runners, contact lifecycle setup and documentation. The existing checkout was clean; this task used it on `fix/331-publication-verification` without creating a worktree.

## Finding and change

The earlier report retained nested-runner `write EPIPE` and build `SIGTERM` failures. Fresh unchanged tests passed on this host: all 917 tests in 71 files, and all 18 publication cases under a two-CPU affinity constraint. Those historical failures were not reproduced. Their exact cause remains unproven; successful fresh runs do not retroactively change the earlier failed results.

Source inspection and process observation did establish that `runAffectedTests` launched a separate Vitest process without a worker limit. The outer runner's `--maxWorkers=2` did not constrain it. It now explicitly uses `--maxWorkers=2`, matching the repository's CI file-worker policy. Independent publication lifecycle chains still run concurrently. The publication change preserves timeouts, retries, assertions, production code, publication approvals and browser targets.

The original fixtures continue exercising prepare/stage/revise/withdraw, invalid batches and stale digests, private/draft exclusion, shared asset retention/removal, literal-dollar SEO, native static links, sitemap/deployment output and affected UI tests. Two builds still compile the complete SPA; other transitions retain their existing publication entry.

## Verification

- Unchanged host full suite: 917 passed in 71 files (`npm test -- --maxWorkers=2`), 173.56 seconds.
- Unchanged two-CPU publication suite: 18 passed, 146.42 seconds.
- Patched two-CPU publication suite: 18 passed, 147.79 seconds. Both constrained runs used `taskset -c 0,1 npm test -- publication/case-study-publication.test.js --maxWorkers=2 --reporter=verbose` on the same host. No speed improvement or historical failure repair is inferred from these timings.
- Final Node 24 full suite: 917 passed in 71 files, 124.99 seconds, including all 18 publication cases. Earlier container attempts passed 916 but failed the Git-ignore check because the worktree metadata was not mounted, then because Git rejected root ownership. The final invocation mounted the common Git directory read-only and used a checkout-specific `safe.directory` supplied through that disposable container's environment. No host/global Git configuration was changed.
- Production build: passed; 23 display derivatives verified, 21 static routes generated, 36 public links checked.
- Local-only SEO checker: passed, with no reported SEO failure.
- Browser verification: all 104 checks passed in Chromium 148.0.7778.96 and WebKit 26.4. Every published article and the collection were checked in both engines, at both widths, with JavaScript enabled and disabled. Article assertions covered HTTP 200, exactly one matching H1, canonical metadata, native collection/contact destinations, no synthetic private/draft sentinels, no horizontal document overflow and no page errors. Collection assertions covered six initial cards, all twelve after Load more and after an article return, and the disabled static Load more plus six native fallback links without JavaScript. An initial disposable browser assertion used a case-sensitive query against the uppercase collection heading; its corrected complete run passed all 104 checks.
- Focused ESLint `no-undef`/`no-unused-vars`, `node --check` and `git diff --check`: passed. No frontend typecheck is configured; no TypeScript or backend files changed. The full suite retains existing Browserslist/jsdom warnings and expected error-boundary test diagnostics.
- Independent standards and requirements reviews: no findings.

Mobile Chromium collection captures were inspected with and without JavaScript. This is targeted publication verification, not a completed theme or media-decoding audit. The compact no-JavaScript fallback link appearance still requires the original report's complete no-JavaScript theme acceptance; it was not silently signed off here.

The host used Node 22.22.1; final production/browser verification used the repository's cached Playwright 1.60.0 Noble container with Node 24.15.0. Browser engines and versions are recorded with the results. Browser viewports were 1440×900 and 390×844 with reduced motion. These are resized browser contexts, not physical devices or historical Safari.

The collaborative browser failed to open with: `Preview automation open failed: This host is missing libraries T3's browser needs (libatk-1.0.so.0, libatk-bridge-2.0.so.0, libXdamage.so.1, libatspi.so.0).` The documented Playwright workflow was used instead. Browser HTTP and WebSocket guards blocked external transport, service workers were disabled, and the production build used a synthetic Convex URL with optional vendor identifiers empty. No lead, email or vendor data was sent.

## PR #348 contact CI repair

The first PR run passed publication/unit/build and the other QA jobs, but contact QA passed 203 cases, skipped four known WebKit middle-click cases and failed one mobile WebKit normal-motion pending-send journey. Its budget setup timed out before lifecycle assertions: the €25,000+ option intercepted a pointer click intended for €5,000–€10,000, after which the option disappeared. Four unchanged focused local runs passed; the intermittent pointer geometry cause remains unproven.

Contact lifecycle setup now selects budgets using the real dropdown keyboard controls (Space, Home, ArrowDown, Enter), first scrolling the trigger into view because its offscreen observer closes the menu. Exact hidden values and visible labels remain asserted. Dedicated dropdown tests retain mouse/touch selection and viewport geometry checks. A new shared-helper regression exercises all four values plus blank, verifies zero budget pointer events, menu closure, restored focus and no form submission. No timeout increases, retries, forced clicks or product changes are included.

The regression failed before implementation (ten pointer events instead of zero). The first keyboard implementation passed seven profiles but failed mobile reduced-motion WebKit because the offscreen trigger closed the menu; scrolling the trigger into view addresses that setup requirement. Final sequential dropdown run: 28 passed, four expected WebKit forced-color skips, across Chromium/WebKit, desktop/mobile and both motion preferences. This includes all eight new keyboard-regression profiles and the unchanged pointer/touch paths. An earlier parallel run was stopped after WebKit setup timeouts; it is not counted as passing. The simultaneously attempted full unit run was interrupted after a DataPolicy timing failure, and contact QA was stopped after 90 passing cases. Verification is repeated sequentially where needed; only completed runs are credited. The repaired pending-send success/failure journeys then passed all 16 cases across the same eight contact browser profiles, including mobile WebKit normal motion. Focused JavaScript syntax, ESLint and diff checks passed; independent standards and specification reviews found no issues. The final sequential Node 24 unit run passed all 917 tests in 71 files (136.88 seconds), including DataPolicy and all publication cases. Full CI on the updated PR remains required before merge.

## Remaining scope

Use `Refs #331`. This follow-up supplies fresh local publication evidence and bounds child-runner resources; it does not claim to reproduce or definitively repair the historical environment failure. The remaining field-fill, typography/animation readiness and mobile action readiness investigations in the original report are unchanged. Its whole-site, platform, environment, delivery and production verification gaps remain open. No complete release signoff, issue closure, merge or deployment is implied.

Raw logs, browser scripts and captures stayed in the external task directory and were removed after delivery. The existing managed checkout is retained for PR review/CI repair, then eligible for retirement when that dependency ends. The open PR and its remote branch remain available.
