# Fresh /code-review against develop e17a0a8

## Standards

Standards: PASS (no blocking findings).

Reviewed `git diff e17a0a817f2a492acac1b76b5f16260f531fb3b7...HEAD`, implementation head `01e719c`, the two pending `tests/qa/qa-entry-bundle.*` files, and `docs/qa/2026-10-02-issue-264-entry-bundle.md`. Unrelated skill/plugin changes excluded.

Documented standards: no violations found against `AGENTS.md` and `docs/git-workflow.md`. The implementation is on `codex/264-entry-bundle`; its changes form one coherent optimization with proportionate animation, registry, and browser coverage. Delivery and CI remain the parent's pending verification steps, not established by this read-only review.

One optional P3 maintainability observation (heuristic, not a hard violation): possible Duplicated Code / Shotgun Surgery in `src/lib/caseStudyThumbnails.js:3-49` and `publication/case-study-derivatives.js:124-360`. Both now hold the same source-to-thumbnail/display URL bindings. For example, the browser's `"/assets/case-studies/invoice-ocr.webp": {"src": "...invoice-ocr-thumb-df3d151823fe.jpg", "display": {"src": "...case-study-display-e6814512a975-926966cc5cb6.webp"}}` duplicates the build registry's source entry plus its display-hash lookup. Updating a derivative requires synchronized edits to both files. The new exhaustive URL parity test makes this acceptable for the current bounded change; a later authoring workflow could generate the browser projection from the build registry while keeping digests outside browser imports.

No additional baseline smells or code-quality bugs identified. `LazyMotion` encloses every routed page and shared animated component, all six production imports use `m`, and animation props remain unchanged. Build tooling now imports the authoritative integrity registry. The new browser QA uses the existing loopback navigation/WebSocket guard and passive contact validation.

Recheck: the 240-second aggregate route deadline and explicit 15-second navigation deadline preserve assertions. The durable report clearly identifies browser verification as pending and records measurement limits. The serial unit log confirms 750 tests / 65 files passed. The implementation change since the first review removes only a blank line.

Totals: 0 documented violations, 0 blocking bugs, 1 optional P3 heuristic. Expensive checks were not rerun.

## Spec

Implementation PASS; acceptance PARTIAL — no implementation defects or scope creep; one outstanding visual validation gate.

Reviewed `e17a0a817f2a492acac1b76b5f16260f531fb3b7...01e719c0f73059721894945cef4cb8922cc63841`, parent-owned entry-QA tests and durable QA report/assets.

- “LazyMotion features={domAnimation} strict” and “all six must change”: implemented in Layout and all six consumers. Animation props/CSS remain unchanged; isolated affected component tests use the real strict provider.
- “Move the digests to a build-only module imported by the plugin”: implemented for source, thumbnail and display integrity metadata. I independently deep-equaled the moved build registry against baseline and checked all 46 browser URL bindings. Helpers/fallbacks and plugin guards are preserved; article sections remain synchronous.
- “Entry chunk ≤ 452 KB min and gzip reduced by ≥ 10 KB”: locked baseline 502,252/154,624 bytes, final 451,922/140,228; gzip reduction 14,396. Independent final-entry scan confirmed both final sizes and “no 64-hex digests other than content-addressed filenames.”
- “Plugin guard tests still reject stale thumbnails” and “Unit: npm test”: targeted guard/build fixture evidence passes; completed serial full suite passes 750 tests across 65 files.
- “No strict runtime error on any route”: eight engine/viewport/motion sweeps cover 21 routes each with no errors. I independently deep-equaled all eight raw captures against baseline: geometry, sources, opacity and image checks match exactly. All eight keyboard-state checks pass. “npm run qa:motion” passes all 64 checks in the fresh managed-server run.

Outstanding acceptance finding:

“Visual QA and npm run qa:motion pass”: motion passes, but the supplementary local visual/cursor/hero run reports 85 passed, 18 skipped and five WebKit failures (three desktop hero checks, wide-gallery ratio on both viewports). `baseline-visual.log` reproduces exactly those five failures on the pinned baseline under identical host conditions. They are pre-existing locally, with no related CSS/Hero/gallery changes in this diff; this is not evidence of a #264 regression. Supported PR CI remains the outstanding visual acceptance gate. Do not claim all visual checks passed or close #264 yet.

PR delivery to develop with `Refs #264`, verified remote head and preservation/cleanup remain parent obligations. No merge or production release is authorized.

Summary: Standards has 0 violations, 0 blocking bugs and 1 optional P3 observation. Spec implementation has 0 defects; local visual acceptance has 1 pending supported-environment gate covering 5 reproduced baseline failures.
