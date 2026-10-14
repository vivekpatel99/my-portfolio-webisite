# Issue #369: summary-first case-study cards

Implemented against develop `fe0e46e5018af88d880eb6344047e4d7be07f284` on 14 October 2026. Scope is the shared homepage/collection card; the twelve article records and all media remain unchanged.

## Content inventory

Before: each card body begins with the full overview caption, then repeats much of its workflow in the summary. After: the existing buyer-facing summary comes first, followed by a compact illustration note. All twelve summaries remain verbatim, so workflow inputs, outputs and buyer purpose are retained. Total supporting caption copy falls from 256 to 102 words. This is a content count, not a conversion claim.

Every full caption below remains on the first image in its article gallery. Gallery screenshots/videos retain their original captions, evidence labels and technical caveats. The overview remains an illustration rather than delivery evidence (DESIGN.md IM-01).

| Story | Before: leading full caption (also retained in article gallery) | After: supporting card note |
| --- | --- | --- |
| n8n Website Data Extraction to JSON (`n8n-openai-data-extraction`) | Illustrative overview of website dataset discovery, format-specific processing and the JSON handoff. | Workflow illustration. |
| Invoice Photo OCR to Excel with Python (`invoice-ocr-extraction`) | Invoice photos pass through a fixed client-region crop and layout-specific OCR parsing into Excel rows with source filenames. | Workflow illustration. Known layout and fixed crop. |
| YOLO Pose Estimation for Fitness Images (`yolo-computer-vision-optimization`) | Illustrative still-image inference. YOLO pose estimation produces a person box and body-keypoint overlay for visual inspection. Form scoring remains separate. | Still-image illustration. Form scoring remains separate. |
| n8n Invoice Extraction with Validation and Review (`ai-invoice-processing-automation`) | Illustrative n8n invoice workflow from intake through extraction, translation and checks into human review and spreadsheet output. | Workflow illustration. |
| LangGraph Project Planning Assistant (`ai-project-planning-assistant`) | Conceptual overview of a LangGraph planning assistant. A project brief passes through clarification, research and report generation before technical review. | Conceptual workflow illustration. |
| Browser Search Automation from a Spreadsheet (`browser-search-to-spreadsheet`) | Illustrative workflow with fictional search data. Spreadsheet rows drive browser searches; result URLs, timestamps and row status return to the sheet for review. | Workflow illustration with fictional search data. |
| Webcam Distance Estimation with Depth Anything V2 (`depth-based-distance-estimation`) | Illustrative webcam path combining RT-DETR and Depth Anything V2 into a distance overlay. The stored reference scale and assumed camera geometry require setup-specific validation. | Webcam illustration. Stored reference scale and assumed camera geometry require setup-specific validation. |
| Color-Coded Schedule PDF Extraction to Excel (`healthcare-document-intelligence`) | Illustrative native-PDF schedule extraction into Excel. Fictional calendar entries use the implemented numeric request legend: 0 Off, 1 Available, 2 Request to Work. | Native PDF illustration with fictional entries. Request legend: 0 Off, 1 Available, 2 Request to Work. |
| n8n Record Sync and a PostgreSQL Query Assistant (`n8n-python-ai-agents`) | Illustrative record synchronization and a separate SQL query assistant. SELECT text checks and a default LIMIT 100 do not guarantee read-only database access or a maximum result size. | Workflow illustration. SELECT checks and default LIMIT 100 do not guarantee read-only database access or a maximum result size. |
| Python Automation for Code-Quality Workflows (`python-ci-workflow-automation`) | Illustrative overview of reusable Python commands for linting, assisted review text and repository helpers. These capabilities support an existing code-quality workflow; the diagram is not an executed CI run. | Workflow illustration. Supports an existing code-quality workflow; not an executed CI run. |
| Resumable Python Listing Extraction to CSV (`resumable-listing-data-extraction`) | Illustrative listing extraction with incremental CSV and JSON Lines output. Restart reads completed listing IDs from saved JSON Lines records; processing settings are defined in code. | Workflow illustration. Resume uses saved JSON Lines listing IDs; processing settings are defined in code. |
| Football Player Tracking with YOLO and Team Colors (`sports-video-analytics-yolo`) | Illustrative football pipeline combining YOLO detection, appearance-based team grouping and tracking IDs into annotated match video. | Workflow illustration. |

The invoice-photo summary still says “known invoice-photo layout” and retains filenames; the note keeps the fixed crop limit. Depth cards retain setup-specific validation of stored reference scale and assumed geometry. Schedule cards retain native-PDF scope, fictional entries and the numeric request legend. SQL cards retain both the read-only-access and result-size limitations. Pose scoring remains separate, the CI toolkit supports an existing workflow and its diagram is not an executed run, and resume still uses saved JSON Lines IDs with processing settings in code. Historical invoice targets, in-progress PDF splitting, football detector metrics and FPS limitations remain in the unchanged evidence captions beside the corresponding article media.

## Authoring and projection

The private source library is outside this checkout. No generated publication data was hand-edited. The repository-owned, public-only `publication/case-study-card-copy.js` is the authored presentation source for this approved shortening; `compile-case-studies.js` adds only its validated-match note to the existing public record projection. Each note is bound to the original cover path and full caption digest. Changed covers/captions and new stories fall back to their full captions until a new compact note is reviewed. The authoring guide documents this maintenance rule.

## Preserved behavior and metadata

A comparison against the pre-edit public projection confirms that removing the new `cardCaption` field yields byte-equivalent JSON values for every record: summaries, sections, image/gallery media, category labels, dates, titles, slugs and external destinations. The collection order and three homepage features match the baseline exactly. The first six and next six still load in the same order; collection destinations retain `?from=collection`.

## Verification

The final implementation commit is `d3a6db7fd3a25b3b44ed4783905611a975c388f5`. The following checks exercised that implementation; subsequent report-only commits do not change the application.

- Production build passed: all 43 display derivatives validated, sitemap generated, 39 static public links checked, 21 static routes generated.
- 26 focused publication/card tests passed after review fixes. The initial 38-test run also included the existing public-copy suite.
- Chromium browser QA: **20 passed** on the final production build. `qa-card-diagrams.spec.js` exercised homepage, all twelve loaded collection cards and the six-card no-JavaScript collection at 1440, 980, 390 and 320px. It checked summary-first copy, notes, dates, destination/order preservation, image/title geometry and paragraph/page overflow.
- `qa-upgrade-interactions.spec.js` collection-return cases passed in both normal and reduced motion: pointer departures, first/second batch restoration, keyboard Load more and Enter navigation with focus restoration, and browser Back preserving loaded count and scroll position.
- T3 browser inspection at 1440, 390 and 320px confirmed the rendered hierarchy. Browser fetches of all twelve article HTML routes returned 200 and found each full original cover caption in the gallery; the CI toolkit article was also opened interactively after its compact-note refinement.
- ESLint parsing and `no-undef` checks passed on changed JavaScript/JSX files. This repository has no application typecheck or configured lint script; the production build validates the application compilation. `git diff --check` passed.

The initial full unit run found that the isolated route fixture did not copy the new authored module. Its explicit fixture file list now includes that dependency. The stable full-suite rerun with one worker passed: **81 files, 1108 tests**. A temporary local ffprobe binary supplied the missing video-test prerequisite. The final PR CI gate must also pass before merge. Earlier overlapping verification/editing runs are not treated as a green full-suite result.

Local WebKit checks could not launch because this host lacks WebKit runtime libraries (including GStreamer, flite, libavif and JPEG libraries). These are prerequisite failures before test execution, not acceptance passes. The required PR `test-and-build` gate includes the repository's WebKit jobs and must be green before merge. No production verification or release is claimed.

## Independent review

Cursor’s Opus 5.5 completed isolated Standards and Spec reviews using `$code-review` against base `fe0e46e` and reviewed head `61895f4` (final application source `d3a6db7`). Round-one findings were resolved: existing-CI-workflow scope restored, confirmed DESIGN decision limited to approved behavior, future-story fallback tests corrected, stale note bindings checked, report links repaired and browser acceptance results recorded. Final Standards review had no blocking findings; final Spec review had no findings. The later full-suite result and documentation wording updates do not change the reviewed application code. Remote CI is tracked by the PR, and integration merge requires its full gate to pass.
