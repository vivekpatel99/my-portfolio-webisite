# Issue 228 consent spacing verification

Issue: [Remove the consent spacer after Reject](https://github.com/vivekpatel99/my-portfolio-webisite/issues/228).
Base: `develop` at `8fe91fb930275289bfe1f8f1f1ec3d0083e226f4`.
Original delivery base: `1aa8bf8077051aebcb4ed9f8c67cfe87b05af0c7`, which also includes the independent Testimonials heading and case-study collection corrections. The consent changes rebased without conflicts.

## Defect and correction

Layout reserved space when analytics were rejected, while the banner hid after either saved decision. The banner now owns its visibility and reports its occupied bottom edge. Layout uses that measurement for both the spacer and scroll clearance. Expanded settings are included. Hidden and unmounted banners release the space and the CSS custom property.

Consent persistence, telemetry authorization, the dark and purple styling, and fixed banner placement remain unchanged. The header remains sticky. The initial 1.5-second delay remains. Content now moves when the banner actually appears, as required by the visible-only reservation criterion.

## Independent rendered observations

Codex drove the local production build through T3 preview before implementation and after the initial correction.

| Viewport and state | Header bottom | Main top | Observation |
| --- | ---: | ---: | --- |
| Before, 1280px, Reject and reload | 69px | 141px | Hidden banner left a 72px gap |
| Before, 1280px, accepted decision and reload | 69px | 69px | No gap |
| Before, 390px, rejected decision and reload | 69px | 129px | Hidden banner left a 60px gap |
| After, 390px and 1440px, rejected decision | 69px | 69px | Spacer is zero |
| After, 1440px, initial visible banner | 69px | 149px | Main matches banner bottom at 149px |
| After, 1440px, expanded settings | 69px | 379px | Settings end at 378px |
| After, resize to 390px, expanded settings | 69px | 355px | Settings end at 354px; no horizontal overflow |

Codex also opened the manager from the scrolled footer, traversed controls with Tab and Enter, saved rejected analytics, and observed focus return to Manage Consent with a zero spacer.

The first fresh Opus review identified missing scroll clearance. Codex reproduced main content at 128px under expanded settings ending at 354px on mobile and 378px on desktop. The shared measurement now supplies `scroll-padding-top`. A keyboard regression failed in all four width and motion cases before this correction.

The later T3 preview host disconnected. Codex completed final rendered checks with the repository's guarded local Playwright fixtures against the rebuilt production preview. WebKit probing showed its native focus scroll can leave part of an input below the viewport edge. The input's visible center still hits the input and its top is below the complete consent overlay. The regression checks those actual clearance and hit-test conditions after settled navigation.

## Verification

- Full unit suite passed on the delivery base, 56 files and 579 tests. Codex independently reran the 13 consent component and layout checks.
- Production build passed and generated 21 static routes.
- Codex production Chromium QA passed 50 checks with two existing localhost GA-loading skips. It covered the new consent regression and relevant existing edge and responsive checks.
- Codex production WebKit QA passed all 32 consent checks across desktop and mobile profiles.
- The existing keyboard-focus suite passed all 24 checks across Chromium and WebKit profiles.
- Closing Options without saving restored the collapsed height in all eight width, motion, and browser combinations.
- The isolated fake-Sentry transport check passed. It delivered an allowed event, suppressed sensitive events, and stayed silent after consent revocation. Reject/reload checks observed zero telemetry requests, including the synthetic DSN hostname.
- Scoped JSX-aware ESLint and `git diff --check` passed.
- The initial consent regression failed all ten cases on the original source. The four added keyboard-clearance cases failed before the CSS clearance correction.

Kiro Claude Opus 5.5 implemented the product correction and regression tests. Fresh Opus reviews assessed requirements and code quality independently. The final review passed both axes with no blocking findings. Its reviewer inspected source and tests but did not execute browsers or tests. Codex independently inspected the final diff and performed the rendered checks above. Saved Kiro runtime model and context-usage metadata identified `claude-opus-5.5` for implementation, follow-up corrections, and the final review.

The final review retained minor test notes about bounded two-second waits and a unit height stub coupled to Radix markup. Its Options-collapse runtime question was resolved by the eight passing browser checks. No focus-reveal handler was added after runtime evidence disproved the supposed WebKit overlay-coverage defect.

To repeat the primary Chromium checks, build and serve this checkout on an exclusive local port, then run:

```sh
QA_LOCAL_ONLY=1 QA_ARTIFACT_SAFE_MODE=1 QA_PREVIEW_URL=http://127.0.0.1:4228 \
npx playwright test -c tests/qa/qa.config.js qa-consent.spec.js qa-edge.spec.js qa-responsive.spec.js \
  --project=preview-desktop --project=preview-mobile \
  --grep 'consent|cookie|Reject|Accept|skip link lands' --reporter=list
```

WebKit consent checks used an external temporary config that inherited the local QA config and selected `qa-consent.spec.js` for the existing WebKit projects. Temporary configs, browser outputs, and agent files are excluded from the commit.

## CI repair and integration follow-up

After PR #249 opened, CI run `36715244042` passed 389 passive browser checks and the isolated contact and telemetry checks. It failed when reconstructing sanitized artifacts because the newly configured consent suite was missing from the sanitizer's explicit source registry.

Opus 5.5 added the exact `qa-consent.spec.js` registration with the bounded label `consent`. Its disk-based hostile-report regression reproduced the CI error before the fix, with one failure and 23 passes, then passed all 24 tests after the correction. The sanitizer still rejects unknown sources and excludes raw titles, errors, captures, storage, and source filenames.

The published branch integrated `develop` through merge commits to preserve shared history. The initial CI-repair integration base was `ac3e4337da0d0bb89949d8db2baad58ad15f9ad0`. Adjacent consent and cursor QA entries conflicted; both were retained, along with both sanitizer registrations. That integration passed 26 sanitizer tests and 613 unit tests. Codex repeated T3 geometry checks at 390px and 1440px and observed header and main at 69px after both Accept and Reject reloads. Expanded mobile settings still ended at 354px, with main at 355px and no horizontal overflow.

The final integration base is `e4161c7d6062e1d5fc6de40a81d4378dc67b72b2`, which adds route-chunk recovery. The Layout import conflict retained both `useRef` for consent measurements and `useLocation` for the incoming recovery boundary. The boundary still wraps Suspense and Outlet; consent measurement and telemetry authorization remain intact. All consent, cursor, and route-recovery QA and sanitizer entries survived. The combined Layout, recovery-boundary, and sanitizer checks passed 44 tests. The complete unit suite passed 58 files and 623 tests, and the production build passed all 21 routes.

No consent product code changed during this repair. Fresh Opus and independent Codex shipping reviews inspect the integrated patch. Their final verdicts and the current SHA-scoped CI result are recorded on the PR before the authorized merge.

The latest integration base is `804e8d66d7af18552d1d1ea4397dad5878fafac5`, which also adds the independently approved storage-failure consent fallback. Another process merged this base into the PR, and Codex adopted those commits without overwriting them. That integration passed 59 unit files and 634 tests, plus the 21-route production build.

CI run `36719786177` exposed a separate test-isolation defect. Its hero parallax check measured layout before the delayed consent banner appeared, then attributed the intentional 80px consent spacer shift to parallax. Opus reproduced that exact failure. The existing hero probe init script now seeds saved rejected consent before navigation, keeping consent constant during the motion measurement. All geometry, motion, badge, and write-count assertions and observation windows remain unchanged. The hero suite passed eight cases with two expected pointer-capability skips, the fine-pointer case passed ten repetitions, and all 32 Chromium consent regressions passed independently of that hero setup.

## Limits and acceptance gate

Browser checks use local Chromium and WebKit with desktop and mobile profiles. Physical devices and the deployed host were not tested. Google Analytics intentionally does not load on localhost; the existing local GA-loading cases are skipped. Sentry transport uses a synthetic DSN and intercepted envelopes. No real contact submission was made.

The first-visit banner now produces a layout shift when it appears after its existing delay. No performance improvement is claimed. Geometry is verified with normal and reduced-motion preferences; this change does not alter the site's existing animation policy.

At initial delivery, the issue remained open pending acceptance, required CI and review conditions, and merge into develop. The subsequent user request authorizes merge into develop after readiness checks pass and cleanup of this worktree. Production release remains separate.
