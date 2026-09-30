# Issue 228 consent spacing verification

Issue: [Remove the consent spacer after Reject](https://github.com/vivekpatel99/my-portfolio-webisite/issues/228).
Base: `develop` at `8fe91fb930275289bfe1f8f1f1ec3d0083e226f4`.
Delivery base: `1aa8bf8077051aebcb4ed9f8c67cfe87b05af0c7`, which also includes the independent Testimonials heading and case-study collection corrections. The consent changes rebased without conflicts.

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

## Limits and acceptance gate

Browser checks use local Chromium and WebKit with desktop and mobile profiles. Physical devices and the deployed host were not tested. Google Analytics intentionally does not load on localhost; the existing local GA-loading cases are skipped. Sentry transport uses a synthetic DSN and intercepted envelopes. No real contact submission was made.

The first-visit banner now produces a layout shift when it appears after its existing delay. No performance improvement is claimed. Geometry is verified with normal and reduced-motion preferences; this change does not alter the site's existing animation policy.

The issue remains open pending human acceptance, required CI and review conditions, and merge into develop. This work authorizes no merge or production release.
