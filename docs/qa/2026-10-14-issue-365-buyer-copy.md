# Issue #365: approved buyer copy and featured work

The owner selected introduction B, approved the featured trio, and confirmed weekly progress updates in the implementation thread on 14 October 2026. [DESIGN.md CT-01](../../DESIGN.md#ct-01-buyer-copy-and-featured-work) records the decisions.

The hero introduction is: “Manual data entry, scattered website data, and unstructured video slow teams down. I build document extraction, n8n automation, and computer vision workflows to make that information usable.” The Role h1 remains `Computer Vision & AI Engineer`. About's unsupported agency-speed comparison is removed and its update promise now says weekly. The invoice, credentials, rate, Linz location, worldwide targeting, and motion code remain intact.

The featured order is invoice validation (`ai-invoice-processing-automation`), football tracking (`sports-video-analytics-yolo`), and website extraction (`n8n-openai-data-extraction`). All three retain their published titles, summaries, diagrams, article destinations, and project metadata. No testimonial pairings are inferred. Homepage and bootstrap descriptions now name document extraction, n8n automation, and computer vision for invoices, website data, and video.

## Verification

Source base: `77e0f169322255e5803d4933b1554977303587ba`, with this PR's scoped changes on `feat/issue-365-buyer-copy`. Screenshots use the production Vite build served locally at `http://127.0.0.1:3000/`; the collaborative browser resolves that server as `http://localhost:3000/`. The final build uses the repository's existing PR fallback Convex URL. No contact submission, social/profile update, or production release was performed.

- Production build passed: 43 display derivatives verified, 39 public links checked, and 21 static route pages generated.
- `QA_LOCAL_ONLY=1 npm run qa:seo` passed against the production output and source metadata.
- Hero, About, featured-selection, portfolio, case-study data, SEO, static-route, and production-eligibility tests passed individually. Existing assertions were updated for the approved copy and selection while preserving the other checks.
- The full serial unit run passed 1,094 of 1,096 tests across 79 of 80 files. The publication fixture's two nested build/test process failures were then retried without concurrent build/browser jobs: that file passed all 19 tests in 148.81 seconds. Every unit test has passed on this source tree, but the full invocation itself had those two failures; the required hosted CI gate must pass before merge.
- Chromium desktop/mobile browser projects passed 20 relevant checks: static home at 1440, 390, and 320px, reduced motion, JavaScript replacement of the static page, delayed-entry stability, and all featured article links and inquiry destinations.
- Local WebKit could not launch because this host lacks its GStreamer, font, image, and other shared libraries. The 18 selected WebKit checks did not exercise the page. Hosted WebKit CI remains required before merge.
- ESLint checks for unreachable code, duplicate keys/arguments, and valid `typeof`, plus `git diff --check`, passed. This JavaScript project has no standalone frontend typecheck script.
- Independent Standards and Spec review passes found no issues, including the updated legacy-publication expectations.

Manual inspection used Chromium `154.0.0.0` in T3's collaborative preview. The actual CSS viewports were 1440×900, 390×844, and 320×740. The approved introduction, unchanged h1 and rate, featured order, removed agency comparison, and weekly promise were checked in the rendered DOM. There was no document horizontal overflow at these widths. Text wraps within its existing panel geometry. This is scoped acceptance evidence, not a whole-site theme audit.

## Screenshots

The listed dimensions are CSS viewport sizes; saved T3 images use their own capture scale. Desktop evidence follows CO-01's existing palette, TY-01's existing type roles, and the preserved SH-02 invoice/card references. CT-01 is the owner-confirmed content decision.

| Surface | Desktop, 1440×900 | Mobile, 390×844 |
| --- | --- | --- |
| Hero introduction and identity | [Hero](assets/issue-365/desktop-hero.png) | [Hero](assets/issue-365/mobile-hero.png) |
| Featured studies | [All three cards](assets/issue-365/desktop-featured.png) | [First card in the stacked trio](assets/issue-365/mobile-featured.png) |
| About biography | [About](assets/issue-365/desktop-about.png) | [Biography](assets/issue-365/mobile-about.png) |
| Weekly update promise | [Delivery rows](assets/issue-365/desktop-updates.png) | [Delivery rows](assets/issue-365/mobile-updates.png) |

[Narrow hero at 320×740](assets/issue-365/narrow-hero.png) shows the existing stacked fields and wrapping introduction. The complete featured trio is verified through rendered destinations and browser navigation checks; one mobile viewport does not contain all three stacked cards.
