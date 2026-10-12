# Reconcile production history before the October release

Release PR #356 (`develop` → `main`) initially conflicted because production has
two squash commits absent from develop's ancestry:

- `82929ec1`: the earlier public-rate, service-offer, location, and case-study
  release (#149).
- `9b7e6370`: identifying/editorial public-copy removal (#222), explicitly
  cherry-picked from develop commit `b6462b77` (#201).

A read-only comparison of both main-only commits against develop
`78bf82e225cedb0f621f74da5f672e598b5702ba` found no missing functional or privacy
requirement. Restoring the old versions would undo later reviewed changes.

| Production requirement | Current develop implementation |
| --- | --- |
| Remove identifying/editorial copy | Original privacy commit is already a develop ancestor; public-copy and browser leak guards remain. |
| Honest n8n representative captions | #353 removes borrowed representative images and tests the fictional SQL specimen labels. |
| Bounded depth, sports, schedule claims | Current publication records/tests retain source-specific limits and distinguish validation scores, tracking, geometry assumptions, and staff schedules. |
| Public hourly rate and proposal rate | Shared pricing remains €45/hour; website, SEO/HTML, and proposal helper derive labels from it. |
| Linz location and three scoped offers | Retained; later reviewed service-detail routes and worldwide availability supersede the older presentation. |
| Separate Other Work collection | Intentionally replaced by the unified collection in #301. |
| Unsupported proof chips removed | #177 removes the old ProofStrip and retains reviewed proof in Hero. |
| Honest approved imagery | Later publication/media revisions preserve provenance guards and label overview diagrams separately from evidence. |
| Gallery geometry and scroll behavior | Aspect-ratio handling remains; broader later QA retains position/focus assertions. |
| CI concurrency | Retained and refined with event-aware cancellation behavior. |

The reconciliation branch starts from that exact develop head and merges
`9b7e637024703be7ffebd088beb052e8178a2fbf` as an additional parent. Its deliberate
history-only resolution retains the reviewed develop application tree; this
report is the only new file. This is not a blanket conflict choice made without
inspection: each main-only requirement was traced to its retained or superseding
implementation before choosing the existing tested tree.

An independent focused check passed 90 tests covering public copy, publication
eligibility, service offers, SEO location, and proposal mapping. Parent full unit
and isolated production build checks run before the reconciliation commit;
hosted CI is required on the sync PR and final release head. Earlier independent
release verification passed real built homepage rate/stars, overview-to-evidence
selection, lightbox Escape/focus return, and empty contact validation.

**Merge this reconciliation PR into develop with a merge commit, not squash or
rebase**, to retain main's ancestry. It changes no production application behavior
and does not deploy. Release PR #356 must then be rechecked at its new develop
head and merged into main only under the owner's production approval, which was
explicitly given in this session. Verify the actual Hostinger deployment
separately after the production merge.
