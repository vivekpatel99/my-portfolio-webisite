# PR 282 integration recheck

Integrated `develop` at `966bcefdd79a8ba75b3639826c5fcde0123299e2` into the feature branch without rewriting history. The one conflict was in `Header.jsx`: the resolution keeps the shared header-height calculation and the newer accessible name, `Vivek Patel home`. The automatically merged banner retains the newer H2 heading.

Fresh Standards and Spec reviewers inspected pinned merge candidate `7cafd89a71b8095f5e55ed1a6ff7b98633b2534d` and found no integration blockers. The previously documented first-visit CLS limitation remains; the owner-requested 1500 ms delay and `Refs #258` are preserved.

Validation on the integrated source passed 741 unit tests, the production build, and diff checks. Browser QA passed all 40 consent-layout tests and 32 existing consent regressions in Chromium/WebKit. All 64 geometry cells have exact header adjacency, uncovered main content, and no horizontal overflow. Manager/settings/dismissal and delayed-arrival probes have zero paragraph drift. Codex independently checked the rendered T3 preview: at 390 px, header and banner top are 69 px, main starts at 138 px, the home link has the newer accessible name, and the consent title is H2.

The prior CLS measurements in the original report belong to head `89d3d990`. They were not rerun for the semantic-only integration. The gap and reading-position checks were rerun on the integrated artifact.

Fresh CI must pass on the pushed integration head before the authorized merge into `develop`. This integration does not authorize production deployment. #258 remains open for the known CLS limitation.
