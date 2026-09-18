# Case-study acceptance handoff

This handoff records software evidence separately from content approval and
live publication. The six proposed stories remain drafts, and the retained
legacy identities remain under their existing validation boundary.

| ID | Concrete evidence | Status |
| --- | --- | --- |
| V01 | `publication/case-study-publication.test.js` prepares, stages, and builds selected text stories; the fresh fixture workflow produces article HTML, cards, metadata, sitemap, routes, and assets from website inputs. | passed locally |
| V02 | `publication/markdown-case-study.test.js` covers optional image handling; `publication/case-study-publication.test.js` verifies text-only output and omission of unreferenced assets. | passed locally |
| V03 | `publication/case-study-images.test.js` verifies full-size image references and intrinsic dimensions; root’s local browser evidence covers 360px/desktop layout, exact three-H2 hierarchy, keyboard back/contact links, all PNG/JPEG/WebP image loads and natural dimensions, full-size 200 responses, and no overflow. | passed local browser review |
| V04 | `publication/markdown-case-study.test.js` covers invalid headings, URLs, HTML, paths, and assets; compiler/staging tests cover unsupported and mismatched image suffixes and preserve prior output. | passed locally |
| V05 | `publication/case-study-publication.test.js` and the fresh fixture workflow verify private and draft sentinels are absent from generated output and unreferenced assets. | passed locally |
| V06 | `publication/stage-case-study-publication.test.js` covers stale digests, deterministic repeat staging, and unchanged staged bytes on rejection; image tests cover frozen-byte changes. | passed locally |
| V07 | The fresh fixture workflow verifies static article HTML and links without JavaScript; root’s startup comparison found identical article text/H1 positions before and after client startup at both viewport sizes, with no blank or duplicate frame. | passed local browser review |
| V08 | `publication/case-study-publication.test.js` and `publication/stage-case-study-publication.test.js` cover revision, withdrawal, shared-asset retention, stale output removal, and zero-published routing. | passed locally |
| V09 | `docs/case-study-migration-status.md` records the six IDs/slugs and draft dispositions. The two migration-batch verification records confirm each selected source/copy comparison, exactly three public-H2 normalizations, applicable patch checks, deterministic preparation, unchanged source/proof hashes, and all six stories previewed at 360px and 1280px with JavaScript disabled. | passed locally; approvals pending |
| V10 | `tools/case-study-route-integrity.test.js` verifies canonical routes, sitemap consistency, generated Apache allowlists, and stale HTML cleanup; live HTTP verification awaits release authorization. | passed locally; live deferred |
| V11 | The fresh fixture workflow removes source/candidate inputs before a website-only build and verifies preview isolation/private absence; production/CI preview refusal is covered by the preview tool tests. | passed locally |
| V12 | `npm test` passed 248 tests in 28 files, `npm run build` passed with 8 routes, and `git diff --check` passed; root’s loopback SEO and safe-artifact passive browser checks passed (163 tests, 7 existing skips). Exact release-commit CI evidence remains required before release. | passed local acceptance; CI pending |

The fresh fixture evidence used the complete website build configuration and
passed preparation determinism, loopback preview for PNG/JPEG/WebP assets,
reviewed staging, static HTML/SEO/routes, Apache rules, asset ownership, and
private-boundary checks. Temporary fixture data was kept outside the checkout.

Before release, record the exact release commit SHA and CI result, then use
[the release checklist](case-study-release-checklist.md) for content approvals,
host integration, live URL checks, and withdrawal deletion verification. A
successful local build remains distinct from verified live publication.
