# Issue #263 — WebKit route-chunk Retry recovery

Date: 2026-10-02 (Europe/Vienna)
Base: develop `a0622e6795d8fd03fe19199a7452aa1ce163724b`

## Repro (before fix)

Production preview of `dist/`. Playwright WebKit and Chromium, viewports 1280×800 and 390×844.

1. Abort the next `ContactRoute-*.js` request.
2. Open `/contact/` → fallback "This page didn't load".
3. Restore the network and click **Retry**.

| Browser | After Retry | Chunk re-requested? |
| --- | --- | --- |
| WebKit 1280 / 390 | Fallback persisted (`navigation.type=reload`) | No |
| Chromium 1280 / 390 | Contact page recovered | Yes (same URL after reload) |

In-page probe: WebKit `import(chunkURL)` stayed failed; `import(chunkURL + '?retry=1')` succeeded.

## Fix

- `lazyRoute()` wraps route `import()` factories; Retry bumps a generation and remounts a fresh `React.lazy` instead of `window.location.reload()`.
- On remount, if the original module URL still fails (WebKit module map), re-import with `?retry=<generation>` resolved from the Vite specifier relative to `import.meta.url`.
- Back to Home unchanged; Chromium still recovers.

## Proof (after fix)

- Unit: `lazyRoute.test.js` + `RouteErrorBoundary.test.jsx` — 18/18 passed.
- Playwright `qa-route-recovery.spec.js` with `QA_LOCAL_ONLY=1`:
  - preview-desktop + preview-webkit-desktop — 18/18
  - preview-mobile + preview-webkit-mobile — 18/18
- AC test: after connectivity returns, one Retry shows "REQUEST A PROJECT ESTIMATE" / Full Name without a new tab; WebKit requests `ContactRoute-*.js?retry=1`.
- `npm run build` — passed (21 static routes).

## Residual

Physical Safari desktop and iOS were **not** verified on this path. Playwright WebKit is the CI evidence only. Owner Safari check still needed before claiming end-user Safari impact is closed.
