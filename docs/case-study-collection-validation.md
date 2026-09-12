# Case-study collection validation handoff

This document is the validation record for CB-10 (#88), under the agreed
collection checklist in #78. It covers collection browsing and homepage
selection. Article gallery work remains in #77. Local validation does not
authorize a merge, release, deployment, publication, or issue closure.

## Dependency chain

The implementation is reviewed as a cumulative chain targeting `develop`.
Compare each issue only with the scope and evidence in its corresponding PR
body; this table is a handoff map, not merge or CI evidence.

| Issue | Scope | PR |
| --- | --- | --- |
| #79 | Published completed-story eligibility | #90 |
| #80 | Completion month and year metadata | #91 |
| #81 | Completion date card display | #92 |
| #82 | Newest-completion collection ordering | #93 |
| #83 | Responsive collection page | #94 |
| #84 | Handpicked homepage stories and all-stories link | #95 |
| #85 | Six-card loading | #96 |
| #87 | Deferred category filters and search | #89 |
| #86 | Browsing-position restoration | #97 (commit `7fb1b93`) |
| #88 | Integrated collection validation | This PR |

The gallery work from #77 remains on its originating branch and named stash.
This handoff records no stash hash and no raw private path.

## Known content disposition

The three retained legacy identities remain unresolved in
`docs/case-study-migration-status.md`. No legacy story identity, completion
month, estimate, or public metadata should be inferred from an adjacent
project. No canonical metadata facts have been received. Retained stories stay
excluded from the eligible collection until explicit status and completion-date
facts are supplied; their article URLs remain available. Owner facts remain
pending. Validation fixtures must use clearly synthetic records and must not
modify the canonical baseline or staged store.

## Required integrated matrix

Run `tools/run-case-study-collection-qa.js` against disposable local fixtures
for each eligible published-story count: **3, 4, 6, 20, and 30**. The harness
defines desktop (1280px), tablet (768px), and mobile (390px) viewports. Each
fixture uses explicit completed status and completion months, a published
ongoing record, a draft/private record, and the configured handpicked slugs
`qa-story-03`, `qa-story-01`, and `qa-story-02`.

The 2026-09-10 harness run was local-only. Its loopback guards block external
network attempts and its disposable fixtures do not modify canonical content.
Record the following factual results:

| Check | Required evidence | Result |
| --- | --- | --- |
| Scale | 3, 4, 6, 20, and 30 eligible fixtures complete | **PASS** |
| Layout | Desktop, tablet, and mobile columns fit at every scale | **PASS** |
| Ordering | Collection is newest completion first; long titles do not clip | **PASS** |
| Date alignment | Card completion date and read link stay aligned at loaded scales | **PASS** |
| Homepage | At most three configured cards appear in configured order; View all link uses the full eligible count and `/case-studies/` | **PASS** |
| Loading | Six cards render initially and each Load more action updates the displayed/total count until exhausted | **PASS** |
| Restoration | Explicit return and browser back restore the collection URL, displayed count, and scroll position | **PASS** |
| Reachability | Every loaded story link is reachable with Tab and mobile touch | **PASS** |
| Exclusion | Ongoing and draft/private records are absent from collection cards and homepage count | **PASS** |
| Removal | 30→3 rebuild removes 27 stories, including story 30, and returns 404 for the removed article | **PASS** |
| Privacy/network | Draft/private output sentinel is absent; loopback guards block external network attempts | **PASS; local-only** |

The harness also checks page errors, no horizontal overflow, card geometry,
unknown/removed article behavior, direct-article return, and the 30-story
removal scenario. Keep raw screenshots, traces, reports, and private fixture
paths out of this tracked handoff; record only bounded outcomes and the
allowlisted sanitized QA summary when one exists.

## Verification record

On 2026-09-10, the full suite passed with 294 tests across 35 files, a fresh
production build passed, 58 desktop/mobile route and interaction checks passed,
and `git diff --check` passed. These checks do not replace the integrated
harness result.

On 2026-09-10, the independent integrated harness exited successfully across
all five scales and all three viewports, including
Tab traversal, touch links, explicit return/back count and scroll restoration,
direct-article return, the 30→3 removal/404 check, and bounded draft-sentinel
output checks. Root’s desktop and mobile visual review also passed for long-title
wrapping and date alignment; the synthetic 1px covers were expected fixture
content. SEO and sanitized-artifact checks also passed. Keep release and
live-host verification as separate authorized steps.
