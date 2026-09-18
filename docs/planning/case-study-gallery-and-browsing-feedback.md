# Case-study galleries and collection browsing

Recorded: 2026-09-10, during local review of develop.
Status: requested follow-up; design direction below is a proposal, not an approved implementation.

## 1. Multiple images within each case study

Viv observes that the current case studies each show a single image. Support multiple images and make it immediately apparent that visitors can browse more than one.

Proposed direction to evaluate:

- Keep one cover image on collection cards; show the full gallery on the case-study page.
- Show a large selected image with visible thumbnails, previous/next buttons, and a position label such as “2 of 6”. Keep the controls visible without hover.
- Support touch swiping on mobile, keyboard navigation, and a horizontally scrollable thumbnail strip. Swiping must not be the only way to advance.
- Let visitors open screenshots at a larger size to read details; provide captions and descriptive alt text. Avoid automatic slide changes.
- Preserve image aspect ratios and lazy-load additional images so a long gallery does not delay the article.

Before implementation, compare this gallery with a simple inline image sequence using real screenshots at desktop and mobile widths. Choose based on image readability, discoverability, accessibility, and article length.

Acceptance examples: one image needs no redundant gallery controls; three or ten images are clearly discoverable and browsable; long screenshots remain readable; adding images uses the content workflow rather than per-project UI code. Every published image must continue through the existing asset review and publication process.

## 2. A collection that grows beyond three case studies

Viv currently sees three case studies and wants a clear way to browse the fourth, fifth, sixth, and eventually twenty or more. Viv reports having worked on twenty Upwork projects, with more expected. This is collection capacity context; it does not mean twenty case studies are already written or approved for publication.

Proposed direction to evaluate:

- Keep a small featured selection on the homepage and add a clear “View all case studies” link with the published total.
- Provide a dedicated collection page with a responsive card grid and normal vertical page scrolling.
- Start with a manageable batch, for example six or nine cards, and an explicit “Load more” button showing how many are displayed and remain. Preserve the visitor’s loaded items and scroll position after returning from an article.
- Evaluate category filters and title/summary search once the collection is large enough to benefit. Derive categories from actual published work.
- Prefer this browseable grid over placing twenty projects in a horizontal carousel, where most projects would be hidden.

Acceptance examples: verify layouts with 3, 4, 6, 20, and 30 published stories; no clipped cards or horizontal page overflow; visitors can reach every story on mobile and with a keyboard; counts reflect published stories only; adding a story requires no layout changes. If filters are introduced, include a clear empty state and reset control.

## Relationship to the earlier plan

These requests extend the initial scope in `simple-case-study-implementation-plan.md`, which excluded gallery widgets and collection filters and initially displayed all published stories without pagination. Preserve that historical plan; settle this follow-up design before implementation.

Next step: compare a desktop/mobile gallery mockup and a twenty-story collection mockup with Viv, then decide the gallery treatment, homepage selection size, and collection loading behavior.
