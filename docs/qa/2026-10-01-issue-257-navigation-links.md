# Issue #257 navigation links verification

## Scope and baseline

Queue #267 was rechecked against current develop `c4619c216beb515861cbd3a702f93ce006d7c863`. #250/#251/#252/#253 already have merged implementations. #252/#253 retain separate acceptance gaps. At selection, #254 had active PR #277. No open PR or local task branch implementing #257 was found. Work used the current clean checkout and a task branch from develop. The branch was subsequently rebased onto develop `07e237910acd94f14b5917ad40f466546809153f` after unrelated PR #274 merged, then onto `db399db4726132371c85f7600bbf221d1cf89023` after PR #277 merged. Final unit, build and browser checks use the latter combined artifact. No worktree was created.

## Reproduction and change

Codex rebuilt develop and reproduced all four controls as BUTTON elements without href in the T3 production preview. A Meta-click event on the closing View case studies button navigated the source page to `/case-studies/`. Header desktop and drawer estimates and the hero estimate had the same imperative-navigation pattern.

Replace these controls with React Router Link. The hero retains Button asChild. Remove unused handlers and imports. The closing primary contact anchor also uses Link so plain activation uses the same route-focus lifecycle. Native modified events remain browser-owned. The drawer closes only on an unmodified activation.

WebKit rejected main focus immediately after drawer inert cleanup, even though the inert attribute had been removed. Deferring the shared route-focus call one animation frame fixed the reproduced pointer flow. Pending frames are cancelled on route changes and unmount. Hash focus and collection Back scrolling retain their existing owners. The route error fallback explicitly owns recovery-heading focus, so the generic frame yields when `[data-route-error]` is present. Persistent-after-frame integration tests protect synchronous and lazy recovery focus. A retained-source-action regression prevents a lazy page transition from being mistaken for destination focus.

Preserve all visual classes except the explicit text-center needed to retain the hero button's default alignment. Existing browser selectors are updated only where the control role changed. Contact submission remains a button and its live smoke test is untouched.

## Rendered checks

Codex independently inspected the source diff and the freshly built production page through T3 at 1440x900 and 390x844. Desktop header, hero and closing control sizes match the baseline. Mobile hero and drawer sizes match. Violet borders, glyphs, spacing, centered text and hover classes remain.

| Control | Viewport | Before and after size, CSS px |
| --- | --- | --- |
| Header estimate | 1440x900 | 175.5625 x 38.5 |
| Hero estimate | 1440x900 | 251.6328125 x 54 |
| Hero estimate | 390x844 | 343 x 44 |
| Drawer estimate | 390x844 | 335 x 46.5 |
| Closing View case studies | Both | 135.03125 x 20.5 |

T3 reserves a 15 px scrollbar, so mobile content width is 375 CSS px within the 390 px viewport. No horizontal document overflow was observed. T3 screenshots were inspected at both widths. Full-page pixel identity is not claimed because normal motion and rotating testimonial content change lower-page positions.

T3 keyboard activation navigated the drawer estimate to `/contact/`, removed the drawer, restored header/main/footer aria-hidden and inert state, and focused main-content. Some earlier T3 evaluations reported hasFocus=false, so those focused-element readings were not used as visible-outline proof. The final T3 mobile pointer flow reported hasFocus=true and main-content focused. The native browser matrix separately requires a focused document, focus-visible and an actual outline or ring for its keyboard flow.

Source/test diff SHA-256 against develop `db399db`: `f705c16ed5bd234884a78d934297a3a68598b1a507e67cc6c00012e69423a9e6`.

## Automated checks and review

- `npm test`: 63 files, 729 tests passed on the rebased source.
- `npm run build`: passed generated-image checks, Vite production compilation and 21 static routes.
- Focused native browser matrix: Chromium/WebKit, 1440x900/390x844, normal/reduced motion. 20 actual passes and four explicit macOS WebKit middle-click expected failures. Zero unexpected or flaky outcomes. All href, modifier, client-click, keyboard Enter, main-focus and drawer recovery assertions passed. Chromium middle-click passed. Mobile-width desktop profiles are intentional for real mouse input; adjacent QA also uses mobile device profiles.
- Existing focus, route-recovery and hero-motion QA: 114 passed and two expected applicability skips across Chromium/WebKit desktop/mobile projects.
- Adjacent responsive, visual, interaction, route and primary CTA accessibility checks: 64 passed on the final rebuilt artifact.
- `git diff --check`: passed. No ESLint configuration or runnable configured `.husky/_` hook was present; no lint setup was added.
- Fresh `/code-review`, using `.claude/commands/code_review.md`, ran in a separate read-only reviewer after the final fix. Standards/code quality PASS; Spec PARTIAL for the limits below. The reviewer independently ran 72 focused unit tests and inspected the final native result JSON. See [the final review](2026-10-01-issue-257-code-review.md).
- Codex independently inspected the complete source diff, corrected incidental selector mistakes, reproduced the defect and verified final rendered geometry and drawer behavior. The implementation lane was separate from both Codex and the fresh review lane.

The persistent recovery test failed before the recovery-ownership correction, then passed. The retained-source test failed under the broad child-focus guard, then passed under the bounded recovery-state rule. Earlier failed candidates and reviews were superseded; only the final source and final verdict are delivered.

Rerun the focused browser matrix with:

```sh
npx playwright test -c tests/qa/qa-navigation-ctas.config.js
```

Its default mode builds and serves a fresh local artifact and writes results outside the repository. For an existing production preview, set `QA_NAVIGATION_CTA_BASE_URL` and `QA_NAVIGATION_CTA_OUTPUT_DIR` to the local URL and an outside task directory.

## Acceptance and limits

The source supplies native link semantics for all four converted controls. Chromium native modifier and middle input and WebKit modifier input are checked with page-count and source-route assertions. Plain click and keyboard activation are checked with an in-document marker to prove client routing, main focus, drawer closure, released landmarks, reopening and Escape.

WebKit middle-click acceptance remains open. On this macOS Playwright WebKit runtime, a plain injected native anchor also navigated the source tab and produced no second page. The focused suite records macOS WebKit middle tests as expected failures, not passes. Pointer-open then keyboard-traversed drawer focus-visible behavior in WebKit remains a limitation shared with existing drawer links. The fully keyboard-open drawer flow passes with a visible focus indicator. This change does not claim to fix the pointer-open heuristic. Physical Safari, iOS, Firefox and screen-reader speech were not verified. No live contact submission, merge, deployment or deployed-host verification was performed.

This issue remains open until the remaining acceptance evidence and merge conditions are met.
