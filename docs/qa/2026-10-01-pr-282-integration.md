# PR 282 integration recheck

Integrated `develop` at `966bcefdd79a8ba75b3639826c5fcde0123299e2` into the feature branch without rewriting history. The one conflict was in `Header.jsx`: the resolution keeps the shared header-height calculation and the newer accessible name, `Vivek Patel home`. The automatically merged banner retains the newer H2 heading.

Fresh Standards and Spec reviewers inspected pinned merge candidate `7cafd89a71b8095f5e55ed1a6ff7b98633b2534d` and found no integration blockers. The previously documented first-visit CLS limitation remains; the owner-requested 1500 ms delay and `Refs #258` are preserved.

Validation on the integrated source passed 741 unit tests, the production build, and diff checks. Browser QA passed all 40 consent-layout tests and 32 existing consent regressions in Chromium/WebKit. All 64 geometry cells have exact header adjacency, uncovered main content, and no horizontal overflow. Manager/settings/dismissal and delayed-arrival probes have zero paragraph drift. Codex independently checked the rendered T3 preview: at 390 px, header and banner top are 69 px, main starts at 138 px, the home link has the newer accessible name, and the consent title is H2.

The prior CLS measurements in the original report belong to head `89d3d990`. They were not rerun for the semantic-only integration. The gap and reading-position checks were rerun on the integrated artifact.

Fresh CI must pass on the pushed integration head before the authorized merge into `develop`. This integration does not authorize production deployment. #258 remains open for the known CLS limitation.

## Shallow-scroll review correction

A later PR review identified reading-position changes above the former spacer cutoff. New browser regressions failed 12 of 16 cases on `aea3515076adf724dcdb0ec1c0170d452dee2e2a`. Options moved the paragraph by 214 px at mobile width and 230 px at desktop width in both engines. WebKit delayed arrival at scroll position 50 px moved the paragraph by 69 px and 77 px respectively.

The correction compensates every nonzero scroll position and clamps the destination at zero. At the true page top, the existing reservation behavior remains. Dismissing a banner near the page start can still move content by the amount that cannot be compensated without scrolling above zero. The tests explicitly check that physical limit.

All 16 new cases pass across Chromium/WebKit, widths 390/1280, and normal/reduced motion. Separate fresh Standards and Spec reviewers passed pinned code candidate `67004df46c13f229a9b89d52128eb6be59d6b5bd` against `aea3515076adf724dcdb0ec1c0170d452dee2e2a`. The new code also passes 741 unit tests and a production build. Codex independently checked the rendered mobile contact page in T3: opening at scroll position 50 px and expanding Options at 100 px both produce zero paragraph drift, with header bottom and banner top at 69 px.

The 1500 ms delay and known first-visit CLS limitation remain. This review correction does not satisfy the remaining CLS acceptance criterion.

The complete browser rerun on the corrected artifact passed all 56 layout cases and all 32 existing consent regressions. The geometry matrix still covers 64 desktop/mobile route and motion combinations. Scoped ESLint and diff checks passed. One redundant test comment was removed after a separate comment review; application behavior was unchanged.

## Probe-mode review correction

A second review comment found that the new shallow tests did not honor the documented `QA_CONSENT_PROBE=1` measurement mode. Their defect assertions now use the existing `!probeOnly` convention. Normal-mode assertions and tolerances remain identical; probe mode retains every interaction and measurement attachment. Application source is unchanged.

Normal and probe modes each passed all 16 shallow cases. Each report contains eight arrival attachments and eight change attachments covering 72 state transitions. Fresh separate Standards and Spec reviewers passed pinned candidate `f6eaecf6020edf4ad34b986c478c4d4aa98696dd` against `70788c846eb8d6edb1bb88d2943e2d7581c59c2a`. Scoped ESLint and diff checks passed.

## CI entrance synchronization

CI run `36884450170` sampled the desktop banner at 59.9839 px during its entrance and failed the existing strict `y > 60` check. Codex independently sampled the rendered entrance in T3: the first frame was 59 px with opacity zero and a -10 px transform; the settled frame was 69 px with opacity one and no transform. Visibility alone does not establish settled geometry.

Local repetitions of the old test passed 30 of 30 runs, so no local red-to-green claim is made. The CI failure and rendered frame samples establish the measurement race. A shared `waitForConsentBannerEntrance` helper now reuses the existing consent suite's exact opacity/translation poll before responsive geometry measurements. The existing width, position, overlap, and CTA assertions remain unchanged. Application code, timing, and motion remain unchanged.

The corrected tests pass 80 repeated responsive consent cases and all 32 Chromium/WebKit consent regressions. Fresh separate Standards and Spec reviewers passed pinned candidate `4f91fd31ad640a040e2cb39d61bccc0c0d982633` against `3f480daa4112a9a4fc864925ad3fd4210a6341c2`. Scoped ESLint and diff checks passed. Fresh CI on the pushed head remains the merge gate.

## Latest develop and bounded transport recovery

GitHub forward-merged develop `a24d051862881235d919140ef6d704a91baf3696` into the PR as `a909c9b4d09611d513892c6706106d5c436841bf`. Fresh separate Standards and Spec reviews found no integration blockers. The newer typography is preserved. Codex rebuilt that head and verified desktop/mobile geometry and keyboard Options/Save behavior in T3. At 1280 px, header bottom and banner top are 69 px and the collapsed banner/main boundary is 146 px. At 390 px with settings expanded, settings end at 351 px and main starts at 352 px. Saving necessary-only preferences by keyboard returns main to 69 px without scrolling.

The combined-head local layout run then reproduced the earlier CI transport error: a loopback image GET failed with `route.fetch: socket hang up` before its geometry assertion; the other 55 cases passed. The failure recurred across tests and engines. Treating it as a one-off CI flake was insufficient.

The shared QA guard now allows one native connection-reset retry for GET/HEAD and zero for other methods. Redirect following remains disabled; URL allowlists, external redirect checks, response cleanup, and error propagation remain intact. [Playwright's documented retry contract](https://playwright.dev/docs/api/class-route#route-fetch-option-max-retries) retries only `ECONNRESET`, not HTTP status failures. Persistent errors still fail after the bound, and write requests are never replayed.

Real loopback-server regressions failed four of six cases before this correction. They now prove transient GET recovery in exactly two requests, persistent GET failure after exactly two, and POST failure after exactly one. All 14 local-navigation browser cases and 14 focused guard unit cases pass, including the existing external-request/redirect/WebSocket controls. Fresh separate Standards and Spec reviewers passed pinned candidate `9f0502ca9d00dd6e7fd69dcc4ec543818224ebbf` against `a909c9b4d09611d513892c6706106d5c436841bf`.

Final local checks pass 743 unit tests, all 56 consent-layout cases, all 32 existing consent regressions, scoped ESLint, and diff checks. The production build is from the combined application head; the transport correction changes QA files only. First-visit CLS has not been remeasured on the combined typography head, so historical CLS values are not presented as current performance. The requested 1500 ms delay and `Refs #258` remain. Fresh CI on the final pushed head must pass before merge.
