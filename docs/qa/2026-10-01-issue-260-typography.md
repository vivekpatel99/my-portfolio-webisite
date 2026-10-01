# Issue 260 typography verification

The shared typography changes shorten desktop reading lines, keep rate values together, and balance headings. Literal testimonial and policy quotes and contact ellipses use typographic characters. The approved fonts, colors, frames, and gallery remain.

## Selection and reproduction

Checked the ordered queue in #267, live issue comments and states, open PRs, merged implementations, and occupied local task branches. Earlier items were implemented, owned by another thread, or awaiting a verification gate. #260 had no claim or matching implementation. This thread claimed it before editing.

The clean current checkout started on `t3code/implement-next-available-issue-1` at `966bcefdd79a8ba75b3639826c5fcde0123299e2`. The task branch starts at that current develop commit. No worktree was created. A separate agent owned the seven application files. Codex owned reproduction, browser tests, independent rendered inspection, delivery, and cleanup.

Reproduced in a freshly built production preview before editing. T3 measured the article's first paragraph at 92.67 characters per line and the closing home CTA at 93, both at 1440 px. At 390 px, `via contact form` had two line boxes. The service heading ended with `DEVELOPMENT`, the hero heading with `Engineer`, and testimonials had straight quote glyphs. Browser baseline capture covered 68 applicable cases.

## Acceptance evidence

The matched Chromium and WebKit matrix covers six routes at 390 and 1440 px with normal and reduced motion. Additional home cases cover 320, 360, 430, and 1024 px; the article also covers 1024 px. There are 68 applicable cases and 76 explicit applicability skips.

| Requirement | Result |
| --- | --- |
| Multiline desktop article and CTA paragraphs average at most 75 characters per line | Article maximum 92.67 before, 69.25 after. Home CTA maximum 93 before, 61.67 after. Both 1024 and 1440 pass in both engines and motion modes. |
| Article body matches summary size, or difference documented | Both are 17 px above 450 px; both remain 15 px at 390. Desktop prose uses a 56ch cap. |
| Each rate value has one line box from 320 through 430; no overflow | Both values stay on one line at all four tested phone widths in both engines and motion modes. All 68 cases have no horizontal overflow. |
| Listed headings avoid a single-word last line at 390 and 1440 | All multiword H1/H2/H3 headings on the six target routes pass. This includes hero, contact, article, service cards, main collection cards and Other Work cards. |
| No straight double quote or three-dot ellipsis in visible target-page text | Rendered scans pass on home, contact, Legal and Data Policy. The contact placeholder also passes. The sending label is `Sending…`; no live submission was sent. |
| Gallery width and 390 px layout unchanged | Gallery widths match all 12 article cells. The six sampled geometry groups match in all 24 mobile route/engine/motion cells. Article body and CTA paragraph widths, heights and font sizes at 390 remain unchanged. Heading line breaks intentionally balance; mobile rate values remain intact within the same strip height. |

The service-detail H1 exception in the issue remains documented. Its long `COMPUTER VISION / MODEL / DEVELOPMENT` display heading is outside the six target routes and is not claimed to avoid widows. Browsers without `text-wrap: balance` retain ordinary wrapping.

An initial 60ch article cap left the outcome paragraph at 79.4 characters per line in Chromium. A T3 probe at 56ch brought it to 66; the implementation agent made that correction. The final unchanged browser assertions pass. The gallery stays 700 px on desktop. The mobile body retains its existing 15 px size to preserve the explicitly required 390 px layout.

## Independent inspection and checks

Codex inspected the full application and QA diff and viewed desktop/mobile renders through T3. Independent T3 checks confirmed the balanced headings, final reading measure, one-line rate values, and unchanged gallery width. The estimate CTA had a solid focus outline in a focused document; Enter navigated to contact. Enter opened the gallery, Escape closed it, and focus returned to the opener. Browser regression tests repeat these keyboard flows across desktop/mobile and normal/reduced motion.

- `npm test` passes 733 tests in 63 files. The separate implementer also ran 82 existing CTA, Contact and Testimonials tests.
- `npm run build` passes, including image checks, public-link checks, sitemap and 21 static routes. The existing entry chunk warning remains.
- Final typography browser suite passes 68 cases with 76 applicability skips. Baseline capture also passes 68 cases.
- Existing hero geometry, badge and first-screen checks pass all 40 cases in Chromium/WebKit with normal/reduced motion.
- Scoped ESLint parsing and `git diff --check` pass. There is no repository ESLint configuration; this scoped run uses explicit environment/parser options and does not claim a configured rule audit.
- Impeccable's detector reports only the pre-existing article blockquote border and gradient-text rule. These are outside the change and preserve the approved visual identity.
- `/deslop` found no added abstraction, guard, cast or explanatory comment. The read-only `/no-comments` pass found no new comments or suppression directives and required zero deletions.
- Fresh separate `/code-review` requirements and standards verdicts are recorded in [the review report](2026-10-01-issue-260-code-review.md).

The standards review caught an invalid phase option silently bypassing typography gates. The harness now accepts only `before` or `after`; an `aftr` probe fails before tests execute. A desktop locator screenshot also clipped the final outcome lines. The final capture crops a full-page screenshot from measured document bounds, temporarily hiding the sticky header during capture. Codex verified the outcome paragraph is fully visible in the actual page and the replacement crop. This affects evidence capture only.

## Evidence and repeatable checks

[Matched measurements](assets/issue-260/measurements.json) preserve every applicable cell, mobile geometry, gallery geometry, font/color comparison, rate line boxes, punctuation findings, widow findings and representative full paragraph line samples. The before/after captures use the same preview, seeded consent, fonts, viewport, engines and motion settings. Captures reflect intentional typography changes; they are not pixel-parity claims.

| Capture | Before | After |
| --- | --- | --- |
| Home CTA at 390 | [Before](assets/issue-260/before-chromium-390-no-preference-home.png) | [After](assets/issue-260/after-chromium-390-no-preference-home.png) |
| Home CTA at 1440 | [Before](assets/issue-260/before-chromium-1440-no-preference-home.png) | [After](assets/issue-260/after-chromium-1440-no-preference-home.png) |
| Article body at 390 | [Before](assets/issue-260/before-chromium-390-no-preference-project-ai-invoice-processing-automation.png) | [After](assets/issue-260/after-chromium-390-no-preference-project-ai-invoice-processing-automation.png) |
| Article body at 1440 | [Before](assets/issue-260/before-chromium-1440-no-preference-project-ai-invoice-processing-automation.png) | [After](assets/issue-260/after-chromium-1440-no-preference-project-ai-invoice-processing-automation.png) |

Install dependencies with `npm ci`, build, and start the local preview with `npm run preview -- --port 4260 --strictPort`. In another terminal run:

```sh
QA_TYPOGRAPHY_BASE_URL=http://127.0.0.1:4260 npx playwright test -c tests/qa/qa-typography.config.js
```

The config creates disposable output outside the repository and rejects non-loopback targets. It blocks service workers and uses the existing local-only network guard. `QA_TYPOGRAPHY_OUTPUT_DIR` selects an explicit external output directory. `QA_TYPOGRAPHY_PHASE=before` captures the same measurements without enforcing the corrected typography gates; use the pinned base checkout/build for baseline reproduction.

## Limits and delivery

Physical Safari/iOS, Firefox, screen-reader speech, native browser zoom, deployed hosting and field behavior are unverified. WebKit checks describe the engine, not physical Safari. Contact loading punctuation was inspected in source and existing contact tests; no live request was sent.

Keep #260 open until required CI and merge conditions are met. No merge or production deployment is authorized by this report. The shared current checkout is retained as requested. Task-owned temporary files, dependencies, build output and preview processes are removed after verified push/PR delivery; the task-delivery baseline check verifies the remaining dirty state.
