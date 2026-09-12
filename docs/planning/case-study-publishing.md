# Case-study publishing discussion

Date: 2026-09-09
Status: simple article UI approved; detailed implementation plan prepared in `simple-case-study-implementation-plan.md`.

## Confirmed goals

- Create case studies with assistant help after client projects.
- Minimize ongoing authoring and publishing work.
- Present attractive project stories that support Google discovery and hiring.
- Reuse relevant stories in Upwork proposals.
- Review visual design before implementing the feature.

## Observed local implementation

- `src/data/caseStudies.js` contains three manually authored JavaScript records.
  `featuredCaseStudies` includes every record. No publication state is present.
- `src/pages/Project.jsx` already supplies a reusable detail template and
  `src/components/Portfolio.jsx` derives homepage cards from the records.
- `src/lib/seoConfig.js` derives project metadata from those records; the build
  generates a sitemap and per-route HTML. `tools/generate-static-route-html.js`
  replaces head metadata in the application shell rather than rendering story
  body content into HTML.
- `docs/deployment.md` documents GitHub main to Hostinger auto-build deployment.
  Live hosting configuration was not independently verified in this audit.
- Existing `CONTEXT.md` describes per-source-project authoring and a published
  state, but this checkout does not implement that content synchronization.
- The central hub has six top-level Markdown story drafts, five stubs, an
  internal contract index, README, and an empty proof index. Drafts already use
  metadata and common narrative sections. Some source_project_id fields are empty.
- The hub README distinguishes public-safe stories from machine-reusable
  observed claims. An empty proof index does not by itself prohibit a manually
  reviewed anonymous story. The whole directory is not a publication payload.
- Current website records include numbers and related-project imagery that
  need attribution review when migrating; they should not be copied as verified
  outcomes for different projects.
- Live GitHub inspection confirmed publication-boundary PR #56 was merged on
  2026-09-08. The inspected local checkout does not include it. Refresh the
  implementation baseline while preserving local edits; extend its compiler,
  approval checks, and generated routes rather than adding a second pipeline.

## Accepted direction

Keep Markdown authoring in the central hub. Export only selected public text and
approved media into the website's content directory, then use one shared page
template. Generate cards, stable URLs, full story HTML, metadata, social previews,
and sitemap entries from that content. Keep the existing website stack.

Start with an assistant-run export and preview, followed by an explicit release
trigger. Publishing after that trigger can use the existing documented build
path. A local folder change alone cannot update the hosted site: the export must
reach its deployment source. Cross-repository automation would require a defined
trigger and access, so defer it unless hands-off syncing is a real requirement.

Only publication-eligible exports belong in the shipped assets. Validation errors
should leave the last valid release in place; withdrawal must remove the page,
cards, sitemap entry, and assets no longer referenced by other published stories.

Viv subsequently selected a simpler design: one article template with a title,
short summary, optional project screenshot, Problem / What I built / Outcome,
and a contact link. Additional images may appear inline in Markdown. Use the same
title, summary, and optional image for the portfolio card. Do not introduce
project-specific layouts, galleries, or custom illustrations. Keep styling sober
and maintenance minimal; add complexity only when needed.

Three visual samples now demonstrate this same structure for invoice automation,
photo OCR, and pose detection. Their image areas are explicitly placeholders;
actual public-safe project media has not been selected or published.

## Decisions accepted in discussion

1. Author with Codex in the current Markdown hub.
2. Preview, then an explicit publish step; automate subsequent publishing work.
3. Refine the current dark/purple visual style.

Viv approved the three-sample simple article UI. The detailed implementation plan
now covers the export contract, preview lifecycle, schema transition, URL migration,
and verification. Upwork-facing links need review against current platform rules
before prescribing a direct-contact website link as the proposal default.

## External references

- Google recommends server-side rendering or prerendering for users and crawlers:
  https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Upwork supports profile highlights and work samples in proposals:
  https://support.upwork.com/hc/en-us/articles/211062998-How-to-submit-a-proposal-on-Upwork

The accepted architecture direction is recorded in ADR 0001. No application code,
source-library content, or live website was changed during planning.
