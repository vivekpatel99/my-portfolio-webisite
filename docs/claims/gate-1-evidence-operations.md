# Gate 1 public-claim operations

This record accompanies `gate-1-claim-ledger.json`. It is the operator-facing source for claim disposition; public pages must only render claims classified `verified` or a specifically approved, correctly scoped `related-credential`.

## Evidence boundary

- Upwork credential check: 6 September 2026. `Top Rated Plus` was observed. Marketplace project counts, hours, job-success percentage, feedback text, ratings, availability, and price claims were not approved as public proof.
- OCR source artifact `ocr-client-fields-main.py`: SHA-256 `4639366cabb8338538fa9ddc82eb182abf84e664df4f04fd12da3f9fa7a2b4be`, inspected 6 September 2026. The supported scope is client fields from a known invoice layout to spreadsheet rows for human review.
- n8n workflow artifacts: `e7032a2a1fe99f9cf30c77b7c570896e2e4d6fa2bde4cc73bd664c83846eef1b` and `5d0e0de24a392cb93c0fafce12687c7c962159bb484f7653020bf2e05429bcbc`. They support implementation pieces, not measured savings or reliability.
- Pose source artifacts `pose-stills-inference.py` (SHA-256 `7fc40747358ec5e6d0c5b35ae4cbeeafca01e20457eba8ac1d52b5d2a53ac075`) and `pose-training.py` (SHA-256 `abb26e0f346120c00553b010c572dea5885d925f53fff6ed6274262889699ba5`), inspected 6 September 2026. They support overlays on still images, not video, latency, accuracy, or application-delivery claims.

No raw client material, local source path, account identifier, contact data, or credential belongs in this repository.

## Rendering rules

1. Read `src/data/positioning.js` for shared public wording and claim references.
2. A public consumer must not render a claim ID classified `unsupported`, `target-estimate`, or `approval-required` in the ledger.
3. A `related-credential` stays withheld unless an explicit placement and attribution review approves it; it cannot prove another case study.
4. Case studies must state their evidence scope where a buyer could otherwise infer an outcome, benchmark, or coverage guarantee.
5. Planning and football media are related/separate work, not extraction or pose-delivery proof. The invoice asset was removed because its public provenance is unresolved.
6. Scope, price, schedule, support, and outcome promises require the project agreement; do not turn contact-form budget choices into public pricing.

## Approval queue

Before restoring any withheld claim, obtain current primary evidence, verify exact scope and attribution, add a ledger row or update its date/placement, add a consumer regression test, and obtain explicit approval for the public assertion. This ledger is not permission to publish new client information.
