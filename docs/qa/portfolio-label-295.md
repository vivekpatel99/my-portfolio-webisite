# Featured Case Studies label cleanup (#295)

The homepage featured-work section now begins with **FEATURED CASE STUDIES**,
with its existing semantic `h2`, purple emphasis, and opposing corner strokes.
The redundant attached **Selected work** label is removed. Issue #294 had already
replaced the earlier `PORTFOLIO · CASE STUDIES` eyebrow with that label on the
starting integration branch (`4fc9bb0`). This implements #295 against that newer
markup without restoring the old eyebrow or changing other section labels.

The attached label was absolutely positioned and owned no document-flow margin.
The heading's existing padding belongs to its corner frame. No empty spacer,
replacement gap, or spacing compensation is added. Section padding, the 14px gap
from heading to paragraph, and the paragraph's 40px bottom margin are preserved.
The paragraph, featured project data, project card markup, card corner styles,
and collection link are unchanged.

This is the portfolio-specific exception to DESIGN.md's general attached-label
placement in SH-02. It follows TY-01's confirmed #295 cleanup and preserves
SH-03's confirmed shared corner geometry and colors.

## Browser evidence

Local production builds were reviewed with Chromium and reduced motion at the
three requested sizes. The T3 preview host was explicitly unavailable; headless
Playwright was used instead. External requests were blocked and no contact form
was submitted. The consent banner remains in the captures, so anchor checks also
cover its occupied space above the section.

| Viewport | Before | After |
| --- | --- | --- |
| 1440 × 900 | [Before](portfolio-label-295/before-1440.png) | [After](portfolio-label-295/after-1440.png) |
| 980 × 1324 | [Before](portfolio-label-295/before-980.png) | [After](portfolio-label-295/after-980.png) |
| 390 × 844 | [Before](portfolio-label-295/before-390.png) | [After](portfolio-label-295/after-390.png) |

Before evidence uses the starting integration version. After evidence uses an
isolated source archive of that version plus the two changed portfolio files;
concurrent edits to other components in the primary checkout are excluded.

At each size, the hero's **View Case Studies** link and the footer's **Portfolio**
link were clicked. Each navigates to `#portfolio` with the heading clear of the
sticky header. The heading, paragraph, and cards have no clipping or horizontal
overflow. Card destinations and the collection destination are retained.
Measurements for both paths are recorded in
[measurements.json](portfolio-label-295/measurements.json).

## Automated checks

The existing portfolio tests were updated to preserve the semantic heading,
section anchor, and purple emphasis instead of requiring the removed label.
Existing card and collection navigation assertions remain. No new test merely
checks the absence of the copied decorative label or class.

Checks completed: the isolated production build, two existing portfolio tests,
scoped ESLint (JSX usage, unused variables, and unreachable code), and the scoped
Git whitespace check. The build reports the existing stale Browserslist dataset
warning. This project has no frontend typecheck script; the modified files are
JSX and the production compiler check is unchanged.

Standards and specification reviews ran independently and found no implementation
violations. The issue explicitly avoids adding an absence-only decorative test.

Measured heading, paragraph, card, and section geometry differs by less than 1px
between before and after at every size and through both navigation paths. The
recorded card destinations, heading corner backgrounds, card corner backgrounds,
heading padding, and paragraph margin are identical.

The complete suite ran with one default fork worker: 844 of 847 tests passed.
Two publication fixture builds hit their subprocess timeouts during heavy shared
host load. A third test needs Git metadata for `git check-ignore`, which the
source archive initially lacked. After adding metadata only in the disposable
copy, the three failed cases passed on targeted rerun (3 passed, 24 unrelated
cases skipped). All 847 cases therefore passed across the full run and its
focused retry; the first full invocation was not a clean pass.

Commands: `npm test -- --maxWorkers=1 --testTimeout=120000 --hookTimeout=120000`,
then the same options with `publication/case-study-publication.test.js` and
`tools/run-case-study-collection-qa.test.js`, filtered to
`builds from a self-contained fixture|withdraws baseline identities|ignores screenshots`.
Remote required checks remain the merge gate.
