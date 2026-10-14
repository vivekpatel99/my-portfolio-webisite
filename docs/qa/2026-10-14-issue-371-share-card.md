# Default portfolio share card — #371

## Scope and owner gate

Starting commit: `d3f8e673cdf4834f7d13a931d4e46b5706563aa5` on
`feat/issue-371-implementation`, from current `origin/develop`. The checkout
was clean. #365 was already merged through #381; this task does not repeat it.

Replace only `public/og-image.png`. Keep its existing URL and every public
project-specific share destination. The editable source is
[issue-371-share-card.svg](assets/issue-371-share-card.svg).

**Owner visual acceptance: pending.** The finished PNG and its copy must be
accepted by Vivek before merge. CI success and general merge authorization do
not satisfy this gate. The PR uses `Refs #371` until acceptance is recorded.

![Proposed default portfolio card](../../public/og-image.png)

Small preview, at 320 × 168 pixels:

<img src="../../public/og-image.png" width="320" height="168" alt="Vivek Patel — Computer Vision and AI Engineer, at small share-preview size" />

Copy proposed for acceptance:

- Vivek Patel
- Computer Vision & AI Engineer
- Document extraction · n8n automation
- Computer vision
- vivekapatel.com

CT-01 (confirmed): name, role and specialties follow the finalized #365
positioning. CO-01 (existing references): background `#0C0D0D`, white identity,
`#A78BFA` specialty text, `#B6B9C3` domain and `#8B5CF6` corners.
TY-01 (existing reference): preserve the sans-serif reading family; the SVG
uses DejaVu Sans for deterministic raster export on this Ubuntu environment.
SH-01's confirmed opposing-corner vocabulary informs this proposed card;
this new placement remains subject to owner acceptance. There are no scores,
metrics, client claims or new credentials.

## Consumers

`src/lib/seoConfig.js` already assigns `/og-image.png` to the home, contact,
legal, data-policy, case-study collection and all three service routes.
`src/lib/seo.js` emits runtime OG, Twitter and `image_src` metadata.
`index.html` seeds the same URL. `tools/generate-static-route-html.js` uses
route metadata for static HTML and the default image for generated `404.html`.
Runtime not-found and unknown-route loading fallbacks inherit the default.
No metadata source changes are necessary.

## Verification

Local production build uses the repository's fallback Convex URL. No leads
were submitted. Local preview is a validation of this integration candidate,
not of production deployment.

- PNG signature/decoder: 1200 × 630, sRGB; raster contains the proposed name
  and role. Browser decoded it at its natural 1200 × 630 dimensions.
- Visual review: full card and 320px preview inspected together; identity and
  role remain readable, with no clipping. Owner acceptance is separate.
- Production build passed. All 20 route entries plus generated `404.html` have
  the expected OG/Twitter destinations. Every served image returned HTTP 200
  with `image/png`; all default images decoded as 1200 × 630. Built PNG bytes
  match the source. All 12 project-specific destinations are preserved.
- Local SEO QA (`QA_LOCAL_ONLY=1 npm run qa:seo`): passed, no failure findings.
  Runtime home metadata also has exactly one OG image and one Twitter image,
  both pointing to the default URL.
- Full local unit suite: 1083/1096 passed on the first run. Failures were
  two contact timeouts, eight missing-`ffprobe` video checks, and three nested
  publication fixture failures under concurrent build load. With temporary
  `ffprobe` outside the repository, affected contact/video files passed
  129/129 in a single-worker rerun. Nested publication fixture rerun: pending.
  No application or test code changed to accommodate these local failures.
- Hosted `test-and-build`, including supported Chromium and WebKit: pending.
  Local Ubuntu26 WebKit is unsupported because required system libraries are
  absent; hosted WebKit is the required browser gate.

- Standards review: no findings. Specification review: no findings. Neither
  review substitutes for owner visual acceptance.
- PNG SHA-256: `979d5c0844ad3bba623b5bcd8f7a9db18184e8fcf8049bd8f82c7b6a6e3df4d1`.

## External share-debugger access — 14 October 2026

[LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) loaded.
Inspecting `https://www.vivekapatel.com/` returned HTTP 401 and redirected to
`/post-inspector/login`, showing Sign in. No scrape result was available.

[Meta Sharing Debugger](https://developers.facebook.com/tools/debug/) loaded
but explicitly required Facebook login to use the tool. No scrape result was
available. No account sign-in or profile change was attempted.

The proposed asset is local/unreleased. These services cannot validate it
through the production URL before a separately authorized release. Platform
caches may keep the previous logo at the unchanged URL; refreshing production
share caches belongs to release verification. No production release, profile
update, social post or real lead submission occurred.

## Reproduce the asset

With project dependencies installed and DejaVu Sans available:

```sh
node --input-type=module -e 'import sharp from "sharp"; await sharp("docs/qa/assets/issue-371-share-card.svg").png().toFile("public/og-image.png");'
```

The deployed file is the PNG; consumers do not need fonts or SVG support.

## Preserved public project share destinations

All destinations below are unchanged from the starting commit. The table uses
paths under `https://www.vivekapatel.com`.

| Project route | Preserved share image |
| --- | --- |
| `/project/n8n-openai-data-extraction` | `/assets/case-studies/n8n-openai-data-extraction-5f8d33c712e39a32dc57c65eab98aa8cac4e98d0eb9019594e41f389482e6c78.png` |
| `/project/invoice-ocr-extraction` | `/assets/case-studies/invoice-ocr-extraction-b8ce7ee800b1787f0c9b87d3ece9c63c05c235d214adb09a595ac6dee7c70bb9.png` |
| `/project/yolo-computer-vision-optimization` | `/assets/case-studies/yolo-computer-vision-optimization-24ce758aad9d742640d262cd2f4c87d0800952848d30bf4e7ea0806b47c40ee5.png` |
| `/project/ai-invoice-processing-automation` | `/assets/case-studies/ai-invoice-processing-automation-c8dfbd729212333c91bfa50a3609df4b6917b43905088205637e79083c0b7942.png` |
| `/project/ai-project-planning-assistant` | `/assets/case-studies/ai-project-planning-assistant-c3300da763e338ca89d04e53726d18cdb029b01bd52e58b56af1b1c266295309.png` |
| `/project/browser-search-to-spreadsheet` | `/assets/case-studies/browser-search-to-spreadsheet-8ae2242a5fc25fe5381c89710e3d03b339d64bcbd18e24fee7ab585ecc71f240.png` |
| `/project/depth-based-distance-estimation` | `/assets/case-studies/depth-based-distance-estimation-76b828a59b753889220e65c72ae309a71a0fae66385ca44b16fed43607aa1396.png` |
| `/project/healthcare-document-intelligence` | `/assets/case-studies/healthcare-document-intelligence-810c1c60cf5ea9c71310b20f4f03d768d86cea515b232c9c63a4a01a6fe039ce.png` |
| `/project/n8n-python-ai-agents` | `/assets/case-studies/n8n-python-ai-agents-90b4eba309ed1497b89f6652c047139a008d69b03a203adfe3cf51d968325e35.png` |
| `/project/python-ci-workflow-automation` | `/assets/case-studies/python-ci-workflow-automation-b2e7442167276c591fd8a53ed27017dd0eaee1cd3e6d9c50542c8be123ca4f0a.png` |
| `/project/resumable-listing-data-extraction` | `/assets/case-studies/resumable-listing-data-extraction-6d3d3858a3b323c7c8fe3d2382a591842ff6638012ca1378b02cb4b2cef6642a.png` |
| `/project/sports-video-analytics-yolo` | `/assets/case-studies/sports-video-analytics-yolo-24b3bf7a4e342c9fb57488d8570f9bfa695e2321483670ed66b798df654385f0.png` |
