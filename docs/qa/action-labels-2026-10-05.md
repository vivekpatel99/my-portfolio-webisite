# Attached action labels

The 5 October 2026 approval adds transparent edge labels to the named prominent actions and the collection h1. The action copy, accessible names, destinations, focus outlines, loading protection, OCR behavior, and image assets are preserved. `DetectionLabel` is reused with `aria-hidden`; a scoped action modifier reserves a 29px left offset and 6px right clearance without changing compact target sizing. The exhausted control reads `ALL WORK SHOWN` above its existing All case studies shown text.

The branch starts at develop `d82e133f486666e182d61cd6fb2ba55cb32b94e4`. Open PRs #310 and #311 are excluded. The collection heading uses the existing shared heading label family that #311 also uses. Panel frames and hero/gallery boundaries belong to separate fixes.

## Verification

- All 850 unit tests pass across 68 files. The same suite passed before edits. Two raw-text expectations now check accessible action names or visible action text separately from hidden decoration.
- Babel parsing, scoped ESLint syntax checks, and `git diff --check` pass. The project has no frontend typecheck or configured frontend lint script.
- Display-image validation, the production Vite build, sitemap generation, and static generation pass. Static generation checks 36 links and generates 21 routes including 404. Output stayed in an external task directory; repository dist and the review server on port 3000 were not used for builds.
- The label geometry check passes all 16 combinations of Chromium/WebKit, widths 1440/980/390/320, and normal/reduced motion. It checks transparent backgrounds, a single label line, centered top-edge line boxes, stroke clearance, target dimensions, and horizontal reflow on all five affected routes.
- Nine interaction checks pass across Chromium desktop/320px and WebKit 390px. They cover hover, pressed and keyboard focus, exhausted collection behavior, drawer navigation, and existing utility/modal behavior. The native Chromium 200% browser zoom check passes separately. Its first run hit an existing response-disposal race during test teardown; an isolated rerun passed without code changes.
- Three synthetic contact lifecycle checks pass in Chromium desktop, Chromium mobile reduced motion, and WebKit mobile. Pending sends retain dimensions and the accessible Sending… name; duplicates are blocked, retry focus and success receipt remain intact. Visual captures use an in-memory transport and synthetic input, never a real submission.
- Independent read-only standards and spec reviews found no actionable issues.

## Visual evidence

Captured from the isolated production preview in Chromium at 1440px and 320px. The screenshots are focused crops except contact states, which show the viewport. All attached labels fit. Narrow service action text wraps inside its control while its edge label stays on one line. The desktop and drawer estimate retain compact heights. Contact pending preserves the edge label and greys the disabled action. These captures are implementation evidence for review, not production or device acceptance.

| Surface | Desktop | Narrow screen |
| --- | --- | --- |
| Hero actions | [Desktop](action-labels-2026-10-05/hero-actions-1440.png) | [320px](action-labels-2026-10-05/hero-actions-320.png) |
| Header estimate | [Desktop](action-labels-2026-10-05/header-estimate-1440.png) | [Drawer](action-labels-2026-10-05/drawer-estimate-320.png) |
| Service actions | [Desktop](action-labels-2026-10-05/service-actions-1440.png) | [320px](action-labels-2026-10-05/service-actions-320.png) |
| Project inquiry | [Desktop](action-labels-2026-10-05/project-inquiry-1440.png) | [320px](action-labels-2026-10-05/project-inquiry-320.png) |
| Collection heading | [Desktop](action-labels-2026-10-05/collection-heading-1440.png) | [320px](action-labels-2026-10-05/collection-heading-320.png) |
| Load more | [Desktop](action-labels-2026-10-05/more-work-1440.png) | [320px](action-labels-2026-10-05/more-work-320.png) |
| Exhausted collection | [Desktop](action-labels-2026-10-05/all-work-shown-1440.png) | [320px](action-labels-2026-10-05/all-work-shown-320.png) |
| Contact idle | [Desktop](action-labels-2026-10-05/contact-idle-1440.png) | [320px](action-labels-2026-10-05/contact-idle-320.png) |
| Contact pending | [Desktop](action-labels-2026-10-05/contact-pending-1440.png) | [320px](action-labels-2026-10-05/contact-pending-320.png) |
