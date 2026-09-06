# Gate 1 Astra verification evidence — 6 September 2026

Issue: [Gate 1 #12](https://github.com/vivekpatel99/my-portfolio-webisite/issues/12).
Base: `f410a04dfc8815223470d9f355f18ed4402dcdb3` (`main`, refreshed before acceptance).
Branch: `codex/gate-1-evidence-positioning`, isolated worktree. The original checkout's unrelated change was preserved.

## Result and architecture

The site leads with one offer: AI automation for operations teams turning documents and web data into structured, reviewable records and dependable handoffs. Computer vision is a supporting specialty. Fit and not-fit guidance, scoped commercial terms, and the same identity run through Hero, proof, services, About, feedback, contact, case studies, and metadata.

The [canonical 43-entry claim ledger](../claims/gate-1-claim-ledger.json) contains 10 verified entries (including explicitly scoped offer wording), 3 related credentials, 1 target/estimate, 13 unsupported assertions, and 16 approval-required assertions. [Operating rules and source hashes](../claims/gate-1-evidence-operations.md) explain provenance and publication limits. Verified offer wording is not a measured client result.

Only the dated Upwork credential is retained as marketplace proof. Unsupported counts, rates, scarcity, quotes/stars, performance benchmarks, service-level promises, and outcome claims were removed. The invoice image was removed from public assets and the build. Illustrative schematics replace ambiguous extraction visuals. The existing pose illustration supports the still-image explanation; its model overlay is not a measured accuracy claim. Related planning and football assets no longer serve as delivery evidence for other projects.

## Independent Astra checks

Runtime observed: `gpt-6-astra` / `high`. Luna inventory: `gpt-5.6-luna` / `max`. Terra implementation: `gpt-5.6-terra` / `high`. Routing was checked in actual task session metadata. A fresh `gpt-5.6-sol` / `high` review follows this technical verification; its verdict and reviewed snapshot are recorded in the draft PR, not inferred here.

Astra inspected the complete source/test/document diff and the new files, and independently executed these checks under Node `v24.19.0`:

| Check | Actual result |
| --- | --- |
| Focused Vitest: positioning, case data, Portfolio, ProofStrip, Stats, Services | 38 passed, 6 files |
| `npm test` | 122 passed, 18 files |
| `SITEMAP_LASTMOD=2026-09-03 npm run build` | Passed; eight static HTML routes including 404 |
| `QA_PREVIEW_URL=http://127.0.0.1:4187 QA_PROD_URL=http://127.0.0.1:4187 npm run qa:seo` | Passed; no SEO failures |
| Local preview desktop/mobile `npm run qa:playwright:ci -- --workers=2` | 159 passed, 5 expected skips |
| Additional independent browser pass: eight routes at 1280px and 390px | 16 checks passed; no page errors, unloaded main images, horizontal overflow, clipped schematic steps, or write requests |
| `git diff --check` | Passed |
| Full source hashes before/after verification | Identical |

The five skips are two deliberately disabled live-contact tests, two existing analytics-acceptance TODOs, and the desktop-only cursor check on mobile. Passive tests exercise only empty/invalid form submissions. No valid lead, email delivery, production mutation, marketplace edit, merge, or deployment was performed. Build date pinning prevents unrelated sitemap churn in the local worktree; the generator itself is unchanged.

Astra's earlier independent pass caught stale service selectors; that rejected result is superseded by the complete successful run above. Screenshot inspection also caught schematic clipping and caption/title overlap; both were corrected and gained browser regressions. Sol's first pass required removal of unapproved service-area JSON-LD and coverage for claims hardcoded in the project template; both were corrected before a complete new Astra verification run. Europe remains only scoped location metadata.

## Screenshots

Screenshots are from the local production build. Consent was rejected before the independent full-page captures. They show rendered content after scroll-reveal animations settled. Portfolio section captures hide the fixed header so it does not obscure the full-section screenshot.

- Homepage: [desktop](gate-1-2026-09-06/home-1280.png), [mobile](gate-1-2026-09-06/home-390.png).
- Portfolio and illustrative captions: [desktop](gate-1-2026-09-06/portfolio-1280.png), [mobile](gate-1-2026-09-06/portfolio-390.png).
- Mobile case studies: [n8n](gate-1-2026-09-06/n8n-openai-data-extraction-390.png), [invoice OCR](gate-1-2026-09-06/invoice-ocr-extraction-390.png), [pose](gate-1-2026-09-06/yolo-computer-vision-optimization-390.png).
- [Mobile contact](gate-1-2026-09-06/contact-390.png).

## Approval-required facts and limits

Current job-success percentage, hours, testimonial originals/ratings, availability, response time, roadmap cadence, support terms, and source-backed performance measurements remain withheld. Public rates need a deliberate scope/currency decision. Restoring client imagery needs provenance and publication approval. The credential is a dated observation and needs refresh before changing its date. Source inspection establishes implementation scope, not production reliability, accuracy, savings, latency, or client acceptance.

Backend code, dependencies, consent behavior, legal wording, publishing controls, and later gates are unchanged. Local UI checks do not verify contact delivery. Vivek's manual acceptance remains pending; this evidence is not approval to mark the PR ready, merge, or deploy.

## Manual review

1. Run `npm ci`, `npm run build`, and `npm run preview` in the review checkout; open the printed local URL.
2. At desktop and mobile widths, read Hero through Footer. Confirm the buyer, input/output promise, supporting specialty, and fit boundaries are coherent.
3. Open all three case studies. Confirm claims match their limitations and both schematic captions remain visible; no removed metrics or invoice source image should appear.
4. Use keyboard Tab, Enter, and Space on navigation and service accordions. Follow the estimate CTA to Contact. Inspect the form and optionally try empty or invalid fields only; do not submit valid details.
5. Inspect titles, descriptions, canonical URLs, and static structured data for the same positioning. Review the ledger's withheld facts before approving any restoration.
6. Record manual acceptance separately. Keep this PR draft until the agreed human review is complete; merging and deployment require separate authorization.

## Changed files

- `docs/claims/gate-1-claim-ledger.json`
- `docs/claims/gate-1-evidence-operations.md`
- `docs/reviews/2026-09-06-gate-1-astra-verification.md`
- `docs/reviews/gate-1-2026-09-06/contact-390.png`
- `docs/reviews/gate-1-2026-09-06/home-1280.png`
- `docs/reviews/gate-1-2026-09-06/home-390.png`
- `docs/reviews/gate-1-2026-09-06/invoice-ocr-extraction-390.png`
- `docs/reviews/gate-1-2026-09-06/n8n-openai-data-extraction-390.png`
- `docs/reviews/gate-1-2026-09-06/portfolio-1280.png`
- `docs/reviews/gate-1-2026-09-06/portfolio-390.png`
- `docs/reviews/gate-1-2026-09-06/yolo-computer-vision-optimization-390.png`
- `index.html`
- `public/assets/case-studies/invoice-ocr.webp`
- `src/components/About.jsx`
- `src/components/CTA.jsx`
- `src/components/CaseStudyVisual.jsx`
- `src/components/Footer.jsx`
- `src/components/Header.jsx`
- `src/components/Hero.jsx`
- `src/components/Portfolio.jsx`
- `src/components/Portfolio.test.jsx`
- `src/components/ProofStrip.jsx`
- `src/components/ProofStrip.test.jsx`
- `src/components/Services.jsx`
- `src/components/Services.test.jsx`
- `src/components/Stats.jsx`
- `src/components/Stats.test.jsx`
- `src/components/Testimonials.jsx`
- `src/config/links.js`
- `src/data/caseStudies.js`
- `src/data/caseStudies.test.js`
- `src/data/positioning.js`
- `src/data/positioning.test.js`
- `src/lib/seoConfig.js`
- `src/pages/Contact.jsx`
- `src/pages/Project.jsx`
- `tests/qa/qa-a11y.spec.js`
- `tests/qa/qa-routes.spec.js`
- `tests/qa/qa-seo-check.js`
- `tests/qa/qa-upgrade-interactions.spec.js`
- `tests/qa/qa-visual.spec.js`
