# Fresh /code-review of issue #257

Reviewed the final source/test diff in a read-only agent separate from implementation. The reviewer reconfirmed scope and Standards PASS after rebasing onto develop `db399db4726132371c85f7600bbf221d1cf89023`; unrelated cursor changes are preserved. Reread #257 requirements and inspected final runtime evidence. Source/test diff SHA-256 is `f705c16ed5bd234884a78d934297a3a68598b1a507e67cc6c00012e69423a9e6`.

## Standards and code quality

Verdict: PASS. No remaining blocking source or test-quality findings in the reviewed diff.

The corrected frame yields only while `main.querySelector('[data-route-error]')` identifies the existing route-error owner. Ordinary source controls inside main no longer prevent generic route focus. This matters because Suspense may retain a focused outgoing Home control until lazy Contact resolves; the previous main.contains guard wrongly treated that source focus as destination focus. The persistent-source unit case now distinguishes these rules, and final rebuilt-browser tests exercise the actual lazy route behavior.

Recovery focus remains covered through the actual RouteErrorBoundary integration, with heading assertions repeated after a real frame for synchronous render errors and failing lazy imports. If the error fallback is present before the frame, ScrollToTop yields; if it renders later, the fallback's passive effect establishes its own heading focus after generic main focus. Navigating away changes the location key and resets the boundary. Initial ordinary load focus remains untouched. Hash navigation retains its existing interval behavior and cancels older pending frames; unmount cleanup also cancels frames. Collection PUSH/Back scroll policy is unchanged. No arbitrary focused child is treated as proof of destination readiness.

Link conversions remain small and correct. Hero uses the existing Button asChild pattern; the drawer uses the existing modified-click predicate without suppressing native default behavior. Closing primary estimate conversion retains its href/classes and shares client routing. Visual classes are unchanged apart from Hero text-center to preserve button alignment after anchor conversion. Adjacent selector migrations follow the changed roles and disambiguate the new closing link. The live-contact test has no diff. No added dependency, broad refactor, caching requirement, network integration or credential. The remaining WebKit timing comment explains a non-obvious behavior; jsdom directives are necessary.

The focused test config uses the existing loopback navigation/WebSocket guards, mobile-width desktop browser input, normal/reduced motion projects and external temporary artifacts. No runnable `.husky/_` hook directory exists in this checkout, and no new lint setup was introduced.

## Spec acceptance

Verdict: PARTIAL. Source approval and passing scoped runtime checks do not establish unmeasured platform acceptance or authorize merge/deployment.

The final inspected `native-narrow/results.json` reports 24 expected outcomes, zero unexpected and zero flaky. This consists of 20 actual passes and four intentionally failed macOS WebKit middle-click probes. The actual passes cover 1440 and 390 widths, normal/reduced motion, native modifier clicks, Chromium middle clicks, plain client routing, main focus, keyboard-open drawer navigation and visible focus, drawer cleanup/reopen and source-document preservation.

Physical Safari middle-click remains unverified. The macOS automated WebKit behavior also occurred with a plain native anchor, so the expected failures do not establish an application defect. Those looped tests stop at the first hero-popup failure and do not individually verify every WebKit middle-click control. Do not describe the result as 24 actual passes or assert full cross-browser middle-click acceptance. Firefox and screen-reader speech remain unverified.

Pointer-open then keyboard-traversed drawer focus-visible behavior in WebKit remains the reported existing limitation shared with drawer navigation links. Keyboard-open flow is covered with real Enter activation and meaningful document-focus/focus-visible assertions. This review does not claim the pointer-open focus-visible heuristic was repaired.

Codex independently verified final geometry and inspected screenshots at 390 and 1440; those results are recorded in [the verification report](2026-10-01-issue-257-navigation-links.md). This reviewer inspected source and runtime result files but did not operate the browser or establish pixel equality. Keep the issue open until acceptance and merge conditions are met and state the remaining limits in the PR/report.

## Checks

- Independent final CTA, Header, Hero, ScrollToTop and RouteErrorBoundary run: 72 tests passed.
- Independent `git diff origin/develop --check`: passed.
- Parent full unit log inspected during review: 64 files, 729 tests passed. Codex reran the full suite after the final rebase: 63 files, 729 tests passed.
- Parent final rebuilt native QA results inspected: 20 actual passes, four expected macOS WebKit middle failures, zero unexpected/flaky outcomes.
- Codex final production build passed on develop `db399db`. Adjacent focus/recovery/motion checks passed 114 tests with two applicability skips; adjacent responsive/visual/interaction/route/accessibility checks passed 64 tests.
