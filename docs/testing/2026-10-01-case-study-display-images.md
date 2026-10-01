# Case-study display image verification

Issue: [#251](https://github.com/vivekpatel99/my-portfolio-webisite/issues/251).
Starting `develop`: `448af6aff86db8304d21e15caf90a849f11fbf58`.
The next available item in #267 was rechecked and reproduced on that revision.

Cards and inline galleries previously requested originals. The registry now
binds 29 published source paths to 23 distinct WebP display assets. All display
assets are 16,110–99,108 bytes. Expanded images and original-image links retain
the original source. CSS, intrinsic width/height attributes, object-cover,
stage aspect ratios, frames, layout and motion code are unchanged.

## Cold-cache measurements

Production build served locally with Vite preview; Chromium, fresh context for
each run, cache disabled, service workers blocked, CPU 4×, 150 ms RTT,
1.6 Mbps download and 750 Kbps upload. Three sequential runs per route, with
build/test work finished before either measurement set. The same probe logic
and conditions were used before and after. LCP was collected through a
PerformanceObserver after network idle plus 1.5 seconds.

| Route/profile | Before LCP (ms) | After LCP (ms) | Median before → after |
|---|---|---|---|
| Collection, 412×823 DPR 1.75 | 4280, 4272, 4280 | 1860, 1856, 1868 | 4280 → 1860 |
| n8n article, 1350×940 DPR 1 | 4124, 4112, 4112 | 1768, 1760, 1752 | 4112 → 1760 |
| Home, 1350×940 DPR 1 | 1800, 1796, 1796 | 1800, 1804, 1796 | 1796 → 1800 |

Every measured image request is below 100,000 bytes after the change. The
collection's maximum is 79,588 bytes; the article/home maximum is 98,082 bytes.
Resource entries include browser preload/hydration requests, so their totals
are not unique-file inventories. [Compact results](case-study-display-images-251/measurements.json).

Reproduce on a local production preview:

```sh
npm ci
npm run build
npm run preview -- --port 4178 --strictPort
node tools/measure-case-study-display-images.mjs /tmp/case-study-measurements.json
```

The build regenerates derivatives in a temporary directory with pinned Sharp
0.35.5 and verifies exact committed bytes, source/derivative hashes,
content-addressed filenames and dimensions. It fails rather than overwriting
stale committed assets. To create new assets, use
`node tools/generate-case-study-display-images.js --write`, then review its
reported bindings and update the registry deliberately.

## Rendered verification

Codex inspected the local production preview through T3 at 1350×940 desktop
and 412×823 mobile. The desktop article image remains 674×179.0234375 CSS px
in a 700×205 stage. The mobile collection card remains 339×300 CSS px in T3
with its visible scrollbar; the fresh lab profile renders 354×300. The mobile
inline article stage is 353×103.390625 with no page horizontal overflow.

The screenshots below are downscaled T3 captures of those same viewports.
Pixel changes are confined to image content: mean absolute RGB channel delta
is 0.1645/255 for the article and 0.2155/255 for the collection. Codex inspected
the before/after rendered images and found no visible identity or geometry
change. WebP introduces small pixel differences; these captures are not a
claim of byte-exact visual equality.

| Surface | Before | After |
|---|---|---|
| Desktop article | [Before](case-study-display-images-251/article-before.png) | [After](case-study-display-images-251/article-final.png) |
| Mobile collection | [Before](case-study-display-images-251/mobile-before.png) | [After](case-study-display-images-251/mobile-final.png) |

Keyboard checks in T3: Enter opens the enlarged image, focus moves to Close,
Tab/Shift+Tab stay inside the dialog, and Escape closes it and restores opener
focus. The enlarged image loads the original 2984×874 image; root inert state
clears on close. Automated route/focus/geometry checks also exercise both
normal and reduced motion in Chromium and WebKit, desktop and mobile.

## Checks and limits

- `npm test -- --run`: 64 files, 716 tests passed, including card/gallery,
  publication/plugin guards and generator negative-path tests.
- `npm run build`: passed; 23 regenerated derivatives verified for 29 sources;
  Vite and 21 static routes generated successfully.
- Independent `node tools/generate-case-study-display-images.js --check`:
  passed. `git diff --check` and probe syntax check passed.
- Gallery-focused Playwright matrix: 38 passed, two failed. Both failures are
  WebKit desktop normal/reduced-motion assertions for the short wide stage:
  expected ratio 4.672489, actual 4.610951, tolerance 0.05. The identical two
  failures and values were reproduced on an immutable export of starting
  `develop`. No assertions or gallery CSS were relaxed.
- A mobile six-image enlarged dialog already overflows on starting `develop`
  (462 px width, left −73 px at viewport 412×823); the task has identical
  geometry. This pre-existing gallery CSS issue remains outside #251.
- Pre-commit hooks were unavailable: configured `.husky/_` directory is absent
  in this checkout. Explicit checks above were run.
- Measurements are local lab evidence. Field data, deployed host caching,
  Firefox and real Safari were not verified. No merge or deployment performed.

The fresh review verdict is recorded in the PR. Keep #251 open until its
acceptance and merge conditions are met.
