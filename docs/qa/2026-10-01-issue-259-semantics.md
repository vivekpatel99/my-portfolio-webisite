# Issue 259 semantic accessibility verification

Issue [#259](https://github.com/vivekpatel99/my-portfolio-webisite/issues/259) was selected from queue #267 after checking current develop, issue comments, merged/open PRs and occupied local task branches. Earlier queue entries already had implementations, and #256 had an active PR owned by another thread. No existing #259 implementation or claim was found. This thread claimed the issue before editing.

The starting checkout was clean at develop `074598921323eba5681423a38a8bdcd99e645d87`. Work used the existing checkout and a branch targeting develop. No worktree was created, no contact request was submitted, and no merge or deployment was performed.

## Reproduction and change

Codex reproduced the issue in the T3 production preview before implementation. The collection skipped H1 to H3. Home failed `definition-list` on three lists and `landmark-complementary-is-top-level` on the testimonial rail. Contact failed the landmark rule. Both logo links used "Vivek Patel Logo", and the three decorative portrait chips were exposed to accessibility APIs.

A separate implementation agent corrected the markup. Main collection cards receive H2, while home and Other Work cards retain H3. The consent dialog title is H2. Both nested complementary landmarks become divs with the same classes and content. Both logo links describe home. Only the three decorative portrait chips become hidden from assistive technology. Service separators live inside DTs, with their original spacing and typography.

The service separator retains its original two React text nodes inside a hidden `display: contents` span. Matched Chromium captures found a small text-raster difference when those nodes were combined. Restoring the original text-node boundary removed that difference without a numerical position adjustment.

## Verification

The baseline passed 729 unit tests and the production build. The final source passed 733 unit tests and the production build. A targeted red/green pass reproduced 11 semantic test failures before the fix, then passed all 165 targeted tests. The build retains the existing large-entry-chunk warning.

The browser suite covers Chromium and WebKit, 390×844 and 1440×900, normal and reduced motion, and `/`, `/case-studies/`, `/contact/`. Every cell audits the three issue rules with consent closed and open, checks accessible names and hidden hero chips, rejects horizontal overflow, opens consent with Enter and verifies focus restoration, and checks home navigation by keyboard. Mobile cells also exercise the navigation drawer, its home link and Escape dismissal.

Matched visual captures use the same browser, viewport, deterministic random seed, rejected consent, loaded fonts and decoded images. Motion is reduced and CSS animations are disabled for the pixel captures, after the normal/reduced-motion behavioral checks. Entrance transforms settle before capture. The sticky header is hidden only while capturing component crops so it cannot obscure the compared component. This does not change layout or the behavioral checks.

The original baseline was recorded from the unchanged production build. The settled parity baseline recompiles the eight changed application files from the pinned develop commit through a temporary Vite source-loader override. All other source and build settings are shared with the final build. The additional baseline build lives outside the repository; no checkout source was reverted for the comparison. This baseline has SPA route rendering rather than generated prerendered HTML. Captures occur after React and fonts settle, so this comparison measures the rendered components, not startup performance.

All 24 browser cells pass, with zero scoped axe violations or incomplete results in either consent state. After the final separator correction, all eight home cells were rerun. All 24 measured geometries are identical to the settled baseline, and all 40 component crops have zero changed pixels. These are laboratory captures, not a guarantee about every possible rendering environment.

The [measurements](assets/issue-259/verification.json) contain the original reproduction, settled baseline, final cells and per-image pixel comparison. Selected lossless captures show the [mobile hero](assets/issue-259/hero-mobile.webp), [desktop hero](assets/issue-259/hero-desktop.webp), [mobile services](assets/issue-259/services-mobile.webp), [collection card](assets/issue-259/collection-desktop.webp) and [contact panel](assets/issue-259/contact-mobile.webp). The durable suite is `tests/qa/qa-semantics.spec.js` with `tests/qa/qa-semantics.config.js`.

Codex independently inspected the source diff and T3-rendered desktop home, mobile home, collection and contact. T3 confirmed valid DT/DD groups, the final hidden separators, no nested complementary landmarks, sequential collection headings and home destination names. Codex activated the desktop and mobile drawer home links with Enter. A fresh `/code-review` split requirements and standards into independent reviewers. Both final axes pass; the [review report](2026-10-01-issue-259-code-review.md) records their independent verdicts.

The repository has no ESLint configuration. Scoped checks use ESLint's browser/node/ES2022 parser, `no-undef`, `no-unused-vars` with the established underscore convention, and React JSX usage rules. These pass for all changed application files and the browser suite. This is a scoped check, not a claim that an existing full-repository lint command passed. `git diff --check` passes. The Impeccable detector returned no findings.

## Repeat the browser checks

Start the local production preview on port 3259 after `npm ci` and `npm run build`. Obtain the pinned axe script outside the repository, then run:

```sh
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.3/axe.min.js -o /tmp/axe-4.10.3.min.js
QA_AXE_PATH=/tmp/axe-4.10.3.min.js npx playwright test -c tests/qa/qa-semantics.config.js
```

`QA_SEMANTICS_BASE_URL` accepts another loopback preview. `QA_SEMANTICS_OUTPUT_DIR` selects an external artifact directory; its default is a unique temporary directory. The default phase asserts the final requirements. `QA_SEMANTICS_CAPTURE_PHASE=before` records a baseline without requiring the repaired semantics.

## Limits and issue lifecycle

Physical devices, Firefox, real Safari, and screen-reader speech output remain unverified. Playwright WebKit is an engine check and does not attest to real Safari. Contact submission was not exercised. No deployment or host-level behavior was tested.

Issue #259 remains open until required PR checks and merge conditions pass. Queue checkboxes are unchanged. This work does not authorize a merge or release.
