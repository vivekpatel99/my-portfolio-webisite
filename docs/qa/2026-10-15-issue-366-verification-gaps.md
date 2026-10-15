# Issue 366 verification gaps

Fresh checks on 15 October 2026 against the local Vite dev server at `http://127.0.0.1:3000`. Browser: Headless Chrome 148.0.7778.96 (Playwright Chromium). These results are not the earlier 183-check run, and they are not a production deployment check.

No contact form was submitted. No database write, email-provider acceptance, or inbox receipt was recorded.

## Native 200% browser zoom

| Item | Result |
| --- | --- |
| Browser | Headless Chrome 148.0.7778.96, MV3 `chrome.tabs.setZoom` |
| Launch window | 1440 by 900 |
| Before | Layout viewport 1440 by 813, `visualViewport.scale` 1 |
| After | Layout viewport 720 by 406, `visualViewport.scale` 1 |
| Action | Home invoice-gap test, six passes with the local-only navigation guard. Action-family test on `/`, the data-extraction service, the invoice project, `/contact/`, and `/case-studies/`, three passes after the harness waited for the loading heading to clear. |
| Outcome | Both harnesses completed. Zoom is browser zoom: the layout viewport halved and the visual scale stayed 1. No separate site defect was reproduced. |

The action-family failure before the wait was the contact route still showing the "Loading page" heading. At 200% the desktop header action is hidden, so that heading was the only visible title. The guard still blocks non-loopback URLs before `route.fetch`.

## Disposed fetch during context close

`guardLocalNavigation` still aborts external URLs and external redirects before the browser can follow them. A fulfill error is ignored only when the message is exactly `route.fulfill: Fetch response has been disposed` and the page is already closed, closes on the next turn, or the frame is already gone. The same error on a page that stays open still fails the check. Unit coverage is `tools/qa-navigation-guard.test.js` (31 cases in that file; full unit run 1133 passed).

## Forced-colors fields

Chromium `forced-colors: active` was on (`matchMedia` true). Viewport 1440 by 900, and the name field also at 390 by 844.

| Field | State | Outline |
| --- | --- | --- |
| Full name, description, budget | Empty and filled, rest | 1px solid `rgb(0, 0, 0)` |
| Full name, description, budget | Empty and filled, focus | 2px solid `rgba(5, 0, 73, 0.8)` |

A probe element with `outline: 2px solid Highlight` computed to the same focus color, so this Chromium build maps `Highlight` to that value. Name and description frames stayed 54px and 144px tall at 1440. The narrow empty name frame was 282 by 54. Screenshot: [desktop contact](assets/issue-366/forced-colors-contact-1440.png).

## Gallery controls

Page: `/project/ai-invoice-processing-automation/`. Viewport 1440 by 900.

| Action | Outcome |
| --- | --- |
| Enlarge, Next image | Count moved from "1 of 6" to "2 of 6" |
| Zoom in, Zoom out | "150%" then "100%"; Zoom out disabled at 100% |
| Escape | Focus returned to "Enlarge image: Original M2 invoice orchestration workflow" |

Screenshot after close: [gallery](assets/issue-366/gallery-closed-focus-1440.png).

CDP touch on a 390 by 844 mobile-emulation context swiped the inline stage from "1 of 6" to "2 of 6". A two-finger CDP pinch did not change the 150% zoom set by the Zoom in button. The gallery has no pinch handler. This is not a physical Safari touch or pinch. That session is still an owner blocker.

## Inquiry labels and global fallback

Viewport 1440 by 900. Contact labels were Full Name, Email Address, Budget Range, and Project Description. Activating "Send project request" on an empty form focused `#name`, set `aria-invalid="true"` and `aria-describedby="name-error"`, and showed "Name is required." No POST was sent.

Spoken VoiceOver was not available in this Linux session. Keyboard focus and labels are not a VoiceOver pass.

The outer error boundary was exercised by a temporary dev-only throw in Header. That throw is not in the diff. The page showed only "Something went wrong. Back to home", with no header, footer, or Retry. The link `href` was `/`. Activating it loaded the home heading "Computer Vision & AI Engineer" and restored the header. Screenshot: [fallback](assets/issue-366/global-fallback-1440.png).

## Real test lead

Prepared locally and not submitted:

- Name: `QA Issue 366 verification`
- Email: `qa-issue-366@example.com`
- Description: `Recognizable local draft for owner authorization. Marker: ISSUE-366-NO-SEND. Do not deliver.`

Database acceptance, email-provider acceptance, and inbox receipt stay unrun until that send is explicitly authorized.
