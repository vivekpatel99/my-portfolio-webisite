# Gates 1-4 rollback inventory and non-UI recovery options

Date: 2026-09-07  
Rollback PR: [#40](https://github.com/vivekpatel99/my-portfolio-webisite/pull/40)  
Rollback merge: `734c25e0a9d234f8378ad9529520dd26c0978c82`  
Restored baseline tree: `f410a04dfc8815223470d9f355f18ed4402dcdb3`

## Current state

PR #40 restored the committed repository tree to the exact state before Gate 1. The rollback used ordinary revert commits, so the shared history remains intact. Gate 4 PR #39 was closed without merging.

The pre-existing local deletion of `.agents/sol-advisor` was not included in PR #40 and remains unrelated working-tree state.

## What was reverted or closed

| PR | Scope | Size | Reverted result |
| --- | --- | ---: | --- |
| [#35](https://github.com/vivekpatel99/my-portfolio-webisite/pull/35) | Gate 1 positioning and evidence alignment | 41 files, +804/-957 | Removed the new positioning data, claim-ledger integration, rewritten marketing copy and components, revised SEO copy, screenshots, and related regression tests. Restored the earlier homepage, service, case-study, testimonial, contact, and metadata behavior. |
| [#36](https://github.com/vivekpatel99/my-portfolio-webisite/pull/36) | Gate 2 evidence-safe case studies | 38 files, +1181/-332 | Removed the publication-state model, claim-placement validation, generated-route coupling, case-study redesign, CI artifact retention, local-only SEO switch, acceptance evidence, and Gate 2 tests. Restored the earlier case-study data, assets, routes, sitemap generation, and build behavior. |
| [#37](https://github.com/vivekpatel99/my-portfolio-webisite/pull/37) | Related case-study thumbnails | 8 files, +113/-5 | Removed the related-context gallery restoration and its policy/tests. This PR was reverted before Gate 2 so the dependency unwound cleanly. |
| [#38](https://github.com/vivekpatel99/my-portfolio-webisite/pull/38) | Gate 3 project-fit diagnostic | 30 files, +1194/-4 | Removed the deterministic decision engine, diagnostic component, telemetry filtering, screenshots, acceptance report, and unit/browser tests. |
| [#39](https://github.com/vivekpatel99/my-portfolio-webisite/pull/39) | Gate 4 intent-aware estimate context | 34 files, +1041/-73 | Not reverted because it never merged. The PR was closed. Its transient contact context, Convex schema/domain changes, persistence, privacy changes, and tests are absent from `main`. |

## Recommended non-UI changes

These should be rebuilt as small independent changes against the restored baseline. Do not cherry-pick an entire Gate commit.

### Priority 1: low-risk operational improvements

1. **Make CI explicitly local-only and retain failure artifacts.**
   - Restore the `QA_LOCAL_ONLY` guard from `5f98a5e:.github/workflows/ci.yml:105-127` and `5f98a5e:tests/qa/qa-seo-check.js:6-11,108-111`.
   - Restore `actions/upload-artifact` for `playwright-output/` from `5f98a5e:.github/workflows/ci.yml:129-135`.
   - Value: prevents accidental production probing in CI and makes browser failures inspectable.
   - UI impact: none.

2. **Suppress Convex SDK payload logging in production.**
   - Adapt `4e63caa:src/lib/convexClient.js:11,124-135` so production uses `logger: false` while development retains useful diagnostics.
   - Value: contact descriptions may contain private free text; rejected mutation payloads should not be written to a visitor's production console.
   - UI impact: none.

3. **Validate generated route consistency without rewriting tracked source.**
   - Retain the route-parity and stale-output ideas from `5f98a5e:tools/generate-static-route-html.js:9-30` and the adversarial checks in `5f98a5e:tools/caseStudyBuild.test.js:39-89`.
   - Do not restore the build-time `.htaccess` rewrite from `5f98a5e:tools/generate-sitemap.js:14-27`; builds should not mutate tracked deployment configuration.
   - Value: prevents stale or mismatched project pages, sitemap entries, and static HTML.
   - UI impact: none.

### Priority 2: useful controls that need a smaller design

4. **Keep an internal evidence ledger independent of page copy.**
   - Reuse the provenance and approval concepts from `736d904:docs/claims/gate-1-evidence-operations.md:3-25` and `736d904:docs/claims/gate-1-claim-ledger.json:1-44`.
   - Rename and update them as durable portfolio evidence records rather than Gate-specific artifacts.
   - Avoid brittle tests that scan implementation source for forbidden phrases.
   - Value: preserves the distinction between verified, related, estimated, unsupported, and approval-required claims without changing the site.

5. **Rebuild a compact publication boundary.**
   - Preserve explicit draft/published status, explicit approval, safe public projection, and negative tests from `5f98a5e:src/data/caseStudyPublishing.js:162-288,327-332`.
   - Split structural validation, evidence policy, and projection instead of restoring the 332-line mixed module. Remove hard-coded external URLs and transitional compatibility aliases.
   - Make one manifest authoritative for case-study slugs consumed by SEO, sitemap, static HTML, and deployment-route validation.
   - Value: prevents draft or unsupported case-study material from leaking into public output.
   - UI impact: none until content is deliberately republished.

## Defer rather than restore now

- **Gate 3 decision engine:** the spec review considers the deterministic rules valuable, but the standards review found that the engine becomes dead, coupled domain machinery without the diagnostic journey. Do not restore it as a standalone non-UI module.
- **Gate 4 inquiry context:** server normalization and retry-safe persistence were sound in isolation, but the contract was duplicated across the domain module, mutation validator, and Convex schema. Revisit only with a newly approved contact-flow design and one canonical validator source.
- **Selector-specific telemetry filters:** do not restore filters for removed DOM sections. If those features return, implement a reusable sensitive-region privacy boundary.
- **Generated Convex files:** never cherry-pick `convex/_generated/*`; regenerate them from retained source with the current toolchain.
- **Gate 4 migration context branch:** do not restore the unreachable import path that expected context fields the importer could not receive.

## Independent review results

### Standards axis

The strongest immediate candidates are local-only CI, QA artifact retention, static-route hygiene, and production Convex log suppression. The publication boundary is worthwhile only after it is split into narrower modules. The most serious standards risk is duplicated policy across ledgers, validators, generators, tests, and schema files.

### Specification axis

The strongest intent-preserving controls are evidence provenance, explicit publication approval, route/build consumer tests, and server-side input normalization. The most serious scope risk is restoring Gate 4's duplicated context contract wholesale. The spec axis sees value in Gate 3's deterministic rules, but that value depends on an approved product journey.

## Suggested implementation order

1. CI local-only guard and artifact retention.
2. Production-only Convex logging suppression.
3. Route consistency validation and tests, with no tracked-source mutation.
4. Internal evidence ledger cleanup.
5. A separately specified compact publication boundary.

Each item should be a small independent commit and review checkpoint. Gates 3 and 4 should remain out until their user-facing product direction is approved again.
