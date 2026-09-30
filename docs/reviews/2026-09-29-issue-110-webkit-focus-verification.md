# Issue #110 — WebKit mobile-menu focus verification

**Date:** 2026-09-29
**Issue:** #110 — [P2] Keep mobile-menu focus contained and restore its toggle in WebKit
**Fix commit:** `0bbf61b` "Fix WebKit focus and add browser regression coverage" (already merged into `develop` and `main`)
**Scope of this document:** independent re-verification only. No application code was changed during verification.

## Summary

The fix for issue #110 is already present in `src/components/Header.jsx` and covered by
`tests/qa/qa-focus.spec.js`. This session re-verified the behavior against a local
production build and reproduced the original defect against the pre-fix logic to prove
the regression coverage is meaningful. All six focus tests passed in each of four
browser projects at the scenario-specific viewports listed below. No behavior still
failed, so `Header.jsx` was not changed.

## What the fix does

`src/components/Header.jsx` (current):

- Blurs any prior active element, then focuses the close button on open
  (`closeButtonRef.current?.focus({ preventScroll: true })`, line ~62), instead of saving
  and later restoring `document.activeElement` (which could be `BODY` after a WebKit
  pointer click).
- Traps `Tab`/`Shift+Tab` with an explicit cyclic index over the full focusable sequence
  (lines ~93–113), rather than a first/last boundary check. This keeps links reachable
  when WebKit's default keyboard setting would skip them.
- On close, restores focus to the actual toggle (mobile) or the desktop estimate button
  after a resize (`desktopQuery.matches ? desktopEstimateRef.current : toggleButtonRef.current`,
  line ~135).
- Preserves inert/`aria-hidden` background state and scroll position across open/close.

## Reproduction of the original defect (pre-fix logic)

A disposable HTML probe replicated the pre-fix trap logic (from `0bbf61b^`) versus the
fixed trap logic in plain JS, run under Playwright's default `Desktop Safari` WebKit at
`390×844`. Pointer-open used `element.click()` so WebKit does not focus the toggle first.

Result:

- **Baseline (pre-fix) logic:** after opening by pointer and pressing `Shift+Tab` from the
  close button, focus leaves the dialog (`menu.contains(document.activeElement) === false`).
  This is the reported containment defect.
- **Fixed logic:** focus stays contained across `Shift+Tab` and a full `Tab` cycle, and
  `Escape` restores the toggle.

### Reproduction nuance

This Playwright WebKit build focuses buttons on pointer `.click()` and lets `Tab` visit
buttons and links, so it does not reproduce the exact `document.activeElement === BODY`
symptom the two reviewers observed with WebKit 26.4 under a specific macOS default. The
browser-version-robust invariant reproduced here is the underlying defect: under the
pre-fix boundary trap, keyboard traversal escapes the open dialog. The fixed cyclic trap
upholds containment and explicit toggle restoration.

## Commands and results

Build:

```
npm run build
# ✓ built; sitemap.xml generated; static HTML for 21 routes
```

Preview server (loopback):

```
npm run preview   # http://127.0.0.1:3000 -> HTTP/1.1 200 OK
```

Repo focus suite across WebKit (desktop + mobile) and Chromium (desktop + mobile):

```
QA_LOCAL_ONLY=1 QA_PREVIEW_URL=http://127.0.0.1:3000 \
npx playwright test -c tests/qa/qa.config.js \
  --project=preview-webkit-desktop --project=preview-webkit-mobile \
  --project=preview-desktop --project=preview-mobile \
  --grep "keyboard focus regressions"
# 24 passed (6 tests × 4 projects)
```

Each test sets its own viewport in `tests/qa/qa-focus.spec.js`, overriding the project
default. The menu containment and Escape restoration test uses `390×600`; menu-link
navigation uses `390×844`; the resize tests use `767×844` and `768×844`; and the gallery
tests use `1280×720`. The four projects exercise WebKit and Chromium browser contexts,
but this run does not repeat every scenario at both mobile and desktop widths.

Covered behaviors: pointer-open → close-button focus; `Shift+Tab`/`Tab` containment across
the full sequence; `Escape` → toggle restoration; menu-link navigation; inert +
scroll-position cleanup; desktop-resize release and keyboard reopen.

## Verdict

Issue #110 is fixed and merged (`0bbf61b` in `develop` and `main`). The focus suite passes
in WebKit and Chromium at the scenario-specific viewports above. No further code change
is required.
