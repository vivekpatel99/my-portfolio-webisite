# Service and contact panel verification

Verified on 5 October 2026 on `codex/service-contact-panels`, based on develop `d82e133f486666e182d61cd6fb2ba55cb32b94e4`. The code and evidence are delivered together in this PR. The predecessor action-label PR #312 was unmerged at branch creation and is not included. This panel change has no implementation dependency on that PR.

The service engagement and combined scope panels now reuse the shared SH-03 panel geometry and transparent edge labels. The contact request form and What happens next panel use the same treatment. Scope separators, factual content, rates, routes, input boundaries, actions, and contact behavior remain unchanged. The engagement title moves to the edge. The redundant interior CONTACT · DETECTED metadata is removed.

## Checks

- Baseline and final unit suite: 68 files, 850 tests passed.
- Display-image integrity, isolated production Vite build, sitemap generation, and static route generation passed. The latter checked 36 public links and generated 21 routes including the 404 page. Build output stayed outside the repository; existing dist and the review preview on port 3000 were preserved.
- Scoped ESLint using the installed react-app configuration passed. Its existing Babel preset emitted a dependency declaration warning. The repository has no typecheck script; JavaScript syntax and JSX compilation passed.
- Chromium and WebKit inspected all four routes below at 1440×900, 980×900, 390×844, and 320×844 with reduced motion: 64 panel inspections passed. Measurements confirmed 23px by 1.5px outer-edge opposing strokes, no continuous wrapper border, transparent labels centered on the top edge, grey resting corners, purple hover/focus-within corners, and no horizontal overflow. Input focus retains its independent four-corner boundary.
- Twelve existing synthetic contact lifecycle cases passed across Chromium and WebKit at 1280 and 390 pixels with reduced motion. Coverage included invalid submission, pending/disabled controls, duplicate-send protection, retry, success focus, and tab-memory draft restoration. External transport was blocked; no live contact was submitted.
- Native Chromium 200% zoom passed on all four routes. The layout viewport changed from 1440 to 720 pixels with visualViewport.scale remaining 1. Labels stayed within their panels and no horizontal overflow appeared.
- Generated service HTML was inspected with JavaScript disabled at the explicit `/services/<id>/index.html` URLs. Vite preview requires those file URLs for this check; production Apache routing was not tested locally.
- Chromium forced-colors checks preserved the filled input's 1px resting outline and 2px focused outline.
- Separate read-only standards and scope reviews found no actionable issues. Diff whitespace checks passed.

This is scoped panel verification, not a completed whole-site audit or deployment verification. The browser matrix used the installed Playwright 1.60.0 Chromium and WebKit builds. The screenshots below show the final code at rest in Chromium at 1440×900 and 390×900. Measurements and extra checks are retained beside them.

## Visual evidence

| Route | Desktop | Mobile |
| --- | --- | --- |
| `/services/data-extraction-automation-sprint` | [Desktop](panel-boundaries-2026-10-05/data-extraction-automation-sprint-1440.png) | [Mobile](panel-boundaries-2026-10-05/data-extraction-automation-sprint-390.png) |
| `/services/computer-vision-production-optimization` | [Desktop](panel-boundaries-2026-10-05/computer-vision-production-optimization-1440.png) | [Mobile](panel-boundaries-2026-10-05/computer-vision-production-optimization-390.png) |
| `/services/ai-workflow-buildout` | [Desktop](panel-boundaries-2026-10-05/ai-workflow-buildout-1440.png) | [Mobile](panel-boundaries-2026-10-05/ai-workflow-buildout-390.png) |
| `/contact` | [Desktop](panel-boundaries-2026-10-05/contact-1440.png) | [Mobile](panel-boundaries-2026-10-05/contact-390.png) |

[Panel measurements](panel-boundaries-2026-10-05/measurements.json) and [additional checks](panel-boundaries-2026-10-05/additional-checks.json).

## Email card follow-up

Vivek subsequently requested an attached label for the Prefer email card. The card now has a transparent `EMAIL` edge label, hidden from assistive technology, while its prompt, email link, fill, opposing corners, and focus outline remain unchanged. This supersedes its earlier no-label exception in SH-02.

All 56 contact unit tests and the isolated production/static build passed. Chromium and WebKit checked rest, hover, keyboard focus, transparent edge-label geometry, the unchanged mailto destination, and no overflow at 1440, 390, and 320 pixels. No live email or contact submission occurred.

[Desktop email card](panel-boundaries-2026-10-05/email-card-1440.png) and [mobile email card](panel-boundaries-2026-10-05/email-card-390.png). Earlier full-page screenshots above predate this follow-up.

## CI assertion repair

Hosted passive QA found two stale assertions for the removed CONTACT · DETECTED metadata. They now verify the direct PROJECT · REQUEST panel label, its aria-hidden attribute and transparent background, and the unchanged submit accessible name after mobile navigation. Both configured Chromium projects passed all four targeted cases against the isolated integration build. Product behavior is unchanged. The branch incorporates the then-current develop through a clean merge commit without rewriting history.

The subsequent action-label integration adds a separate PROJECT · REQUEST label to the submit button. A pre-existing panel assertion became ambiguous when both labels were present. The assertion now scopes to the form's direct edge label; the existing submit assertion independently preserves its accessible name and hidden decoration. No product code changed during this repair.
