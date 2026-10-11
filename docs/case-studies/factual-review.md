# Case-study source and media review

This review checks the twelve case studies against their original implementations, source artifacts and permitted portfolio media. It supersedes the factual scope of the earlier presentation reviews. It does not claim that every original project was executed again, that an integration PR is deployed, or that search traffic will increase.

The original-project corrections are integrated. Independent portfolio and technical reviews passed the final prepared candidate.

## Source corrections

| Case study | Source evidence | Resulting explanation |
| --- | --- | --- |
| Invoice automation | n8n exports and milestone delivery notes | Intake, extraction, translation, checks and spreadsheet review are the delivered core. Correction memory can reuse supplier details; formula and raw audit values remain protected. Multi-invoice PDF splitting remains a separate extension in progress. |
| Invoice photo OCR | Delivered Python crop, OCR, parser and Excel writer | A fixed client-details region feeds a layout-specific parser. Excel retains a source filename. Seller extraction, JSON/database output and savings claims are not attributed to this tool. |
| Staff schedule PDFs | PDF grid/color classifier and workbook exporter | Native PDF text and drawings produce schedule rows. No highlight or near-white means Available; unknown highlights and unreadable dates are skipped. Numeric request codes and fictional examples match the source. |
| Website dataset extraction | n8n discovery and Excel/CSV/HTML processing exports | The handoff includes JSON, schemas, geographic/subcategory tags and error logs. Language filtering checks URL patterns. |
| Planning assistant | Full public repository at `0875a9493bca3f4f8c01de726c2b886ec05f95b9` | Clarification, supervised research, compression, configuration and report generation are present. The earlier minimal snapshot omitted real features. Repository examples and fictional gallery examples are distinguished from measured client runs. |
| Browser search | Archived implementation and handoff scripts | Spreadsheet inputs return result URLs, timestamps and row status. A returned URL is not evidence of a completed booking. |
| n8n record sync and SQL | Synchronization exports and SQL validation/executor workflow | Create, update and delete routes remain separate. Shared error handling is verified on collection, comparison, lookup and create. SQL text checks and fallback LIMIT 100 are not guaranteed read-only permissions or an enforced result cap. |
| Python code-quality toolkit | Reusable commands, workflow modules, tests and documentation | Independent linting, assisted review drafts and repository helpers support existing tools. The owner permits an anonymous description; proprietary source and client identities remain private. |
| Listing extraction | Scraper and CSV/JSON Lines append/resume logic | Restart reads completed `listing_id` values from saved JSON Lines records. Worker count, delays and retry limits are set in code. |
| Webcam depth prototype | Webcam loop, reference-depth conversion and detector settings | RT-DETR and Depth Anything V2 produce a distance overlay. The separate navigation module is not called by that loop. Distance conversion uses a reference scale and assumed camera geometry. |
| Fitness pose estimation | Training/inference code and exercise overlays | Still-image pose overlays support visual review. Printed confidence is per prediction, not project-wide accuracy. Form scoring and a consumer application require additional work. |
| Football tracking | [Public implementation](https://github.com/vivekpatel99/football-players-tracking-yolo/tree/1bb92a5c1f04178380ae5e1fd9f3aa660eb161e6) | Four-class detection, appearance-based team colors, tracking IDs and annotated video replace the unrelated padel event pipeline. Published detection results have a 49-image validation scope. |

## Media and diagrams

Each gallery item is classified as project output, implementation screenshot, conceptual diagram or fictional sample. Captions explain the distinction where it matters. The supplied invoice and OCR concept images were retained for the original review. On 11 October 2026, the owner requested their removal because the source-aligned workflow diagrams replace them. See [the gallery pruning review](gallery-pruning-review.md) for the current galleries and reviewed candidate.

The football tracking clip matches the public repository demonstration after re-encoding. Its poster is a frame from that clip. The F1 plot and confusion matrix have identical decoded pixels to the repository plots. Detector validation is distinguished from tracking accuracy and processing speed. The separate supplied illustration's real-time and win claims are removed from the football gallery.

The n8n synchronization case removes six borrowed workflow screenshots from other projects and the supplied client-schema reference. The relevant website and invoice workflow screenshots remain in their own cases, with internal links from the n8n story. The unrelated lead-qualification image remains unassigned.

Updated editable diagrams follow the existing white, purple and lavender style. SQL and webcam arrows follow verified capabilities. Schedule and listing examples use source-aligned fields and codes with fictional values. No artwork adds an unmeasured performance or business result.

The owner permits public use of the recognizable people in the fitness/depth examples. Five fitness JPEGs match original project artifacts; an additional supplied WebP has matching visual style but its original file has not yet been recovered. Its caption retains that provenance limit. OCR spreadsheet and overlay examples are not presented as a paired input/output experiment or relabeled synthetic without proof.

## Buyer and search information

Every article explains the problem, implementation, output, suitable buyer and useful enquiry inputs. Service links use existing offers. Titles name concrete services such as invoice OCR, n8n automation, YOLO tracking and PDF extraction. The existing static HTML, canonical URL and summary-derived metadata remain the search inputs. Global availability retains the actual Linz work location.

The edits follow Google's guidance on [helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) and [descriptive snippets](https://developers.google.com/search/docs/appearance/snippet). They add useful source-backed information and clear enquiry paths, without ranking or revenue guarantees.

## Dates and verification limits

Existing owner-approved completion dates remain. The owner cannot recall the football delivery month and authorizes a 2025 estimate. April 2025 is selected from repository history; it is an estimated completion month, not proof of delivery. Private authoring notes retain that basis under the repository's date policy.

Original client APIs, model training and workflow executions were not rerun. Code and saved artifacts substantiate the described capabilities. Football results are the repository's published evaluation, not a new independent benchmark. Camera accuracy, fitness accuracy, client savings and production delivery are not inferred from illustrations or screenshots.

## Reviewed publication and website checks

The exact prepared candidate is saved in [factual-publication-candidate.json](factual-publication-candidate.json). Its SHA-256 is `a6d081a855788019362d50ea1fd866cb7b71a36ad0f785577b92b5a6ab94917f`. Staged article, claim and asset approvals bind to that identity.

The candidate includes twelve stories and 46 referenced asset records. There are 45 gallery slides including covers, plus one video poster. Seven source-aligned workflow covers and three fictional samples replace inaccurate earlier artwork. Existing correctly assigned project images remain.

The final expert's first round passed eleven cases and held the depth case because its visible FPS counter was not explained. The still's caption and alt now identify an on-screen prototype counter rather than a validated processing-speed benchmark. The listing sample caption now explicitly says it is not a client export or measured run. The second expert round passed all twelve cases against the corrected candidate. See [the final portfolio expert review](factual-portfolio-expert-review.md).

Verification so far:

- 962 unit tests passed in the isolated candidate. Nine unchanged Git-context tests passed in the shared checkout after their test and helper bytes were confirmed identical. The combined full-suite coverage is 971 passing tests.
- Forty-six affected publication tests passed again after the final caption corrections. Twelve public-copy tests passed again with a guard for the FPS clarification. An independent technical review also passed seventy focused tests and confirmed all current derivative bindings.
- Display-image integrity and the production build passed. Static output includes 21 routes and 39 validated public links.
- SEO checks passed against the local preview.
- Rendered desktop and mobile checks covered all twelve articles, every gallery slide, captions, image/video loading, canonical URLs and horizontal overflow. The football clip reports 640 by 360 pixels and a 30-second duration.

T3 preview calls returned “Preview automation snapshot timed out after 15000ms.” and “No preview automation host is available for evaluate in environment 6feb8497-9dca-4b3b-8ce6-e710058476d8. The server-owned browser may be starting or reconnecting.” Rendered verification followed the repository's documented Playwright QA workflow.

Browser route and visual regression checks passed 103 tests, with the existing mobile custom-cursor test skipped. Evidence-label and keyboard checks passed 112 tests across Chromium and WebKit at desktop and mobile sizes. The final portfolio expert passed all twelve cases with no P1 or P2 findings. Remote CI and production release remain separate.
