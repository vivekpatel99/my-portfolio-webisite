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

PASS — implementation and local #264 acceptance. No spec defects or scope creep. Required PR CI remains a delivery gate; supplemental WebKit limitations remain explicit.

Reviewed the diff from `e17a0a817f2a492acac1b76b5f16260f531fb3b7` through `01e719c`, plus parent-owned entry-QA tests and durable QA report/assets.

- “LazyMotion features={domAnimation} strict” and “all six must change”: implemented in Layout and all six consumers. Animation props/CSS remain unchanged; isolated affected component tests use the real strict provider.
- “Move the digests to a build-only module imported by the plugin”: implemented for source, thumbnail and display metadata. Independently deep-equaled the moved build registry against baseline and checked all 46 browser URL bindings. Helpers/fallbacks and plugin guards are preserved; article sections remain synchronous.
- “Entry chunk ≤ 452 KB min and gzip reduced by ≥ 10 KB”: locked baseline 502,252/154,624 bytes, final 451,922/140,228; gzip reduction 14,396. Independent final-entry scan confirmed sizes and “no 64-hex digests other than content-addressed filenames.”
- “Plugin guard tests still reject stale thumbnails” and “Unit: npm test”: guard/build fixtures pass; completed full serial suite passes 750 tests across 65 files.
- “No strict runtime error on any route”: eight engine/viewport/motion sweeps cover 21 routes each without errors. Independently deep-equaled all eight raw captures against baseline; geometry, sources and image checks match exactly. All eight keyboard-state checks pass.
- “Visual QA and npm run qa:motion pass”: all 64 motion checks pass. Structured supplementary results confirm the standard configured visual checks pass: Chromium visual 27 passed/1 intentional skip; Chromium hero 8 passed/2 skips; cursor across four projects 20 passed/12 skips. Independent rendered inspection and screenshots support visual preservation.

Limit, not a #264 finding: the broader temporary configuration added WebKit hero/gallery coverage beyond `qa.config.js:93–105`, whose WebKit projects run only focus/cursor. That supplemental coverage has five failures, reproduced exactly on the pinned baseline: three desktop hero checks and two wide-gallery ratios. The issue targets Chromium and does not require this expansion. These failures remain documented; neither local acceptance nor a green standard CI run proves those excluded checks pass.

PR delivery/required CI, remote-head verification, preservation/cleanup, and keeping #264 open remain parent obligations. No merge or production release is authorized.

Summary: Standards has 0 violations, 0 blocking bugs and 1 optional P3 observation. Spec has 0 defects or scope creep; local acceptance passes with explicit supplemental WebKit limitations. Required PR CI remains pending.
