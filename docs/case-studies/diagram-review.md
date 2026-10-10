# Case-study diagram review

Eight project-specific Excalidraw diagrams were created at Viv’s request, with one author per case study. Existing supplied invoice, OCR and planning illustrations stay assigned, and the football illustration and video remain in PR #350. The unrelated n8n lead-qualification illustration stays unassigned.

The diagrams use a white canvas, dark slate headings, purple arrows and pale-purple processing shapes. This follows the requested older thumbnail style. Native scenes are 1600 × 900; the unchanged renderer adds a 10-pixel border, producing 1620 × 920 PNGs. All scenes remain editable and exports are kept uncropped.

## Mapping and scope

| Case study | Diagram explanation and visible scope caption | Source |
| --- | --- | --- |
| n8n-openai-data-extraction | Illustrative workflow. An n8n and OpenAI workflow discovers website datasets, processes Excel, CSV and HTML tables separately, and produces structured JSON organized by starting URL. Source-specific changes may need adjustment. | [Editable scene](diagrams/n8n-openai-data-extraction.excalidraw) |
| yolo-computer-vision-optimization | Illustrative still-image inference. YOLO pose estimation produces a person box and body-keypoint overlay for visual inspection. Form scoring remains separate. | [Editable scene](diagrams/yolo-computer-vision-optimization.excalidraw) |
| browser-search-to-spreadsheet | Illustrative workflow. Spreadsheet search inputs drive configurable browser runs. Result URLs, timestamps and row status return to a reviewable sheet. Ongoing operation requires maintenance and authorized access. | [Editable scene](diagrams/browser-search-to-spreadsheet.excalidraw) |
| depth-based-distance-estimation | Illustrative workflow for an uncalibrated lab demo combining object detection, Depth Anything V2, spatial calculations and navigation-zone logic. Camera and environment validation remains application-specific. | [Editable scene](diagrams/depth-based-distance-estimation.excalidraw) |
| healthcare-document-intelligence | Illustrative workflow. Native-PDF extraction turns staff calendars into reviewable Excel rows, preserving dates, shifts and color-coded requests. Illustrative data only. | [Editable scene](diagrams/healthcare-document-intelligence.excalidraw) |
| n8n-python-ai-agents | Illustrative workflow. Inspectable n8n synchronization and a separate SQL question agent with SELECT-only validation and bounded results. | [Editable scene](diagrams/n8n-python-ai-agents.excalidraw) |
| python-ci-workflow-automation | Illustrative workflow. A Python toolkit organizes code-quality workflow logic behind reusable entry points, with independent linting, assisted review-text and PR-helper capabilities. | [Editable scene](diagrams/python-ci-workflow-automation.excalidraw) |
| resumable-listing-data-extraction | Illustrative workflow. Collect listing URLs, extract details with controlled delays and retries, retain completed listings for restart, and export incremental CSV and JSONL files. Website changes and source-access requirements still need maintenance. | [Editable scene](diagrams/resumable-listing-data-extraction.excalidraw) |

Every main arrow was checked against the public case study’s problem, built and outcome sections. Format routing, independent toolkit capabilities, parallel detection/depth components and separate n8n/SQL lanes do not imply an unsupported runtime sequence. Sample calendar entries, JSON rows, browser results and visual objects are illustrative. No diagram adds measured accuracy, time savings, production readiness or unrestricted access claims.

## Review and verification

Each author rendered, viewed and audited the native text, bindings and full/320-pixel composition. A fresh independent Codex reviewer then viewed all eight full PNGs and independent thumbnails, audited scene labels and arrow explanations, and reviewed the complete twelve-case prose. No spelling errors or unsupported diagram claims were identified. Fine sample rows and supporting technical notes require enlargement.

The parent shortened the SQL headline after spotting an edge collision. Independent review also found that six retained n8n images described their other-project provenance only in alt text; matching visible captions were added. A focused independent follow-up confirmed static caption rendering, retained media, correct approval digest and cleared the gallery hold.

The Excalidraw skill’s requested Kiro Opus 5.5 review was attempted but failed with “You've reached your monthly usage limit.” No Kiro review passed. The independent Codex review is the fallback; owner visual review and production release remain pending.

All twelve case-study titles, summaries and section paragraphs were reviewed for spelling and explanation. New cover captions identify illustrative scope. Existing OCR and invoice captions retain the user’s requested explanation of the supplied illustrations’ unverified claims. Original screenshots remain available in the galleries.

Verification: the complete unit suite passed all 936 tests across 72 files. The asset-delivery test verifies the exact published display set, including required bindings and exclusion of unpublished media. The initial CI failure came from its stale fixed count of 23 display images; the reviewed replacement also passed the combined-preview asset checks. After strengthening provenance and thumbnail assertions, 49 focused tests passed in the combined football-media preview. Stale expectations for prior cover paths and six-image counts were updated while retaining the original screenshots and measurement disclaimers.

The combined production build passed deterministic derivative verification and generated 21 static routes, with 36 public links checked. All twelve collection cards loaded on desktop (1280 × 900) and mobile (375 × 812); all twelve case-study routes displayed their cover and caption without horizontal overflow. All multi-image gallery thumbnails loaded. The SQL lightbox used the original PNG, ArrowRight changed the selected image and visible provenance, and Escape closed it and restored focus. Single-image cases retained direct original-image links. The football gallery loaded, and its muted 30-second H.264 tracking video played successfully.

## Reading the diagrams

### n8n-openai-data-extraction

- Website sources are processed through separate Excel workbook, CSV file and HTML table paths. These are alternative format branches, not a sequence that converts Excel into CSV into HTML. Source sections: problem, built.
- The supported source formats feed the common table normalization and table-to-JSON capability. Convergence means a shared capability, not an assertion that every input is processed simultaneously or merged into a single table. Source sections: built.
- The table transformation produces structured JSON organized by the starting URL. Source sections: problem, built, outcome.

### yolo-computer-vision-optimization

- The exercise still is the input to YOLO pose estimation. This depicts inference on a still image, not training or live-video processing. Source sections: problem, built.
- Pose inference produces a visual output with a person box and body-keypoint overlay that a person can inspect. Source sections: built, outcome.

### browser-search-to-spreadsheet

- Spreadsheet search inputs enter the browser workflow. The sample row R1 has the same fictional travel-search text in the input sheet and browser. Source sections: problem, built.
- The browser workflow writes a result URL, timestamp and execution status back to the spreadsheet. This arrow represents the recorded handoff, not booking completion or a measured success rate. Source sections: built, outcome.

### depth-based-distance-estimation

- The scene supplies an object-detection component. Bounding boxes identify illustrative objects. Source sections: problem, built.
- The same scene supplies the Depth Anything V2 depth-estimation component. Source sections: problem, built.
- Detected objects contribute to spatial calculations. The branch shows a component relationship, not a verified runtime schedule. Source sections: problem, built.
- Depth estimates contribute to spatial calculations alongside detection. Parallel placement avoids claiming a detector-to-depth execution sequence or concurrent execution. Source sections: problem, built.
- Spatial calculations and navigation-zone logic support the conceptual scene overlay. Its dotted object relationship and purple zone are illustrative, without metric values or readiness claims. Source sections: built, outcome.

### healthcare-document-intelligence

- The native-PDF extractor reads text and drawings from the calendar and detects its grid to interpret dates, shift labels and color-coded requests. Source sections: problem, built.
- The extracted schedule information becomes Excel rows with request codes and a readable legend. Continuation-page handling and duplicate-row removal support that export. Source sections: built, outcome.

### n8n-python-ai-agents

- Source records enter n8n workflows for collection, comparison and AI enrichment with review. Source sections: built.
- The n8n workflow supports record synchronization through insert, update and delete routes. Source sections: problem, built.
- The n8n capability also synchronizes the vector index. The branch shows a separate output responsibility, without claiming runtime ordering relative to record synchronization. Source sections: built.
- The separate database question agent loads schema information and calls an SQL tool. Source sections: problem, built.
- The executor path validates the SQL with a SELECT-only boundary. Source sections: built.
- Accepted queries produce results subject to executor result limits. The blank table is an illustrative artifact, without client data or an accuracy claim. Source sections: built, outcome.

### python-ci-workflow-automation

- Workflow decisions written in ordinary Python are organized behind reusable entry points. This is an architectural transformation, not an automatic conversion of arbitrary code. Source sections: built, outcome, problem.
- The toolkit exposes linting and linter-execution integration as a capability. The report symbol is illustrative and does not indicate a passed lint result. Source sections: built.
- The toolkit exposes integration points for AI-assisted review-text generation. The speech bubble represents generated text without an accuracy or acceptance guarantee. Source sections: built, outcome.
- The toolkit exposes repository workflow helpers for pull-request-related operations. The branch symbol does not depict automatic merging. Source sections: built.

### resumable-listing-data-extraction

- The separately collected listing URLs feed the listing-detail extraction stage. Source sections: built.
- Extraction produces incremental CSV and JSONL files. Both drawn documents are members of the output stage, and neither format depends on the other. Source sections: built, problem.
- Completed listings are retained in a record that supports restart and resume. The arrow does not assert a particular checkpoint storage format or transactional write order. Source sections: built.
- A restarted extraction run consults the completed-listing record to avoid repeating completed work. Source sections: problem, built.

## Asset integrity

Sources are canonical public PNGs. Galleries use small JPEG thumbnails; collection cards use deterministic WebP display derivatives capped at 100,000 bytes. Build-only bindings contain source and derivative SHA-256 hashes.

| Case study | PNG SHA-256 | Display bytes |
| --- | --- | ---: |
| n8n-openai-data-extraction | `5f8d33c712e39a32dc57c65eab98aa8cac4e98d0eb9019594e41f389482e6c78` | 50996 |
| yolo-computer-vision-optimization | `24ce758aad9d742640d262cd2f4c87d0800952848d30bf4e7ea0806b47c40ee5` | 34496 |
| browser-search-to-spreadsheet | `8ae2242a5fc25fe5381c89710e3d03b339d64bcbd18e24fee7ab585ecc71f240` | 40670 |
| depth-based-distance-estimation | `6f27eac0ad723f3f4efd36a0ad81d7893a8410409f1cb841d61cc39c6c0f436e` | 46028 |
| healthcare-document-intelligence | `b902df1b21e477101a86519a9ed58603cd960f7e5be68df053f9b70f783f7687` | 47262 |
| n8n-python-ai-agents | `705758e6d203830ba8b9a8d02aa51efd5861b90c9aa2978035cfa55a5273f71d` | 49698 |
| python-ci-workflow-automation | `b2e7442167276c591fd8a53ed27017dd0eaee1cd3e6d9c50542c8be123ca4f0a` | 40096 |
| resumable-listing-data-extraction | `852269fcf337a73b0cf5b42b21ed24a278e1974fa2b13e165927e951cc20e0d1` | 48118 |

## Delivery boundary

Diagram creation and integration were requested by Viv. Author checks, independent review, build and browser verification provide review evidence; they do not represent explicit owner approval of final pixels or authorize a production deployment. The PR targets develop. Football media is a separate PR and is included in the combined local preview without merging either PR.
