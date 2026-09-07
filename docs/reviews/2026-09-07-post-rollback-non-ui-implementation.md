# Post-rollback non-UI implementation and verification

Date: 2026-09-07  
Branch: `codex/post-rollback-non-ui-review`  
Base: `c8af79c306b3cb32e18a111e7ddbe2ff3783f663`  
Reviewed implementation: `2346d05d15b32c1b7f8174875f7260a0228dad83`

## Changes

1. **CI safety and evidence.** CI sets `QA_LOCAL_ONLY=1`. SEO and Playwright reject unsafe preview URLs and omit production/live-contact targets. SEO validates redirects before following them; a shared passive Playwright fixture rejects external navigation and checks redirect destinations before forwarding responses. Intentional external subresources and explicitly invoked live workflows remain available. Failure screenshots, traces, QA JSON and screenshots are retained under `playwright-output/` and uploaded with `actions/upload-artifact@v4` even when a step fails.
2. **Contact privacy.** Production passes `{ logger: false }` to `ConvexReactClient`; development keeps SDK defaults. Tests cover option resolution and actual constructor wiring with mocked production/development environments. No contact form, schema, lead, email, or inquiry-context change.
3. **Static route integrity.** Existing `caseStudySlugs` remains authoritative. Build checks compare SEO keys/canonical paths, sitemap locations, static project HTML and the existing Apache allowlist. Stale generated project `index.html` files are removed while sibling files remain. Output preflight rejects symlink directories/indexes before writing, and parity rejects stale symlinks. Deployment configuration is read, never rewritten.

No visible content, styling, assets, published route set, publication system, evidence ledger, diagnostic, or other Gate 1–4 feature was restored. The rollback inventory remains a historical record and did not require correction. The unrelated `.agents/sol-advisor` deletion was preserved and excluded from commits.

## Verification

Final checks ran in `/Users/viv/Freelance/my-website/horizons-website` on the reviewed implementation:

| Check | Exact command / evidence | Result |
| --- | --- | --- |
| Full unit suite | `npm test` | 19 files, 160 tests passed |
| Production build | `SITEMAP_LASTMOD=2026-09-03 VITE_CONVEX_URL=https://coordinated-mandrill-587.eu-west-1.convex.cloud npm run build` | Passed; 8 generated HTML routes including 404 |
| Local SEO | `QA_LOCAL_ONLY=1 QA_PREVIEW_URL=http://127.0.0.1:3000 npm run qa:seo` | Passed; JSON-LD present, no failing finding |
| Preview browser suite | `QA_LOCAL_ONLY=1 QA_PREVIEW_URL=http://127.0.0.1:3000 npm run qa:playwright:ci` | 153 passed, 5 intentional skips, 0 failures; 22.0 s |
| Redirect regression | `QA_LOCAL_ONLY=1 QA_PREVIEW_URL=http://127.0.0.1:3000 npx playwright test -c tests/qa/qa.config.js --project=preview-desktop --project=preview-mobile qa-local-navigation.spec.js` | 2 passed; loopback 302 rejected before any external browser request |
| Diff / source preservation | `git diff --check`; `git diff --quiet c8af79c306b3cb32e18a111e7ddbe2ff3783f663 -- src/pages src/components src/data public` | Passed; tracked `.htaccess` and sitemap bytes unchanged |

The five browser skips are the two passive live-contact submission placeholders, two existing analytics-configuration TODOs, and the mobile fine-pointer assertion. Valid contact submission, production mutation and email delivery were not exercised.

A separate testing team covered unit/build/CI, adversarial route/privacy checks and frontend behavior. Its initial unit/build pass used the task's existing detached snapshot at the same pinned commit; the orchestrator subsequently reran the full suite and production build in the requested original branch checkout. The independent adversarial replay passed 10/10 sentinel cases after fixes; final focused route tests cover 15 cases and navigation guard tests cover 5 cases.

## Browser evidence

Codex computer-use inspected the built frontend at **1280×800** and **390×844**. Desktop: homepage, View Case Studies, n8n case-study card, header estimate CTA and empty contact validation. Mobile: homepage, menu open/Portfolio/menu close, Invoice OCR card, contact layout and empty validation. Settled screenshots showed expected content with no new visible regression in inspected states; browser console warning/error capture was empty. These captures are in the Codex task. Final build retained the same application bundle names/bytes as the inspected build; subsequent edits affect tooling/tests only.

An independent Playwright observer visited home/contact and attempted empty validation in desktop and iPhone profiles: **zero non-GET requests, zero Convex mutation POSTs, zero WebSockets**. Broader route, navigation, responsive and contact validation coverage is in the preview suite. Generated QA JSON and PNGs are in ignored `playwright-output/`; CI retains failure traces/screenshots there.

## Independent review

- **Standards axis (fresh Sol high):** no high-confidence actionable findings remain on the pinned final diff. Reviewed repository/Convex rules, cohesion, duplication, safe cleanup and correctness.
- **Specification axis (separate fresh Sol high):** no high-confidence specification findings on the pinned final diff; all three requested non-UI scopes complete without Gate/UI/content/published-route expansion.

The adversarial/review findings were resolved: full sitemap URL parity; symlinked output-root/canonical/stale paths; external Playwright navigation/redirect escape. No changes were made solely on unverified external advice.

Kiro standard-tier/fs_read review was requested but **did not run**: automatic approval review rejected transmitting the private repository diff to Kiro's external service. No workaround or retry was attempted. A Kiro pass needs explicit approval for that transfer.

## Limits and manual review

- This is local preview verification, not a deployment or Viv's manual acceptance. Apache rewrite behavior on the live host, valid lead persistence, email delivery and external telemetry configuration remain untested.
- `QA_LOCAL_ONLY` constrains QA targets and browser navigation; intentional external subresources remain permitted. It is not a general network sandbox.
- Existing sitemap generation still supports its intentional last-modified date update. Verification pinned the existing date to prove source preservation; no build-time `.htaccess` rewrite was added.
- Browser visual inspection is agent observation, not a pixel-baseline comparison. Existing Browserslist/deprecation warnings were not dependency-upgrade scope.

For manual review: inspect the three scopes in the draft PR; build and start `npm run preview`; visit home, all three case studies, contact, legal/data-policy and an unknown project at desktop/mobile widths; exercise menu/CTAs and empty/invalid contact validation; inspect the console and network panel. Do not submit a valid contact request unless separately authorizing a live integration test. Verify CI and retained artifacts on the PR before deciding whether to merge. No merge, deployment or issue closure is authorized by this report.
