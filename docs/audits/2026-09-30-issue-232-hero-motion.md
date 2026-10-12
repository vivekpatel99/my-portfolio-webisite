# Issue #232 hero motion verification

[Issue #232](https://github.com/vivekpatel99/my-portfolio-webisite/issues/232) was rechecked and reproduced against develop `8fe91fb930275289bfe1f8f1f1ec3d0083e226f4` on 2026-09-30. The unconditional parallax frame loop and offscreen CSS animations remained present.

## Behavior

`Hero.jsx` owns one visibility boundary for CSS animations and parallax. Fine-pointer input starts a frame loop only while the hero is visible and motion is allowed. The loop stops after exact convergence, returns to neutral on leave, and cancels when visibility or preferences change or the component unmounts. Background depths are cached. The visibility observer uses its latest queued entry.

Offscreen CSS animations pause at their existing phase. Normal in-view animations resume. Reduced motion removes the animated treatment, and a coarse primary pointer starts no parallax loop. The invoice, portrait, all badges, detection frames, colors, commercial copy, and randomized invoice field selection retain their approved behavior.

## Matched production measurements

Codex ran fresh local production builds through the same Chromium browser, at 1440 × 900, normal motion and a fine primary pointer. Each run used a fresh browser context, no throttling, loopback-only transport, and identical input and settling waits. A probe installed before application load counted `--px` and `--py` writes. Each measurement window lasted two seconds.

| Window | Before writes | Final writes | Before running hero CSS animations | Final running hero CSS animations |
| --- | ---: | ---: | ---: | ---: |
| Idle after load | 3840 | 0 | 13 | 13 |
| Pointer move to 700,300 | 3856 | 816 | 13 | 13 |
| Settled after a three-second wait | 3840 | 0 | 13 | 13 |
| Offscreen after a 500 ms wait | 3840 | 0 | 13 | 0 |

Returning to view generated zero idle writes and resumed all 13 named animations. The first background box had identical fine-pointer displacement in both runs after 200 ms: `--px: 2.55px`, `--py: -3.21px`. Foreground rectangles were identical before and after at 1440 × 900 and widths 320, 390, and 768 with height 844. [Sanitized measurements and conditions](assets/2026-09-30/issue-232-performance.json) retain the counts and comparisons.

These are local work counts from one matched sequence. They do not establish field Core Web Vitals, jank, battery savings, or statistical latency improvements. Disabling an already-displaced parallax effect performs one neutral update before the measurement window. T3 timing varied, so its counts were excluded from this comparison.

## Checks

- The new idle browser regression failed against the unchanged production build with 3840 writes where zero was required.
- Final unit tests passed: 54 files, 569 tests. The 28 Hero tests cover scheduling, exact convergence, leave, visibility, batched observer entries, dynamic preferences, and cleanup. The observer-batch regression failed with the old first-entry callback and passed with the latest-entry callback.
- The final production build passed and generated 21 static routes. Local SEO QA passed with both targets explicitly set to the local preview.
- Final Hero browser QA passed 16 cases across desktop/mobile Chromium and WebKit. Four skips exclude fine-pointer cases on coarse mobile contexts and coarse-pointer cases on fine desktop contexts. Idle, convergence, leave, offscreen/resume, keyboard focus, reduced motion at load and after preference changes, and coarse-pointer behavior were exercised.
- Relevant existing responsive, visual, navigation/CTA, and focus QA passed 139 cases, with one expected skip. These checks include desktop/mobile geometry and Chromium/WebKit keyboard behavior.
- Codex inspected the source diff and the desktop/mobile T3 render. All portrait badges and the three selected invoice frames remained present. Tab followed by Enter on the hero estimate CTA reached `/contact/`. A rendered footer check showed the hero paused with zero running named animations.
- Scoped ESLint passed with zero errors or warnings. `git diff --check` passed. No live contact submission was used.

The retained Chromium regression runs with:

```sh
QA_LOCAL_ONLY=1 QA_ARTIFACT_SAFE_MODE=1 \
QA_PREVIEW_URL=http://127.0.0.1:3000 \
npx playwright test -c tests/qa/qa.config.js qa-hero-motion.spec.js \
  --project=preview-desktop --project=preview-mobile \
  --workers=1 --reporter=line --output=/tmp/issue-232-qa
```

Local WebKit verification used a temporary configuration outside the repository that extended `qa.config.js` and selected `qa-hero-motion.spec.js` in all four local projects. Existing CI selects Hero QA in Chromium and retains focus QA in WebKit.

## Independent reviews

Kiro CLI 2.26.0 used scoped agents pinned to `claude-opus-5.5`. Live CLI readbacks for both the implementation and final review sessions displayed that model. Implementation session `2c332d88-d353-40e5-bf76-18709a490061` was followed by a fresh requirements/code-quality review, `2d7c8724-72d0-448d-8f39-f50c6c1875ba`. That review found the stale observer-entry edge case. Opus corrected it in session `a0bf9f59-06c5-42aa-bb92-1e0b540d5aa9` and added its regression.

A second fresh review, `fb89a1fd-2327-42da-9145-bef84c8bc3f0`, inspected the final runtime and test diff and reported no actionable findings for either requirements or code quality. Reviewers inspected source; Codex owns the browser results. The provider's underlying served revision was not separately exposed. Two incompatible V3 review attempts could not read the artifacts and were excluded from the review evidence.

## Delivery boundary

The issue remains open pending acceptance and the required merge conditions. This work targets develop. It does not merge, release to main, or deploy. Hidden-tab throttling remains browser-owned; this change gates visibility relative to the viewport. Existing unrelated audit findings remain separate.
