# Featured Case Studies heading — #295

Baseline: `4fc9bb0d1db789ec5bf4f8e0309764cd46a4e925` on `develop`.
The #294 theme implementation had already removed the original
`PORTFOLIO · CASE STUDIES` eyebrow and underline, but replaced it with a
`Selected work` edge label. This change removes that replacement from the
homepage portfolio heading, following TY-01's confirmed #295 decision.
SH-02 now records this scoped exception to the general attached-label rule.

The heading remains an h2 with its purple emphasis and shared opposing
corners. A plain h2 with the existing `detection-heading` class avoids
rendering an empty label. No spacer, new margin, or compensating gap is added.
The original eyebrow's spacing and underline were already absent at baseline.
The shared heading padding belongs to the retained corner frame.

## Production browser verification

Both capture sets use local production builds and Chromium, reduced motion,
and analytics disabled. T3 preview reported no connected desktop automation
host, so verification used headless Playwright. The before build used Vite
preview; after verification used a Python static server for `dist` after Vite
preview stopped responding. These are local captures, not production deployment
evidence. The white outline around the section is its existing anchor-focus
indicator, visible after direct hash navigation in both capture sets.

| Viewport | Before | After | Heading / paragraph gap | Paragraph / cards gap |
| --- | --- | --- | --- | --- |
| 1440 × 900 | [Before](assets/featured-heading-295/before-1440.png) | [After](assets/featured-heading-295/after-1440.png) | 14px | 40px |
| 980 × 1324 | [Before](assets/featured-heading-295/before-980.png) | [After](assets/featured-heading-295/after-980.png) | 14px | 40px |
| 390 × 844 | [Before](assets/featured-heading-295/before-390.png) | [After](assets/featured-heading-295/after-390.png) | 14px | 40px |

All three after captures open with Featured Case Studies, without a small
label or underline. The heading wraps cleanly on mobile; there is no horizontal
overflow or clipped heading. Desktop has three card columns, the intermediate
layout has two, and mobile has one. Section padding and neighboring section
spacing are unchanged.

Before/after measurements match for the heading, paragraph, and first card
rectangles, heading padding, card count, paragraph content, and every portfolio
link's text and destination. Project card source and corner styling are unchanged.
The original label was absolutely positioned, so its removal leaves no
in-flow spacing to reclaim.

At each viewport, both the hero's View Case Studies link and the footer's
Portfolio link navigate to `/#portfolio`. The heading lands approximately
192px from the viewport top, below the 69px sticky header. The collection
link retains its destination and count of 12.

## Checks

- Production build: passed, including display-image verification, sitemap,
  36 public-link checks, and static HTML for 21 routes.
- Existing local browser checks: 8 passed across desktop and mobile projects;
  portfolio heading/card styling, card navigation, and section visibility
  before scrolling, on anchor jumps, and in print.
- Isolated Portfolio unit tests: 2 passed using one thread worker.
- Impeccable detector for `Portfolio.jsx`: no findings.
- `git diff --check`: passed.
- The initial full unit run was stopped after a Contact worker timeout and
  publication fixture timeouts under concurrent environment load. It is not
  a passing full-suite result; required CI must verify the full suite.
- A focused thread-pool run passed 8 tests in 2 files but reported an unhandled
  worker-start timeout for `ScrollToTop.test.jsx`; that run is not a clean pass.

The existing unit and browser assertions requiring `Selected work` were
updated to validate the semantic Featured Case Studies heading. No new test
was added solely to assert the absence of a copied label or CSS class.
