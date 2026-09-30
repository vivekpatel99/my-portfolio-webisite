# Issue #110 — WebKit mobile-menu focus verification

**Date:** 2026-09-29
**Issue:** #110 — [P2] Keep mobile-menu focus contained and restore its toggle in WebKit
**Fix commit:** `0bbf61b` "Fix WebKit focus and add browser regression coverage" (already merged into `develop` and `main`)
**Scope of this document:** independent re-verification only. No application code was changed during verification.

## Summary

The fix for issue #110 is already present in `src/components/Header.jsx` and covered by
`tests/qa/qa-focus.spec.js`. This session re-verified the fixed behavior against a local
production build. All six focus tests passed in each of four browser projects at the
scenario-specific viewports listed below. The fixed behavior passed, so `Header.jsx` was
not changed. The pre-fix probe described below does not establish an independent
reproduction of the original defect.

## Focus behavior and commit history

Commit `0bbf61b` changed `src/components/Header.jsx` to:

- Save the menu toggle as the focus restoration target instead of the previously active
  element.
- Trap `Tab` and `Shift+Tab` with a cyclic index over the full focusable sequence instead
  of checking only the first and last elements. This keeps links reachable when WebKit's
  keyboard setting skips links during native traversal.
- Restore focus to the saved toggle when the menu closes.

The close button was already focused on open before `0bbf61b`.

The current header also blurs prior focus and uses `preventScroll` when focusing the close
button. Those changes came in `fff5306`. Commit `67a83cd` added the desktop resize focus
target. The current code also restores background inert state and scroll position.

## Limit of the pre-fix probe

A disposable HTML probe compared the pre-fix and fixed trap logic under Playwright
WebKit at `390×844`. It called `element.click()` in page JavaScript, which dispatches a
synthetic click rather than pointer input. The probe's menu focus order and WebKit
keyboard-navigation setting were not recorded, so they cannot be checked against the
real component and the reported environment.

In the pre-fix `Header.jsx` (`0bbf61b^`), the logo link comes before the close button.
If WebKit includes links in native keyboard traversal, one `Shift+Tab` from the close
button moves to the logo and stays inside the dialog. The probe therefore cannot
establish the reported focus escape or the `document.activeElement === BODY` symptom.
The verdict below excludes the probe.

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

Covered behaviors: programmatic menu open → close-button focus; `Shift+Tab`/`Tab`
containment across the full sequence; `Escape` → toggle restoration; menu-link navigation;
inert + scroll-position cleanup; desktop-resize release and keyboard reopen.

## Verdict

Issue #110 is fixed and merged (`0bbf61b` in `develop` and `main`). The focus suite passes
in WebKit and Chromium at the scenario-specific viewports above. No further code change
is required.
