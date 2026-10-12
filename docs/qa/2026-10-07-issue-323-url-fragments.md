# URL fragment navigation regression verification

Issue [#323](https://github.com/vivekpatel99/my-portfolio-webisite/issues/323) was inspected on 7 October 2026 at develop `8a80ffb834ed9f28edf7eb497f8caa12bc8c4da7`.

## Behavior

`ScrollToTop` now ignores fragments whose percent decoding throws `URIError`, before it schedules anchor retries. Unexpected exceptions still propagate. Valid anchor decoding, scrolling, focus and effect cleanup keep their existing behavior. No visual design decision changed; navigation preservation follows DESIGN rule NV-01.

## Baseline evidence

- The Codex in-app browser showed only the global error screen on the baseline production build at `/#%E0%A4%A`.
- The new unit regressions failed in five malformed-fragment cases before the fix, with `URIError`; twelve existing or valid-fragment cases passed.
- Both Chromium and WebKit failed the baseline cold-load shell checks for `#%E0%A4%A` and `#%`.
- The clean baseline unit suite passed 68 files and 850 tests. Its first sandbox run could not bind test servers; the scoped rerun passed. The baseline production build passed.

## Candidate verification

| Check | Result |
| --- | --- |
| Complete unit suite, `npm test -- --maxWorkers=2` | 68 files, 857 tests passed. |
| Targeted ScrollToTop, QA configuration and artifact sanitizer tests | 3 files, 64 tests passed. |
| Production build, `npm run build` | Passed, including display derivatives, static routes and sitemap. |
| Production Chromium and WebKit fragment suite | 48 cases passed across all four configured projects. Final desktop run passed 24 in 29.3 seconds; touch-context run passed 24 in 28.4 seconds. |
| Codex in-app browser | Reloading the malformed URL retained the header, homepage content and footer. |
| Artifact sanitizer fixture, `npm run qa:artifacts:verify` | Passed. |
| ESLint with installed react-app rules via an external task config | No errors; one pre-existing unused `React` import warning in ScrollToTop. The final browser spec passed without lint findings. |
| Repository diff whitespace check | Passed. |

The repository has no lint or typecheck package script and no frontend TypeScript configuration. The lint command used the installed react-app configuration without adding repository configuration. Existing dependency warnings were also present in baseline runs.

The browser matrix covers cold loads, actual Header event handler to React Router navigation, native hash changes, no anchor effects for malformed input, preserved source focus and scroll, and recovery using the ordinary Services link. It also covers valid encoded fragments and ordinary Services, About and Portfolio footer arrival and focus. Unit tests additionally cover multibyte encoding and cancellation of a previous anchor timer.

All browser tests used loopback-only HTTP and WebSocket guards, blocked service workers, necessary-only consent and synthetic navigation input. The SPA test changes a Header link's DOM href because the production handler reads that href before calling navigate. Application code and production link definitions are unchanged.

The suite uses an explicit 1280 by 720 desktop viewport. Chromium and WebKit results establish current desktop-engine behavior, not historical Safari, physical-device or mobile-drawer behavior. The spec is included in all local CI browser projects; its explicit viewport also applies to projects otherwise named mobile.

The position assertion records target geometry when the browser's actual `scrollIntoView` method runs, subtracts computed scroll padding and clamps the scroll range. It checks actual scroll position within two CSS pixels, target viewport presence and focus. Initial assertions that assumed a stationary section after arrival failed because of existing scroll padding and the SectionAnimator entrance transform. This correction does not widen the position tolerance or change application behavior.

During integration CI, one WebKit touch-context Portfolio arrival differed from the recorded destination by 11.6875 pixels. Twenty independent repeat navigations passed with a 0.3125-pixel rounding difference. A static 12-pixel transform also passed three controlled trials, so the exact CI cause was not reproduced; a changing entrance transform or layout remains the suspected measurement race. The exact fixture subsequently showed an offscreen target retaining its initial 12-pixel transform. Ordinary footer-link tests now expose the target to complete its entrance animation, await font readiness and stable geometry, then focus and activate the real footer link. The same two-pixel position assertion remains. Cold-load navigation remains immediate.

To reproduce against a production preview, build, start a loopback preview on an available port, and run:

```sh
QA_LOCAL_ONLY=1 QA_ARTIFACT_SAFE_MODE=1 QA_PREVIEW_URL=http://127.0.0.1:4404 \
  npm run qa:playwright:passive -- qa-fragments \
  --project=preview-desktop --project=preview-webkit-desktop
```

## Review

Independent standards and specification reviewers found no issues in the final code candidate `744a863fdfc5ea10bd7ee2afd096c48044587ff8`. The comment review found no added comments to remove.

Kiro was requested with the tracked `portfolio_frontend_review` profile, configured `claude-opus-5.5` and high effort, using read-only tools. Its first review found no application defect and identified a weak exact-text assertion for the composite global error paragraph. The assertion now uses a prefix regular expression. Shell landmark checks already detected the baseline failure independently. Runtime output did not attest the executed model revision.

The bounded follow-up found no new high-confidence issues and accepted the assertion correction and position measurement. It identified missing evidence for configured touch contexts, which were then checked separately. The baseline concern was resolved by the earlier production red run, whose unchanged shell checks failed for both malformed inputs in both engines. Its cross-route Back observation was explicitly a non-regression hypothesis; it is outside this ticket's required matrix. The coordinator bound the exact code diff to the Git snapshot and owned production build.

Actual Kiro output is preserved in [the first review](2026-10-07-issue-323/kiro-review.txt) and [the final review](2026-10-07-issue-323/kiro-final-review.txt). Requested configuration is known from the invocation and tracked profile; runtime model and effort attestation remained unavailable.

No deployment, production release, merge or real contact submission was performed.
