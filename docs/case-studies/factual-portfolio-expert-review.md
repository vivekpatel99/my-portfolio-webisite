# Portfolio case-study review

**Verdict: PASS**

Reviewed publication digest: `a6d081a855788019362d50ea1fd866cb7b71a36ad0f785577b92b5a6ab94917f`

Candidate preview: `http://127.0.0.1:5194/`. No website files were changed.

The round-1 hold is cleared. There is no P1 and no P2.

## Media count

The publication has **46** asset records, and every one is used:

| Kind | Count |
| --- | --- |
| Card and social covers | 12 |
| Gallery items | 33 (32 images and 1 video) |
| Video poster | 1 |
| Total | 46 |

Each reading page shows the cover plus its gallery. That is **45** slides. The poster belongs to the football video and is not a separate slide.

## Coverage

| Case | Slides | Buyer path | Result |
| --- | --- | --- | --- |
| n8n Website Data Extraction to JSON | 7 | Data Extraction Automation Sprint, then contact | Pass |
| Invoice Photo OCR to Excel with Python | 4 | Data Extraction Automation Sprint, then contact | Pass |
| YOLO Pose Estimation for Fitness Images | 7 | Computer Vision Model Development, then contact | Pass |
| n8n Invoice Extraction with Validation and Review | 7 | AI Workflow Buildout, then contact | Pass |
| LangGraph Project Planning Assistant | 3 | AI Workflow Buildout, then contact | Pass |
| Browser Search Automation from a Spreadsheet | 2 | AI Workflow Buildout, then contact | Pass |
| Webcam Distance Estimation with Depth Anything V2 | 2 | Computer Vision Model Development, then contact | Pass |
| Color-Coded Schedule PDF Extraction to Excel | 3 | Data Extraction Automation Sprint, then contact | Pass |
| n8n Record Sync and a PostgreSQL Query Assistant | 2 | AI Workflow Buildout, plus the website and invoice articles | Pass |
| Python Automation for Code-Quality Workflows | 2 | AI Workflow Buildout, then contact | Pass |
| Resumable Python Listing Extraction to CSV | 2 | Data Extraction Automation Sprint, then contact | Pass |
| Football Player Tracking with YOLO and Team Colors | 4 | Public repository, Computer Vision Model Development, then contact | Pass |

Every page has one h1. The title, summary, and meta description name the same work. Each canonical URL is `https://www.vivekapatel.com/project/<slug>/`, and the sitemap lists the same twelve URLs. The contact form asks for full name, email address, budget range, and project description. It was not submitted.

Homepage featured cards use the website, invoice-photo, and fitness covers. The collection shows all 12 after Load more. Desktop (1440px) and phone (390px) pages did not overflow sideways. Enquiry buttons are 262 by 56 pixels. Back links stay on one row at phone width. Card covers use `object-fit: contain` with top alignment (SH-03). Gallery previous and next controls are 44px and sit on their own row under the stage (IM-01).

## P1

None.

## P2

None.

The round-1 depth caption gap is fixed on the rendered gallery. The still prints **FPS: 5.39**. The visible caption now says that number is an on-screen prototype counter captured in the still, not a validated processing-speed benchmark. The alt text says the same thing. The listing sample caption now says the two-field illustration is not a client export or a measured run.

## Checked and accepted

- Football is detection, jersey grouping, ByteTrack IDs, and annotated video. The cover order is match, four classes, track IDs, then jersey groups. That matches the frame path: `model.track` runs, then `team_classifier.predict`. A separate crop pass fits the classifier before the video loop. No padel events remain.
- Detector scores are the repository's 49-image, 1,174-object validation. Ball recall 0.618 is called out as the weaker class. Captions say this is detection, not tracking, team assignment, or speed. The F1 legend reads "all classes 0.90 at 0.359". The confusion matrix keeps background as missed and unmatched detections, not a fifth class. The clip is 640 by 360, 30 seconds, and ready to play. Its caption says playback frame rate is not a processing-speed result.
- April 2025 is shown on the card as "Completed Apr 2025", the same format as known months. The public label does not add "estimated".
- SQL copy says text checks and a default LIMIT 100 are not a read-only guarantee or a hard row cap. The sample query has no LIMIT, and its footer says it does not prove execution or a row bound.
- The combined n8n article links to the website and invoice articles. It does not reuse their canvases.
- Schedule sample headers are NAME, Date, Year, WEEKDAY, SHIFT, REQUEST. Codes are 0 Off (yellow or pink), 1 Available (missing or near-white), and 2 Request to Work (green).
- Listing resume reads `listing_id` from saved JSON Lines. The illustration is a two-field snippet.
- Invoice and OCR concept drawings stay in their galleries. Captions reject the 94% faster, JSON/database, purchase-order, Azure, and audit-ready claims on those drawings. New purple covers are the card images.
- Pose captions say printed scores are prediction confidence. The kneeling example says some joints are misplaced. The extra WebP caption says its original file was not recovered.
- Planning, browser search, listing, SQL, and code-quality samples are marked fictional. Service links match the live service titles. Linz remains the work location on the homepage and service pages.

Covers use the same white, purple, and lavender drawing style. Arrows follow the stated paths. "Not an invoice" does not continue into extraction. The depth navigation note has no arrow into the webcam path. No cover text was clipped on the full diagrams. At card size the diagrams stay fully visible. The smallest footnotes are hard to read until the image is enlarged. That is not a crop.

## Optional, not blockers

- The planning cover drawing is a four-step goal, breakdown, dependencies, and action plan. Its caption also names clarification, research, and report generation. The article and architecture graph carry those stages. The caption can say the drawing is a simple sketch of that assistant.
- The schedule cover table uses Date, Weekday, Shift, and Code. It is labeled an illustrative subset. The article and the fictional workbook use the real export headers.
- Adding the word "estimated" to April 2025 would be a product choice. The current public format is allowed.

## Limits

Models, workflows, and OCR were not run again. Football numbers are the repository's published validation. The contact form was not submitted. The football clip was checked for size, duration, and readiness. It was not watched through.

Desktop and phone layout were checked in headless Chrome for all 12 reading pages. A separate preview tab checked the collection, Load more, the depth still, the listing sample, and the football clip. Later slides in the headless pass were read before some images finished loading. Those assets were then checked directly: all 46 files match the publication hashes, and the preview serves every one.
