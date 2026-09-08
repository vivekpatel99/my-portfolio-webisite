# Issue #43: case-study publication boundary

The authoritative source is `publication/case-study-manifest.js`. Application
exports, SEO, sitemap, static route HTML, deployment routing, and case-study
asset output consume its validated public projection. Vite replaces the
projection module before dependency traversal, so the raw manifest, approval
records, and unused claims are absent from browser bundles.

## Editing and withdrawal

- A draft contains only `id`, `slug`, and `status: 'draft'`. Keep unpublished
  copy and evidence outside this manifest and outside `public/`.
- A published record requires a matching approval, approved claim references,
  safe links, and referenced assets with matching approved bytes. Missing or
  invalid approval fails the build; it does not silently publish the record.
- Withdraw a record by replacing it with its metadata-only draft form, or by
  removing it, then run `npm run build`. The clean Vite output removes old
  chunks, unique assets, and static project pages. Shared assets remain while
  another published record uses them.
- Generated routing and sitemap files belong in `dist/`. The build leaves
  tracked `public/.htaccess` and `public/sitemap.xml` unchanged.

## Existing content and approval scope

The three existing records are retained byte-for-byte from main commit
`08c2853123c89b4061c72b9432588d619a1cc875`, under the task's explicit requirement
to preserve existing visible content and routes. Their `baseline-retention`
entries are restricted to pinned identity/content/claim/asset hashes. This is
permission to retain that exact baseline, not a new factual review, client
consent claim, or license determination. Changed or new material requires an
explicit approval entry tied to its exact hash and evidence reference; changing
a hash while retaining the baseline marker does not grant approval.

## Coordination with PR #53

PR #53 at `94544ff68a621c0bf675d3143667a0c20bf9af39` owns the Kaggle provenance
manifest, license conclusions, asset approval verification, and provenance
scripts. Issue #43 does not modify these files or approve their five unresolved
assets. The publication manifest uses the same `public/assets/case-studies/`
paths and preserves the existing asset bytes.

Both PRs edit the `package.json` build command. When combining them, preserve
PR #53's scripts and use:

```sh
npm run provenance:deploy && vite build && node tools/generate-sitemap.js && node tools/generate-static-route-html.js
```

A disposable combined-state check passed provenance inventory auditing for all
five assets and stopped the build before bundling on all five unresolved
approvals. The two PRs are independently reviewable against main; neither gate
replaces the other. No merge, deployment, or production submission is part of
this change.

## Local verification

- `npm test`: 21 files, 174 passing tests. A disposable source fixture runs
  published and all-drafts builds in the same output directory to test draft
  exclusion and withdrawal. It also runs the affected unit suites in both states.
- `npm run build`: passed; generated eight HTML routes including the 404 page.
- Independent comparison with main: exact public case-study and SEO objects,
  all five asset SHA-256 hashes, and the existing deployment route rule match.
- Passive desktop/mobile browser suite: 157 passed, seven intentional skips;
  local-only SEO passed. No valid contact submission was made.
- Development HTTP checks: image MIME types, HEAD requests, prefix MP4 byte ranges, and denied case-study asset aliases passed.
- No tracked public configuration or asset bytes changed.

## PR review follow-up

Both review findings were confirmed. The old data/route fixtures compared the
active publication set with the tracked Apache template, so approved record-set
changes failed tests before CI reached the build. These tests now validate the
generated allowlist, and renderer/negative tests no longer require particular
production records. Independent full-suite runs cover one withdrawal, all
drafts, and one added approved test record. Production data and runtime code
are unchanged by this follow-up.

The build fixture now performs two builds and has a 180-second test budget,
with a 60-second timeout for each build and a 20-second timeout for each of its
two nonrecursive affected-suite runs. This replaces the unbounded build
children inside a 30-second test.
