# Hero, gallery, and card decorative boundaries

Verified on 5 October 2026 on `codex/hero-gallery-boundaries`, based on develop `d82e133f486666e182d61cd6fb2ba55cb32b94e4`. The predecessor chats released the shared checkout before branch creation. The predecessor heading changes and unmerged PRs #312 and #313 are excluded. This implementation has no dependency on those changes. The existing card category-label alignment from #310 is preserved.

## Approved changes

- SH-02 and OC-02. The portrait retains its stronger top-left/bottom-right strokes, transparent engineer label, existing 0.99 score, crop assets, frame size, and ID/REC badges.
- DP-01. Empty floating boxes and portrait ghost borders become faint borderless light. Existing lighting, drift/parallax lifecycle, and reduced-motion safeguards remain. No detection labels or confidence scores are invented.
- SH-02 and SH-03. Inline gallery stages and outer lightboxes reuse the shared opposing corners with transparent PROJECT EVIDENCE labels. The lightbox has one decorative outer frame. Controls, selected thumbnails, focus outlines, captions, zoom, and media rendering remain functional.
- The decorative arrow inside each card remains visible without a nested bordered tile. Card navigation and label alignment remain intact.
- DESIGN.md records only these approved changes. Functional OCR fields retain all four corners, the same six fixed scores, and the same pair animation.

## Verification

The baseline and final unit suites passed 68 files and 850 tests. Initial sandboxed baseline failures were local-server EPERM restrictions; the scoped rerun passed. The focused hero, gallery, and card suites passed 48, 30, and 13 tests. One old card assertion for the removed border was deleted; its SVG geometry checks remain.

Display-image integrity, production Vite build, sitemap, and static generation passed. Static generation checked 36 links and 21 routes. All outputs were outside the repository. Existing dist and the parent review server on port 3000 were preserved. Scoped ESLint with react-app rules passed with the existing Babel preset dependency warning. No typecheck script exists; JSX compilation and lint passed.

The installed Playwright 1.60.0 Chromium desktop/mobile projects passed 141 checks with 3 expected coarse-pointer skips. The selected suites were qa-hero-ocr-labels, qa-hero-motion, qa-visual, and qa-routes. They cover standard/reduced motion, annotation geometry/cycle, lifecycle cleanup, passive routes, media loading, gallery geometry, and navigation. External contact submission was disabled.

Direct visual inspection in the Codex in-app browser covered the hero and cards at desktop and 390px widths, wide n8n gallery inline/lightbox, and a single-image depth case study. Card hover retained purple corners and keyboard focus retained its separate 2px outline. Gallery label line boxes measured centered exactly on the top edge with transparent backgrounds; the lightbox has no nested decorative stage frame. Gallery ArrowRight, Shift+Tab wrapping, zoom-out disabled at 100%, zoom to 150%, Escape, and opener focus restoration were exercised. Thumbnail keyboard focus retained its 3px outline.

Visual inspection reproduced an existing wide-gallery lightbox overflow on port 3000 at 390px: the 462px dialog started at x=-95 in a 375px scrollable viewport. A bounded grid column and shrinkable dialog now keep the outer frame and label within 320px and 390px viewports. The committed regression check verifies those bounds, label alignment/transparency, Escape, and focus restoration. It passes in both Chromium projects.

No current public case study has video media. A temporary local fixture imported the real gallery component and styles with an existing repository video and poster copied only into its external temporary output. Desktop/mobile native controls remained visible. Video metadata loaded with readyState 4 and duration 30 seconds, playback started without an error, image/video selection worked, zoom controls disappeared for video, and Escape from focused video restored focus to the remaining thumbnail. The fixture is not a published case study and is removed during cleanup.

Separate read-only standards and specification reviews found no actionable issues. Diff whitespace checks passed. This is scoped local verification, not a whole-site audit or production deployment verification.

## Visual evidence

| View | Desktop | Mobile |
| --- | --- | --- |
| Hero | [Desktop](decorative-boundaries-2026-10-05/hero-desktop.jpg) | [Mobile](decorative-boundaries-2026-10-05/hero-mobile.jpg), [portrait](decorative-boundaries-2026-10-05/portrait-mobile.jpg) |
| Cards | [Rest](decorative-boundaries-2026-10-05/card-desktop.jpg), [keyboard focus](decorative-boundaries-2026-10-05/card-focus-desktop.jpg) | [Mobile](decorative-boundaries-2026-10-05/card-mobile.jpg) |
| Gallery | [Desktop](decorative-boundaries-2026-10-05/gallery-desktop.jpg) | [Mobile](decorative-boundaries-2026-10-05/gallery-mobile.jpg) |
| Lightbox | [Desktop](decorative-boundaries-2026-10-05/lightbox-desktop.jpg) | [Mobile](decorative-boundaries-2026-10-05/lightbox-mobile.jpg) |
| Temporary video fixture | [Desktop](decorative-boundaries-2026-10-05/video-desktop.jpg) | [Mobile](decorative-boundaries-2026-10-05/video-mobile.jpg) |

## Integration follow-up

The babysitting follow-up incorporates develop `e6a2101de1325f4b4a86c662b6188b1fb7f6e607` after PRs #311 and #312 merged. The guide conflict preserves both the approved portrait direction and the new Previous work heading label. Action labels and the rest of those integrated changes remain intact. The original screenshots above document the initial scoped patch; final integration is checked by the follow-up build, tests, and hosted CI.

Follow-up verification passed all 850 unit tests, the production build and static route generation, and 147 Chromium desktop/mobile browser checks (five device-specific skips), including the integrated action labels. An independent read-only review found no actionable regressions against the updated develop base.

A second integration follow-up incorporates develop `e464ef46e0bf6a54d70df8a064ebd3b8a0c77aae` after PR #313 merged during CI. The guide retains its approved service/contact panels alongside this PR’s gallery decision. No application-source conflict occurred.

The second integration passed 850 unit tests, production build/static generation, and 83 visual/upgrade-flow Chromium checks across desktop/mobile (one device-specific skip), plus independent review.
