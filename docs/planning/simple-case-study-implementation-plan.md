# Simple case-study publishing — implementation plan

Date: 2026-09-09
Status: UI approved; implementation plan ready for review. No feature implementation or release authorized by this document alone.

The formal acceptance specification and eight dependency-linked local tickets are
in `.scratch/simple-case-study-publishing/spec.md` and
`.scratch/simple-case-study-publishing/README.md`. The specification is the
implementation acceptance contract; this plan supplies supporting rationale.
Ticket granularity review precedes remote tracker publication.

## 1. Outcome and scope

Replace manually maintained case-study content with Markdown-driven articles using the UI Viv approved in the three-sample preview. Keep React, Vite, the existing hosting path, and the existing publication checks.

The normal workflow is: write with Codex in the central hub → inspect a local preview → say publish → Codex prepares and releases the reviewed content through the existing build/deployment flow → verify the public URL.

“Automatic” means no hand-editing cards, React pages, SEO entries, or server route lists for a new story. It does not mean a background watcher publishes every local edit. First implementation ends with a tested local result and reviewable changes; production release follows an explicit instruction.

### Approved UI reference

The approved preview is `simple-case-study-samples.html` in this task's visualization output directory. Its three project selectors are preview controls, not part of the website.

One article template, in this order:

1. Optional category label.
2. Title and short summary.
3. Optional screenshot with descriptive alt text and optional caption.
4. The problem.
5. What I built — paragraphs or a short list.
6. The outcome — qualitative results are sufficient.
7. “Working on something similar?” and “Discuss a similar project →”, linking to `/contact/`.

Use a readable single column, approximately 680–720px maximum width, existing dark background, restrained purple links, sentence-case headings, and generous but modest spacing. At mobile widths reduce padding and wrap text naturally. Use the existing site header/footer and consent behavior. No custom hero diagrams, per-project layouts, gallery widgets, animated counters, filters, or new application navigation.

Screenshots display at their natural aspect ratio with a maximum width of 100%. Do not crop an n8n workflow or a document to fill the article. A plain link can open the full image; no lightbox is needed. Missing images remove the entire image area, including its spacing and caption. Preview placeholders never ship.

## 2. Baseline and prerequisite

Local inspection found a three-record `src/data/caseStudies.js`, a reusable `Project.jsx`, homepage `Portfolio.jsx`, and route/SEO build scripts. The local work includes planning documents and an unrelated deletion of `.agents/sol-advisor`; preserve all existing changes.

Live GitHub inspection on 2026-09-09 confirmed [PR #56](https://github.com/vivekpatel99/my-portfolio-webisite/pull/56) merged on 2026-09-08. Its merged changes are absent from the inspected local checkout. It introduces:

- `publication/case-study-manifest.js`, the publication compiler and validators.
- Exact-content approval bindings and approved asset checks.
- A public projection consumed by the application and build tools.
- Draft exclusion and generated route allowlists, sitemap output, and asset handling.

Before implementation, inspect the then-current remote main and local divergence, and update the working baseline without discarding local edits. Use this checkout; do not create a worktree unless requested. If the baseline has advanced again, adapt this plan to the actual merged implementation. Do not cherry-pick or reimplement PR #56 blindly. Its dependency relationship with asset-provenance work must also be checked in the updated baseline.

The remote compiler currently requires the old content shape, including a cover image and legacy fields. Optional images and the new article body require an intentional schema update; UI-only changes will not suffice.

## 3. User stories

1. As Viv, I want to write a case study with Codex in the current hub, so that I maintain one editable story.
2. As Viv, I want to preview a new or edited story before release, so that I can judge its wording and appearance.
3. As Viv, I want publishing to update the page, card, metadata, and sitemap together, so that I do not edit code for each project.
4. As Viv, I want a story without images to remain presentable, so that lack of a screenshot does not prevent publication.
5. As a visitor, I want to understand the problem, work, and outcome quickly on a phone or desktop, so that I can assess fit.
6. As a visitor, I want readable screenshots and a clear contact link, so that I can inspect the work and enquire.
7. As Viv, I want stable page URLs, so that links already shared continue to refer to the same work.
8. As Viv, I want invalid content to stop a release with a useful error, so that the existing published version remains available.
9. As Viv, I want to edit or withdraw a story deliberately, so that stale content is removed from all public outputs.
10. As Viv, I want a canonical story URL available for appropriate reuse, so that I can reference relevant work without rewriting it.

## 4. Content contract

### Authoring location

Keep the source under `/Users/viv/Freelance/case_study_to_proposal_hub/case-studies/`. Each selected story remains one Markdown file. Images live in a simple sibling asset directory grouped by story ID. The website receives generated public content and selected assets; these are not a second authoring location.

Builds on GitHub/Hostinger must work from the website repository alone. Do not make production builds depend on an absolute Mac path, access to private client repositories, or credentials to the hub.

### Minimum fields

| Field | Requirement | Meaning |
|---|---|---|
| `id` | Required, unique, stable | Reuse existing story identity |
| `title` | Required | Shared by article and homepage card |
| `summary` | Required | Shared by article, card, and meta description |
| `slug` | Optional for a new story | Default to ID; explicitly preserve old URLs where appropriate |
| `category` | Optional | Small label; omit if absent |
| `image` | Optional | Local source path, alt text, optional caption |
| Body | Required | The problem / What I built / The outcome |

No separate card title, gallery schema, metric fields, page builder, or required technology list. Existing hub metadata such as confidentiality and source references remains internal unless explicitly part of the public contract.

Use ordinary Markdown headings, paragraphs, lists, emphasis, links, and images. No MDX, executable expressions, arbitrary HTML, iframe embeds, or plugins that run code from the document. Use a maintained Markdown parser and frontmatter parser selected against the existing dependency tree during implementation; do not write a custom Markdown parser.

### Explicit public section selection

Existing hub drafts contain internal reuse notes, source identifiers, and longer technical material. Never export the entire folder or blindly publish the full current body.

During one-time editorial migration, normalize each selected story's public sections to `The problem`, `What I built`, and `The outcome`. The importer includes only these named level-two sections and their contents, ending at the next level-two heading. Other sections remain private source notes. Require exactly one of each public section; missing/duplicate sections produce a file-specific error. Images may be inserted inside these sections without additional page types.

Title and summary come from metadata; do not repeat a source H1 or introductory blockquote in the output. Keep the public outcome text available separately for the existing evidence binding, while rendering it once as part of the article.

## 5. Minimal implementation shape

### A. One local preparation command

Add a documented package command accepting an explicit source file or an explicit list of story files. It reads the source, validates the public fields/sections, resolves referenced images, and prepares the public projection plus local preview input. Repeat runs with unchanged sources must produce no diff.

Do not recursively publish every `.md` file. README, contract indexes, stubs, and proof registries are not stories. A selected update must not delete unrelated published stories; withdrawal is a separate explicit operation.

Resolve asset paths inside the allowed story-assets directory, reject traversal/symlink escape and missing files, and use stable names or content-derived filenames under the existing case-study asset prefix. Copy only referenced raster images (PNG/JPEG/WebP for v1), not entire client folders. Require alt text. Optimize/redact selected screenshots during content preparation and remove sensitive metadata before their bytes are approved. Any source or image change invalidates approval for the previously reviewed bytes.

### B. Extend the existing publication pipeline

Adapt the merged compiler/manifest to the minimal article shape rather than adding another competing content registry. The importer prepares generated record data; Codex handles the mechanical approval bindings after an explicit publish instruction. Viv should not edit hashes or JavaScript by hand.

Use an explicit schema version transition, and migrate legacy records through it. Bind the complete public article and media references to the reviewed content. Preserve existing observed-claim and asset-provenance checks; do not reinterpret baseline retention approvals as approval for rewritten content. Preview preparation must not create production approval.

The existing empty proposal `proof-index.json` is not a reason to refuse an otherwise reviewed anonymous story; it controls machine reuse of observed claims. Do not populate it as a side effect of website publication. Preserve the distinction between source evidence, website publication approval, and proposal-library reuse.

### C. One shared article component

Make `src/pages/Project.jsx` a thin route lookup and SEO wrapper around a simple article component. The article receives normalized public data, has no data fetching or browser-only dependencies, and is usable in both browser rendering and the build.

Compile Markdown through one safe rendering path. Reject dangerous link protocols and raw HTML; do not inject unvalidated source text as trusted HTML. Prefer compiling the selected Markdown once during content preparation/build so the browser consumes only public output. Retain the sanitized Markdown or normalized source in build-only inputs for deterministic regeneration.

Simplify `Portfolio.jsx`: same title/summary, optional image above text, and one link to the case study. Keep the existing responsive card grid. Show all published stories initially; no featured flag or pagination. Remove copy promising a “measurable outcome” for every project. No-image cards must have no broken element, placeholder, or blank reserved image box.

### D. Full story HTML and route generation

Keep `/project/<slug>/` URLs and existing SEO conventions. Generate title, description, canonical URL, and social metadata from the same public projection; use the cover image if present and the existing site image otherwise. Retain sitemap and Apache allowlist generation supplied by the publication pipeline.

Extend `tools/generate-static-route-html.js` to include the actual article content, not only metadata. Render the shared pure article at build time with React's existing server renderer; use Vite's transform/build support for JSX rather than adding a server framework. Ensure compiled CSS includes the article styles.

Insert the snapshot inside the normal root. The existing `createRoot` may replace it with the same article when the app starts; a site-wide hydration conversion is not required. Preserve meaningful title, article, image, and contact/back links without JavaScript. Verify that the initial content is visible and that the client takeover does not leave two articles, blank the content, or cause a material layout shift. Do not execute analytics, contact submission, or Convex calls during generation.

Build order: validate/compile published content → Vite bundle and approved assets → sitemap/routes → static article HTML → output integrity checks. Clean generated output so withdrawn content cannot survive as stale files. Preserve any merged provenance preflight before bundling.

## 6. Preview and publication lifecycle

| Action | Local result | Production result |
|---|---|---|
| Prepare draft | Validated temporary preview inputs | None |
| Preview | Loopback-only preview with the shared template | None |
| Revise | Replace candidate and rebuild preview | None; prior approval no longer covers edited bytes |
| Explicit publish | Bind reviewed content, prepare website change, run checks | Release only the reviewed change through approved Git/deployment steps |
| Withdraw | Prepare removal of named record and unreferenced assets | After explicit release, old URL returns a real 404 and disappears from cards/sitemap |

Draft previews must be separate from production inputs and build output. Prefer an ignored, local preview directory with the same renderer; refuse preview mode in CI/production. Do not grant draft access merely through a query parameter on the deployed site. Preview output must not be part of a public PR artifact upload. Use `noindex` for previews as a secondary precaution, not as access control.

Preparation or validation failure must not overwrite the currently valid publication snapshot. Stage candidate output first and replace it only on successful validation. Report the failing file/field in plain language. If deployment fails after a merge, report the actual state and inspect before retrying. Do not claim “published” from a successful local build.

The existing documented hosting flow is GitHub main → Hostinger build. Verify its actual integration before the first release. Completion means the expected public page, image, canonical URL, and sitemap entry have been checked. A withdrawal also requires verifying that hosting removes obsolete files rather than only uploading new ones.

## 7. Content migration

Deliver the infrastructure with one representative story first, then apply the same pipeline to the other five hub stories. Work can be split into small reviewable commits without introducing multiple templates.

1. Normalize and preview the invoice-automation story.
2. Exercise the same template with photo OCR and pose detection, matching the approved examples.
3. Normalize and prepare n8n agents, healthcare document extraction, and sports video analytics.
4. Keep incomplete/unapproved candidates out of the public release. Their presence in the library is not publication approval.
5. Review chosen images separately; publish a text-only story when no suitable image is available.

Old route handling must follow actual project identity:

| Existing route | Migration treatment |
|---|---|
| `n8n-openai-data-extraction` | Retain as a legacy story until its exact source is identified; do not substitute the invoice or SQL-agent engagement |
| `invoice-ocr-extraction` | Compare to `photo-ocr-extraction`; retain the old slug only if confirmed to be the same project |
| `yolo-computer-vision-optimization` | Check its mixed pose/stitching claims against the actual project; do not migrate unrelated benchmark claims into the pose story |

Keep verified same-project slugs stable. Add redirects only for a confirmed rename of the same story. Do not redirect an unrelated retired project to a newer case study. A unresolved legacy record can retain its previously approved content while review proceeds; new wording requires review. Legacy presentation may be mapped to the simple template without inventing new outcomes.

The first production batch is the explicitly reviewed set, not automatically all six drafts. The system is complete when any subsequent valid story can be prepared and published without editing application code.

## 8. Work sequence and completion checks

| Step | Work | Complete when |
|---|---|---|
| 1. Establish baseline | Reconcile local checkout with merged publication work; preserve dirty files | Current compiler, provenance, and build flow documented and understood |
| 2. Define/import content | Minimal parser, section selection, assets, deterministic export | A valid selected file imports; invalid input fails without changing existing output |
| 3. Render approved UI | Shared article and simple cards | Automation, OCR, pose, and no-image variants fit the same template on desktop/mobile |
| 4. Integrate publication | Schema transition, approval bindings, local draft preview | Draft content stays local; changed public content cannot reuse stale approval |
| 5. Generate pages | Full article HTML, SEO, asset and route output | Direct project URLs work and the article is readable without JavaScript |
| 6. Migrate stories | Six candidates, legacy identity review, actual media where available | Per-story preview and URL map are reviewable; unready content remains draft |
| 7. Verify and document | Existing tests, focused integration checks, authoring instructions | Checks pass and adding one fixture story requires no React/routing edits |
| 8. Release when instructed | CI, approved merge/deploy, passive live verification | Reviewed stories are observable on the public site; no unapproved content leaked |

## 9. Verification

Use existing Vitest, publication fixture builds, route-integrity tests, and passive Playwright tests. Extend these seams rather than building a separate test framework.

Required behaviors:

- A valid new story appears in the page, card, sitemap, allowlist, and metadata from one input.
- Text-only story omits image/caption and produces useful social metadata fallback.
- Missing required sections, duplicate IDs/slugs, missing media, unsafe paths/URLs, and raw HTML fail clearly.
- An internal source note containing a sentinel never appears in generated HTML, bundles, or assets.
- Draft records and local preview output never appear in the production build.
- Modified body or asset bytes cannot reuse the old exact-content approval.
- A withdrawal removes route, sitemap entry, card, and uniquely owned assets while retaining assets referenced by other published stories.
- Published article text is present with JavaScript disabled; browser startup retains the same content and functional links.
- 360px and desktop layouts have no horizontal overflow; images retain their proportions; keyboard focus and heading order are usable.
- An n8n screenshot remains legible when opened directly; no placeholder graphic is published.
- All legacy route mappings are checked against the agreed migration table.

Run `npm test`, `npm run build`, the existing SEO/passive browser QA commands, and `git diff --check` on the final candidate. Do not submit the contact form or perform live side effects for QA. Review generated output, not just source code. No performance scores or ranking guarantees are required to call this implementation complete.

## 10. File impact

Expected changes, adjusted to the refreshed baseline:

- `src/pages/Project.jsx` and a shared article component: approved UI.
- `src/components/Portfolio.jsx`: simple data-driven cards and accurate section copy.
- `publication/` compiler, schema, and generated inputs: Markdown-derived article support and optional media.
- `plugins/vite-plugin-case-study-publication.js`: continue exposing only published projection/assets; adapt if the schema requires it.
- `tools/`: local importer/preview entrypoint and extended static HTML generation.
- `src/lib/seoConfig.js`: per-story metadata and optional image fallback.
- Existing publication, project, portfolio, route, and browser tests.
- `package.json` and lockfile: preparation command and minimal parser dependencies.
- `docs/deployment.md` and a short authoring guide: exact prepare/preview/publish/update/withdraw commands.
- Selected Markdown story public sections and assets in the hub during authorized implementation; no rewrite of proposal proof registries.

No Convex schema, backend function, authentication, or database change is needed.

## 11. Deliberately deferred

CMS/admin editor, database-backed stories, cross-repository webhooks, background publishing, scheduled jobs, project-specific layouts, galleries/lightboxes, generated artwork, video hosting, search/filtering, pagination, complex SEO automation, automatic Upwork submissions, and a second Upwork-specific website.

The website supplies a canonical URL. Before using it in Upwork, check the current link/contact rules for the intended placement. The generic website contact CTA is not automatically an approved Upwork proposal link. No proposal submission or external marketplace publication is part of this implementation.

## 12. Delivery summary

The implementation handoff should include: the working local preview; list of migrated draft/published candidates and URL mapping; commands for adding/editing/removing a story; validation evidence; remaining content/media approvals; and the exact proposed release change.

Success: the approved sober article design works for every prepared story, and adding the next case study is content work rather than application development.
