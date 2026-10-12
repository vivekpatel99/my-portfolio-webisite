# Testimonial footer counter

Verified on 8 October 2026 from `develop` commit `751464d678d26335d3b9b423f39a41a227a41786`.

The decorative purple diamond and its 148px desktop rail are removed. The quote article fills the panel while retaining its padding and 790px reading measure. The existing Field counter sits below the quote beside the client identity and source in the wrapping footer. DESIGN.md records the confirmed decision under SH-02.

## Verification

- Production build passed in a temporary source copy, including sitemap generation and 36 static-route link checks. The candidate was served on port 3014.
- The existing carousel and testimonial checks passed in Chromium desktop/mobile and WebKit desktop/mobile: 56 passed, four expected skips, no failures. Skips cover touch-only and mouse-hover-only cases on the opposite device class.
- Checks include autoplay, manual selection and persistent pause, mouse hover, focus hold/resume, overlapping stop reasons, touch focus, keyboard traversal and outlines, 44px non-overlapping diamond navigation targets, reduced motion, and live motion-preference changes.
- All ten testimonials passed layout and content checks at 1440px, 390px, 320px, and 640px in both browser engines: 80 slide checks. Each counter remains below the quote and inside the panel without overlapping the client details. The quote article fills the former rail space. No page overflows horizontally.
- Each selected slide retains its original project title, quote, client name/source, padded counter values, selected-dot state, slide announcement label, and polite live-region state when stopped. No carousel state or timing code changed.
- A broader initial selection passed 59 checks and skipped four, with one WebKit hero-button bottom-pixel failure. That unrelated check passed when rerun in isolation on both the unchanged parent preview and candidate. No hero-button files changed.
- `git diff --check` passed.

## PR review correction

The first CI run and Codex review identified one obsolete unit assertion that still required the removed rail. The failure reproduced locally (21 passing tests, one failure). The corrected test checks the counter inside the footer after the quote, its padded values before and after slide selection, and the absence of the decorative rail and complementary landmark. All 22 carousel unit tests and the full 914-test suite across 71 files then passed locally. This correction changes tests and this report; the rendered component and captured layout remain unchanged.

The first build was accidentally launched in the shared checkout. Its original output was reconstructed and restored byte for byte against the starting SHA-256 inventory of all 118 files. The parent preview server on port 3000 remained running. Subsequent builds and browser artifacts used the temporary copy.

## Evidence

The captures use reduced motion to hold the first quote. Desktop captures include the panel, section heading, and functional navigation dots. Narrow captures include the panel and attached edge label.

- [Chromium desktop](assets/testimonial-layout/chromium-desktop.png)
- [WebKit desktop](assets/testimonial-layout/webkit-desktop.png)
- [Chromium mobile, 390px](assets/testimonial-layout/chromium-mobile.png)
- [Chromium narrow, 320px](assets/testimonial-layout/chromium-narrow.png)
- [WebKit narrow, 320px](assets/testimonial-layout/webkit-narrow.png)
- [All slide geometry measurements](assets/testimonial-layout/layout-results.json)
- [Verification summary](assets/testimonial-layout/verification-summary.json)

## Repeat the carousel checks

Serve a production build on a separate local port. Run the standard Chromium carousel suite:

```sh
QA_LOCAL_ONLY=1 QA_PREVIEW_URL=http://127.0.0.1:3014 \
  npx playwright test -c tests/qa/qa.config.js qa-testimonials.spec.js \
  --project=preview-desktop --project=preview-mobile --workers=2
```

This task also used a temporary Playwright configuration with Desktop Safari and iPhone 14 WebKit projects, including the testimonial specs that the standard WebKit regression projects omit. It selected all carousel tests plus the testimonial panel/footer and homepage-flow checks from the accessibility and upgrade-interaction specs.

For a visual repeat, view every quote at 1440px, 390px, and 320px. Confirm the project and quote begin within the normal panel padding, the Field counter appears in the footer, and both counter and client/source stay within the frame. Select each navigation dot, then traverse the panel and dots with Tab. Check that reduced motion prevents autoplay and keeps manual navigation available.

These results verify the local candidate. They do not establish production deployment.
