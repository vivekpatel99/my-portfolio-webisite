# Case-study improvement review — 11 October 2026

Historical presentation review. The later [source and media review](factual-review.md) supersedes factual scope and publication identity where corrected.

This follow-up remains in PR #353. It incorporates the football media prepared in PR #350, so the images, video, galleries and explanations can be reviewed together in one PR. No integration merge or production release is included.

## Findings and changes

| Finding | Response |
| --- | --- |
| Historical invoice screenshot metrics looked like current verified results | Visible captions qualify all four M1/M2 occurrences, including the copies in the n8n SQL story. The 97.9%, 18-invoice dataset and OCR Arena ranking are historical annotations, not independently verified benchmarks for these case studies. |
| PDF splitting screenshot implied combined multi-invoice processing | Its caption explicitly keeps combined multi-invoice PDFs outside the verified scope. |
| Supplied football visuals did not establish the same delivery as the pose, shot and rally narrative | The article and every football-media caption identify the relationship as unverified. Delivered batch/human-review scope remains; the supplied video is a tracking reference. |
| Charts lacked interpretation and evaluation context | F1 captions explain precision/recall, the displayed peak and weaker ball curve. The matrix caption explains raw counts and background margins. Model, dataset and run context remain unverified. |
| Gallery arrows obscured mobile chart and diagram labels | Navigation moves to a separate row below media, including the enlarged dialog; arrows retain 44px targets. DESIGN.md records this as an existing reference under IM-01. |
| Six cases lacked a concrete output format | Added purple, editable output illustrations for browser search, listing extraction, schedules, planning, the Python quality toolkit and the SQL agent. Each image visibly says “Illustrative output” and “Fictional data”; captions describe what to inspect and the evidence boundary. |
| Copy repeated exclusions or used unexplained wording | Staff-schedule boundary remains in the problem and relevant captions; shortened repeated exclusions in summary/outcome. Clarified the n8n summary, expanded JSON Lines in listing prose, and shortened long cover captions. |
| “Record completed” was ambiguous | The native listing diagram now says “Save completed listings.” Re-rendered and inspected at native and 360px widths. |
| Exact Python PR-helper behavior was not established | The example shows representative handoff notes and explicitly does not demonstrate a pull-request action. No undocumented operation was invented. |

The supplied OCR/invoice illustrations retain their scope captions. Lead qualification remains unassigned and absent from production output.

## Sources and publication

The six editable output sources are in `sample-outputs/`. PNGs use the matching `*-sample-output.png` names under `public/assets/case-studies/`. Their 1080 × 810 composition matches the existing white, slate and purple imagery; main text is at least 14px when viewed at 360px width. Supporting labels in the wider Excalidraw workflow still benefit from enlargement on mobile.

The reviewed candidate is `diagram-publication-candidate.json`. Official staging now preserves and validates explicit image/video galleries, requires an approved image poster, checks safe local media paths and reviewed byte digests, and rejects unsupported fields. Asset references in the candidate describe frozen snapshots; their content is recoverable by matching SHA-256 against the committed public source assets.

Display images and thumbnails have source/derivative hash bindings. Existing thumbnail aliases remain available. Samples are illustrations of format and workflow; they are not client exports, benchmark results, captured agent executions or successful CI runs.

## Verification

The integrated candidate passed all 965 unit tests across 73 files. The production build verified 44 display derivatives for 50 image sources, generated 21 static routes and checked 36 public links. Full tests in the exported review copy used the shared Git directory read-only for the existing ignore-rule test. A separate read-only code review found no actionable defects in safe-path checks, rejected fields, approved-byte binding or gallery round trips. At the initial review, MP4 staging validated approved bytes and the container header; a separate ffprobe check confirmed the supplied video is H.264, 640 × 360 and 30 seconds. Subsequent automated review requested stream validation within staging itself; the follow-up below records that repair.

All 140 scoped gallery, focus and evidence cases passed across the initial run and targeted fixture corrections, in Chromium and WebKit on desktop and mobile. A separate capture check covered 18 chart, diagram and sample states at 390px and 1440px, including inline media and enlarged 100%/150% views. Arrows measured 44 × 44px and sat 12px below the evidence stage; Escape restored focus. The parent inspected the [mobile chart](review-evidence/chart-390-inline.png) and [mobile sample](review-evidence/sample-390-inline.png).

T3 snapshots failed with “Preview automation snapshot timed out after 15000ms” and “Preview automation client server-browser disconnected during snapshot.” Rendered verification used the documented repository browser-QA path instead. No physical-device or production-deployment verification was performed.

The [fresh independent portfolio review](portfolio-expert-review.md) passed with no substantive blockers, important defects or spelling mistakes. It covered all twelve stories/covers, eight native workflows, six fictional outputs, all 50 gallery items and the critical scope captions. Nine initially incomplete offscreen lazy thumbnails were selected, loaded and decoded successfully with matching byte hashes; final broken-image failures were zero. Supporting details in wider diagrams still benefit from enlargement on mobile. This is a content and presentation pass, not production-release approval.

## Follow-up CI and staging review

CI exposed expensive deep equality on the complete 2,184,380-byte video fixture.
The final assertion now uses native `Buffer.equals` and still requires identical
bytes. On the local Mac with `CI=1 --maxWorkers=2`, the same round-trip test fell
from 1,587 ms to 40 ms; a final-byte-only mismatch was rejected. The fixture,
approval assertions and five-second test budget remain intact.

The MP4 boundary keeps one private `assertReviewedMp4Snapshot` helper in the
stager. Its caller supplies frozen approved bytes, asset metadata and the
validated stories. The helper finds every matching gallery entry and owns
temporary-file cleanup, bounded process execution, parsed stream metadata and
dimension agreement. It runs before any
public-asset or staged-store write. FFprobe inspects a temporary file containing
the approved bytes; probing a mutable source path would weaken the byte binding.

An established JavaScript MP4 parser was considered as a portable alternative.
It would add a dependency and parse container/sample-description metadata without
checking codec stream dimensions. The selected FFprobe approach keeps that
complexity out of the caller and avoids a new JavaScript dependency, at the cost
of an explicit local tool prerequisite and CI installation. Packet inspection
provides evidence beyond an empty track header; it does not prove every frame
decodes. The [authoring guide](../case-study-authoring.md) records the prerequisite
and the separate playback-review boundary.

The diagram review now names the current twelve-story candidate, its exact
SHA-256 and 51 asset entries. Its earlier eleven-story audit is explicitly
historical; reconstruction instructions refer to the current digest.

The WebKit gallery regression now waits for visible elements and loaded images
before reading geometry, retaining its original bounds and tolerances. Both
complete affected specifications passed all 80 cases across WebKit desktop and
mobile. Initial checks and bounded repeats added 14 passing executions. The
footer Portfolio failure did not reproduce in twelve mobile executions; its
behavior and assertions are unchanged, with failure-only geometry diagnostics
that rethrow the original error. A new remote CI run remains necessary.

The repair passed all 970 unit tests across 73 files with `CI=1 --maxWorkers=2`.
Five new regressions first demonstrated acceptance of header-only and audio-only
MP4s, incorrect asset dimensions, incorrect gallery dimensions and a conflicting
second story sharing the video. All five now reject before staged bytes or public
asset digests change; the real clip still stages successfully. Probe temporary
files were removed on success and rejection. The production media and candidate
bytes are unchanged by this CI repair, so the prior build and visual review apply
to the same published content.

A fresh independent review found no blockers in the staging, QA, documentation
or CI repair. Missing-tool, timeout, malformed-JSON and cleanup branches were
reviewed in code; they were not separately exercised by the 25 staging tests.
