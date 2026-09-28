# Visual/UI/Interaction Audit — Inner Pages
Build: develop @ fff5306, http://127.0.0.1:4173. Reviewer: senior UI/interaction. Read-only.
Screenshots: `.kiro-audit-tmp/visual/` (reused) + new `inner-*.png`.

## Findings (appended per page)


### /case-studies/

**UI-I01 · P0 · Half the case-study cards have an empty media area, including the flagship CV project** · /case-studies/ @1440
- Evidence: eval over `article.card`: 4 of 8 cards have no `<img>` at all — "Recorded Match Video to Reviewable Tracks and Event Tags" (Computer Vision), "Browser Search Results…", "Resumable Listing Extraction…", "Testable Python Automation…". Each still renders a 300px-min-height `#111` block with scrim + bracket (CaseStudyCard.js:65-72 `project.image ? img : null`). Visible in cs-1440-s-00.png (3rd card blank) and cs-1440-s-05.png (2nd "Other work" card blank).
- Why: to someone hiring a CV engineer, a blank tile on the one sports-video CV card looks like a broken image. It also makes a portfolio about "seeing" look like it has nothing to show.
- Fix: add a representative still for each slug (for sports: a frame with tracked bboxes). If a project has no image, render a designed fallback such as a large mono category glyph with the bbox motif and a "no public visuals · NDA" tag, and shrink the media height instead of showing an empty 300px box.
- Effort: M (assets) / S (fallback)

**UI-I02 · P1 · Card crops make ultra-wide and tall screenshots unreadable** · /case-studies/ @1440
- Evidence: the invoice card source is 2448×684 (3.6:1), shown `object-cover` in a 372×≥300 box (≈1.2:1), so about 67% of the width is cropped away and the n8n node labels end up at about 4px. The healthcare card is 1098×1524 portrait code, and the planning card is 546×958 webp (low-res, upscaled). The n8n-agents card is 2262×769. cs-1440-s-00.png: the n8n graph and code are illegible texture.
- Why: a buyer can't tell from the thumbnails what was built. They read as generic "dark UI noise" and don't differentiate the cards.
- Fix: author card-specific crops (for example 16:10, focused on one meaningful region such as an output table, a detection frame or a before→after) as separate `cardImage` assets, and keep full screenshots for the article gallery.
- Effort: M

**UI-I03 · P2 · Grid rhythm differs between "Collection" and "Other work", and the second grid is orphaned** · /case-studies/ @1440
- Evidence: the collection grid uses `gap-8` (32px) with card width 372px (CaseStudyCollection.js:131). The Other-work grid uses `gap-[22px]` with card width 379px (CaseStudiesContent.js:50). Other work has 2 cards in a 3-column grid, leaving the third column empty (cs-1440-s-05.png).
- Why: small misalignments like these make the page look assembled rather than designed. The empty column looks like missing content.
- Fix: use one grid token (gap-8) for both grids. For ≤2 items, use `lg:grid-cols-2` or a compact list row style for "Other work".
- Effort: S

**UI-I04 · P2 · Buttons mix three shapes on one page** · /case-studies/ @1440
- Evidence: "Back to home" is a square bordered button (CaseStudiesContent.js:13). "Load more" is `rounded-full` (CaseStudyCollection.js:151, visible pill in cs-1440-s-05.png top). The header CTA is square mono. The card arrow is square.
- Why: this breaks the sharp-corner "bbox" visual language, and buttons stop reading as one system.
- Fix: make Load more square with a bracket or mono label to match the header CTA, and drop `rounded-full` site-wide on inner pages (see also UI-I07 and UI-I12).
- Effort: S

**UI-I05 · P3 · Negative-scope disclaimers in card summaries read defensive** · /case-studies/ @1440
- Evidence: the healthcare card summary ends "Not clinical EHR. Not medical records." and the sports card ends "Not live scoring." (cs-1440-s-00.png).
- Why: these are useful for honesty, but on a sales card the last thing the buyer reads is what you didn't do.
- Fix: move the limitations into the article's scope/limits section, and keep the card summary to the outcome plus the artefact.
- Effort: S

- Note: there are no filters or tags. That's acceptable at 10+2 items, but a simple "All · CV · Document AI · Automation" chip row would help CV buyers jump straight to their area (P3, S).


### /project/* (case-study article template — CaseStudyArticle.js / .css)

Structural eval (all 12 slugs, 1440×900, script `visual/inner-eval-proj.sh`):

| slug | media | lead media natural px | lead box (w×h @top) | captions | words |
|---|---|---|---|---|---|
| yolo-computer-vision-optimization | 6 | 960×720 | 674×499 @587 | 0 | 172 |
| sports-video-analytics-yolo | **0** | — | — | 0 | 181 |
| healthcare-document-intelligence | 1 | 1098×1524 | 700×**971** @574 | 1 | 169 |
| n8n-openai-data-extraction | 6 | 2984×874 | 674×179 @587 | 0 | 180 |
| invoice-ocr-extraction | 2 | 1654×2339 | 674×499 @587 | 0 | 175 |
| ai-invoice-processing-automation | 5 | 2448×684 | 674×170 @587 | 1 | 178 |
| ai-project-planning-assistant | 1 | 546×958 (upscaled 1.28×) | 700×**1227** @574 | 0 | 138 |
| browser-search-to-spreadsheet | **0** | — | — | 0 | 134 |
| depth-based-distance-estimation | 1 | 1280×769 | 700×421 @574 | 1 | 156 |
| n8n-python-ai-agents | 7 | 2262×769 | 674×212 @587 | 1 | 147 |
| python-ci-workflow-automation | **0** | — | — | 0 | 133 |
| resumable-listing-data-extraction | **0** | — | — | 0 | 144 |

All 12 pages have exactly the same H2 set, "The problem | What I built | The outcome", and 133–181 words. Every page has the same CTA text link, "Discuss a similar project →", and 0 links to other projects.

**UI-I06 · P0 · The flagship sports-video CV case study has no visual evidence at all** · /project/sports-video-analytics-yolo/ @1440
- Evidence: media=0, pageH 1525 (sports-1440-s-00.png: H1 → summary → text bullets only). The copy promises "Debug overlays, optional clips and manual annotation tools", but none of them are shown. Three other slugs (browser-search, python-ci, resumable-listing) are also media-less.
- Why: a CV/video buyer's first question is "show me the tracks". A tracking and event-tagging project told only in bullets is the weakest possible proof for the service the site sells hardest.
- Fix: add at least one annotated frame (bboxes plus track IDs plus ball trajectory), a 5–10s muted looping clip (the gallery already supports mp4/webm via `isVideo`, CaseStudyGallery.js:113), and a JSON/CSV output excerpt as a code block. If client footage is under NDA, use a public-domain match clip.
- Effort: M

**UI-I07 · P1 · There's no results / at-a-glance box; the article is three thin prose sections** · all /project/* @1440
- Evidence: CaseStudyArticle.js:56-74 renders nav → category → H1 → summary → gallery → 3 sections → CTA. There's no role, stack, timeline, client type, deliverables or metrics block. The body is 133–181 words. The fold at 900px falls inside the gallery (lead media top at 574–587px), so above the fold a buyer sees only a title and a one-line summary.
- Why: buyers skim. Without a "Stack · Role · Duration · Deliverables · Result" panel they can't tell in 5 seconds whether this is relevant or how senior the work was. That makes these read as project notes rather than case studies.
- Fix: add a compact bbox-framed facts panel between the summary and the gallery with 4–6 mono key/value rows (Stack, My role, Timeline, Output artefacts, Validation / what was measured), plus one headline outcome line. The data lives in the publication records, so it's a template-level change.
- Effort: M

**UI-I08 · P1 · Portrait and ultra-wide lead media wreck the article rhythm** · /project/healthcare-document-intelligence/, /project/ai-project-planning-assistant/, /project/ai-invoice-processing-automation/, /project/n8n-openai-data-extraction/ @1440
- Evidence: single-image stories use `.case-study-cover img {width:100%;height:auto}` (CaseStudyArticle.css:28), with no max-height. The healthcare lead image is 700×971px and planning is 700×1227px, so the first paragraph starts about 1,550–1,800px down the page (hc-1440-s-00.png shows only IDE boilerplate code under the fold). Ultra-wide galleries collapse to 674×170–212px (n8n, invoice), where node labels are unreadable without the lightbox. The planning image is 546px natural, stretched to 700px (blurry on 1× and worse on 2×).
- Why: the reader scrolls a full screen of `argparse` boilerplate before reading why the work mattered, and the ultra-wide strips look like thumbnails. The images don't show the output (PDF → Excel row), which is what the buyer is actually paying for.
- Fix: cap lead media with `max-height: min(70vh, 560px); object-fit: contain` and a background frame, or better, lead with an output image (the Excel result, an annotated detection) and demote code to a later gallery slot. Provide crops of ≥1400px for ultra-wide flows, or split them into 2–3 legible detail crops.
- Effort: S (CSS cap) / M (assets)

**UI-I09 · P1 · No next-project navigation or strong end CTA; the article ends in a small text link** · all /project/* @1440
- Evidence: projLinks=0 on all 12 pages. `.case-study-cta a` is a 14px text link, "Discuss a similar project →" (CaseStudyArticle.css:56-58), with no button and no bbox styling. By contrast, the header CTA is a bordered mono "REQUEST ESTIMATE" button.
- Why: the end of a case study is the highest-intent moment. The buyer gets no primary button and no "next: related CV project", so they either bounce or go back to the grid.
- Fix: end with (a) the same bracketed primary button as the header, labelled "Request an estimate for a similar project", plus a secondary email link, and (b) a "Next case study" card (same category first) that reuses CaseStudyCard.
- Effort: S–M

**UI-I10 · P2 · The article template is visually a different site from the rest of the product** · all /project/* @1440
- Evidence: H1 is weight 500, 38px, sentence case, while every other page H1 is bold uppercase with a purple accent span (CaseStudiesContent.js:21-25, Contact.jsx:176). The back link is a `border-radius:9999px` pill (CaseStudyArticle.css:18) where the site uses square. Links are #c8abea (not #8B5CF6/#a78bfa), and there are no bbox brackets or mono meta labels (yolo-1440-s-00.png compared with cs-1440-s-00.png).
- Why: the bbox/detection motif is the site's differentiator for a CV engineer. It disappears exactly where the proof lives, so the case studies feel like an imported blog template.
- Fix: bring the article onto the site tokens: uppercase bold H1 with an accent word (or keep sentence case but at weight 700), a square back button, a mono `COMPUTER VISION · CASE STUDY` meta line with the bbox underline from the card, and corner brackets on the gallery stage.
- Effort: S

**UI-I11 · P2 · Gallery images have no captions; the counter and thumbnails are misaligned** · /project/yolo-computer-vision-optimization/ @1440 (yolo-1440-s-01.png, yolo-1440-lightbox.png)
- Evidence: 0 of 6 images have captions (the alt text is good but invisible). The count "1 of 6" is centred, the thumbnail strip is left-aligned, and the lightbox zoom is centred with left-aligned thumbnails. The arrows (44px at x=299/937) sit on top of the image edge at an inline stage of 700px. The images are generic stock yoga photos with default Ultralytics overlays and colours ("person 0.96").
- Why: without captions the reader doesn't know what each frame proves (for example a hard pose, occlusion or a failure case). Default-looking YOLO output with stock photos reads as a tutorial run rather than engineered work.
- Fix: add one-line captions (what's hard about this frame and what the model got right or wrong), and centre the thumbnail strip, or left-align the counter to match. Consider including one failure or edge case with a note; it signals engineering maturity.
- Effort: S

**UI-I12 · P3 · Duplicate navigation row above the H1** · all /project/* @1440
- Evidence: "← View case studies" (pill) and "Back to home" (text) take 44px plus a 32px margin above the category (yolo-1440-s-00.png), on top of the fixed header, which already has "Case Studies". The H1 starts at about y=305.
- Why: this pushes the title and summary down and adds two redundant choices before the content.
- Fix: keep a single small breadcrumb, `Case studies / Computer Vision`, in mono 12px, and drop "Back to home".
- Effort: S

- Lightbox interaction (verified via keyboard eval): opening focuses "Close enlarged image"; ArrowRight advances ("2 of 6"); 10×Tab stays inside the dialog; Escape closes and returns focus to the inline opener; body scroll is locked, then restored; background is `inert`. Swipe is implemented (50px horizontal threshold, CaseStudyGallery.js:137-143). Good.


### /services/computer-vision-production-optimization (ServiceDetail.jsx)

**UI-I13 · P1 · The service page is a bare spec sheet: no proof, no process, no deliverables, and the right 40% is empty** · @1440
- Evidence: the page is 1246px tall, and 0 links point to any case study (eval). The content is H1 → rate → summary → in/out-of-scope lists → 2 buttons (svc-1440-s-00/01.png). `max-w-4xl` leaves roughly 560px of empty canvas on the right. There's no testimonial, no "typical engagement" steps, no before/after metric and no related CV case study, even though yolo-, sports- and depth- CV stories exist.
- Why: this is the page a CV buyer lands on from search or ads. "€45/hour · 1–2 weeks" with three one-line bullets gives no reason to believe the optimization claim. Competitors show a benchmark ("38 → 12 ms/frame on Jetson").
- Fix: add (1) a "Relevant work" row of 2–3 CaseStudyCards filtered to Computer Vision, (2) a 3–4 step engagement timeline (Profile → Optimize → Validate → Handoff) with a deliverable per step, (3) one quantified proof point or a testimonial, and (4) a right-rail sticky summary card (rate, duration, CTA) to use the empty column.
- Effort: M

**UI-I14 · P1 · The primary CTA fails contrast: dark navy text on purple** · @1440
- Evidence: the "Request a Project Estimate" button is `color rgb(15,23,42)` on `rgb(124,58,237)` at 14px/500, so the contrast is about 3.1:1, below WCAG AA 4.5:1 (ServiceDetail.jsx:76-78, shadcn default `text-primary-foreground`). It's visible as low-legibility text in svc-1440-s-01.png. White on the same purple gives about 5.7:1.
- Why: the most important button on a sales page is the hardest to read, and it looks disabled next to the white-text secondary button.
- Fix: add `text-white` (and match the site's square mono bordered CTA style instead of `rounded-md` 6px).
- Effort: S

**UI-I15 · P2 · The page grid doesn't align with the header or footer, and the H1 is oversized** · @1440
- Evidence: the H1 left edge is at x=44, the header logo at x=188 and the footer frame at x=160 (eval). `container mx-auto px-6` resolves to a wider container than the header or footer. The H1 is 72px uppercase across 3 lines, taking 230px (svc-1440-s-00.png), while other inner H1s are 28–46px.
- Why: the left edge jumps between regions, which makes the page feel unfinished. The shouting H1 pushes the value proposition and CTA below the fold: the buttons sit at y≈890 at 1440×900.
- Fix: use the same `max-w-[1180px] mx-auto px-7 md:px-12` wrapper as /case-studies/, and clamp the H1 to `clamp(2rem,4vw,3rem)` with an accent span on "Computer Vision".
- Effort: S

**UI-I16 · P2 · Scope lists have no markers or icons, and there's no bbox motif** · @1440
- Evidence: `li` list-style is `none` (eval), so in-scope and out-of-scope items are plain lines of equal weight. There are no ✓/✕ markers, no brackets and no mono meta labels, although the contact aside uses a custom tick (Contact.jsx:200).
- Why: the in/out split is a smart trust device, but visually the two columns read the same.
- Fix: reuse the contact tick for in-scope items and a muted ✕ for out-of-scope, frame the in-scope column with the corner brackets, and add a `SERVICE · CV` mono meta label.
- Effort: S

**UI-I17 · P2 · The service route has no route-specific `<title>` or canonical** · @1440
- Evidence: `document.title` is "Vivek Patel - Expert AI & Computer Vision Engineer", and canonical is `https://www.vivekapatel.com/`. ServiceDetail.jsx doesn't render `<Seo>`, unlike every other page.
- Why: shared links and search results show the homepage snippet, and the canonical tells search engines the page is a duplicate of `/`.
- Fix: add `<Seo title={`${service.title} | Vivek Patel`} description={service.summary} path={`/services/${service.id}`} />`.
- Effort: S


### /contact/ (Contact.jsx)

**UI-I18 · P0 · Decorative "NAME · FIELD" chips cover the real field labels** · /contact/ @1440 and 390
- Evidence: each field has an absolute `.field-meta` chip at `-top-[9px]` with `bg-[#0C0D0D] z-[4]` (Contact.jsx:228-230, 250, 272, 296) sitting on top of the real `<label>`. The measured name label box is y 467–480, the chip y 458–471, so the chip overlaps 5px of a 13px label box (about the top 40% of the glyphs). In contact-1440-s-00.png and contact-1440-errors.png, "FULL NAME *", "EMAIL ADDRESS *", "BUDGET RANGE" and "PROJECT DESCRIPTION *" are visibly sliced in half under the chips. The real labels are also 9px mono `#6b7280` (about 4.1:1 on #0C0D0D), below AA.
- Why: the actual accessible labels, including the required asterisk, are illegible, while decoration that repeats the same word ("NAME · FIELD") is legible. On the conversion page this reads as a rendering bug.
- Fix: remove the `.field-meta` chips, or turn them into the label itself: one line, `NAME *`, in 11–12px mono `#a78bfa`. Set real labels to ≥12px with contrast ≥4.5:1.
- Effort: S

**UI-I19 · P1 · The submit button says "SUBMIT · FIELD" and its accessible name doesn't match the visible text** · /contact/ @1440
- Evidence: the visible text is `SUBMIT · FIELD` (11px mono), while `aria-label="Submit Project Estimate Request"` (Contact.jsx:333-347). It's 190px wide, centred, and sits at y=1059, below the fold at 1440×900.
- Why: "SUBMIT · FIELD" is decorative jargon that doesn't say what happens. Voice-control users saying "click submit" work, but "click send request" doesn't, and the mismatch fails WCAG 2.5.3 Label in Name. The page H1 promises "Request a project estimate", and the button should close that loop.
- Fix: use the visible label "Send estimate request →" (or "Request estimate"), drop the aria-label, make it full-width on mobile, and give it a stronger fill (it's the only primary action on the page).
- Effort: S

**UI-I20 · P1 · Error states rely on toasts; fields don't turn red; the toast contradicts the inline errors** · /contact/ @1440 (contact-1440-errors.png)
- Evidence: after submitting with name empty and email "not-an-email", the inline errors are "Name is required.", "Enter a valid email address." and "Project description is required.", but the toast only says "Invalid email address. Please check your email format…" (Contact.jsx:106-114 picks the email message whenever an email was typed). Input borders stay `rgba(255,255,255,0.12)` because there's no `aria-[invalid=true]:border-red-*` style. The toast renders at the top-left over the hero, away from the form, and focus isn't moved to the first invalid field.
- Why: this gives mixed signals at the moment of highest friction. Keyboard and screen-reader users land nowhere, and sighted users have to hunt for red text under unchanged boxes.
- Fix: drop the validation toast (keep toasts for network failure only), add `aria-invalid:border-red-400` plus an icon, focus the first invalid field on submit, and optionally show an error summary at the top of the form.
- Effort: S

**UI-I21 · P1 · Success is a transient toast plus a silent form reset** · /contact/ (source-inferred, Contact.jsx:161-166)
- Evidence: on success the toast "Request received… within 24 hours" shows and `setFormState` clears every field. There's no inline confirmation panel, no summary of what was sent, and no next step (for example "check your inbox" or a booking link). The success path wasn't exercised because the form must not be submitted.
- Why: toasts auto-dismiss. A buyer who glances away sees an empty form and may resubmit or assume it failed, which costs leads or produces duplicates.
- Fix: replace the form with a persistent bbox-framed success state ("Request received · I'll reply to name@… within 24h"), echo the key details, offer "Add files by email" and "Send another", and move focus to its heading.
- Effort: S–M

**UI-I22 · P2 · Mobile order buries the form, and autofill hints are missing** · /contact/ @390 (contact-390-s-00..02.png)
- Evidence: at 390×844 the aside renders first, the form top is at y=848 (just below the fold), the name input at y=933 and submit at y=1584, with a page height of 2468. The inputs have no `autocomplete` attributes (`name`, `email`) and `enterKeyHint` isn't set. `type=email` is correct.
- Why: mobile visitors from LinkedIn or Upwork have to scroll past "What happens next" before seeing a single field, and without autofill hints they type everything by hand.
- Fix: use `order-first` on the form below md (or move the proof strip and aside below the form), and add `autoComplete="name"` / `autoComplete="email"`.
- Effort: S

**UI-I23 · P2 · Budget select and trust cues** · /contact/ @1440
- Evidence: the options are "Select your budget range", "< €5,000", "€5,000 - €10,000", "€10,000 - €25,000" and "€25,000+". There's no "Not sure yet" option, and the service page advertises €45/h × 1–2 weeks (≈ €1.8–3.6k), so small jobs all fall into one bucket. The select's text colour is `#9ca3af` even after selection (Contact.jsx:283), so a chosen value looks like a placeholder. There's no privacy or GDPR microcopy or /legal link near the submit button (privacyLink=false). The proof strip only has 2 items (100% JSS, 5★), with no count of jobs or reviews.
- Why: budget is the most anxiety-inducing field. The lack of a "not sure" option and a value that looks unselected both add friction, and EU buyers look for a privacy note beside the form.
- Fix: add "Not sure yet" and "< €2,000" options, use `text-white` when there's a value, and add "Your details are used only to reply · Privacy policy" under the button. Make the proof specific, for example "100% JSS · N jobs".
- Effort: S

- Placeholder-as-label: not an issue; real labels exist and placeholders are examples, which is good (the problem is legibility, UI-I18). There are 4 fields with 3 required, which is a good length. "Helpful details to include" is a strong prompt.


### /does-not-exist, /services/<bad-id>

**UI-I24 · P2 · The 404 is a dead end with one pill button; the service 404 is a soft 404** · /does-not-exist @1440 (does-not-exist-1440.png)
- Evidence: the only link in the section is "Back to Home" (a `rounded-full` pill, NotFound.jsx:22). There are no links to Case studies, Services or Contact, no search and no motif. `noindex, nofollow` is set correctly. `/services/does-not-exist` renders a different, bare "Service Not Found" (ServiceDetail.jsx:11-20) with the homepage `<title>` and no noindex, so it's a soft 404.
- Why: 404s mostly come from old Upwork or LinkedIn links to renamed project slugs. Those are high-intent visitors, and one "home" button loses them.
- Fix: offer three quick paths (Case studies · CV services · Request estimate) plus the 3 featured case-study cards. Add a small on-brand touch such as a dashed bbox labelled `page · 0.00 conf · not detected`. Make ServiceDetail's not-found state render `<NotFound />`.
- Effort: S

### /legal/, /data-policy/

**UI-I25 · P2 · Legal pages have a ~106-character measure, no table of contents, and a mixed voice** · /legal/ and /data-policy/ @1440 (legal-1440.png, data-policy-1440.png)
- Evidence: the paragraph width is 848px at 16px/24px, about 106 characters per line (`max-w-4xl` + `prose max-w-none`, Legal.jsx:29-32). There are 6 and 4 H2s with no TOC or anchors. The Privacy page speaks in "I/my" (28 uses, 2 "we/our"), while the Cookie page uses "we/our" (15, 1 "I"). The routes are named /legal = "Privacy Policy" and /data-policy = "Cookie Policy". Line-height 1.5 is fine.
- Why: EU procurement people actually read these pages. Long lines slow reading, and the we/I switch looks templated, which undercuts the "solo, accountable engineer" positioning.
- Fix: remove `max-w-none` (prose defaults to ~65ch) and add an "On this page" anchor list. Unify on first person "I". Optionally alias `/privacy/` and `/cookies/`.
- Effort: S

### Cross-page consistency

**UI-I26 · P2 · The content left edge jumps on every inner page** · all inner pages @1440
- Evidence: H1 or content left x: /case-studies 130 · /project/* 370 · /services/* 44 · /contact 170 (aside) · /legal 296 · /404 360. The header logo is at 188 and the footer frame at 160. There are six different wrappers (`max-w-[1180px]`, `756px`, `container`, `max-w-[1100px]`, `max-w-4xl`, `max-w-3xl`).
- Why: moving between pages, the eye has to re-find the column every time. This is the most visible "templated/assembled" signal once someone navigates.
- Fix: define two layout primitives, `PageWide` (1180) and `PageProse` (720, left-aligned to the same 1180 grid or centred consistently), and use them everywhere.
- Effort: M

**UI-I27 · P2 · The bbox/detection motif is inconsistent: strong on cards, contact and footer, absent on articles, services, 404 and legal** · all inner pages
- Evidence: corner brackets and mono `X · Y` meta labels appear on CaseStudyCard.js:48-49, Contact.jsx:219-224, the header CTA and the footer frame. There are none on CaseStudyArticle (UI-I10), ServiceDetail, NotFound or Legal. The motif is over-used on contact (`CONTACT · DETECTED`, `SUBMIT · FIELD`, four field chips — UI-I18/19) and missing where it would add meaning: the gallery stage, where it would literally frame detections, and the service in-scope list.
- Why: used sparingly and meaningfully, the motif says "this person does CV". Sprayed on form labels it becomes noise, and missing from case studies it feels unfinished.
- Fix: write a one-paragraph motif rule: brackets frame primary content objects (cards, the primary form, the gallery stage, the key-facts panel), and mono meta labels only name categories and states, never repeat a visible label. Then apply it to the article, service and 404 pages and strip it from the form field chips.
- Effort: S–M

**UI-I28 · P3 · On mobile, gallery arrows cover a quarter of the image** · /project/yolo-computer-vision-optimization/ @390 (inner-yolo-390-s-01.png)
- Evidence: the stage is 346×260, and the two 44px arrows (x 31–75 and 315–359) overlay the image edges, together covering about 25% of its width. Swipe exists but isn't advertised. The global cookie bar (not this page's code) also covers the gallery until it's dismissed.
- Fix: below 450px, move the arrows under the stage next to the "1 of 6" counter (the ‹ 1 of 6 › pattern) and let swipe carry the stage.
- Effort: S

## What works well
- The gallery and lightbox are well engineered. Focus moves to Close on open. Arrow keys navigate. Tab is trapped (10 tabs stayed inside). Escape closes and returns focus to the opener, and background `inert` plus the scroll lock are restored. There's also swipe with a 50px threshold, zoom up to 300%, and no-JS fallbacks (CaseStudyGallery.js).
- Honest, specific copy: "detection scores describe those predictions, not a measured project-wide accuracy rate" (yolo page). Senior CV buyers trust this; it just needs to move out of card summaries (UI-I05).
- Case-studies listing: "Showing 6 of 10" live status, Load more with `aria-controls`, scroll and return state restored from articles, a no-JS `<noscript>` list, and consistent card heights (446px) and date format.
- Contact is structurally sound: 4 fields with 3 required, real `<label for>`, examples as placeholders rather than labels, a "Helpful details to include" prompt, a 3-step "What happens next" aside, an email fallback, `type=email`, and inline errors with `role=alert` + `aria-describedby`.
- The service page's in-scope / out-of-scope split and the visible rate and duration are strong qualification devices, and rare on freelancer sites.
- The 404 has the correct `noindex`, and there's no horizontal overflow at 390 on any inner page tested (scrollWidth=390).
