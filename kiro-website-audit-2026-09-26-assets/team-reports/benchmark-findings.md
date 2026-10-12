# Benchmark Findings: Competitor Portfolios & Animation Playbook

- **Audit date:** 2026-09-26 (session clock)
- **Target:** owner site, production preview at http://127.0.0.1:4173 (develop branch, commit `fff5306`)
- **Benchmarks:** shahzeb-ai.com, sahilsingh.space, plus parlance-labs.com and it-jim.com/portfolio
- **Method:** Playwright CLI 0.1.21, session `bench`, at 1440×900 and 390×844, scrolling in steps. `document.getAnimations()` was used to list running animations. For the owner site I read the source (Hero.jsx, SectionAnimator.jsx, Testimonials.jsx, index.css) without editing it.
- **Evidence folder:** `.kiro-audit-tmp/bench/`. Prefixes: `sz-` = Shahzeb, `ss-` = Sahil, `vp-` = owner, `ext-` = extra benchmarks. `-d-` = desktop, `-m-` = mobile.
- **Quotes:** competitor copy is paraphrased.

---

## 1. Benchmark: shahzeb-ai.com ("Shah Zeb — Computer Vision Engineer")

Evidence: `sz-d-01-hero.png`, `sz-d-02.png` (services), `sz-d-03.png` (how I work), `sz-d-05.png` (testimonials/stack), `sz-d-07.png` (contact), `sz-m-01-hero.png`, `sz-m-03.png`.

| Area | What they do |
|---|---|
| Hero structure | The H1 is an outcome in two lines: cameras watch, AI understands. It is not the person's name. A 2-line subhead lists the use cases (inspection, surveillance, counting, tracking, docs) and says "real world, not demo". There is a status pill saying they accept projects. The primary CTA is "Start a project" and the secondary is "See what I build". |
| Proof above the fold | A 3-stat strip: 90% Job Success, Top Rated (Upwork), 8 industries. These are platform-verifiable claims, not invented metrics. |
| Visual motif | A canvas renders faint detection boxes behind the hero, with class labels, confidence and track IDs (vehicle 0.90, person 0.86, ID 10x). A portrait card has corner brackets, the badges "engineer · 0.99", "ID 001 · TRACKED" and "REC", and a HUD footer (FRAME / FPS / LATENCY / PIPELINE). |
| Services | 5 accordion rows with item 1 open by default, so content is visible without a click. Each row has a one-line benefit and a 6-bullet scope. |
| Process | The pitch is "define success before choosing a model". They show a DATA→TRAIN→OPTIMIZE→DEPLOY→SUPPORT chip pipeline, a `project_spec.yaml` card (target accuracy, FPS, latency, hardware, failure cases) and 4 guarantee cards. |
| Industries | 8 numbered industries, as text only. |
| Testimonials | 4 cards in a 2×2 grid showing all at once, with an initials avatar and first/last name. There is no company, project or rating. Some quotes are weak (one is about tutoring Python). |
| Case studies | **None.** "Portfolio" is in the nav, but no project, output or before/after is on the page. This is their biggest weakness. |
| Stack | 3 grouped cards: Core, Models, Deploy (YOLO, RT-DETR, SAM, ByteTrack, TensorRT, DeepStream…). |
| CTA / booking | The only external CTA is "Hire me on Upwork" (header plus contact). There is an inline brief form with a "replies within 24h" promise, and the contact copy promises target metrics, a pipeline and a timeline in the reply. There is no Calendly link and no pricing. |
| Pricing / FAQ | None. |
| Motion | 7 CSS animations, **all infinite**: status blink 1.6s, pulse ring, portrait float 7s, scan sweep 4.5s, REC blink 1.2s, terminal cursor blink, form status blink. The canvas boxes drift continuously. **No `prefers-reduced-motion` rule was found.** Sections are not hidden before scroll (0 elements at opacity 0). The same animations keep running on mobile. |
| Weak spots | On mobile the hero canvas boxes overlap the body copy, which hurts legibility (`sz-m-01-hero.png`). The yaml card and blinking cursor lean toward terminal cosplay. The testimonials have no context. |

**Where the owner already beats Shahzeb:**
- 10 real case studies with images showing actual detection output: `vp-d-02.png`, `vp-d-cs-01.png`.
- Public pricing (from €45/h).
- A contact form with a budget field and a "what happens next" 3-step list (`vp-d-contact.png`).
- 10 testimonials with project context.
- A "Top Rated Plus / 100% JSS" claim that is stronger than Shahzeb's.
- Reduced-motion support in most components.

**What the owner lacks compared with Shahzeb:**
- An outcome-led H1.
- An industries list.
- A "define success first" process with a concrete spec artifact.
- A stack display.
- A first service expanded by default.
- A testimonials grid visible at a glance.

---

## 2. Benchmark: sahilsingh.space ("AI & Computer Vision Engineer")

Evidence: `ss-d-01-hero.png`, `ss-d-02.png` (about/flagship), `ss-d-05.png` (project cards), `ss-d-06.png` (publications + metrics), `ss-m-01-hero.png`, `ss-m-03.png`.

| Area | What they do |
|---|---|
| Hero structure | A large script-font name, then a typewriter role line ("A [role] building in India"). Below that is a long, dense résumé-style paragraph and two CTAs: See Works / Reach Out. The first screen reads like an employment CV, not a freelance offer. |
| Proof above the fold | None. The first proof appears after about 2 screens. |
| Navigation | 8 nav items plus Resume, GitHub, LinkedIn and "Say hi", with a right-side dot scroll-spy. This is a lot of choice and dilutes the CTA. |
| Case-study format | 6 "project cards", each with a **live mini-simulation** as the thumbnail: event-detection timeline, face-lock with an ASD 0.982 score, RAG citation, SQL generation, route graph. Clicking opens an "interactive workspace". The format is strong, but the outputs are simulated UI, not real model output. |
| Metrics | Serif "counters": 1+ Years, 10+ Pipelines, 0→1 Builder. The numbers are vague and can't be verified. |
| Credibility | An IEEE publication with DOI and paper links, 12 certificates with verify links, education with GPA, and a 3-role experience timeline. This is heavy academic/employee proof. |
| Testimonials | None. |
| CTA / contact | A contact form styled as a terminal ("mail_gateway.exe", "Transmit Message"), plus raw email and phone. There is no booking link, pricing or process. |
| Stack | 6 tag groups. |
| Motion | **19 infinite animations on mobile**: floating blobs 22–30s, orbit spin 38–42s, nebula, gradient shift on every card 4s, pulse badges. There are **7 canvases** (particles and simulations), a typewriter headline, a scroll marquee and a physics bubble "playground". **No reduced-motion rule was found.** 11 elements were still at opacity 0 after scrolling, and the flagship tool cards were blank while their reveal ran (`ss-d-02.png`). The typewriter briefly left "A  building in India" with a gap (`ss-d-01-hero.png`). |
| Weak spots | Terminal cosplay (`sahil.get_contact_info()`, "Active Pipelines: Running [100% OK]"). Decorative motion everywhere. The phone and email are exposed. It reads as an early-career job-seeker rather than a vendor. |

**Where the owner already beats Sahil:**
- Proof above the fold: Top Rated Plus, 100% JSS, rate, location.
- Real client testimonials.
- Pricing.
- A focused CTA.
- A brand-consistent, restrained palette.
- Reduced-motion handling.
- Real inference images rather than simulated widgets.

**What the owner lacks compared with Sahil:**
- An interactive or animated thumbnail that *demonstrates* the capability.
- Linkable external credentials (verify links, DOI-style citations, GitHub repos per case study).
- An experience timeline that names MAGNA International with dates.

---

## 3. Additional benchmarks (patterns worth borrowing)

- **it-jim.com/portfolio** (`ext-itjim-d-01.png`). CV and AI consultancy. Each case is laid out as client name + short title + one-line summary + tags + a **"Key results" box of 3–4 quantified bullets** (for example, a percentage of automation). The results sit next to the image, before the "Read more" link. https://www.it-jim.com/portfolio/
- **parlance-labs.com** (`ext-parlance-d-01.png`). Hamel Husain's AI consultancy. The hero is minimal: brand plus a 6-word promise ("AI that works in production"). Then come 3 numbered outcome cards, a single scale proof (thousands of engineers trained), a testimonials link and a "Work With Us" CTA. There is almost no motion. This shows that trust comes from outcomes and restraint, not effects. https://parlance-labs.com
- **jxnl.co consulting writing** (Jason Liu). He argues for selling the business outcome and timeline rather than the tech (e.g., a cost reduction in 8 weeks), and for tiered offers instead of one headline price. https://jxnl.co/writing/2024/10/31/consulting-start/ and https://jxnl.co/writing/2024/09/17/pricing-strategy-for-consultants/

---

## 4. Owner site snapshot (evidence)

`vp-d-01-hero.png` (with cookie banner), `vp-d-01b-hero-nobanner.png`, `vp-d-02.png` (case studies), `vp-d-03.png` (services), `vp-d-04.png` (testimonials), `vp-d-05.png` (about), `vp-d-06.png` (process/CTA), `vp-d-cs-01.png` (case study page), `vp-d-contact.png`, `vp-m-01b-hero-nobanner.png`, `vp-m-02.png`.

Runtime facts:
- 13 infinite CSS animations run on the home page at both desktop and mobile sizes: 8× `bg-drift`, 4× `ghost-trail`, 1× `photo-scan`.
- 0 canvases and 0 videos.
- The Hero rAF parallax loop runs continuously, even when the mouse is idle (`Hero.jsx:43-54`).
- `photo-scan` is **not** gated by `reduceMotion` (`Hero.jsx:370`).
- `SectionAnimator` wraps 4 home sections with `opacity:0, y:50`, a 0.8s transition and `amount 0.1`. This left large blank areas mid-scroll (`vp-d-03.png` lower half, `vp-d-06.png` middle).
- The testimonials carousel auto-advances every 6s and pauses on hover/focus or under reduced motion. That part is good.

---

## 5. Gaps (BM-xx)

### BM-01 · P0 · The hero portrait card nearly copies Shahzeb's signature element
- **Evidence:** `vp-d-01b-hero-nobanner.png` compared with `sz-d-01-hero.png`. Both show a portrait inside corner brackets with the badges `engineer · 0.99`, `ID 001 · TRACKED` and `● REC`, plus a scan line. The labels, placement and animation are identical.
- **Risk:** A prospect who has seen both sites will read the owner's as a clone, which directly undermines credibility. Shahzeb's site targets the same Upwork CV niche.
- **Fix:** Keep the bounding-box motif but make it yours. Take the labels from your own work: the MAGNA or OCR domain, `invoice_field`, a real keypoint skeleton from the pose case study, or your actual model/latency figures. Drop "REC" and "ID 001 · TRACKED".

### BM-02 · P0 · The hero leads with an ID card, not an outcome
- **Evidence:**
  - `vp-d-01b-hero-nobanner.png`: the largest text is the name and role inside a "PROFILE INVOICE" parse card.
  - The actual value proposition (detectors, document extractors, n8n workflows) is 14px body text.
  - Shahzeb (`sz-d-01-hero.png`) and Parlance (`ext-parlance-d-01.png`) both lead with a buyer outcome.
- **Fix:** Put a buyer-outcome H1 above or beside the card, e.g., "Camera feeds and messy documents → reliable production data". Keep the parse card as the *visual proof* of the motif, not as the headline.

### BM-03 · P0 · Mobile hero is broken
- **Evidence:** `vp-m-01b-hero-nobanner.png`. The portrait shrinks to about 90px. The `engineer · 0.99` and `ID 001 · TRACKED` badges wrap or truncate and overlap each other. The portrait block collides with the primary CTA. The parse card fills the first screen, so the CTA sits at the very bottom edge.
- **Fix:** On screens under 768px, hide the portrait badges or move the portrait below the CTAs. Reduce the parse card to name + role + the 3 proof chips.

### BM-04 · P1 · Internal spec/debug labels are visible to buyers
- **Evidence:** innerText includes:
  - "NAV · SITE"
  - "CTA · DETECTED"
  - "ROUTE · /CONTACT/ · NO MAILTO"
  - "SECONDARY PATH · FORM REMAINS PRIMARY"
  - "PHOTO · FIELD"
  - "BBOX · ACTIVE"
  - "CLIENT RESPONSE · DETECTED"

  See `vp-d-06.png` and `vp-d-contact.png`.
- **Risk:**
  - These read as leaked implementation notes; "NO MAILTO" means nothing to a client.
  - Overusing "· DETECTED" as a section-label suffix drifts into the terminal cosplay the owner has ruled out.
- **Fix:**
  - Remove the route and constraint labels entirely.
  - Keep at most one short eyebrow per section.
  - Reserve "detected / 0.9x" for places where there is a real detection.

### BM-05 · P0 · The About photo is an empty placeholder
- **Evidence:** `vp-d-05.png` shows a grey box labelled "PHOTO · FIELD" where the About portrait should be.
- **Risk:** It looks unfinished, and trust sections are exactly where an empty slot hurts most.
- **Fix:** Use a real photo, a work-context image (a setup with a Jetson or camera), or remove the column.

### BM-06 · P1 · The service offers are all collapsed and show nothing by default
- **Evidence:** `vp-d-03.png` shows 3 closed accordions with no benefit line, duration or price visible. More than half the screen is empty.
- **Comparison:** Shahzeb opens row 1 and gives every row a one-line benefit (`sz-d-02.png`).
- **Fix:** Show on each closed card a benefit line, typical duration, "from €X" and an ideal-client line. Open the first card by default.

### BM-07 · P1 · Case-study cards lack a quantified "Key results" line
- **Evidence:** `vp-d-02.png` cards show only a category, title, summary and date. The case-study page `vp-d-cs-01.png` has no at-a-glance box (client type, stack, duration, result).
- **Comparison:** it-jim puts 3–4 result bullets next to every image (`ext-itjim-d-01.png`).
- **Fix:** Add one *verifiable* result per card, even if qualitative, e.g., "Exported N invoices to spreadsheet, linked to source files", or latency/throughput where it was measured. On the case-study page, add a facts box above the image: Client type · Problem · Stack · Duration · Outcome.
- The page's honest "not claimed" wording is a strength; keep it.

### BM-08 · P1 · The strongest credential (MAGNA International) is buried
- **Evidence:** `vp-d-05.png`. It appears as one bullet under "Key differentiators", below the fold.
- **Comparison:** Sahil surfaces employers and publications with verify links (`ss-d-06.png`).
- **Fix:**
  - Add a "Trusted by / worked with" row near the hero with MAGNA (text wordmark if logo rights are unclear).
  - Link the Upwork, Freelancer and FreelancerMap profiles so buyers can check the JSS and Top Rated Plus claims.

### BM-09 · P1 · Testimonials are one-at-a-time and some are anonymous
- **Evidence:** `vp-d-04.png`. It is a single-slide carousel (1 of 10 visible, auto-advancing every 6s). Slide 1 is attributed to "Upwork Client".
- **Comparison:** Shahzeb shows 4 at once (`sz-d-05.png`).
- **Fix:**
  - Show 3–4 at a glance (grid, or a carousel with a static "featured 3" row).
  - Attribute each quote with name initial, role/industry, project and platform.
  - Add a "View on Upwork" verify link.
  - Consider stopping auto-rotation; buyers read at their own pace.

### BM-10 · P2 · The process is too thin
- **Evidence:** `vp-d-06.png`. "My Process" has only 2 steps (Strategy & Discovery, Execution & Optimization) with a lot of white space around them.
- **Comparison:** Shahzeb's "define success first" framing and spec card (`sz-d-03.png`) is the single most persuasive CV-specific trust block across both inspiration sites.
- **Fix:** Use 4–5 steps (Scope & success metric → Data audit → Build & evaluate on your data → Deploy/optimize on your hardware → Handover + 30-day support). Add a small visual "acceptance criteria" card in the owner's own style, not a terminal: target metric, FPS/latency, hardware, known failure cases.

### BM-11 · P2 · No industries/use-case index and no stack display
- **Evidence:** Neither appears on the home page (`vp-d-*`).
- **Comparison:** Shahzeb lists 8 industries and 3 stack groups (`sz-d-05.png`).
- **Fix:**
  - Add a compact "Use cases I ship" row: document AI, industrial inspection, pose/keypoints, edge inference, workflow automation. Link each to the matching case study.
  - Add a 3-group stack row: Train · Optimize (ONNX/TensorRT/CUDA) · Deploy.

### BM-12 · P2 · No FAQ or objection handling
- **Evidence:** No FAQ on any of the 4 benchmark sites, which makes it an easy differentiator.
- **Fix:** Add a 5–6 question FAQ (NDA/data privacy, work on my own hardware/on-prem, who owns the IP/model, fixed price vs hourly, what if accuracy isn't met, response time). Add FAQPage JSON-LD.

### BM-13 · P2 · Mid-page blank areas while sections reveal
- **Evidence:** `vp-d-03.png` (lower half empty) and `vp-d-06.png`. `SectionAnimator` starts sections at opacity 0 with y:50, and 0.8s is slow.
- **Comparison:** Sahil has the same problem (`ss-d-02.png`); Shahzeb does not hide content.
- **Fix:** See AN-09. Reveal with a 12–16px offset, start from opacity 0.001→1 or skip the opacity change, use 0.35–0.45s, and trigger at `amount: 0.2` with a `margin: "0px 0px -10% 0px"` pre-trigger.

### BM-14 · P2 · Continuous background work with no clear value
- **Evidence:**
  - 13 infinite CSS animations run on mobile.
  - The rAF parallax tick runs at 60fps even without mouse input (`Hero.jsx:43-54`).
  - `photo-scan` ignores reduced motion (`Hero.jsx:370`).
- **Fix:** Pause offscreen, stop rAF when the values have converged, and gate `photo-scan`. See the performance guardrails in §6.

### BM-15 · P3 · Header and nav microcopy
- **Evidence:** "NAV · SITE" next to the logo (`vp-d-01-hero.png`).
- **Fix:** Put "Computer Vision & AI Engineer" (or nothing) next to the VP mark, as Shahzeb does with a short "/ computer vision" label.

### BM-16 · P3 · The cookie banner covers the hero on first paint
- **Evidence:** `vp-d-01-hero.png` shows a full-width banner under the header, pushing the hero down and hiding the "INFERENCE ONLINE" pill.
- **Fix:** Use a compact bottom-corner card at 1440 and a bottom sheet at 390, so the first view shows the value proposition and CTA.

---

## 6. Animation playbook for a CV engineer brand (AN-xx)

Global rules for every item below:
- **Performance:** animate `transform`/`opacity` only (plus SVG `stroke-dashoffset` / `pathLength`). Use `viewport={{ once: true }}`. Pause anything looping with `useInView` or IntersectionObserver plus `document.visibilitychange`. Keep ≤ 2 concurrent loops per viewport and none on mobile unless the user asks.
- **Reduced motion:** wrap the app in `<MotionConfig reducedMotion="user">` (framer-motion 10 supports it). This makes transform animations instant while keeping opacity. Components still read `useReducedMotion()` for loops.
- **Brand:** all overlays use #8B5CF6 strokes on #0C0D0D, with no cyan.

### AN-01 · P0 · Hero bounding-box "lock-on", once on load
- **Purpose:** trust and clarity. It shows in about 1 second what the owner does (localize → label → confirm) using the owner's own artifact: the parse card fields or a real detection image.
- **Trigger:** first mount of the hero only. Persist `sessionStorage.heroPlayed` so it doesn't replay on back-navigation.
- **Choreography:**
  1. Corner brackets scale from 1.08→1 and fade in (opacity 0→1) over 280ms.
  2. The label chip (`field · 0.99`) slides up 6px and fades in, starting 120ms later.
  3. The confidence value counts from 0.00 to its final value over 400ms.

  Total ≤ 900ms. Ease `[0.2, 0.8, 0.2, 1]`.
- **Implementation:** `motion.div` with `variants` `{hidden:{opacity:0, scale:1.08}, show:{opacity:1, scale:1, transition:{duration:0.28}}}`. Stagger the parent with `staggerChildren: 0.06` and cap it at 5 fields; anything beyond that appears with no delay. The count uses `animate(0, 0.99, {duration:0.4, onUpdate:v=>ref.current.textContent=v.toFixed(2)})` from `framer-motion`.
- **Guardrails:**
  - **Text is fully visible and readable at t=0**; only brackets and chips animate. This protects LCP and SEO.
  - No layout shift: brackets are absolutely positioned.
- **Reduced motion:** render the final state and skip the count.

### AN-02 · P0 · Case-study thumbnail: detection boxes draw on hover/focus
- **Purpose:** clarity. It proves the output is the owner's real model output and invites the click.
- **Trigger:**
  - `whileHover` / `whileFocus` on the card, which works with keyboard.
  - On touch, draw once when 50% of the card is in view (`whileInView`, once).
- **Choreography:** an SVG `<rect>` outline draws with `pathLength` 0→1 over 450ms `easeOut`. The class/score chip fades in at 300ms. For the pose card, keypoint dots scale 0→1 with a 30ms stagger, capped at 17 points.
- **Implementation:** store the box coordinates in case-study data (a normalized `[x,y,w,h]` from the real prediction). Use `<motion.rect initial={{pathLength:0}} animate={hover?{pathLength:1}:{pathLength:0}} />` inside a `viewBox="0 0 1 1"` overlay with `preserveAspectRatio="none"` and `vector-effect="non-scaling-stroke"`.
- **Guardrails:** the overlay has `pointer-events:none`, there is no filter blur, and the image is untouched (no zoom on hover beyond scale 1.02).
- **Reduced motion:** boxes are shown statically at 60% opacity.

### AN-03 · P1 · Count-up of verified metrics only
- **Purpose:** trust. Numbers become legible and memorable. Only use figures a buyer can verify (100% JSS, Top Rated Plus, 10 testimonials, N case studies, and measured latency or FPS from a case study with its source linked).
- **Trigger:** `useInView(ref, {once:true, amount:0.6})`.
- **Timing:** 700–900ms, `easeOut`. Integers only, no decimals flicker. Show a unit/suffix immediately.
- **Implementation:** `const mv = useMotionValue(0); const rounded = useTransform(mv, v => Math.round(v)); useEffect(()=>{ if(inView) animate(mv, target, {duration:0.8}) },[inView])` then render `<motion.span>{rounded}</motion.span>`.
- **Guardrails:**
  - SSR and pre-render must output the **final number** in HTML, with the animation starting only after hydration, so crawlers and no-JS readers see the truth.
  - Use `font-variant-numeric: tabular-nums` so the width doesn't jitter.
- **Reduced motion:** show the final value.

### AN-04 · P1 · Before/after slider on the case-study page (raw frame vs model output)
- **Purpose:** clarity and proof. This is the single most persuasive CV-specific interaction, and none of the benchmarks have it.
- **Trigger:** user drag, keyboard arrow keys, or clicking a "Raw / Output" toggle. No autoplay. An optional one-time nudge moves the handle 50%→60%→50% over 900ms when it enters view, desktop only.
- **Implementation:**
  - A `motion.div` handle with `drag="x"`, `dragConstraints={containerRef}` and `dragElastic={0}`, and a `useMotionValue(x)`.
  - The top image uses `clipPath: useTransform(x, v => \`inset(0 ${100-v}% 0 0)\`)`, or a `scaleX` mask on a wrapper to stay compositor-only.
  - It is an `<input type="range">` underneath for accessibility (`aria-label="Compare raw image and detection output"`).
- **Guardrails:** both images use the same aspect ratio with explicit width/height (no CLS), and the output image loads lazily.
- **Reduced motion:** no nudge; the slider still works.

### AN-05 · P1 · Short real-inference video loop (muted), played only in view
- **Purpose:** trust. Real frames with boxes and track IDs moving across time beat any simulation (compare Sahil's simulated widgets, `ss-d-05.png`).
- **Trigger:** IntersectionObserver at ≥50% in view → `video.play()`. Pause when out of view or when the tab is hidden.
- **Specs:**
  - 4–6s loop, 720p, H.264 MP4 plus WebM, ≤ 1.5 MB.
  - `muted playsinline loop preload="metadata" poster="first-frame.webp"`.
  - Label it "Real output · model · hardware · FPS".
- **Implementation:** there's no framer involvement; use a small `useInViewPlay(ref)` hook. Fade in the caption chip with `whileInView`.
- **Guardrails:**
  - On mobile or with `navigator.connection.saveData`, show the poster plus a play button instead of autoplay.
  - Never place it in the hero on mobile.
- **Reduced motion:** poster plus a play button, with no autoplay.

### AN-06 · P1 · Pipeline stepper that fills as the process section scrolls in
- **Purpose:** clarity. It visualizes the Scope → Data → Train/Eval → Deploy → Support process (BM-10).
- **Trigger:** `whileInView` once. Each connector line scales `scaleX 0→1` with `transformOrigin:left`, 220ms per step, 80ms stagger, 5 steps, ≤ 1.2s total. The step labels are visible from the start.
- **Implementation:** a `motion.span` for each connector, and variants on the parent with `staggerChildren:0.08`.
- **Guardrails:** don't make it scroll-linked; this avoids scroll jank and scroll-jacking.
- **Reduced motion:** lines are fully drawn.

### AN-07 · P2 · Service card expand with height animation plus a scope checklist tick-in
- **Purpose:** clarity. It confirms what is in and out of scope.
- **Trigger:** click or Enter on the accordion header.
- **Timing:** 250–300ms `easeOut` using `AnimatePresence` + `motion.div layout` or `initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}`. The check icons draw with `pathLength` and a 40ms stagger, capped at 6 icons.
- **Guardrails:**
  - Only one accordion open at a time.
  - Use `layout` only on the card, not on the page.
  - `aria-expanded` and `aria-controls` must be present.
- **Reduced motion:** the panel opens instantly.

### AN-08 · P2 · CTA micro-feedback plus form "analysis" confirmation
- **Purpose:** conversion. It reassures the buyer that the brief was received and what happens next.
- **Trigger:** button hover/press, and form submit success.
- **Behavior:**
  - Hover shifts the arrow `x: 0→3px` over 150ms.
  - Press sets `whileTap={{scale:0.98}}`.
  - On success, a bracket frame locks onto the confirmation card, reusing the AN-01 variant in 400ms. The card reads "Brief received · reply within 24h", followed by the 3 next steps.
- **Guardrails:** no confetti and no infinite glow pulse on the CTA.
- **Reduced motion:** the confirmation appears statically.

### AN-09 · P1 · Replace the SectionAnimator reveal with a fast, visible-first reveal
- **Purpose:** it removes the blank screens (BM-13) while keeping a sense of polish.
- **Change:**
  - `initial={{opacity:0.001, y:12}}`, or skip the opacity change for text-heavy sections.
  - `whileInView={{opacity:1,y:0}}`.
  - `transition={{duration:0.4, ease:[0.2,0.8,0.2,1]}}`.
  - `viewport={{once:true, amount:0.15, margin:'0px 0px -10% 0px'}}`.
  - Don't wrap sections that are above the fold at common heights.
- **Guardrails:** no nested staggered reveals inside revealed sections, and a maximum of one reveal per section.
- **Reduced motion:** already handled; keep it.

### AN-10 · P2 · Tame the existing hero loops
- **Purpose:** performance and focus. Keep the ambient feel, but only while it is useful.
- **Changes:**
  - Keep a single slow `bg-drift` layer (≥ 15s) and remove the rest, or play them once.
  - Run `ghost-trail` and `photo-scan` a fixed number of times, e.g., `animation-iteration-count: 2`, then stop.
  - Pause when the hero leaves view: toggle an `is-paused` class on IntersectionObserver that sets `animation-play-state: paused`.
  - Stop rAF when `|target-cur| < 0.05` and restart it on `mousemove`.
  - Skip parallax entirely when `(pointer: coarse)`.
  - Gate `photo-scan` with `reduceMotion` (`Hero.jsx:370`).

**Priority order for implementation:** AN-01 → AN-02 → AN-09 → AN-10 → AN-03 → AN-04 → AN-05 → AN-06 → AN-07 → AN-08.

---

## 7. Animation anti-patterns to avoid (seen in the benchmarks or at risk on the owner site)

1. **Content hidden until in view.** Opacity-0 sections leave blank areas and make crawlers, screenshots and print fail. Seen in: Sahil (`ss-d-02.png`) and owner (`vp-d-03.png`).
2. **Long staggered reveals.** More than 5 children or more than 1.2s total makes the reader wait. Cap the stagger at 60–80ms and 5 items.
3. **Infinite loops on mobile.** Shahzeb runs 7 and Sahil 19, all continuing offscreen with no reduced-motion rule. They drain battery and cause jank.
4. **Blinking "live/REC" dots and blinking terminal cursors.** They read as cosplay and pull the eye away from the CTA.
5. **Typewriter headlines.** The role is missing when the page first renders (Sahil: "A  building in India"), which is bad for SEO and screen readers.
6. **Scroll-jacking or scroll-linked pinning,** and dot scroll-spy rails that duplicate the nav (Sahil).
7. **Custom cursor on touch or coarse pointers.** The owner correctly gates `CustomCursor` on `(pointer: fine)` and reduced motion; keep that.
8. **Simulated "AI output" widgets presented as real work.** If it's a mock-up, label it; prefer real inference (AN-04, AN-05).
9. **Decorative canvases behind body text.** Shahzeb's mobile hero boxes overlap the copy (`sz-m-01-hero.png`). Keep overlays out of the text column or below 0.15 opacity.
10. **Auto-rotating testimonial carousels.** Buyers can't read at their own pace; prefer a static grid (BM-09).
11. **Physics playgrounds and marquees** that add weight without proof (Sahil).
12. **Animating layout properties** (`top`, `height` without `layout`, `box-shadow` glows in loops). Use transform and opacity only.

---

## 8. Summary scorecard

| Dimension | Shahzeb | Sahil | Owner |
|---|---|---|---|
| Outcome-led hero | ✅ strong | ❌ résumé | ❌ ID card (BM-02) |
| Proof above fold | ✅ 3 platform stats | ❌ | ✅ strongest (TR+, 100% JSS, €, location) |
| Case studies with real output | ❌ none | ⚠️ simulated | ✅ 10, real images (add results, BM-07) |
| Testimonials | ⚠️ 4, no context | ❌ none | ✅ 10 with project context (layout, BM-09) |
| Pricing | ❌ | ❌ | ✅ from €45/h |
| Process | ✅ spec-first | ❌ | ⚠️ 2 steps (BM-10) |
| Contact / conversion | ⚠️ inline form + Upwork | ⚠️ terminal form + phone | ✅ form + budget + next steps |
| Originality | ✅ | ✅ | ❌ hero clone risk (BM-01) |
| Motion restraint and reduced motion | ❌ no RM, 7 loops | ❌ no RM, 19 loops, 7 canvases | ⚠️ RM mostly handled, 13 loops (BM-14) |
| Mobile hero | ⚠️ overlap | ✅ | ❌ broken (BM-03) |
