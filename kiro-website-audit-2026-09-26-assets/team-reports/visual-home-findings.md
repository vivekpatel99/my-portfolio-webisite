# Visual/UI audit — Homepage + global chrome

Build: develop @ fff5306, http://127.0.0.1:4173. Viewports 1440x900, 768x1024, 390x844, 320.
Severity: P0 = blocks trust/usability, P1 = visible quality defect a buyer notices, P2 = polish, P3 = nit.
Status: IN PROGRESS (appended incrementally).



## 1. Header + Hero (1440x900)

Raw measurements (m1–m4 re-run 2026-09-26, cookie banner visible):
- header sticky, 0,0,1440x69; inner container `max-w-[1120px] px-7` → logo x=188, CTA right edge x=1252.
- Hero container `container px-12` + `max-w-[1320px]` → badge/article/CTAs x=68; portrait right edge x=1296 (card) / ~1324 (brackets).
- Left edges of top-level content across page: 68 (hero), 98 (h1 inside article), 130 (FEATURED CASE STUDIES), 180 (SERVICE OFFERS), 160 (CLIENT RESULTS / WHO I AM / footer), 188 (header logo), 260 (CTA heading). **7 different left edges.**
- Hero: article 68,236,760x431 → bottom 667; CTA row top 667 → **0px gap** between panel and buttons.
- Overlap test (m4): 8/8 confidence chips overlap their own field label ("Name × field·0.99", … "Profile Invoice × doc·extract·0.97").
- Font sizes in `<main>`: 89 text nodes ≤11px (8px×3, 9px×15, 10px×47, 11px×24) vs ~70 nodes ≥12px. **~56% of all text nodes are ≤11px.** 25 distinct font sizes in use.
- H1 "Computer Vision & AI Engineer" = 26.4px; "Vivek Patel" = 20.8px; testimonials section uses a second `<h1>` "CLIENT RESULTS" at 57.6px. Section H2s = 57.6px.
- Bio = 12.48px `#9ca3af` (desktop), 11.52px (mobile).
- Hero section 781px tall with `pb-40` (160px) → last content (chips) ends y≈690 of 900; ~210px empty band before next section.
- Primary CTA: white on `#8B5CF6` → contrast **4.23:1** at 16px/600 (not "large text") → fails WCAG AA 4.5:1.

### UI-H01 · P1 · Header and hero sit on different containers (x=188 vs x=68)
- Viewport: 1440 (also 1280+ any width >1176).
- Evidence: logo x=188 (`Header.jsx:170` `max-w-[1120px] mx-auto px-7`), hero x=68 (`Hero.jsx:152-153` `container mx-auto px-6 md:px-12` + `max-w-[1320px]`). Header right edge 1252 vs portrait right edge 1296–1324. home-1440-02-accepted.png: the VP mark floats 120px right of the invoice panel edge; nav CTA ends 44–72px left of portrait brackets.
- Why: the first thing a design-literate buyer sees is two grids fighting. For someone selling precision (CV/bbox accuracy), misaligned boxes undermine the pitch.
- Fix: introduce one shell, e.g. `const shell = "mx-auto w-full max-w-[1200px] px-5 md:px-8"` and use it in Header, Hero, every section and Footer. Drop `container` + `max-w-[1320px]` in Hero.
- Effort: S–M (class swap in ~8 files, then re-check hero two-column widths).

### UI-H02 · P1 · Seven different left edges down the page
- Viewport: 1440.
- Evidence: 68 / 98 / 130 / 160 / 180 / 188 / 260 (m3 `leftEdges`). Portfolio heading x=130, Services x=180, Testimonials/About/Footer x=160, CTA x=260.
- Why: scrolling reads as a stack of unrelated templates rather than one product; reduces perceived craft.
- Fix: same shell as UI-H01; section headings flush to shell left; if CTA should be centered, center it explicitly (`text-center mx-auto max-w-[720px]`) instead of an arbitrary 260px indent.
- Effort: M.

### UI-H03 · P1 · Hero H1 is 26px — smaller than every section heading (57.6px)
- Viewport: all (1440: 26.4px; 390: 17.9px `max-md:text-[1.12rem]`).
- Evidence: `Hero.jsx:216` `text-[clamp(1.25rem,2.1vw,1.65rem)]`; section H2s 57.6px; testimonials has a second `<h1>` at 57.6px. home-1440-02-accepted.png: the value proposition is inside a boxed "field" and competes with 10px mono chips.
- Why: inverted hierarchy — the hero doesn't answer "who is this and what will they do for me" at a glance; the biggest type on the page is "CLIENT RESULTS". Also two H1s dilutes SEO/semantics.
- Fix: make the role line the dominant element: `text-[clamp(2.25rem,4.2vw,3.5rem)] leading-[1.05] font-bold`, pull it OUT of the bbox field (or keep a single subtle bracket), and add a one-line outcome subhead at `text-lg md:text-xl text-gray-300` (replace the 12.48px bio). Demote testimonials `<h1>` to `<h2>`.
- Effort: M.

### UI-H04 · P1 · Confidence chips collide with field labels (8/8 overlaps)
- Viewport: 1440, 768, 390.
- Evidence: m4 `hits` = 8 overlaps. Chips positioned `absolute -top-3` (12px up) while labels sit `mb-[7px]` above the box → 5px collision (`Hero.jsx:195-200, 207-213, 227-229` etc.). "doc · extract · 0.97" chip (`Hero.jsx:170-174`, `-top-[13px]`) covers "PROFILE INVOICE" title (title y=243 vs chip 224–247) and itself tucks under "INFERENCE ONLINE" badge (badge bottom 236, chip top 224). Visible in home-1440-02-accepted.png at 90,160–235,180.
- Why: overlapping text reads as a layout bug, not an intentional HUD — the exact defect class a CV engineer is paid to eliminate.
- Fix: either drop the per-field labels (NAME/ROLE/…) and keep only chips, or move chips inside the box top-right (`absolute top-1 right-1.5 text-[10px]`) and give the label `mb-4`. Move the article's scan chip to `-top-3 right-[18px]` and add `mt-4` between status badge and article (currently `gap-0`, `Hero.jsx:153`).
- Effort: S.

### UI-H05 · P1 · CTAs glued to panel; 210px dead band under hero
- Viewport: 1440 (390 worse, see mobile section).
- Evidence: article bottom 667 = CTA top 667 (0px) (`Hero.jsx:407` `mt-0`); grid `gap-0.5` (`Hero.jsx:163`). Hero `pb-40` (`Hero.jsx:66`) leaves y≈690–900 empty (home-1440-02-accepted.png lower quarter is blank). Rhythm inverted: 0px where grouping needs air, 160px where content should follow.
- Why: buttons look like part of the card's border; the fold ends on emptiness instead of the first proof (case studies) peeking in.
- Fix: `mt-8` on the CTA row, `gap-10` on the grid, hero `pb-16 md:pb-24`; optionally `min-h-[calc(100svh-68px)]` with `justify-center` so the fold is composed.
- Effort: S.

### UI-H06 · P1 · Primary CTA fails contrast (4.23:1)
- Viewport: all.
- Evidence: m2 `bg=rgb(139,92,246) c=white fs=16px`; weight 600 → normal text threshold 4.5:1. In home-1440-02-accepted.png the label renders even lighter (lavender), reading as disabled.
- Why: the one action that makes money looks inactive.
- Fix: `bg-[#7C3AED] hover:bg-[#6D28D9]` (white ≈ 5.7:1) or keep #8B5CF6 with `text-[#0C0D0D]`. Apply to cookie "Accept" too (same purple).
- Effort: S.

### UI-H07 · P2 · Header debug label "NAV · SITE" (and "FOOTER · SITE")
- Viewport: all (also inside mobile drawer).
- Evidence: `Header.jsx:176-178`, `Header.jsx:226-228` (drawer); 10px `#6b7280` next to logo at x=240.
- Why: reads as leftover dev scaffolding; it also occupies the slot where a buyer expects the name.
- Fix: replace with the wordmark `Vivek Patel` (`text-sm font-semibold text-white`) + optional `text-gray-500` "CV & AI Engineer". Remove the drawer copy.
- Effort: S.

### UI-H08 · P2 · Header CTA and hero CTAs look like different design systems
- Viewport: 1440/768.
- Evidence: header button: square corners, mono 11px uppercase, 176x39, outline (`Header.jsx:198-204`). Hero buttons: 10px radius, 16px sans 600, 54px tall (`Hero.jsx:409-424`). Cookie buttons: pill (`rounded-full`, see cookie section). Three radii (0 / 10px / 999px) for the same "primary action" role.
- Why: inconsistency erodes perceived polish; buyer can't tell which is the main action.
- Fix: one Button variant set: `h-11 rounded-lg px-5 text-sm font-semibold`; header uses `size="sm"` of the same primary. Pick 8px radius everywhere (cards use 8px already).
- Effort: S.

### UI-H09 · P2 · Micro-type overload: 56% of text ≤11px, 25 font sizes
- Viewport: all; worst on 390.
- Evidence: histogram above; 9px labels NAME/ROLE/CREDENTIAL/RATE/LOCATION/TAGS + "Upwork freelancer"/"Client delivery record" 9px `#6b7280` (`Hero.jsx:192, 205, 225, 227, 245, 262, 275, 301`). 8px text in testimonials ("CLIENT RESPONSE · DETECTED", "BBOX · ACTIVE", "Upwork"). `#6b7280` on `#0C0D0D` ≈ 4.0:1 — below AA for small text.
- Why: a buyer skims; 9px mono grey is unreadable on laptops and invisible on phones. The only readable proof points (Top Rated Plus, 100% JSS, €45/h) are drowned in labels.
- Fix: floor = 12px for any text, 14px for meaningful copy; restrict to a scale of 6 sizes (12/14/16/20/28/48–56). Delete "field parse", "OCR surface", "INV-VP-0045", sub-captions; use `text-gray-400` (#9ca3af, 7.6:1) minimum for labels.
- Effort: M.

### UI-H10 · P2 · Hero portrait: small, floating, heavy chrome; badge language
- Viewport: 1440.
- Evidence: img 236x276 at x=1060,y=313 inside a 1.7fr/0.72fr grid; right column ≈440px wide but card capped `max-w-[300px]` (`Hero.jsx:329-330`) → ~200px of empty column left of it; vertical center (y≈450) doesn't align with article top (236) or H1. Chrome: 4 animated ghost frames + 4 glowing L-brackets + scanline + 3 badges ("engineer · 0.99", "ID 001 · TRACKED", "REC") — `Hero.jsx:333-400`. home-1440-02-accepted.png.
- Why: the face is the trust anchor; it's shrunk and wrapped in effects. "TRACKED/REC" on your own face gives surveillance vibes — off-message for a buyer. The rounded-card-with-floating-label-chips treatment is a common Dribbble/Framer template look, which reduces distinctiveness.
- Fix: top-align columns (`items-start`), let photo fill column `max-w-[380px]`, keep ONE static bbox (1.5px #8B5CF6 + single label "Vivek · 0.99"), drop ghost trails, REC, scanline. Consider colour photo.
- Effort: S.

### UI-H11 · P2 · Cookie banner is in-flow: pushes hero 72px, pure CLS
- Viewport: all.
- Evidence: banner 0,72,1440x77 below sticky header; hero top moves from 69 → 141 (m1 with banner) — compare home-1440-01-cookie.png vs home-1440-02-accepted.png (panel y 164 → 236). After Accept, content jumps up 72px.
- Why: layout jump on first interaction and the fold loses 77px on every first visit.
- Fix: render as `fixed bottom-4 inset-x-4 md:left-auto md:right-6 md:max-w-[420px] z-50` card; no page reflow.
- Effort: S.


> Correction to UI-H11 evidence: banner itself is `fixed top-[72px]` (`CookieConsentBanner.jsx:108`); the reflow comes from a spacer `h-[60px] sm:h-[72px]` in `Layout.jsx:66-68`. Banner is 77px tall vs 72px spacer → 5px of hero hidden; header is 68–69px vs banner top 72 → 3px strip between them. After scrolling, the header is gone (UI-H12) so a 72px strip of page content shows ABOVE the banner (home-1440-s-01.png / s-02.png top band). Fix unchanged: bottom-anchored fixed card, delete spacer.

## 2. Global chrome: sticky header, anchors (1440)

### UI-H12 · P0 · "Sticky" header is not sticky — scrolls away on every page
- Viewport: all.
- Evidence: scrollTo(0,1500) → header rect y=-1500 (measured). Header has `sticky top-0` (`Header.jsx:167`) but its parent `Layout.jsx:63` has `overflow-x-hidden`, which computes `overflow-y:auto` → the div becomes the sticky scroll container, and it never scrolls (window does). home-1440-s-01.png / s-02.png show no nav bar at the top.
- Why: no persistent nav and no persistent "Request Estimate" on a long (5863px) one-pager; the conversion path disappears after the fold. Also invalidates the `scroll-margin-top:96px` on every section (UI-H13) and the cookie banner offset.
- Fix: `Layout.jsx:63` `overflow-x-hidden` → `overflow-x-clip` (clip does not create a scroll container), or move overflow control to `body`. Re-test at 390 (hero bboxes are the likely x-overflow source; they already have `overflow-hidden` on their own wrapper).
- Effort: S.

### UI-H13 · P2 · Anchor offset double-counts a header that isn't there
- Viewport: all.
- Evidence: all `section[id]` have `scroll-margin-top: 96px`; `html scroll-padding-top: auto`. With the header gone (UI-H12), anchor jumps leave 96px of the previous section visible above the target. menu-390-after-anchor.png.
- Fix: after UI-H12, set one source of truth: `html { scroll-padding-top: 80px }` (68px header + 12px) and remove per-section margins; or keep `scroll-mt-[80px]`.
- Effort: S.

## 3. Sections below the fold (1440)

Measurements: section heights / padding (m3):
| section | height | pad top/bot | min-h | heading size (max) | container |
|---|---|---|---|---|---|
| hero | 781 | 64 / 160 | – | h1 26.4px | container+1320 |
| portfolio | 828 | 64 / 64 | – | 37.6px (`clamp(...,2.35rem)`) | max-w 1180 |
| services | 900 | 56 / 56 | **900** | 41.6px (2.6rem) | max-w 1080 |
| testimonials | 900 | 92 / 92 | **100vh** | 57.6px (`<h1>` 4rem) | max-w 1120 |
| about | 1270 | 56 / 56 | 900 | 44px (2.75rem) + 21.6px "MY PROCESS" | max-w 1120 |
| cta | 900 | 56 / 56 | **900** | 57.6px (3.6rem) | max-w 920 |
Five padding values (56/64/92/160), five container widths, five H2 sizes.

### UI-H14 · P1 · `min-h-[900px]` sections create large dead vertical gaps
- Viewport: 1440 (and 768/390 where 900px ≫ content).
- Evidence: `Services.jsx:27`, `About.jsx:5`, `CTA.jsx:25` `min-h-[900px]`; `Testimonials.jsx:41` `min-h-screen`. Services collapsed content ends ~y=685 of a 900 viewport → ~215px empty (home-1440-s-02.png bottom quarter). CTA content ≈ 420px tall inside 900px → ~480px of blank.
- Why: blank screens mid-scroll feel broken/unfinished and push the CTA ~1000px further away.
- Fix: delete all `min-h-[900px]`/`min-h-screen`; use one rhythm `py-20 md:py-28` (80/112px) for every section; hero `pt-12 pb-16`.
- Effort: S.

### UI-H15 · P2 · Inconsistent section heading scale (37.6 / 41.6 / 44 / 57.6px)
- Viewport: 1440.
- Evidence: table above; `Portfolio.jsx:13`, `Services.jsx:29`, `About.jsx:10`, `Testimonials.jsx:47`, `CTA.jsx:30`. Two sections also get an eyebrow ("PORTFOLIO · CASE STUDIES"), Services doesn't (home-1440-s-02.png).
- Why: hierarchy shifts per section → reads as stitched templates.
- Fix: one `SectionHeading` pattern: eyebrow (12px mono, gray-400) + `text-[clamp(2rem,3.6vw,2.75rem)] font-bold tracking-[-0.02em]` + lede `text-base md:text-lg text-gray-400 max-w-[60ch]`.
- Effort: S.

### UI-H16 · P2 · Case-card category labels sit on top of busy screenshots
- Viewport: 1440.
- Evidence: home-1440-s-01.png — "DOCUMENT AI · CASE STUDY" (10px mono #d8caff) is printed over the invoice table screenshot and is barely legible; same for "AI WORKFLOW AUTOMATION" over the n8n canvas. Source `CaseStudyCard.js` (label overlays on image, 10px).
- Why: the portfolio grid is the strongest proof on the page; noisy overlays make it look cluttered.
- Fix: move category eyebrow below the image into the card body (`mt-5 text-xs font-mono text-violet-300`), keep only title over a stronger gradient `from-black/85 via-black/40`, or no overlay at all.
- Effort: S.

### UI-H17 · P1 · Services collapsed by default — offers are invisible
- Viewport: all.
- Evidence: `Services.jsx:12` `useState(null)`; 3 rows show only "SERVICE · OFFER 0N" + title in `#9ca3af` gray (home-1440-s-02.png); price/duration/scope need a click (home-1440-services-open.png). Titles in gray look disabled.
- Why: the buyer's key questions (what, how long, how much) are hidden behind interaction; accordions are for FAQs, not the core offer.
- Fix: render as 3 always-open cards in `lg:grid-cols-3 gap-6` with title (white), 2-line outcome, duration + "from €45/h" row, "Scope details →" link; keep accordion only for in/out-of-scope lists if needed. Minimum: `useState(0)` and white titles.
- Effort: M.


### UI-H18 · P1 · About "PHOTO · FIELD" is an empty placeholder box
- Viewport: all.
- Evidence: `About.jsx:17-35` — 4:3 `bg-[#161718]` panel with a diamond glyph and the text "PHOTO · FIELD" (twice: meta + inside). ~460x345px of empty grey on 1440 (home-1440-s-04.png, left half).
- Why: an unfinished-looking placeholder in the "Who I am" section is the single most "template not finished" signal on the page; it also leaves the bio card visually unbalanced.
- Fix: either real image (working-setup photo, Jetson/camera rig, or a real detection output from a case study with bbox overlay) or delete the column and let the bio run `max-w-[70ch]` with a proof strip (MAGNA logo/text, CUDA/ONNX/TensorRT, years).
- Effort: S (delete) / M (photo).

### UI-H19 · P1 · Debug/"system" micro-labels leak into the UI
- Viewport: all.
- Evidence: "ROUTE · /CONTACT/ · NO MAILTO" 9px `#484851` (≈2.2:1) `CTA.jsx:73-75`; "BBOX · ACTIVE" 8px `#484851` `Testimonials.jsx:~113`; "CLIENT RESPONSE · DETECTED" 8px `#52525b` (≈2.6:1); "FOOTER · SITE" `Footer.jsx:18-20`; "NAV · SITE"; "INV-VP-0045", "OCR surface", "field parse" (Hero). Visible in home-1440-s-07.png (below CTA) and home-1440-s-03.png (top-right of card).
- Why: these read as developer notes ("no mailto" is an implementation detail); buyers may assume the site is unfinished. Sub-3:1 text also fails WCAG 1.4.3.
- Fix: delete all of them. Keep at most one eyebrow per section ("Case studies", "Services", "Testimonials", "About").
- Effort: S.

### UI-H20 · P2 · Testimonials: one-at-a-time autoplay carousel, 5px dot targets, empty rail
- Viewport: all.
- Evidence: `Testimonials.jsx:8-22` 6s `setInterval` auto-advance across 10 quotes (pauses on hover/focus and under reduced-motion — good). Dots `w-[5px] h-[5px]` / active `w-2 h-2` (`Testimonials.jsx:~120-128`) → 5–8px hit targets (WCAG 2.5.8 wants ≥24px). Left rail 148px holds only a decorative diamond and a 9px "Field 06 / 10" counter (home-1440-s-03.png). ~230px empty between dots and About (home-1440-s-04.png y 175–400).
- Why: social proof is strongest in volume; one rotating quote hides 90% of it and moves while being read. Tiny dots are hard to hit, especially on touch.
- Fix: static grid of 3–6 short quotes `md:grid-cols-2 lg:grid-cols-3 gap-6` with client/project/Upwork ★ line, "Read all 10 on Upwork →" link; if carousel stays: no autoplay, prev/next buttons `h-11 w-11`, dots wrapped in `p-2.5` buttons, drop rail on `<lg`.
- Effort: M.

### UI-H21 · P2 · Low-contrast grey body copy (#6b7280) in About/Process
- Viewport: all.
- Evidence: "MY PROCESS" paragraphs `text-[0.84rem] text-[#6b7280]` (`About.jsx:110,116`) → 13.4px at **4.0:1** on #0C0D0D (fails AA). Same colour used for eyebrows, CTA "View case studies" secondary link (`CTA.jsx:67`), footer legal links 10px (`Footer.jsx:38-42`).
- Fix: body copy `text-gray-400` (#9ca3af, 7.6:1) minimum; secondary labels `text-gray-400`, never `#6b7280` below 14px.
- Effort: S.

### UI-H22 · P2 · Closing CTA: third distinct button style + 480px of empty section
- Viewport: 1440.
- Evidence: `CTA.jsx:42-63` — square outline bbox button, bold uppercase 16.8px, 420x70, plus 9px "REQUEST · ESTIMATE" tab label; hero uses rounded 10px filled; header uses mono 11px outline. `min-h-[900px]` → ~250px blank between CTA and footer (home-1440-s-07.png y 510–755). Secondary "VIEW CASE STUDIES" is 11px mono #6b7280.
- Why: final conversion moment is visually weaker (outline, no fill) than the hero button, and floats in a void.
- Fix: reuse the hero primary button (filled) + a real secondary button; remove min-h; `py-24`; optionally add response-time line ("Reply within 24h") in 14px gray-300.
- Effort: S.

### UI-H23 · P3 · Footer: boxed HUD footer, all-caps 10–11px mono links
- Viewport: 1440.
- Evidence: `Footer.jsx:12-45` — bordered box with bbox corners, 11px mono uppercase nav, 10px `#6b7280` legal row; box aligned to 1120 container (x=160) while hero is at x=68.
- Fix: unboxed footer, `text-sm text-gray-400` links, name + one-line positioning + email/LinkedIn/GitHub/Upwork; 14px min.
- Effort: S.


## 4. Tablet / mobile (768, 390, 320)

Measurements (cookie banner visible, spacer 60px on <sm, 72px on ≥sm):
| vp | article | portrait img | CTA 1 | CTA 2 | gap CTA1→2 | H1 | hero left x | portfolio H2 x | header inner x |
|---|---|---|---|---|---|---|---|---|---|
| 768 | 48,236,672x423 | 156x183 @ y703 | 48,918,252x54 | 312,918 | 12px (row) | 20px | 48 | 48 | 28 |
| 390 | 16,160,358x462 | **86x101** @ y634 | 16,746,358x44 | 16,790 | **0px** | 17.9px | 16 | 28 | 20 |
| 320 | 16,160,288x484 | 86x101 @ y655 | 16,768,288x44 | 16,812 | **0px** | 17.9px | 16 | 28 | 20 |
No horizontal overflow at any width (scrollWidth = viewport) — good.

### UI-H24 · P1 · Mobile hero: 86px portrait with three 70x40 badges piled on it
- Viewport: 390, 320 (and 768 partially).
- Evidence: img 86x101 (`Hero.jsx:326-327` `max-md:max-w-[110px]`, `max-md:p-3`); badges "engineer · 0.99" (70x40, wraps to 2 lines), "ID 001 · TRACKED" (70x40), "REC" (50x25) at y=650/678/693 → all three overlap each other and cover ~90% of the face (home-390-s-00.png). At 768 "ID 001 · TRACKED" (328–458) and "REC" (386–440) overlap on the same row (home-768-s-00.png, "ID 001 [REC] D").
- Why: on the device most recruiters/clients first open the link on, the face is an unreadable thumbnail under colliding labels — a visible bug above the fold.
- Fix: on `<md` put a 56–64px round avatar next to the name (`flex items-center gap-3`, `size-14 rounded-full`) and hide the badge stack (`max-md:hidden`); or show the portrait full-width above the panel at `max-w-[240px]` with a single badge. At 768 use `lg:` badges only.
- Effort: S.

### UI-H25 · P1 · Mobile CTAs stacked with 0px gap, and zero padding override
- Viewport: 390, 320.
- Evidence: `Hero.jsx:407` `max-md:flex-col max-md:gap-0`; buttons `max-md:py-0` (`Hero.jsx:411, 419`) → CTA1 bottom 790 = CTA2 top 790 (home-390-s-00.png: buttons touch, reading as one split control). ~200px empty below CTAs before "PORTFOLIO" eyebrow (home-390-s-01.png y 75–285, from `max-md:pb-36`).
- Fix: `max-md:gap-3`, remove `max-md:py-0` (keep `min-h-12`), hero `max-md:pb-12`.
- Effort: S.

### UI-H26 · P1 · Mobile label collisions are worse: "PROFILE INVOICE", NAME, ROLE, CREDENTIAL, SUCCESS, RATE, TAGS all half-covered
- Viewport: 390, 320 (home-390-s-00.png, home-320-s-00.png).
- Evidence: same `-top-3` chips as UI-H04 but `max-md:mb-[5px]` labels → 7px overlap; the "doc · extract · 0.97" chip fully hides "PROFILE INVOICE"; panel padding `max-md:px-2.5 max-md:py-0` (`Hero.jsx:166`) so bottom brackets touch the Tags box. First viewport at 390 is ~70% HUD chrome, ~30% readable claims.
- Fix: on mobile drop labels + chips entirely (`max-md:hidden` on the 9px labels and the 10px chips), keep plain stacked facts: name (24px), role (28–32px H1), 2 proof pills, rate/location line, 1-sentence bio (15px), CTAs.
- Effort: S.

### UI-H27 · P2 · Mobile left edges: hero x=16 vs sections x=28 vs header x=20
- Viewport: 390/320; at 768 header 28 vs content 48.
- Evidence: table above; `Hero.jsx:152` `max-md:px-4`, sections `px-7` (`Portfolio.jsx:8`, `Services.jsx:27`…), header `px-7`/drawer `px-5`.
- Fix: covered by the single shell in UI-H01 (`px-5 md:px-8`).
- Effort: S.

### UI-H28 · P2 · Hero CTA falls below the fold on 320 and on first visit at 390
- Viewport: 320x568/640; 390x844 with banner.
- Evidence: 320: CTA1 top 768 > 640 viewport (home-320-s-00.png ends at the portrait); 390: CTA1 at 746–790 of 844 — visible, but only after ~460px of HUD panel plus the 60px cookie spacer.
- Why: the primary action should be visible without scroll on the smallest phones.
- Fix: the simplification in UI-H26 cuts the panel from ~470px to ~300px, which brings CTAs to ~y 520 at 320.
- Effort: (included in UI-H26).

### UI-H29 · P3 · Mobile drawer: repeats "NAV · SITE", no identity/contact, 4 links vertically centred in 700px void
- Viewport: 390.
- Evidence: menu-390-open.png — links at y 330–520, ~250px empty above, ~250 below; CTA pinned bottom (good). All links `#9ca3af` (no active on home). Hamburger lines 1.5px; toggle 44x44 (good).
- Fix: `justify-start pt-10`; add name + "Available for new projects" + email/LinkedIn row above the CTA; make CTA filled primary.
- Effort: S.

## 5. Interaction, motion, cursor

### UI-H30 · P2 · Custom cursor hides the native pointer and has no interactive state
- Viewport: desktop (pointer: fine).
- Evidence: `CustomCursor.jsx:49-70` 16px `#9372FF` dot, `mix-blend-difference`, spring (stiffness 500/damping 28) → visible lag; `body{cursor:none}` (m1 `cursor: none`). No variant for links/buttons/text inputs. Stray purple dot visible in home-1440-02-accepted.png (x≈1116,y≈110) and over the drawer close button in menu-390-open.png (desktop-emulated).
- Why: portfolio-template gimmick; removes the hand/I-beam affordance that tells a buyer something is clickable; lag makes the site feel slow.
- Fix: remove, or keep native cursor (`cursor:auto`) and render the dot as a trailing accent only; at minimum add `hover` scale for `a,button` and restore `cursor:text` on inputs.
- Effort: S.

### UI-H31 · P2 · Keyboard focus: browser-default blue 1px ring in header/nav/services/footer
- Viewport: 1440.
- Evidence: Tab sequence (measured): Skip link, VP, 4 nav links, header CTA, "View all case studies", Services rows → `outline: auto 1px rgb(0,95,204)`; hero buttons use shadcn ring (slate-300) — OK; case cards get a purple 2px offset outline (home-1440-focus-card.png) — OK. Three different focus treatments.
- Fix: global `:focus-visible { outline: 2px solid #A78BFA; outline-offset: 3px; border-radius: 4px }` in index.css; drop per-component variants.
- Effort: S.

### UI-H32 · P2 · Scroll-reveal hides whole sections until in view (opacity 0, y+50)
- Viewport: all.
- Evidence: `SectionAnimator.jsx:8-12` `initial={{opacity:0,y:50}}`, 0.8s; at load 4 wrappers report `opacity:0` (m1). Full-page capture/print without scrolling shows blank sections (home-1440-fullpage-noscroll.png / home-1440-print-noscroll.png). Anchor jumps land on invisible content that fades in 0.8s later. Reduced-motion is respected (good).
- Fix: `@media print { * { opacity:1 !important; transform:none !important } }`; shorten to 0.35s and `y: 16`; or animate only children, never the whole section.
- Effort: S.

### UI-H33 · P3 · Bbox motif density — from "signature" to "cosplay"
- Viewport: all.
- Evidence: count of decorative bbox elements above the fold at 1440: 8 drifting background boxes + parallax (`Hero.jsx:83-146`), 4 ghost frames + 4 glowing L-brackets + scanline on portrait, 4 corner brackets on the panel, 7 field boxes each with a confidence chip, 3 photo badges, a pulsing "Inference online" pill = **~40 decorative detection elements**. Every section repeats corner brackets + "· DETECTED" eyebrows (About, Testimonials, CTA).
- Why: the motif is a good idea for a CV engineer — once. Repeated everywhere it becomes noise, fights the content, and reads as theme rather than evidence. Real detections in the case-study thumbnails (person 0.96, invoice fields) are far more persuasive than decorative ones.
- Fix: keep ONE hero moment (e.g., a single real detection over the portrait or a real invoice crop), delete background drift boxes and ghost trails, drop "· DETECTED" suffixes, keep corner brackets only on case cards.
- Effort: M.

## What works well
- Dark, restrained palette with a single accent (#8B5CF6) — coherent brand colour, no rainbow.
- Case-study cards use REAL model outputs (person bbox 0.96, invoice field boxes) — the best proof on the page; card focus ring is clear (home-1440-focus-card.png).
- Proof points are the right ones and near the top: Top Rated Plus, 100% Job Success, €45/h, Linz — just need hierarchy.
- "When you hire me" 4-row table is clean, scannable, well aligned (home-1440-s-05.png) — the best-designed block; use it as the template for Services.
- Accessibility plumbing is thoughtful: skip link, drawer focus-trap + inert background, Escape to close, 44px touch targets on header/menu/cookie buttons, `aria-expanded` on accordions, reduced-motion respected by Hero/SectionAnimator/Testimonials/CustomCursor, carousel pauses on hover/focus.
- No horizontal overflow at 320/390/768.
- Cookie banner offers Accept / Reject / Options with equal prominence for Accept and Reject (good consent UX) — only its placement is the problem.

Status: COMPLETE (2026-09-26). 33 findings: P0×1, P1×13, P2×16, P3×3.
