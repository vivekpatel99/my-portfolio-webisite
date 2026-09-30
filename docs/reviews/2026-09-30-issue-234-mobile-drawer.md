# Issue #234 mobile drawer verification

Verified on 2026-09-30 against `develop` at
`8fe91fb930275289bfe1f8f1f1ec3d0083e226f4`, using the current checkout.
The issue remains reproducible on that commit. This change targets `develop`.
It does not authorize a merge or production release.

## Reproduction and correction

Codex reproduced the issue in a local production build. At 568×256 and
320×256, the drawer had `clientHeight=256`, `scrollHeight=306`, and
`overflow-y=visible`. An attempted scroll left `scrollTop=0`. The CTA ended
at y=306.28. Tab focused Testimonials and then the CTA without revealing
their complete bounds. At 320×320, every control fit.

Codex also ran the new regression against the unchanged build. It failed
when Tab reached Testimonials at 568×256 and Case Studies at 320×200.
Opus's complete baseline matrix produced 48 visibility failures and 16
passing comparison cases across Chromium and WebKit.

`Header.jsx` adds `overflow-y-auto` to the shared fixed drawer. Its outer
flex column starts at the top. The inner navigation retains its content
minimum height, so centering does not move overflowing items above the
scroll origin. The existing focus trap can now scroll focused controls
into view. The logo and close row scroll with the menu content.

The change preserves colors, fonts, spacing, routes, focus handling, and
landmark cleanup. It adds no state, event listeners, or dependencies.

## Independent rendered verification

Codex rebuilt the production bundle and drove the T3 collaborative preview.
At 568×256 and 320×256, all seven actions became fully visible and hittable
through Tab. Focusing the CTA increased the drawer's scroll position to
50.5px and brought its bottom to y=255.78. Scrolling to the end increased
the position to 78.5px and brought the CTA's bottom to y=227.78.

The initial vertical action positions at 320×320 and 390×844 match the baseline.
The tall drawer still has a 68px header row, its first navigation item at
y=311.36, and its CTA at y=769.5. At 1440×900, all visible desktop header
control rectangles and colors match the baseline. No horizontal drawer
overflow was observed at 320px width.
At 320×320, the controls still fit without scrolling. The drawer now exposes
14px of scrollable bottom padding; hosts with classic scrollbars reserve
horizontal space for that scrollbar.

Escape removes the drawer, returns focus to the toggle, and releases inert
state. Resizing an open drawer to 768px removes it, releases inert state,
and focuses the desktop estimate button. Codex inspected the rendered short
drawer and its reachable CTA as well as the source diff.

## Automated checks

- All 559 unit tests in 54 files pass after the source change.
- The production build passes and generates 21 static routes.
- All 98 selected passive browser checks pass in Chromium and WebKit,
  with desktop and mobile contexts.
- The new matrix covers 568×256, 320×256, 320×200, 320×320, and 390×844 on
  the home route, plus the shortest layouts on `/case-studies/`.
- Both normal and reduced motion pass. Tests measure complete control
  bounds and hit targets during Tab, Shift+Tab, and scrolling. They also
  cover Escape, focus wrapping, landmark release, resizing to 768px, and
  clicking the CTA to navigate to contact. They submit no contact form.
- Desktop Chromium and WebKit also verify native wheel scrolling. Every
  short mobile case checks computed scroll capability as well as keyboard
  and programmatic scroll reachability. Playwright rejects wheel input in
  mobile WebKit and provides no native touch-scroll gesture API.
- A temporary rendered `overflow-y: hidden` mutation fails the scroll guard.
  The earlier wheel guard independently rejected the same mutation.
- Scoped ESLint checks and `git diff --check` pass.

Run the browser checks against a completed local production preview with
these commands. Set `QA_PREVIEW_URL` to the preview's actual port. Artifacts
must use an absolute temporary directory outside the repository.

```sh
npm test
npm run build
QA_LOCAL_ONLY=1 QA_ARTIFACT_SAFE_MODE=1 QA_PREVIEW_URL=http://127.0.0.1:4234 \
  npx playwright test -c tests/qa/qa.config.js \
  --project=preview-desktop --project=preview-mobile \
  --project=preview-webkit-desktop --project=preview-webkit-mobile \
  --grep 'keyboard focus regressions|mobile menu' \
  --output=/absolute/task-directory/passive-results --reporter=line --workers=2
npx eslint --no-eslintrc --env browser,es2022 \
  --parser-options '{"ecmaVersion":2022,"sourceType":"module","ecmaFeatures":{"jsx":true}}' \
  --plugin react --rule 'react/jsx-uses-vars:error' \
  --rule 'react/jsx-uses-react:error' --rule 'no-undef:error' \
  --rule 'no-unused-vars:error' src/components/Header.jsx tests/qa/qa-focus.spec.js
git diff --check
```

## Review and limits

Kiro used a validated temporary agent configuration pinned to
`claude-opus-5.5`. Its interactive runtime displayed that model as active.
Opus wrote the regression tests and the source correction. A separate fresh
Opus review found no requirements defect and identified a test gap because
programmatic scrolling also works with `overflow: hidden`. Opus added the
wheel and computed-scroll-capability guards. Codex independently inspects
the diff and executes the checks above.
The fresh final Opus review reports no actionable findings under either
requirements or code quality after inspecting the corrected tests and evidence.

Native 200% browser zoom remains unverified. T3's zoom shortcut did not
change the measured viewport, device pixel ratio, or visual viewport scale.
Viewport reflow checks do not substitute for native browser zoom.
T3 rejects preview heights below 240px, so the 320×200 acceptance case was
verified through Playwright in both browser families.
Native touch gestures on a physical mobile device remain unverified.

The close button scrolls out of view when scrolling down a short drawer.
Keyboard traversal brings it back into view, and Escape remains available.
Issue #234 stays open pending owner acceptance, native zoom verification on
a supporting host, and the required checks and merge conditions.
