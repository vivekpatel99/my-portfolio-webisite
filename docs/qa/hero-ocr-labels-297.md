# Hero OCR label attachment verification

Issue [#297](https://github.com/vivekpatel99/my-portfolio-webisite/issues/297), checked on 3 October 2026 against a local production build. The baseline is `develop` at `70298941554c2e4c3dd5c8f20736914ca59ee5dd`.

## Result

All seven invoice labels include their fixed illustrative confidence score. The header says `OCR simulation`. Each field uses one intrinsic grid for its label and value. A label begins 17 CSS pixels from the frame's left edge, leaving a 5px gap after the 12px corner stroke. Its 12px line box is centered on the frame's 6px top-edge guide. The value occupies the next row with readable clearance.

The portrait tag begins 29px from the strongest outer frame's left edge, leaving the same 5px gap after its 24px stroke. Its vertical center matches the frame guide within half a CSS pixel, including WebKit's fractional transform rounding. The lower badges, image source, factual values, h1, invoice outer padding, and action destinations remain intact.

Below 360px, Name/Role and Credential/Success stack so the labels retain their size and corner clearances. The Rate/Location columns use an 8px gap to accommodate both browser engines' monospace metrics. Rate and Tags receive scores but never receive highlights. Exactly three of the five eligible fields retain the current page-load highlight behavior.

This follows the guide's OC-01 through OC-03, SH-03, TY-01, and LY-01. The guide remains in the separate documentation PR [#299](https://github.com/vivekpatel99/my-portfolio-webisite/pull/299).

## Rendered checks

The following are actual CSS viewport dimensions, measured in the page and exercised by the browser regression tests. JPEG capture dimensions may differ from CSS dimensions because the in-app browser scales its captures.

| Viewport | Observed result |
| --- | --- |
| 1440 × 900 | Labels and portrait tag attach to their frame guides. Values and actions remain readable. |
| 980 × 1324 | Invoice, actions, and portrait retain the stacked tablet composition. No overflow. |
| 390 × 844 | Role wraps across lines. Credential and score fit within their column. No overflow. |
| 320 × 740 | Narrow groups stack. Location retains full corner clearance. Page scroll width is 320px. |
| Native Chromium 200% zoom | Browser zoom shrinks the layout viewport with visual scale remaining 1. Existing invoice spacing, containment, and action checks pass. |

The OCR geometry tests also cover 768 × 900 and four deterministic page-load selections. Together they highlight every eligible field, including Location. They check fixed label text, exactly three highlights, corner clearances, value containment, stationary label bounds after pointer input and reduced-motion changes, and the portrait tag's anchor.

In Codex's browser, the estimate action opened `/contact/`, the case-study action reached `/#portfolio`, and keyboard navigation from the estimate action focused View Case Studies. No form was submitted. The final production preview is left open for Vivek's feedback.

## Automated verification

- Full unit suite, `npm test -- --maxWorkers=2`, passes all 817 tests in 68 files.
- Production build, `npm run build`, passes image derivative checks, bundling, sitemap generation, and static output checks for 36 public links and 21 routes.
- Chromium hero motion, responsive, and OCR checks passed 80 cases, with two expected pointer-specific skips. After the final narrow-column correction, all 31 affected geometry, fold, spacing, and native zoom cases pass again.
- WebKit passes all 20 OCR geometry cases on the final source.
- Scoped ESLint checks cover JSX use, unused variables, and parsing. They pass. The repository has no frontend typecheck or lint script; no configuration was added.
- Impeccable's layout detector reports no findings for Hero.jsx and index.css. `git diff --check` passes.

To repeat the integrated Chromium checks after starting a loopback production preview:

```sh
QA_LOCAL_ONLY=1 QA_PREVIEW_URL=http://127.0.0.1:4308 npx playwright test -c tests/qa/qa.config.js --project preview-desktop --project preview-mobile --grep 'hero|OCR'
```

## Code review

Independent Standards and Spec review agents checked the pinned implementation and subsequent test corrections. Neither reported a blocking implementation finding. The Spec review identified missing Location and exact-viewport coverage and an obsolete side-by-side assertion; these were corrected and verified. The comment review found no added comments requiring deletion.

The Model the Domain principle led to one fixed label/score registry. The Prove It Works principle led to rendered geometry checks and direct navigation and keyboard checks, alongside the source review.

## Remaining acceptance

Vivek's visual review of the label/frame attachment remains pending. The current implementation does not rotate highlights or provide a Pause control. Those belong to [#292](https://github.com/vivekpatel99/my-portfolio-webisite/issues/292). Rotation, pause/resume, and all five rotating selections must be checked together when that implementation is available. Score constants and label geometry are independent of selection, and this change introduces no timer, OCR service, tracking event, or network request.

Keep #297 open with a `Refs #297` declaration while the visual review and dependent rotation validation remain outstanding. This verification does not authorize a merge or production deployment.

## Visual evidence

The desktop comparisons show the Name and Credential frame junctions and the portrait's outer tag junction. Mobile comparisons show the multiline Role and longer labels. Captures retain surrounding content so the relationship between labels, values, and frames is visible.

### Desktop before

![Desktop hero before the label attachment change](hero-ocr-labels-297/before-desktop.jpg)

### Desktop after

![Desktop hero with fixed OCR labels attached to frames](hero-ocr-labels-297/after-desktop.jpg)

### Mobile before

![Mobile hero before, with separate labels and multiline Role](hero-ocr-labels-297/before-mobile.jpg)

### Mobile after, 390 × 844

![Mobile hero after, with attached labels and multiline Role](hero-ocr-labels-297/after-mobile.jpg)

### Tablet after, 980 × 1324

![Tablet hero after the label attachment change](hero-ocr-labels-297/after-tablet.jpg)

### Narrow after, 320 × 740

![Narrow hero with full label clearance and no horizontal overflow](hero-ocr-labels-297/after-narrow.jpg)
