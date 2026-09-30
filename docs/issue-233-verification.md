# Issue #233 verification

Verified on 2026-09-30 against `develop` commit `8fe91fb930275289bfe1f8f1f1ec3d0083e226f4` in the current checkout. This record covers local production behavior. It does not authorize merging or deployment.

## Defect and correction

Other Work cards requested the article collection-return path but omitted the departure snapshot. The shared capture boundary now surrounds core cards and Other Work and uses the existing collection-origin predicate. It saves the current `{loadedCount, scrollY}` before pointer, keyboard click, or auxiliary activation. Per-card capture props were removed. Collection eligibility, resume/query/hash handling, native Back restoration, and visual styles stay in their existing owners.

Codex reproduced the defect in the original production build before implementation. At 1440×900, opening `/project/ai-project-planning-assistant/` from the collection at `scrollY=1388.5` returned to `0`; the selected card was below the viewport. A real previous core-card visit saved `186`, and the subsequent Other Work departure at `1388.5` returned to `186` instead.

After the fix, Codex's T3 browser observations showed:

| State | Departure | Return | Selected card |
| --- | ---: | ---: | --- |
| Desktop, fresh session, pointer | 1388.5 | 1388.5 | Visible, link viewport y 364.09–664.09 |
| Desktop, existing core snapshot 186 | 1388.5 | 1388.5 | Visible; current departure replaced the core snapshot |
| Mobile 390×844, fresh session, Enter | 3516 | 3516 | Visible, link viewport y 335.78–635.78 |

Desktop and mobile before/after comparisons of every initially rendered card matched exactly for x, document y, width, height, background, and border color. Codex also inspected rendered desktop/mobile views. At 320×568, both Other Work titles wrapped without horizontal clipping, there was no page overflow, and Tab moved between their links with visible focus outlines. Article keyboard navigation still focused `main-content` at the page top.

## Checks

- `npm test`: 571 tests in 55 files passed on the final source.
- New composition regressions failed before implementation. A later mutation that blocked Other Work capture caused 7 of 10 composition tests to fail, including both real stale-core cases, then the source was restored.
- Final collection-return Playwright matrix: 32 passed, comprising 16 Chromium and 16 WebKit desktop/mobile tests with normal and reduced motion. Both Other Work entries were exercised in the fresh, prior-core, and keyboard pagination paths.
- Adjacent local route/navigation/focus QA: 90 passed in Chromium desktop/mobile.
- `npm run build`: passed; static output generated for 21 routes.
- `node tests/qa/qa-seo-check.js`: passed.
- Scoped ESLint `no-unused-vars` and `no-undef` checks on the three changed source files passed. `git diff --check` passed.

The regressions exercise both Other Work cards, fresh and actual prior-core sessions, exhausted pagination and retained keyboard focus, loaded-count restoration, native Back, and explicit article returns within 100px. They run with normal and reduced motion. Existing unit tests cover origin markers, resume consumption without losing unrelated URL parameters/hash, SSR/noscript, empty collections, storage failures, and publication eligibility.

To rerun locally, build and serve the checkout with `npm run build` and `npm run preview`. Use `QA_LOCAL_ONLY=1` and point `QA_PREVIEW_URL` at that exclusive preview port. Run `npx playwright test -c tests/qa/qa.config.js --project=preview-desktop --project=preview-mobile --grep 'collection return'`. WebKit verification used the existing WebKit project settings with `testMatch` extended to the collection regression spec in a disposable configuration. Raw logs, screenshots, and configurations were kept outside the repository.

## Review and limits

Kiro Claude Opus 5.5 implemented the change and reviewed it in a separate fresh session. Both interactive sessions reported `claude-opus-5.5`. The first review identified a stale-core test gap, duplicated origin parsing, unnecessary comments, and data-count assumptions. Those findings were corrected. The fresh final Opus review found no blocking or actionable defects on either specification or code quality. A WebKit run exposed a pointer-focus assumption in the test, which was corrected to exercise keyboard focus retention. Codex independently inspected the final source/tests and drove the T3 browser and local QA.

The final browser setup clears both session and history snapshots before a fresh iteration, because same-URL document navigation can retain history state.

Physical devices and the deployed host were not tested. Middle-click snapshot capture has unit coverage; actual new-tab storage inheritance was not tested. No live contact submission was performed. The issue stays open until the required PR checks, review, and acceptance/merge conditions are met.
