# Website audit for vivekapatel.com, 26 Sep 2026

This file merges two reviews of the same commit. One is the Kiro pass. The other is the buyer-journey pass that used to live in `2026-09-26-portfolio-business-ux-audit.md`. Both read `develop` at `fff530610879cf98ef4af8a1c260f04678cbd5a3` (`fff5306`). The live site was an older build. Findings describe `develop` unless a sentence says live.

This audit does not approve new pricing, new delivery promises, extra client material, implementation, or deployment. It predicts no change in earnings. Conversion ideas stay hypotheses until real buyers and inquiry records test them.

The audience is businesses buying computer vision or AI engineering projects. The conversion is a qualified project inquiry, then a bounded paid discovery or pilot. The goal is a site that reads as a hireable computer vision and AI engineer and produces those inquiries.

Kiro evidence is in [`../../kiro-website-audit-2026-09-26-assets/`](../../kiro-website-audit-2026-09-26-assets/). Buyer-journey evidence is in [`assets/2026-09-26/`](assets/2026-09-26/).

## How this audit was done

| Team | What it covered | Tools |
|---|---|---|
| Visual/UI, homepage | Alignment, spacing, type, the bbox motif, header/footer, cookie banner, mobile menu | Playwright CLI 0.1.21 at 1440 / 768 / 390 / 320, DOM measurements |
| Visual/UI, inner pages | Case-study list and articles, service page, contact form, 404, legal pages | Playwright CLI, keyboard walkthroughs, checks on all 12 project slugs |
| Content, trust, conversion | Positioning, copy, proof, offer, pricing, CTAs. All claims were checked against `/Users/viv/Freelance/case_study_to_proposal_hub` | Source and hub reading, rendered page text |
| Performance, SEO, accessibility | Core Web Vitals, bundle, images, prerendering, metadata, structured data, contrast, ARIA, consent | Lighthouse 12 (mobile and desktop), axe-core, curl against the live site |
| Benchmark and motion | shahzeb-ai.com, sahilsingh.space, it-jim.com, parlance-labs.com; animation playbook | Playwright CLI screenshots at 1440 and 390 |

The lead reviewer checked the most serious findings personally:
- **Sticky header:** at `scrollY=1500` the header sits at `top=-1500`.
- **Service pages:** `/services/*` returns 404 on the live site.
- **Internal notes:** the notes in `publication/staged-case-study-publication.js` are published on public pages.
- **Hero portrait badges:** the badges match Shahzeb's.
- **"100% Job Success":** this claim does not appear in any text record in the hub.

The buyer-journey pass also did the following.

- It built with `npm run build` and served the result at `http://127.0.0.1:4173`.
- It opened all 20 public paths, plus a not-found path, at 1440×900 and 390×900. The homepage was also checked at 768×900 and 320×900.
- It ran five existing test suites (Header, Testimonials, CaseStudyGallery, Contact, CookieConsentBanner). 63 tests passed. Those tests use fixtures. They do not prove a real lead arrives.
- It read the hub at `/Users/viv/Freelance/case_study_to_proposal_hub`. Publication records govern what is already on the site. They are not blanket permission to publish new claims.
- It opened both inspiration sites in a browser. Shahzeb's rendered site differed from an older text snapshot, so the comparison uses the live browser version.
- It reviewed the user-supplied hero screenshot. Field crowding is F36, recorded here under K-26. The extra viewport and zoom checks in that finding are acceptance criteria, not tests already run.

**Limits:**

- The Kiro performance pass used `vite preview`, which is uncompressed, has no CDN, and returns 200 for every route. Treat those LCP numbers as relative.
- The buyer-journey browser checks blocked external requests, including analytics and the obsolete remote preload. HTTP routing conclusions come from the generated files and the supplied Apache rules. Vite preview does not enforce those rules.
- GA and Sentry consent gating was checked in the code but not at runtime, because the local build has no IDs.
- The contact form was never submitted. No production deploy, analytics dashboard, or email arrival was verified.
- Browser testing used Chromium, with phone viewport and touch emulation. This is not Safari, a real device, a screen reader, or a formal WCAG certification.
- The crosswalk of finding IDs is in section 12.

---

## 1. Verdict

The foundation is stronger than most freelancer sites:
- 10+ real case studies with real model output
- a clean single-accent dark palette
- good accessibility groundwork (skip link, focus traps, reduced motion)
- a solid gallery and lightbox
- honest scope notes
- TBT 0 ms and CLS 0

What holds it back is not missing animation. The site doesn't yet argue "hire me for computer vision."
- **The hero:** it's an invoice-parsing ID card. The 26 px role line is smaller than every section heading, and the actual offer is 12 px text.
- **The work shown:** featured work, services and SEO metadata lead with OCR, n8n and scraping.
- **The best CV proof:** the MAGNA R&D work (CUDA stitching 37 s → 2.5 s, ONNX on NVIDIA/Hailo/SiMa) is one vague bullet about 3,600 px down the page. The flagship sports-tracking case study has no images.
- **Unfinished look:** 30+ debug labels ("NAV · SITE", "ROUTE · /CONTACT/ · NO MAILTO", "SUBMIT · FIELD"), an empty "PHOTO · FIELD" box and published editorial notes ("Not for proposals", a client's first name) make the beta look unfinished.
- **The portrait card:** it reuses Shahzeb's signature badges almost word for word (`engineer · 0.99`, `ID 001 · TRACKED`, `● REC`). He sells in the same Upwork niche, so buyers comparing the two will notice.
- **Two P0 bugs block the buying path.** The sticky header scrolls away on every page, taking navigation and the CTA with it. Service pages return 404 in production.
- **A third navigation failure, from the buyer-journey pass.** Open the mobile menu at 390 px, then widen the window. The drawer hides and the page stays inert (F02). The Kiro pass did not re-test it.

Fix the broken paths and the unfinished surface before adding motion. Then use motion to show real detection output, not decoration.

### Where the two passes disagree

Both passes read the same commit. Five calls stay open.

**Headline width.** The Kiro pass wants a computer-vision outcome in the H1, with document AI and automation moved to an Also strip. The buyer-journey pass wants the lead to be computer vision and document AI, with automation kept visible as support. Section 11 holds the decision. Neither set of hero sentences in section 7 is approved copy.

**New offers.** The Kiro pass drafts a feasibility sprint, a custom pipeline build, and an optimization engagement. The buyer-journey pass says to keep the current rates and the current 1 to 2 week optimization boundary. A paid feasibility review is a hypothesis. It is not an approved offer, and it is not permission to widen the current offer into a from-scratch product build.

**Service routing severity.** Curl against the live site returned 404 for service URLs, so the Kiro pass marks that P0 (K-55). The buyer-journey pass marks the same gap P1 (F01) because the in-app route works and the failure is static hosting plus metadata. Production 404 is the bar. A Vite preview pass is not enough.

**Mobile LCP.** Lighthouse on the uncompressed preview reported 3.7 s on the homepage. Three throttled local Chromium runs in the buyer-journey pass reported a median of 1,340 ms. The tools and the throttling differ. Neither figure is a field p75.

**Motion.** The Kiro pass specifies animations AN-01 through AN-08. The buyer-journey pass puts motion last, after the broken paths, the offer, and a measurement baseline. Do not build those animations until the earlier gates in section 9 are closed.

### Scorecard

| Angle | Score | Reason |
|---|---|---|
| Positioning | 4/10 | CV is in the H1 but not in the argument. The hero art, featured work, services and meta description lead with OCR, n8n and scraping. |
| Trust & proof | 5/10 | Real case studies, but the MAGNA proof is buried, reputation claims can't be verified, the sports case has no visuals, and internal notes are public. |
| Offer & conversion | 4/10 | Services are collapsed. Pricing leads with an hourly rate. The CV offer excludes new builds. There's one high-commitment CTA and no FAQ. |
| Layout & alignment | 4/10 | Content starts at 7 different left edges, chips collide with labels, and `min-h-[900px]` leaves dead bands. |
| Typography & cleanliness | 3/10 | 56% of text is ≤11 px across 25 font sizes, debug labels are everywhere, and buttons come in 4 styles. |
| Interactions | 5/10 | The header scrolls away and form validation is confusing, but the gallery, lightbox and focus traps are solid. |
| Mobile | 3/10 | The portrait is 86 px with badges covering the face. CTAs have no gap between them, and at 320 the CTA falls below the fold. |
| Case-study pages | 5/10 | Honest and real, but thin (133–181 words), with no facts box, a weak end CTA and 4 of 8 listing cards without images. |
| Performance | 7/10 | TBT 0 and CLS 0, but mobile LCP is 3.7 s on home, with oversized PNGs and an unused preload. |
| SEO | 5/10 | Service pages 404, home and contact serve empty HTML, and the metadata is diluted. |
| Accessibility | 6/10 | Good plumbing, but the primary CTA and grey labels fail contrast and there are two H1s. |
| Privacy/security | 7/10 | Consent code is sound and headers are good. *Live* loads Google Fonts and a Hostinger image before consent. |

---

## 2. Fix first (ranked)

| # | Finding | What | Why | Effort |
|---|---|---|---|---|
| 1 | K-40 | Fix the sticky header (`overflow-x-hidden` to `overflow-x-clip`) | Navigation and the CTA vanish on every page | S |
| 2 | F02 | Close the mobile menu when the viewport crosses the desktop breakpoint, and clear `inert` | A resized phone menu can disable the whole page | S |
| 3 | K-55, F01 | Make service URLs return 200 on Apache-equivalent hosting, with their own metadata. Unknown IDs stay 404 | Home links to pages that 404 in production. Vite preview is not the test | S–M |
| 4 | K-07, F03, F21 | Remove editorial notes and the client first name. Caption borrowed screenshots in the gallery | Credibility, confidentiality, and misattributed evidence | S |
| 5 | K-25, K-09, F04, F05 | Delete debug labels. Fill or remove the About photo box | The site looks like an unfinished beta | S |
| 6 | K-01 | Replace the Shahzeb-style portrait badges with your own signature | Clone risk in the same niche | M |
| 7 | K-02, K-26, F06, F36 | Make specialty, problem, and next step readable. Fix chip collisions. Headline width is still open | 5-second test fails, and annotations collide | M |
| 8 | K-46, F07 | Rebuild the mobile hero (avatar, no badges, a real gap between CTAs) | Most first visits from shared links are on mobile | S |
| 9 | K-43, K-44, F25 | Stop chips covering contact labels. Fix the submit label, validation, and focus | Friction at the point of conversion | S |
| 10 | K-60, F10 | Meet contrast on primary CTAs (`#7C3AED` background) and grey labels | Main button looks disabled | S |
| 11 | F14 | Move focus on route changes. Stop header clicks from eating modifier-clicks | Keyboard and new-tab behavior | S |
| 12 | K-05 | Surface the MAGNA R&D proof in the hero, About, and a case card [VERIFY NDA] | Strongest CV credential on record | S |
| 13 | K-06 | Add visuals to the sports CV case and fallbacks to the empty cards | Flagship CV proof shows nothing | M |
| 14 | K-15, K-16, F16 | Show services as open cards. Do not publish a new offer ladder until section 11 is decided | Offers are invisible. A new ladder is not approved | M |
| 15 | K-10, F19 | Date-stamp and link the reputation claims | Unverifiable numbers undermine the real ones | S |
| 16 | K-33, K-20, F18, F22 | Facts box, end CTA, next-project card, and the selected service or case carried into the form | Buyers scan for role, stack, and outcome, then need a next step | M |
| 17 | K-51, K-52, F29, F31 | Remove the unused preload. Add srcset and WebP for card images | Oversized images and a useless preload | S / M |

Acceptance text for these rows is in section 3.14. Media clearance and new benchmark evidence can take longer than the code change. Priorities follow buyer impact. They are not formal security ratings.

---

## 3. Findings by angle

Format: **ID [severity] title** (source IDs), then Evidence, Why it matters and Fix. Severity scale:
- **P0:** broken, or blocks trust or conversion
- **P1:** high
- **P2:** medium
- **P3:** low

Effort is S, M or L. Screenshots are in the assets folder.

### 3.1 Positioning

**K-01 [P0] The hero portrait card nearly copies Shahzeb's signature element** (BM-01, UI-H10, CT-24) · M
- Evidence: `vp-d-01b-hero-nobanner.png` vs `sz-d-01-hero.png` show the same bracketed portrait, the same `engineer · 0.99`, `ID 001 · TRACKED` and red `● REC` badges, and the same placement and scan line (`Hero.jsx:333-400`). Your "INFERENCE ONLINE" pill also echoes his "SYSTEM LIVE · ACCEPTING PROJECTS".
- Why: you both sell CV work on Upwork, so buyers comparing profiles will see a clone. The surveillance labels ("TRACKED", "REC", alt text "Tracked engineer portrait") also sit oddly on your own face.
- Fix: keep the purple bbox language but make it yours. Use one static box on the portrait, e.g. `Vivek Patel · CV engineer`. Drop REC, TRACKED, the ghost trails and the scanline. Better still, replace the portrait slot with a real detection frame from your own work (pose keypoints, sports tracks) and move the photo to About. Alt text: "Portrait of Vivek Patel".

**K-02 [P0] Positioning is split four ways. CV is the headline but not the argument** (CT-02, BM-02, CT-16, CT-10) · M
- Evidence:
  - The hero art is an invoice-OCR "PROFILE INVOICE" (`Hero.jsx:170-200`).
  - Bio: "detectors, document extractors, and n8n workflows" (`Hero.jsx:280`). Tags: OCR / CV / n8n.
  - Featured order: n8n → invoice OCR → pose (`publication/case-study-featured.js:3-7`).
  - Services lead with extraction (`serviceOffers.js:10`).
  - About: "vision + scraping + AI agents" (`About.jsx:62`). The meta description leads with web scraping (`seoConfig.js:10`, `index.html:22`).
- Why: a CTO buying CV work sees an automation freelancer who also does CV. Every competitor who looks CV-only wins that comparison.
- Fix:
  - Lead with CV, optionally "Computer Vision & Vision-based Document AI" (see §7 hero options). Keep OCR and n8n as a secondary "Also" strip.
  - Reorder featured work: sports tracking → pose → MAGNA stitching (text case) → invoice OCR.
  - Remove scraping from the homepage and SEO.

**K-03 [P2] No use-case index or stack display** (BM-11) · M
- Evidence: the homepage has no industries or use-cases row and no Train / Optimize / Deploy stack row. Shahzeb shows 8 industries and 3 stack groups.
- Fix: add a "Use cases I ship" row (sports and video analytics, pose/fitness, inspection, document AI, edge deployment), each linking to a case study. Add a stack row: PyTorch/YOLO · ONNX/TensorRT/CUDA · Docker/GStreamer · Jetson/Hailo [VERIFY].

**K-04 [P2] The bbox motif is overused on home and contact, and missing everywhere else** (UI-H33, UI-I27) · M
- Evidence: about 40 decorative detection elements sit above the fold (8 drifting boxes, `Hero.jsx:83-146`), plus "· DETECTED" suffixes and field chips. Articles, the service page, 404 and legal pages have no brackets at all.
- Fix: write down one motif rule. Brackets frame only primary objects: cards, the form, the gallery stage, the facts panel. Confidence chips appear only on real model output. Delete the drift boxes and the "· DETECTED" suffixes.

### 3.2 Trust & proof

**K-05 [P0] The strongest verified CV proof is missing or buried** (CT-03, BM-08, CT-23, CT-14) · S
- Evidence: the only MAGNA mention is the bullet "Production inference work for MAGNA International" (`About.jsx:56`), about 3,600 px down the page. Your CV (`HUB/cvs/Vivek_Patel_upwork_CV_ v3.3.2.pdf`) documents:
  - CUDA/OpenCV stitching cut from 37 s to 2.5 s
  - GStreamer pipelines
  - PyTorch→ONNX models benchmarked on NVIDIA, Hailo and SiMa.ai, plus TensorRT
  - MSc thesis on closed-loop object tracking on Zynq with a 6-DOF arm
- Why: this is exactly what CV buyers look for: real-time performance, edge hardware, automotive R&D.
- Fix: put "Ex-MAGNA R&D" in the hero proof bar. Add a text-only employment case card ("Real-time image stitching: 37 s → 2.5 s"). Rewrite the About differentiators with specific facts [VERIFY what the NDA allows; present this as employment, not freelance].

**K-06 [P0] The flagship CV case study has no visuals, and half the listing cards have no image** (UI-I06, UI-I01, CT-10) · M (S for fallback)
- Evidence: `/project/sports-video-analytics-yolo/` has 0 images (`sports-1440-s-00.png`), although its copy promises overlays and clips. On `/case-studies/`, 4 of 8 cards render an empty 300 px `#111` block (`CaseStudyCard.js:65-72`, `cs-1440-s-00.png`).
- Why: it's your only repeat CV engagement (Dec 2025 → Jun 2026), and it shows buyers nothing.
- Fix: add an annotated frame (boxes, track IDs, ball trajectory), a 5–10 s muted loop (the gallery already supports mp4) and a JSON/CSV excerpt. If the footage is under NDA, reproduce it on public-domain footage [VERIFY licence]. For cards without images, add a designed fallback (category glyph plus "Visuals under NDA").

**K-07 [P0] Internal editorial notes and a client's first name are published** (CT-01) · S
- Evidence (all in `publication/staged-case-study-publication.js`):
  - "Not a benchmark. Not for proposals." (~l.541, 2301)
  - "This story replaces the older mixed pose/stitching description." (~l.2096)
  - Six image alt texts: "temporary stand-in for **Andrew** engagement screenshots" (l.1342-1402). The hub rule is `client_name_usage: omit`.
  - The delivered depth project is titled "Lab Demo…".
- Why: this breaches client confidentiality, and screen readers and search engines read alt text.
- Fix: edit the hub source stories and re-stage (don't hand-edit generated output). Leave one neutral scope line per article. Retitle the depth case "Object Detection + Monocular Depth for Scene-Level Distance Estimates". Label borrowed screenshots with a visible caption such as "Representative workflow from similar work".

**K-08 [P1] Pose images may go beyond the recorded reuse permission, and six images are duplicated across case studies** (CT-15, PX-17) · S
- Evidence: `project-sources.yaml` records `reuse_scope: anonymous-case-study-text` for supporting-computer-vision, yet the pose article shows 7 images. Six byte-identical PNGs (2.2 MB) appear under n8n-openai, n8n-python-agents and ai-invoice.
- Fix: record media permission in the hub, or regenerate the overlays on licensed or self-shot images [VERIFY]. Remove reused screenshots, or caption them honestly.

**K-09 [P1] About shows an empty "PHOTO · FIELD" placeholder** (UI-H18, CT-12, BM-05) · S
- Evidence: a 460×345 px grey box with a diamond glyph (`About.jsx:17-35`, `home-1440-s-04.png`). `src/config/links.js:23` already defines `aboutPhoto`.
- Fix: use a warmer, working-context photo (desk, camera rig, Jetson) [VERIFY one exists]. Otherwise remove the column and run the bio at `max-w-[70ch]` with a proof strip.

**K-10 [P1] Reputation claims can't be verified** (CT-06) · S
- Evidence: "100% Job Success" (`Hero.jsx:249`, `Contact.jsx:186`) and "5★ Average Rating" (`Contact.jsx:191`) appear without links or dates. "100% Job Success" isn't in any hub text record. The hub's 24 Aug snapshot has Top Rated Plus, 21 jobs, 15 reviews and $45/hr. The 5★ figure mixes in 3 "Direct" testimonials.
- Fix: check the live Upwork value and date-stamp it ("Top Rated Plus · 100% JSS · Upwork, Sep 2026 ↗"), linked to your profile. Replace the 5★ with "15 Upwork reviews · 21 jobs" [VERIFY counts].

**K-11 [P1] Unsupported claims contradict your honest disclaimers** (CT-05) · S
- Evidence:
  - "I deliver measurable results faster than typical agency timelines" (`About.jsx:49`), while every case study says "No … figure is claimed".
  - "CLIENT RESULTS / Real projects. Real impact." (`Testimonials.jsx:48-51`) shows no results.
- Fix: replace the comparison with concrete working practice, and base outcomes on verified facts (the sports repeat engagement, MAGNA). Rename the testimonials heading "What clients say".

**K-12 [P1] Testimonials rotate one at a time and are mostly anonymous** (UI-H20, CT-13, BM-09) · M
- Evidence:
  - A 6 s autoplay carousel shows 1 of 10 quotes with 5–8 px dots (`Testimonials.jsx:8-22`).
  - 7 of 10 are attributed to "Upwork Client".
  - Some "Direct" labels contradict hub contract IDs (`testimonials.js:84-110`), and one title claims Flowise/Langflow, which the hub rules out.
- Fix: show a static grid of 3 quotes (sports CV, the ML-infrastructure engineer, invoice AI). Attribute each as "Role · industry · Verified Upwork review · date ↗" and add a "Read all on Upwork" link. Correct the source labels [VERIFY].

**K-13 [P2] Commercial promises are inconsistent** (CT-20) · S
- Evidence:
  - The 24 h promise is worded three ways: reply, quote and roadmap (`Contact.jsx:161,179`, `About.jsx:83`).
  - "Bi-weekly" updates is ambiguous (`About.jsx:88`).
  - The "complimentary optimization pass" appears only in About, while Upwork says "30-day post-deployment warranty".
- Fix: use one wording everywhere: "Reply within 1 working day". Say "twice-weekly update + milestone demo" [VERIFY]. Align the support and warranty wording with Upwork.

**K-14 [P3] GitHub is barely linked** (CT-26) · M
- Evidence: GitHub appears only in the footer and a contact icon, despite 41 public repos, including football player tracking and medical segmentation.
- Fix: add an "Open source" strip with 2–3 pinned CV repos, each with a README GIF [VERIFY they're presentable].

### 3.3 Offer & conversion

**K-15 [P1] Services are collapsed by default** (UI-H17, BM-06) · M
- Evidence: `Services.jsx:12` sets `useState(null)`. Three rows show only "SERVICE · OFFER 0N" with grey titles that look disabled (`home-1440-s-02.png`), and price, duration and scope need a click.
- Fix: use three always-open cards (`lg:grid-cols-3`), each showing outcome, typical duration, "from €X" and a "Scope details →" link. The "When you hire me" table is your best-designed block; reuse its style.

**K-16 [P1] The CV service excludes what CV buyers need** (CT-09) · M
- Evidence: the CV offer is only "for existing YOLO, OCR, OpenCV, ONNX, or edge-AI systems". It excludes "Building a computer-vision product from scratch" and "Training a new model from zero" (`serviceOffers.js:33-47`), yet the pose and sports projects were exactly that.
- Fix: build a CV-first ladder:
  1. Vision Feasibility Sprint (1 week, fixed price)
  2. Custom Vision Pipeline Build (2–6 weeks)
  3. Inference Optimization & Edge Deployment (1–3 weeks)

  Put Document AI and n8n in an "Also" line [VERIFY durations and prices].
- The buyer-journey pass does not accept this ladder as a new commitment (F16). Keep the current rates. Do not widen the current 1 to 2 week optimization offer into a from-scratch product build. A separate paid feasibility review can be proposed only after its scope is set.

**K-17 [P1] Pricing leads with the hourly rate, and the currency doesn't match Upwork** (CT-07) · S
- Evidence: "€45/hour" appears twice above the fold (`Hero.jsx:263,413`), plus in the Services, CTA and ServiceDetail sections and in JSON-LD `priceRange`. Upwork shows $45.
- Why: €45/h sets a commodity anchor for a specialist with automotive R&D experience, and buyers of CV projects think in project budgets.
- Fix: remove the rate from the hero, CTA and metadata. Sell a fixed-price feasibility sprint and quote builds after it. Keep one hourly line in an FAQ, and align the currency [VERIFY].

**K-18 [P1] Budget bands don't match the offers** (CT-08, UI-I23) · S
- Evidence: the bands are `< €5k / €5k-€10k / €10k-€25k / €25k+` (`budgetOptions.js:1`). A 1–2 week sprint at €45/h comes to about €1.8–3.6k, so every offer lands in the lowest band. There's no "Not sure yet", and the selected value stays grey (`Contact.jsx:283`).
- Fix: use bands "Feasibility check (< €2k) / €2–5k / €5–15k / €15k+ / Not sure yet" [VERIFY]. Show the selected value in `text-white`.

**K-19 [P1] The CV service page is a bare spec sheet** (UI-I13, UI-I15, UI-I16) · M
- Evidence: `/services/computer-vision-production-optimization` has 0 case-study links and no process, testimonial or metric (`svc-1440-s-01.png`). The right 40% of the page is empty. The H1 is 72 px across 3 lines, and the left edge is x=44 while the header is at 188. The scope lists have no markers.
- Fix: add a "Relevant work" row of 2–3 CV cards, a Profile → Optimize → Validate → Handoff timeline, and a sticky right-rail summary (duration, from-price, CTA). Mark scope lists ✓ / ✕. Put the page on the shared container.

**K-20 [P1] Case studies end with a 14 px text link and no next step** (UI-I09, F18) · S–M
- Evidence: none of the 12 project pages links to another project. The only CTA is `.case-study-cta a`, "Discuss a similar project →", at 14 px (`CaseStudyArticle.css:56`).
- Fix: end each article with a primary button, "Request an estimate for a similar project", plus a "Next case study" card from the same category. Pass the case slug, and the service id from service-page CTAs, to `/contact/` as a readable label the visitor can edit or remove (F18). Do not hide a tracking id in the message.

**K-21 [P2] There's only one high-commitment CTA and no low-friction path** (CT-17) · M
- Evidence: every CTA says "Request (a Project) Estimate" (`Hero.jsx:397`, `CTA.jsx:62`, `Header.jsx:209`). There's no booking link and no sample-data offer.
- Fix: keep the estimate as primary and add "Book a 20-min technical call" (Cal.com) plus "Send sample footage for a free feasibility check" as secondary paths [VERIFY capacity].

**K-22 [P2] No FAQ or risk reversal** (CT-18, BM-12) · S–M
- Evidence: the only risk reversal is "30 days of post-delivery support" (`About.jsx:98`). NDA, IP and model-weights ownership, on-prem/GDPR data handling and "what if accuracy isn't met" are never addressed. None of the four benchmark sites has an FAQ, so adding one is an easy way to stand out.
- Fix: add a 6-question FAQ with `FAQPage` JSON-LD [VERIFY answers].

**K-23 [P2] The process is too thin** (BM-10) · M
- Evidence: "My Process" has 2 steps with a lot of empty space (`home-1440-s-04.png`). Shahzeb's "define success before model" spec card is the strongest trust block across the benchmarks (`sz-d-03.png`).
- Fix: use five steps (Scope & success metric → Data audit → Build & evaluate → Deploy/optimize → Handover + support). Add an "acceptance criteria" card listing metric, FPS/latency, target hardware and known failure cases.

**K-24 [P2] The contact form is tuned for OCR buyers and sends leads to marketplaces** (CT-19, UI-I21, F26, F27, F34) · S–M
- Evidence:
  - The placeholder example is an invoice/CRM task (`Contact.jsx:318`).
  - There's no optional sample-link field.
  - Freelancer.com and FreelancerMap links sit next to the form (`Contact.jsx:34-37,365`).
  - On success, the form shows a fleeting toast and silently resets (`Contact.jsx:161-166`).
  - No analytics events fire for form start or submit.
- Fix: use a CV example ("detect defects on 1080p line-camera video, run on a Jetson"), add an optional sample-link field, and keep only Upwork, LinkedIn, GitHub and email. Show a persistent confirmation state ("Brief received: I'll reply to name@… within 1 working day") and move focus to it. On failure, keep the input and do not show a raw backend message. Say what to send now, what to defer, and link the privacy notice beside the action (F26, F27). Add the events in section 10. Saving a lead is not the same as confirming that email arrived.

### 3.4 Layout & alignment

**K-25 [P1] 30+ debug and "system" labels are visible to buyers** (UI-H19, UI-H07, CT-04, BM-04, BM-15) · S
- Evidence:
  - Header and footer: "NAV · SITE" (`Header.jsx:176,226`), "FOOTER · SITE" (`Footer.jsx:19`).
  - CTA and contact: "ROUTE · /CONTACT/ · NO MAILTO" (`CTA.jsx:74`, 9 px at about 2.2:1 contrast), "SECONDARY PATH · FORM REMAINS PRIMARY" (`Contact.jsx:219`).
  - Testimonials: "BBOX · ACTIVE", "CLIENT RESPONSE · DETECTED".
  - Hero: "INV-VP-0045", "OCR surface", "field parse" (`Hero.jsx`).
- Why: they read as leaked implementation notes and push the design toward the terminal cosplay you've ruled out.
- Fix: delete them all. Allow one plain eyebrow per section ("Selected work", "Services", "About"). Next to the VP mark, show "Vivek Patel" or nothing.

**K-26 [P1] Hero confidence chips collide with their labels (8 of 8)** (UI-H04, UI-H26, F36) · S
- Evidence: the chips use `-top-3` while the labels use `mb-[7px]`, a 5 px collision. On mobile it's 7 px (`Hero.jsx:195-229`). "doc · extract · 0.97" covers "PROFILE INVOICE" and tucks under the "INFERENCE ONLINE" pill (`home-1440-02-accepted.png`).
- Fix: if the card stays, drop the per-field labels or move the chips inside the box (`absolute top-1 right-1.5`), and give the pill and panel `mt-4` between them. Better: cut to one chip, per K-01 and K-02.

**K-27 [P1] Content starts at 7 different left edges** (UI-H01, UI-H02, UI-I26, UI-H27, F08) · S–M
- Evidence: the homepage at 1440 has left edges at x = 68, 98, 130, 160, 180, 188 and 260. The header uses `max-w-[1120px] px-7` and the hero uses `container` + `max-w-[1320px]`. Inner pages start at 130, 370, 44, 170, 296 and 360. Mobile uses 16, 20 and 28.
- Fix: one shell for every section, header and footer (`mx-auto w-full max-w-[1200px] px-5 md:px-8`), with `PageWide` and `PageProse` (720 px) primitives.

**K-28 [P1] Forced section heights leave dead bands, and the CTAs are glued to the panel** (UI-H05, UI-H14, UI-H22, F09) · S
- Evidence:
  - `min-h-[900px]` on Services, About and CTA and `min-h-screen` on Testimonials leave about 215 px and about 480 px blank.
  - The hero has `pb-40`, then about 210 px of empty space.
  - The CTA row has a 0 px gap to the panel (`Hero.jsx:407 mt-0`).
- Fix: remove every forced min-height. Use one rhythm, `py-20 md:py-28`. Give the CTA row `mt-8` and the hero `pb-16 md:pb-24`.

**K-29 [P2] The case-studies grid rhythm is inconsistent, and articles have a duplicate nav row** (UI-I03, UI-I12) · S
- Evidence:
  - The collection uses `gap-8` with 372 px cards; "Other work" uses `gap-[22px]` with 379 px cards and leaves its third column empty.
  - Articles open with a "← View case studies" pill plus "Back to home", which pushes the H1 to y≈305.
- Fix: use the same gap everywhere, use a 2-column grid when there are 2 or fewer items, and replace the nav row with a single breadcrumb, `Case studies / Computer vision`.

### 3.5 Typography & cleanliness

**K-30 [P1] The type scale is inverted, and micro-type dominates** (UI-H03, UI-H09, UI-H15) · M
- Evidence:
  - The hero H1 is 26.4 px, or 17.9 px on mobile (`Hero.jsx:216`), while section H2s reach 57.6 px.
  - The key bio sentence is 12.48 px.
  - 56% of text nodes are ≤11 px (89 nodes at 8–11 px), across 25 distinct font sizes.
  - Section H2s vary between 37.6, 41.6, 44 and 57.6 px.
- Fix: set the H1 to `clamp(2.25rem,4.2vw,3.5rem)` and add an outcome subhead (`text-lg md:text-xl`). Use a 6-step scale (12/14/16/20/28/48–56), a 12 px floor, and 14 px for anything meaningful. Add one `SectionHeading` component.

**K-31 [P2] Four button styles do the same job** (UI-H08, UI-I04, UI-H22) · S
- Evidence: the header uses a square mono 11 px button, the hero uses 10 px radius at 16 px/600, the cookie banner and Load more use `rounded-full`, and the closing CTA is a square outline with a 9 px tab.
- Fix: one Button component with primary, secondary and ghost variants plus a `sm` size. Choose either 8 px radius or square and use it everywhere (square fits the bbox language).

**K-32 [P2] Headlines are weak and full of clichés; casing is inconsistent** (CT-21, CT-25) · S
- Evidence:
  - Weak headlines: "WHO I AM", "WHEN YOU HIRE ME", "No surprises.", and "Production-ready" used 3 or more times.
  - Casing and spelling: "Github", "Linkedin" (`Footer.jsx:31-32`), "Transfering" (`testimonials.js:65`).
- Fix: use headings that carry a claim ("From sample footage to a deployed model"). Replace "production-ready" with specifics ("Dockerized, documented, tested, with a GPU run path"). Fix the casing.

### 3.6 Case-study pages

**K-33 [P1] Articles have no at-a-glance facts or results box, and the template is thin** (UI-I07, CT-11, BM-07, F22) · M
- Evidence:
  - All 12 articles are 133–181 words and follow the same Problem / What I built / Outcome template.
  - None states role, stack, hardware, timeline or data volume, and none includes the matching client quote.
  - The 900 px fold lands inside the gallery.
  - "Reviewable" appears in 5 of 10 titles.
  - it-jim puts 3–4 key results beside every case (`ext-itjim-d-01.png`).
- Fix: add a bracket-framed facts panel under the summary with Client type · Role · Timeline · Stack · Hardware · Output artefacts · Validation. Then add Challenge → Approach (with a trade-off) → Result → Quote → Scope note → CTA. Write outcome-first titles and drop "Reviewable".

**K-34 [P1] Lead media sizes break the article rhythm** (UI-I08) · S / M
- Evidence:
  - `.case-study-cover img` has no max-height (`CaseStudyArticle.css:28`).
  - The healthcare lead renders at 700×971 and is an IDE screenshot of argparse boilerplate (`hc-1440-s-00.png`).
  - The planning image is a 546 px source upscaled to 700.
  - Ultra-wide flows shrink to 170–212 px tall.
- Fix: `max-height:min(70vh,560px); object-fit:contain`. Lead with output (an Excel result, a detection frame), not code. Split ultra-wide flows into 2–3 detail crops.

**K-35 [P1] Card crops make screenshots unreadable, and labels sit over busy images** (UI-I02, UI-H16) · M
- Evidence: a 2448×684 invoice image in a 372×300 `object-cover` box loses about 67% of its width, leaving n8n labels about 4 px tall. The 10 px "DOCUMENT AI · CASE STUDY" label sits over table content.
- Fix: author a dedicated 16:10 `cardImage` crop per case (one meaningful region: a detection frame, an output table). Move the eyebrow below the image.

**K-36 [P2] The article template looks like a different site** (UI-I10) · S
- Evidence: the H1 is weight 500 at 38 px, the back link is a pill, links are `#c8abea`, and there are no brackets or mono meta (`yolo-1440-s-00.png` vs `cs-1440-s-00.png`).
- Fix: bring articles onto the site tokens: bold H1, square buttons, a mono meta line, and a bracketed gallery stage.

**K-37 [P2] Gallery images have no captions and show generic output** (UI-I11) · S
- Evidence: none of the 6 YOLO images has a caption. They're stock yoga photos with default Ultralytics `person 0.96` overlays, and the counter and thumbnails are misaligned.
- Why: buyers can't tell your engineering from a default `yolo predict`.
- Fix: add a one-line caption to each image (what's hard in the frame, what the model did). Include one failure or edge case with a note. Align the counter and strip.

**K-38 [P3] Defensive negative-scope lines in card summaries** (UI-I05) · S
- Evidence: "Not clinical EHR. Not medical records." and "Not live scoring." appear in listing cards.
- Fix: move limitations into the article's scope note. Cards state the outcome and the artefact.

**K-39 [P3] No filter on /case-studies/** (UI-I05-note) · S
- Fix: add an "All · Computer vision · Document AI · Automation" chip row so CV buyers can jump straight to their area.

### 3.7 Interactions

**K-40 [P0] The "sticky" header scrolls away on every page** (UI-H12, UI-H13) · S
- Evidence: verified. At `scrollY=1500` the header's `top` is −1500. `Layout.jsx:63` has `overflow-x-hidden`, which computes `overflow-y:auto`, so `sticky top-0` (`Header.jsx:180`) sticks inside a div that never scrolls. On a 5,863 px page, nav and "Request Estimate" disappear, and the 96 px anchor offset leaves the previous section showing.
- Fix: change it to `overflow-x-clip`, or move overflow control to `body`. Then set `html{scroll-padding-top:80px}`, remove the per-section margins, and re-test for horizontal overflow at 390.

**F02 [P1] The mobile menu can leave the page inert after a resize** · S
- Evidence. Reproduced in the buyer-journey pass. At 390 px, open the menu, then resize to 1024 px. The menu becomes `display:none` while `main` and `header` stay `inert`. Source is `src/components/Header.jsx:46` and the drawer's `md:hidden` class. The same pass found that a generic first-`footer` lookup can hit the testimonial footer on the home page.
- Why. Navigation can disable the whole page, including the inquiry path.
- Fix. Close the drawer when the viewport enters the desktop breakpoint, clear inert, and restore focus to a visible control. Point the footer lookup at the site footer.
- Done when. Links, controls, and landmarks work after 767, then 768, then 767, including keyboard use. Evidence is [`browser-observations.json`](assets/2026-09-26/browser-observations.json).
- The Kiro pass did not re-test this. It still applies to `fff5306` unless later code fixed it.

**K-41 [P2] The cookie banner pushes the page, covers the hero and misses focus** (UI-H11, PX-20, BM-16, F11) · S
- Evidence:
  - The banner is fixed below the header at `top-[72px]` (77 px tall), while the spacer is 72 px, so 5 px of the hero is hidden.
  - The page jumps 60–72 px on Accept or Reject.
  - The banner mounts after 1.5 s with `aria-modal=false` and receives no focus.
- Fix: a bottom-corner card on desktop (`fixed bottom-4 right-6 max-w-[420px]`) and a bottom sheet on mobile, with no spacer.

**K-42 [P2] The custom cursor hides the native pointer** (UI-H30, F13) · S
- Evidence: `body{cursor:none}` plus a lagging 16 px spring dot, with no state for links or inputs (`CustomCursor.jsx:49-70`). It's gated correctly on `(pointer: fine)`.
- Fix: remove it, or keep the native cursor and use the dot only as a trailing accent that grows on `a, button`.

**K-43 [P0] Decorative chips cover the contact form labels** (UI-I18) · S
- Evidence: `.field-meta` chips at `-top-[9px] z-[4]` overlap 5 px of each 13 px label, cutting "FULL NAME *" and the required asterisk (`Contact.jsx:228-296`, `contact-1440-s-00.png`). The labels are 9 px `#6b7280`, about 4.1:1.
- Fix: remove the chips, or make the chip the label itself (`NAME *`, 12 px, `#a78bfa`).

**K-44 [P1] The submit label doesn't match the button, and validation is confusing** (UI-I19, UI-I20, F25) · S
- Evidence:
  - The visible text "SUBMIT · FIELD" differs from `aria-label="Submit Project Estimate Request"`, which fails WCAG 2.5.3.
  - On an empty submit, the toast mentions only email while three inline errors appear (`contact-1440-errors.png`).
  - Borders never turn red, and focus stays on the button.
- Fix: label the button "Send project details →" and drop the aria-label. Use toasts only for network errors, add `aria-invalid` red borders, and focus the first invalid field. Add `autoComplete="name"` and `autoComplete="email"`.

**K-45 [P2] Keyboard focus looks different in three places** (UI-H31) · S
- Evidence: the browser-default 1 px blue ring in the header, nav and footer, a slate ring on hero buttons, and a purple outline on cards.
- Fix: one global `:focus-visible{outline:2px solid #A78BFA;outline-offset:3px}`.

### 3.8 Mobile

**K-46 [P1] The mobile hero is broken** (UI-H24, UI-H25, UI-H26, UI-H28, BM-03, F07) · S
- Evidence:
  - At 390 the portrait is 86×101 px with three 70×40 badges covering about 90% of the face (`home-390-s-00.png`, `vp-m-01b-hero-nobanner.png`).
  - At 768 "TRACKED" and "REC" overlap (`home-768-s-00.png`).
  - The CTAs stack with a 0 px gap (`max-md:gap-0 py-0`), followed by about 200 px of empty space.
  - At 320 the CTA starts at y=768 on a 640 px screen.
- Fix: below `md`, show a 56–64 px round avatar beside the name and hide the badges and field labels. Stack name, H1, 2 proof pills and a 15 px subhead above the CTAs (`gap-3`, full width). Set `pb-12`.

**K-47 [P2] On mobile the contact form is buried** (UI-I22, F24) · S
- Evidence: at 390 the aside renders first, so the first input sits at y=933 and submit at y=1584.
- Fix: put the form `order-first` below `md` and move the proof and "what happens next" content below it.

**K-48 [P3] Mobile details: drawer, gallery arrows, touch targets** (UI-H29, UI-I28, PX-15) · S
- Evidence:
  - The drawer repeats "NAV · SITE" and floats its links in empty space (`menu-390-open.png`).
  - Gallery arrows cover about 25% of a 346 px stage.
  - The footer legal links are 15 px tall and "Save Preferences" is 36 px.
- Fix: top-align the drawer with name, availability and contact. Move the arrows under the stage. Make touch targets at least 24 px (44 px preferred).

### 3.9 Motion (current state)

**K-49 [P2] Scroll reveal hides whole sections until they're in view** (UI-H32, PX-19, BM-13) · S
- Evidence: `SectionAnimator.jsx:8-12` starts four sections at `opacity:0, y:50` for 0.8 s. Full-page captures and print come out blank (`home-1440-fullpage-noscroll.png`), and anchor jumps land on invisible content.
- Fix: keep content visible by default and hide it only under a JS class. Use `y:12–16` and 0.35–0.4 s. Never wrap above-the-fold sections. Add `@media print{*{opacity:1!important;transform:none!important}}`.

**K-50 [P2] Hero loops run forever, even off-screen** (PX-08, BM-14, AN-10, F30) · S–M
- Evidence:
  - The parallax rAF loop runs even with no pointer (122 callbacks in 2 s while scrolled to the footer, `Hero.jsx:17-62`).
  - 13 infinite CSS animations run, and `photo-scan` animates `top` without a reduced-motion gate (`Hero.jsx:370,462`).
  - At 6× CPU: 489 ms of main thread and 296 layouts per 5 s idle, vs 32 ms with reduced motion.
- Fix: start rAF on `mousemove` and stop it once values converge. Skip it on `(pointer: coarse)`. Pause with IntersectionObserver when off-screen. Move the scan to `translateY`. Gate the scan with `reduceMotion`.

### 3.10 Performance

Lighthouse (mobile unless stated; localhost, uncompressed):

| Page | Perf / A11y / BP / SEO | LCP | TBT / CLS | Transfer |
|---|---|---|---|---|
| `/` | 89 / 93 / 100 / 100 | **3.7 s** (88% render delay) | 0 / 0 | 966 KiB |
| `/` desktop | 100 / 96 / 100 / 100 | 0.7 s | 0 / 0 | 1,003 KiB |
| `/case-studies/` | 93 / 91 / 100 / 100 | **3.1 s** (LCP image lazy-loaded) | 0 / 0 | 846 KiB |
| `/project/yolo-…/` | 96 / 96 / 100 / 100 | 2.7 s | 0 / 0 | 363 KiB |
| `/services/cv-…` | 97 / 92 / 100 / 100* | 2.3 s | 0 / 0 | 226 KiB |
| `/contact/` | 97 / 93 / 100 / 100 | 2.3 s | 0 / 0 | 236 KiB |

\* This is 100 only because the local preview returns 200. In production the page returns 404 (K-55).

The buyer-journey pass measured a different local baseline. Do not average it with the Lighthouse row above.

| Measurement | Result | How to read it |
|---|---|---|
| Build | Passed | 18 static routes including 404. Missing service routes remain a defect |
| Main JavaScript | 490.33 kB raw, 150.78 kB gzip | Payload size, not field speed |
| Main CSS | 61.65 kB raw, 12.16 kB gzip | Fresh build output |
| Contact chunk | 85.30 kB raw, 24.45 kB gzip | Already split from the main entry |
| Local mobile LCP | Median 1,340 ms, range 1,332–1,348 ms | Three runs, 4× CPU, 150 ms latency, 200,000 bytes/sec. Not production p75 |
| Local observed CLS | 0.001198 in each run | Observation window only |
| Resource transfer | 888,276 bytes per run | Resource Timing, excluding the HTML document. External requests were blocked |
| Offscreen hero work | 1,920 calls to `setProperty('--px'` and `'--py')` in one second | Repeated execution, not 1,920 paints |

The first offscreen check watched DOM mutations and saw zero, because identical style values need not create mutations. A second probe counted style writes. No Lighthouse score is claimed for this table. Field targets remain p75 LCP at or under 2.5 s, INP at or under 200 ms, and CLS at or under 0.1, by device class.

axe violations: home 2 rules / 24 nodes (color-contrast, landmark), `/case-studies/` 2 / 10, `/contact/` 2 / 2, service page 1 / 1, YOLO project page 0.

**K-51 [P1] An unused 100 KB third-party image is preloaded** (PX-05, F29) · S
- Evidence: `index.html:23-25` preloads a Hostinger CDN JPG that only the unimported `AnimatedHeroBackground.jsx` and `AnimatedCtaBackground.jsx` use. It triggers a console warning and competes with the JS bundle. On *live* it's also fetched before consent.
- Fix: delete the preload and the two dead components, and remove `backgrounds` from `links.js`.

**K-52 [P1] Oversized case-study images with no srcset or modern formats** (PX-06, PX-07, F31) · M
- Evidence:
  - 2984 px PNGs of up to 510 KB go into 332 px slots.
  - The portrait is 1008×1367 but displayed at 86 px on mobile.
  - `mylogo.png` is 50 KB.
  - Lighthouse estimates savings of 649 KiB on home and 501 KiB on `/case-studies/`.
  - The first card is `loading="lazy"` but is the LCP element.
  - The hero image has no `width`/`height`/`fetchpriority`.
- Fix: have the publication plugin emit 480/800/1200 px WebP (the 320 px thumbs already exist), then add `srcset` and `sizes="(min-width:1024px) 360px, 90vw"`. Load the first 2–3 cards eagerly with `fetchpriority="high"`. Give the portrait dimensions and serve it at about 600 px. Use an SVG logo.

**K-53 [P2] The entry chunk is 150 KB gzip and loads every page eagerly** (PX-09, F35) · M
- Evidence: `App.jsx:4-7` imports Home, Project and CaseStudies eagerly, and framer-motion is used only for simple fades. Unused JS is 48–66 KiB per page. Build-only packages (gray-matter, marked, @babel/traverse) are listed as runtime `dependencies`.
- Fix: `lazy()` Project and CaseStudies. Use `LazyMotion` + `m` + `domAnimation` (about −25 KB gzip). Add a vendor chunk. Move build-only packages to `devDependencies`.

**K-54 [P3] Unhashed brand files are cached as immutable for a year** (PX-18, F33) · S
- Evidence: `public/.htaccess:48-51` covers `/assets/logos/mylogo.png` and `/assets/images/vivek-black-and-white.webp`.
- Fix: import both through Vite so they get content hashes, or use `max-age=86400`.

### 3.11 SEO

**K-55 [P0] Service pages return 404 in production** (PX-01, PX-02, UI-I17, UI-I24, F01) · S–M
- Evidence:
  - Verified with curl: `/services/computer-vision-production-optimization` returns 404, while `/` returns 200.
  - `.htaccess` has no services rewrite, and there's no `routeSeo` entry, prerendered HTML or sitemap entry for the service pages.
  - `ServiceDetail.jsx` renders no `<Seo>`, so its canonical is `/`. An unknown service ID is a soft 404 with status 200 and no `noindex`.
  - The homepage Services section links to these pages.
- Fix: generate `/services/${id}` from `serviceOffers` into `routeSeo`, the prerender step, the sitemap and the `.htaccess` rewrite. Add `<Seo>` with a service title and path. Render `<NotFound/>` with `noindex` for unknown IDs. Add a build assertion that fails on any unrouted link.

**K-56 [P1] Home and contact ship empty HTML, and prerendered pages are thrown away on boot** (PX-03, PX-04, F32) · M–L
- Evidence: `dist/index.html` and `dist/contact/index.html` contain only `<div id="root"></div>`, with no H1 and no links. `main.jsx:9` uses `createRoot`, not `hydrateRoot`, and the prerendered articles lack the header and footer. Render delay is 83–88% of LCP.
- Why: non-JS crawlers, AI search bots and link-preview scrapers see nothing on your two most important pages.
- Fix: prerender home (H1, hero, featured cards, services, CTA, nav) and contact with the real `<Layout>`. Then switch prerendered routes to `hydrateRoot`.

**K-57 [P2] Metadata dilutes the CV positioning, and titles get truncated** (CT-22, PX-13) · S
- Evidence:
  - The home description leads with scraping and "€45/hour" (`seoConfig.js:10`), and JSON-LD `knowsAbout` includes "Web Scraping".
  - The home title lacks "Freelance", "YOLO" and "Edge".
  - Project titles run 70–90 characters.
  - The YOLO project's title doesn't mention YOLO.
- Fix: home title "Freelance Computer Vision Engineer – YOLO, Edge AI & OCR | Vivek Patel", with a CV-first description (Linz, detection/tracking/pose, CUDA/ONNX/TensorRT, ex-MAGNA [VERIFY]). Project titles as "{≤45 characters} | Vivek Patel". Sync `index.html` with `seoConfig.js`.

**K-58 [P2] Structured data is site-wide boilerplate** (PX-12) · M
- Evidence: all routes carry the same Person + ProfessionalService. There's no Article, BreadcrumbList, Service or FAQPage markup, and `priceRange` is "€45/hour".
- Fix: per-route JSON-LD with stable `@id`s: Article + BreadcrumbList for projects, Service (provider → Person, `areaServed: Europe`) for services, FAQPage for the FAQ (K-22), and `PostalAddress` Linz, AT.

**K-59 [P3] OG images, the 404 page and crawl hygiene** (PX-14, PX-23, UI-I24) · S–M
- Evidence:
  - OG images are 960×720, 1654×2339 or 2984×874 instead of 1200×630, with no alt or dimension tags.
  - The hero CTA is a `<button onClick=navigate>` rather than a link.
  - Some card links carry `?from=collection`.
  - The 404 is a dead end with only "Back to Home".
- Fix: generate a 1200×630 card per case study. Use `<Link>` for navigation and router state instead of the query string. Give the 404 three paths (CV case studies, services, request estimate).

### 3.12 Accessibility

**K-60 [P1] The primary CTAs and grey labels fail contrast** (UI-H06, UI-I14, UI-H21, PX-10, F10) · S
- Evidence:
  - The hero primary CTA is white on `#8B5CF6`, 4.23:1, which looks disabled in `home-1440-02-accepted.png`.
  - The service CTA is navy on `#7C3AED`, 3.1:1 (`ServiceDetail.jsx:76`).
  - `#6b7280` labels and body text are 4.0:1 on `#0C0D0D` (3.7:1 on `#161718`).
- Fix: use `bg-[#7C3AED] hover:bg-[#6D28D9]` with white text (5.7:1) for every primary button and the cookie Accept button, and keep `#8B5CF6` for borders and strokes. Set text to at least `#9ca3af` and never use `#6b7280` below 14 px.

**K-61 [P2] Heading structure is broken** (PX-11, UI-H03) · S
- Evidence:
  - Home has 2 `<h1>`s (Testimonials "CLIENT RESULTS", `Testimonials.jsx:47`).
  - `/case-studies/` jumps from h1 to h3.
  - The cookie banner uses an `<h3>`.
  - The accordion places an `<h3>` inside `role="button"`.
- Fix: Testimonials → `<h2>`, add an h2 "Featured case studies", use the WAI accordion pattern `<h3><button aria-expanded>`.

**F14 [P2] Route changes do not move focus, and header clicks swallow modifier-clicks** · S
- Evidence. Source-confirmed in the buyer-journey pass. This is not a screen-reader certification. `ScrollToTop.jsx:11` scrolls and does not focus the destination. Header handlers call `preventDefault` on every click, which blocks Cmd-click, Ctrl-click, middle-click, and explicit link targets. Testimonials adds a second homepage `h1`, which is also K-61. Decorative labels are exposed to assistive tech, which is also K-25 and K-62. Contact, the policy pages, and the cookie banner still request translation animations outside one shared reduced-motion policy, which is also K-50.
- Fix. Move focus on purpose for route and anchor changes, and keep Back plus collection restoration. Allow modifier-clicks and middle-click. Use one page title. Hide decorative annotations from assistive tech. Apply one motion policy and test that preference.
- Done when. Keyboard and screen-reader journeys announce the destination, native new-tab actions work, heading order is coherent, and reduced motion suppresses positional effects on every route.
- The Kiro pass recorded this as not re-tested. K-61 covers only the heading part.

**K-62 [P3] ARIA, alt text and legal-page readability** (PX-16, UI-I25) · S
- Evidence:
  - The logo's `aria-label` is "Vivek Patel Logo" while its visible text is "VP".
  - Decorative "field · 0.99", "REC" and "ID 001" aren't `aria-hidden`.
  - `<aside>` elements are nested.
  - Legal pages run about 106 characters per line with no table of contents, and switch between "I" and "we".
- Fix: set `aria-hidden="true"` on all decorative chips and change the nested `<aside>` to `<div>`. On legal pages, drop `max-w-none` from prose, add an "On this page" list and write consistently in first person.

### 3.13 Privacy/security

**K-63 [P1] *Live* loads third-party resources before consent** (PX-22) · S
- Evidence: *live* (the older build) requests `fonts.googleapis.com`, `fonts.gstatic.com` and the Hostinger JPG before consent. `develop` no longer loads Google Fonts. The GA and Sentry gating is correct in code but was not tested at runtime.
- Why: German and Austrian courts have ruled that loading Google Fonts without consent is a GDPR breach, and you're based in Linz.
- Fix: release `develop` together with K-51. Add a CI check that `googletagmanager` only loads behind consent.

**K-64 [P3] CSP and metadata hygiene** (PX-21) · S
- Evidence: `script-src 'unsafe-inline'` although no inline scripts are emitted, no `worker-src` for Sentry Replay, and `<meta name="generator" content="Hostinger Horizons">`.
- Fix: drop `'unsafe-inline'`, add `worker-src 'self' blob:`, and remove the generator meta.

**Clean checks:**
- Reduced motion is honoured across the site; only `photo-scan` ignores it (K-50).
- Skip link, drawer focus trap and inert background all work.
- The gallery modal works with the keyboard and restores focus.
- No source maps, and no secrets in the bundles (only the public `VITE_CONVEX_URL`).
- HSTS, nosniff, Referrer-Policy, Permissions-Policy and `frame-ancestors` are all set on *live*.
- No console errors and no failed requests.

**Severity totals for K-01 through K-64:** P0 8, P1 26, P2 22, P3 8. F02 is an extra P1. F14 is an extra P2. Those two are not inside the 64.

### 3.14 Buyer-journey acceptance checks

Use these as the done checks. They come from the buyer-journey pass. A Kiro fix that skips the check is not finished.

| IDs | Done when |
|---|---|
| K-55, F01 | Every valid service URL returns HTTP 200 on an Apache-equivalent host, with the right visible content, title, canonical, and social metadata. Unknown service IDs return HTTP 404. A Vite preview pass does not count. |
| F02 | Links, controls, and landmarks work after 767, then 768, then 767, including the keyboard. |
| K-07, K-08, F03, F21 | A sighted reader can tell which images belong to the story and which are illustrations, in the gallery and the enlarged view, without reading the DOM. Stories state limits without approval notes or draft history. The client first name is gone. |
| K-09, F04 | No photo placeholder remains at phone or desktop width. |
| K-25, F05 | Every visible action names its result. No routing or editorial instruction remains in the interface. |
| K-02, K-30, F06 | After five seconds, a buyer can name the specialty, the problem, and the next step. Invented scores are gone or marked as illustration. |
| K-46, F07 | The portrait and its labels stay legible at 320, 390, and 768 px. The main action follows the promise. Decoration comes after that action in the stacked layout. |
| K-27, F08 | A desktop overlay shows one deliberate shared left edge. The same spacing tokens hold on phone and tablet. |
| K-26, F36 | Labels, tags, and borders do not collide at 320, 390, 768, 1024, and 1440 px, or at 200 percent zoom. Annotation space is reserved. Panel width is intentional. The user screenshot is the reference as well as the responsive layouts. |
| K-28, F09 | Collapsed services and the final CTA no longer hold a near-screen of empty space. Keyboard and mobile scroll still feel natural. |
| K-60, F10 | Rendered labels, body text, links, and placeholders meet the contrast ratio that applies to them. Important copy is readable on a phone. |
| K-41, F11 | Accept and Reject leave the content in the same position after dismiss and after reload. Rejection still turns optional tracking off. |
| K-12, F12 | Touch and keyboard users can select and read a long quote without it changing under them. |
| K-42, F13 | The pointer stays visible before startup, after a blocked bundle, and with reduced motion. |
| F14 | Keyboard and screen-reader journeys announce the destination. Native new-tab actions work. Heading order is coherent. Reduced motion suppresses positional effects on every route. |
| K-15, F15 | Within two scrolls, a visitor sees a computer-vision problem, real output, and a relevant way to engage. That commercial effect is a hypothesis, not a measured result. |
| K-16, F16 | The hero, selected work, the CV offer, and the contact prompt describe compatible engagements. New-build and optimization inquiries each have a path. Do not widen the current 1 to 2 week offer into a full product build. |
| K-19, F17 | Each service page says who it suits, what the buyer provides, what they receive, how it is checked, and what happens first. Keep current rates and timing until you change them on purpose. An inquiry reply is not a paid discovery and not a binding quote. |
| K-20, F18 | The visitor does not have to restate which offer or project brought them to the form. |
| K-10, F19 | The proof block links to a source the reader can open. Maintained metrics show their basis and review date. Quotes are exact, or they are marked as excerpts. |
| K-11, F20 | Important performance claims have a basis, or they become specific practices that do not imply a measured win over agencies. |
| K-33, F22 | A technical buyer can say what you decided, how you evaluated it, and what it cannot reliably do. Deepen two or three stories, not all twelve. Do not invent accuracy, FPS, ROI, time saved, or customer acceptance. |
| K-13, F23 | Page copy, metadata, and the form receipt use the same promise for a reply, an estimate, and a kickoff roadmap. Do not silently shorten support or change timing while fixing the words. |
| K-47, F24 | On a phone, the visitor can start the request promptly and still see the next step. |
| K-44, F25 | Keyboard and mobile users land on the first invalid field and can correct it. |
| K-24, F26, F27 | After the toast is gone, a lasting "Request received" state, plus failure and retry, are still clear. Saving a lead is not confirmation that email arrived. Visitors know what to send now, what to defer, and where data handling is explained. A real send stays a separate authorized test. |
| K-17, K-18, F28 | Buyers can read the engagement basis without treating a week range as a fixed total. This pass found no evidence that the current price should rise or fall. |
| K-51, F29 | A cold trace contains no request for the obsolete JPEG. Compare like-for-like runs before claiming time saved. |
| K-50, F30 | A touch, off-screen, or idle trace shows no unnecessary hero loop. An intentional pointer move still works. |
| K-52, F31 | On a phone, `currentSrc` and transferred bytes match the card size. Image dimensions do not shift the layout. |
| K-56, F32 | The first HTML explains the offer and still has working navigation and contact when JavaScript is delayed or absent. |
| K-54, F33 | An updated portrait or logo reaches a returning browser without a manual cache clear. Hashed files stay cached. |
| F34, section 10 | A failed submit is not a lead. A success counts once. Rejecting consent emits no optional analytics. Message text, names, email, and budgets are not analytics fields. |
| K-53, F35 | The same benchmark shows a smaller entry cost, without slower case navigation, a broken Back action, or missing static HTML. This is not a reason to rewrite the framework. |

---


## 4. What already works (keep it)

- **Real model output** on case cards (person bbox, invoice field boxes). Neither inspiration site has this: Sahil's outputs are simulated, and Shahzeb shows no case studies.
- **A restrained palette:** one accent colour and no rainbow gradients. There are also no web fonts, so no font-loading cost.
- **The "When you hire me" 4-row table** (`home-1440-s-05.png`). Use it as the pattern for services and process.
- **Honest copy:** scope limits and in/out-of-scope lists build trust with technical buyers. Move them to the right place (K-38); don't delete them.
- **Accessibility plumbing:** skip link, focus trap with inert background, Escape handling, 44 px toggles and reduced-motion support.
- **The gallery lightbox:** focus management, arrow keys, swipe, zoom and a no-JS fallback.
- **The case-studies list:** "Showing 6 of 10", Load more with `aria-controls` and scroll restore.
- **The cookie banner** gives Accept and Reject equal weight.
- **Routes render.** The buyer-journey pass saw no uncaught page errors, no broken rendered images, and no document-level horizontal overflow on the routes it opened.
- **Publication boundary.** The publication compiler keeps private approval metadata out of browser bundles and uses content-addressed project media.
- **Contact basics.** The form has real labels, field errors, optional budget, input retention on failure, and duplicate-submit protection.
- **Consent.** Reject is available, the choice persists, and settings can be reopened.

---

## 5. Benchmark vs inspirations

| | shahzeb-ai.com | sahilsingh.space | Your site |
|---|---|---|---|
| Hero | Two-line outcome H1, a use-case subhead, "accepting projects" pill | Script-font name, typewriter role, résumé paragraph | Name and role inside an invoice-parse card; the offer is 12 px |
| Proof above the fold | 90% JSS · Top Rated · 8 industries | None | TRP · 100% JSS · rate · location (strongest of the three, but unverifiable) |
| Case studies | None | Live mini-simulations (simulated output) | 10+ real, with real output (your biggest advantage) |
| Testimonials | 4 at once, no context | None | 10 with context, but one at a time and anonymous |
| Offer | Accordion with row 1 open, a one-line benefit and scope | None | 3 collapsed rows, hourly-first |
| Process | "Define success before the model" spec card, 4 guarantees | – | 2 thin steps |
| Motion | Canvas of faint boxes and a HUD portrait; 7 infinite loops, no reduced-motion support | 19 loops on mobile, 7 canvases, marquee, physics toy; no reduced-motion support | 13 loops, but reduced motion is respected |

**What to borrow from the benchmarks:**
- An outcome-first H1 (Shahzeb).
- The "acceptance criteria before the model" trust block (Shahzeb).
- Linkable, verifiable credentials (Sahil: DOI links, certificate verify links).
- A key-results box per case (it-jim.com/portfolio).
- Restraint (parlance-labs.com: a short outcome hero and almost no motion).

**What to avoid:**
- Copying Shahzeb's portrait badges (K-01).
- Sahil's navigation weight (8 items plus a scroll-spy).
- Typewriter headlines.
- Simulated output presented as real work.
- Shahzeb's claims, confidence values, and live-looking counters treated as if they were evidence. The buyer-journey pass also says further imitation of that portrait will add less than showing your own reviewable output.

**Extra sources:**
- [it-jim portfolio](https://www.it-jim.com/portfolio/)
- [Parlance Labs](https://parlance-labs.com)
- jxnl.co on [selling outcomes](https://jxnl.co/writing/2024/10/31/consulting-start/) and [tiered pricing](https://jxnl.co/writing/2024/09/17/pricing-strategy-for-consultants/)

These were paraphrased, not quoted.

Evidence: `sz-d-01-hero.png`, `sz-d-03.png`, `ss-d-01-hero.png`, `ext-itjim-d-01.png`, `vp-d-01b-hero-nobanner.png`.

---

## 6. Animation playbook

**Before adding anything:** fix K-49 (content hidden until in view) and K-50 (runaway loops). New motion should prove capability ("this is what my model sees"), not decorate.

The buyer-journey pass puts this playbook in phase 4, after the broken paths, the offer, and a measurement baseline. Short state changes on buttons, accordions, and the gallery can land earlier. A flagship clip should be started by the visitor, cleared for reuse, and labeled. Do not present simulated confidence as live inference. Do not add scroll hijacking, a cursor the page requires, or another background canvas whose job is to signal "AI."

**Global rules:**
- Animate transform and opacity only (plus SVG `pathLength`).
- Use `viewport={{ once: true }}` for reveals.
- No more than 2 loops per viewport, and no loops on mobile.
- Wrap the app in `<MotionConfig reducedMotion="user">`.
- Stay on-brand: `#8B5CF6` on `#0C0D0D`, no cyan.

| ID | Animation | Purpose | Trigger · timing | framer-motion 10 hint | Guardrail | Reduced motion | Priority |
|---|---|---|---|---|---|---|---|
| AN-01 | Hero bbox lock-on on a real detection frame | Show localize → label → confirm on your own output | First mount only (`sessionStorage`); brackets scale 1.08→1 in 280 ms, chip +120 ms, confidence count 400 ms, total ≤900 ms, ease `[0.2,0.8,0.2,1]` | variants plus `staggerChildren:0.06` (≤5); `animate(0,0.99,{onUpdate})` | Text visible at t=0 (LCP); absolutely positioned, no CLS | Final state | P0 |
| AN-02 | Detection boxes draw on case thumbnails | Prove it's real model output; invite the click | `whileHover` / `whileFocus`; on touch, `whileInView` once; `pathLength` 0→1 in 450 ms | `<motion.rect>` in `viewBox="0 0 1 1"`, `vector-effect="non-scaling-stroke"`, normalized real predictions | `pointer-events:none`; hover scale ≤1.02 | Static boxes at 60% | P0 |
| AN-09 | Visible-first section reveal | Remove blank screens | `whileInView` once, 0.4 s, `y:12` | `viewport{once:true,amount:0.15}` | Never on above-the-fold sections; one per section | Already handled | P1 |
| AN-10 | Tame the hero loops | Performance and focus | IntersectionObserver pause; rAF only on `mousemove` | CSS `animation-play-state: paused` class | Skip on `(pointer: coarse)` | Gate `photo-scan` | P1 |
| AN-03 | Count-up of verified metrics (37 s → 2.5 s, jobs, reviews) | Make numbers memorable | `useInView` once at 0.6, 0.8 s, integers | `useMotionValue` + `useTransform(Math.round)` | Final value present in the HTML; `tabular-nums` | Final value | P1 |
| AN-04 | Before/after slider (raw frame vs model output) | The proof format no benchmark has | Drag, arrow keys, toggle; one 900 ms nudge on view (desktop) | `drag="x"`, `clipPath` via `useTransform` | Underlying `<input type=range>` with a label; fixed aspect ratio | No nudge | P1 |
| AN-05 | Real-inference video loop (sports tracks) | Real frames with track IDs | Plays at ≥50% in view; pauses off-screen or when the tab is hidden; 4–6 s, ≤1.5 MB | `useInView` → `video.play()` | `muted playsinline preload="metadata" poster`; poster only on mobile or `saveData` | Poster and play button | P1 |
| AN-06 | Process pipeline stepper | Show the 5-step process (K-23) | `whileInView` once; `scaleX` 220 ms per step, ≤1.2 s total | `staggerChildren:0.08`, `transformOrigin:left` | Labels visible from the start | Fully drawn | P1 |
| AN-07 | Service card expand and scope tick-in | Confirm what's in scope | Click; 250–300 ms | `AnimatePresence` + `layout`, `pathLength` checks | `aria-expanded` | Instant | P2 |
| AN-08 | CTA micro-feedback and form confirmation lock-on | Reassure the buyer after submitting | Hover arrow +3 px in 150 ms; tap 0.98; confirmation 400 ms | Reuse AN-01 variants | No confetti, no infinite glow | Static | P2 |

**Build order:** AN-10 → AN-09 → AN-01 → AN-02 → AN-05 → AN-04 → AN-03 → AN-06 → AN-07 → AN-08.

**Anti-patterns:**
- Content hidden until it scrolls into view.
- Staggered reveals with more than 5 children or longer than 1.2 s.
- Infinite loops on mobile or off-screen.
- Blinking "REC" or "live" dots and terminal cursors.
- Typewriter headlines.
- Scroll-jacking, pinning or scroll-spy rails.
- A custom cursor on touch devices.
- Simulated AI output presented as real work.
- Canvases behind body text.
- Auto-rotating testimonials.
- Marquees and physics toys.
- Animating `top`, `height` or `box-shadow`.

---

## 7. Proposed homepage structure and hero copy

**Information architecture (in order):**
1. **Header:** wordmark; Work · Services · About · Contact; "Request estimate". No HUD labels.
2. **Hero:** CV outcome H1, subhead, two CTAs, a real detection visual (AN-01), and a proof bar.
3. **Selected CV work (3 cards):** sports tracking → pose → MAGNA stitching (text), each with its stack and a verified result.
4. **Services:** 3 open, CV-first cards: Feasibility Sprint → Pipeline Build → Optimization & Edge Deployment.
5. **How engagements work:** 5 steps plus an acceptance-criteria card; NDA, IP and on-prem notes.
6. **What clients say:** 3 static, verifiable quotes.
7. **About:** real photo; MAGNA R&D, thesis, hardware, languages; GitHub strip.
8. **Also: Document AI & automation:** one strip linking the invoice OCR, schedule PDF and n8n cases.
9. **FAQ:** pricing model, NDA, IP/weights, GDPR/on-prem, hardware targets, response time.
10. **Final CTA:** "Have footage and a question?" plus the feasibility-check offer and "Reply within 1 working day".
11. **Footer:** plain links, legal, and GitHub / LinkedIn / Upwork.

The buyer-journey pass proposed a shorter page. Role and problem, one estimate action, one evidence action. Then one computer-vision case, one document-AI case, and one automation example. Then source-linked feedback, services that name the first paid step, a short biography, and the inquiry. Keep the full case library. At ten main stories, reordering relevance matters more than a filter. K-39 can wait.

**Hero copy options.** The Kiro pass prefers A or B. The buyer-journey pass prefers D. None of these is approved publication copy.
- **A (performance-led, for CTOs with an existing model):**
  - H1: "Computer vision that runs fast enough for production."
  - Sub: "I build detection, tracking and pose pipelines in PyTorch and OpenCV, then optimize them for real hardware with CUDA, ONNX and TensorRT. At MAGNA R&D I cut a real-time image-stitching step from 37 s to 2.5 s." [VERIFY NDA]
- **B (outcome-led, for teams with footage):**
  - H1: "From raw video to tracks, events and data your team can check."
  - Sub: "Freelance computer vision engineer. I've delivered player/ball tracking and shot detection for sports video, pose estimation for fitness, and detection-plus-depth scene analysis, each with review overlays and Docker-ready handoff."
- **C (umbrella, if OCR must stay primary for revenue):**
  - H1: "Vision AI engineer for video, images and scanned documents."
- **D (buyer-journey pass).** H1: "Computer vision and AI engineering for real workflows." Sub: "I build and improve systems that turn images, video and documents into outputs your team can review and use." Actions: "Tell me about your project" and "See relevant work."
- **Proof bar:** Top Rated Plus · Upwork ↗ | Ex-MAGNA International R&D (2023–2025) | MSc Advanced Electronics, FH Joanneum | Linz, Austria · EN / DE B1 [VERIFY live values]

**Lead magnets** [VERIFY capacity]:
- A free vision feasibility check: 10–20 images or a 30 s clip, answered with a one-page note within 2 working days.
- An "Inference speed checklist before you buy bigger GPUs" PDF.
- A fixed-price "PyTorch vs ONNX vs TensorRT on your hardware" benchmark report.

---

## 8. Verified facts available but unused

| Fact | Source (hub) |
|---|---|
| MAGNA International R&D Advanced Engineering, Software Engineer, Jul 2023–May 2025 | `cvs/Vivek_Patel_upwork_CV_ v3.3.2.pdf` |
| Real-time CUDA/OpenCV image stitching, 37 s → 2.5 s [VERIFY NDA] | CV; Upwork profile text |
| GStreamer vision pipelines for autonomous systems | CV |
| PyTorch → ONNX benchmarked on NVIDIA, Hailo, SiMa.ai; TensorRT | CV |
| MAGNA Powertrain Software Test Engineer, 2019–2023 | CV |
| MSc Advanced Electronics, FH Joanneum; thesis on closed-loop object tracking (Zynq, 6-DOF arm) | CV |
| B.Tech Instrumentation & Control, Nirma University; vision-based object-follower robot | CV |
| Top Rated Plus, 21 jobs, 15 reviews (snapshot 24 Aug 2026) [VERIFY live] | `profiles-descriptions/current-profile.md` |
| Sports CV repeat engagement, Dec 2025 → Jun 2026 | `website-case-studies/catalog.json` |
| ML-infrastructure engagement plus a strong technical testimonial | `catalog.json`; `src/data/testimonials.js:50` |
| GDPR-aware, on-prem and self-hosted delivery; 30-day post-deployment warranty | `profiles-descriptions/Upwork General Profile - All Work.txt` |
| English fluent, German B1 | CV |
| Public repos: football player tracking, medical image segmentation, LangGraph planner | CV; `case-studies/proof-index.json` |

### Per-story next evidence

The buyer-journey pass read all twelve published stories. Improve clarity before adding projects. Do not invent accuracy, FPS, ROI, time saved, or customer acceptance. A benchmark needs data conditions, hardware, workload, and a comparable baseline.

| Story slug | Useful evidence already public | Best next addition |
|---|---|---|
| `yolo-computer-vision-optimization` | Fitness pose outputs and a training path | Personal role, evaluation method, supported inputs. Align the title with the route |
| `sports-video-analytics-yolo` | Honest recorded-video scope, tracking, and event-review boundaries | A cleared annotated frame or clip, the review workflow, and a known failure |
| `depth-based-distance-estimation` | Explicit lab and uncalibrated status | Keep the lab label. Remove internal proposal instructions |
| `invoice-ocr-extraction` | Invoice photos tied to reviewable rows | A readable source-to-output comparison and exception handling |
| `ai-invoice-processing-automation` | Validation and spreadsheet handoff | One input and output example, plus how review works |
| `healthcare-document-intelligence` | Color-coded schedule extraction | A sanitized calendar beside output rows. Do not imply clinical-document work |
| `n8n-openai-data-extraction` | The workflow and output formats | A compact JSON or schema example, and why that approach was chosen |
| `n8n-python-ai-agents` | Maintainability and a read-only SQL boundary | Replace or visibly qualify borrowed media. Show a constrained query and result |
| `browser-search-to-spreadsheet` | Run and status documentation | A sanitized queue and a reviewable result |
| `resumable-listing-data-extraction` | Recovery and incremental exports | A concrete interruption and resume example |
| `ai-project-planning-assistant` | Implementation-only framing | A brief-to-plan example, and owned code only if it is fit to publish |
| `python-ci-workflow-automation` | A testable architecture and a bounded purpose | A small command and output walkthrough |

For a flagship computer-vision case, use this order. Buyer problem, operating constraints, your responsibility, input and output, architecture, evaluation, known failures, handoff, and the relevant next engagement.


---

## 9. Roadmap

**Sprint 1 (1–2 days): make the beta look finished and fix what's broken**
- K-40: sticky header
- F02: mobile menu leaves the page inert after resize
- F14: route focus and modifier-click
- K-55, F01: service routes. Test on Apache-equivalent hosting. Vite preview does not count.
- K-07, F03: internal notes, the client first name, and visible captions on borrowed screenshots
- K-25 and K-09: debug labels and the About box
- K-43 and K-44: contact labels, submit label and validation
- K-60: contrast
- K-28: forced heights and CTA spacing
- K-46: mobile hero
- K-51: unused preload
- K-61: headings
- Release `develop` so live stops loading resources before consent (K-63)

**Sprint 2 (about 1 week): positioning and proof**
- K-01 and K-02: new hero with its own visual signature. Pick the headline only after section 11.
- K-05: MAGNA proof [VERIFY]
- K-06: sports visuals and card fallbacks
- K-10 to K-12: verifiable reputation and testimonial grid
- K-15 to K-18: CV-first services, pricing and budget bands
- K-33 to K-35: case-study template, facts box and card crops
- K-20: article CTA and next project
- K-22: FAQ
- K-57: metadata
- K-27, K-30, K-31: design-system pass (container, type scale, buttons)

**Sprint 3 (about 1 week): motion and performance**
- K-49 and K-50 first, then AN-01, AN-02, AN-05 and AN-04
- K-52 and K-53: images and bundle
- K-56: prerender home and contact, then hydrate
- K-58: JSON-LD

**Later**
- K-03 use-case index
- K-14 GitHub strip
- K-19 richer service pages
- K-23 process stepper
- Lead magnets
- K-59 OG cards
- K-62 legal page polish

---

## 10. Measurement plan

No inquiry funnel is tracked yet (F34). Without it, you can't tell whether a redesign raises orders.

- **GA4 events** (after consent):
  - `cta_click {location: hero|header|services|article|final}`
  - `service_view {id}`
  - `case_study_view {slug, category}`
  - `case_study_scroll_75`
  - `form_start` (first field focus)
  - `form_submit_success {budget_band, service}`
  - `form_submit_error {type}`
  - `outbound_click {upwork|linkedin|github}`
  - `booking_click` (if you add K-21)
- **Consent-independent:** store the landing page, the case or service that referred the visitor, and UTM parameters with each Convex lead record, submitted as part of the form. Mention this in the privacy policy.
- **KPIs, reviewed monthly:**
  - Visitor → `form_start` rate
  - `form_start` → submit rate
  - Qualified inquiries per month (CV-related, budget band ≥ €2k)
  - Inquiry → paid discovery or pilot rate
  - Share of inquiries that are CV rather than automation
- **Judging a change:** compare 4-week windows before and after each sprint. Annotate release dates. Don't trust small differences at low volume; ask every inquirer "what made you reach out?"
- **Privacy limit from F34:** failed submissions are not leads, and a success counts once. Never send message text, names, email, budgets, or arbitrary query strings as analytics fields. Rejecting consent emits no optional events.

---

## 11. Decisions you need to make

Each question comes with the Kiro pass's recommended default. The buyer-journey pass does not accept a new price or a wider delivery promise as part of this audit. Where the two passes disagree, the default below is a Kiro recommendation, not a merged decision.

1. **What leads?** Decided 26 Sep 2026. Keep the words Computer Vision and AI automation. Do not rename this to document AI, computer vision only, or "Computer Vision & AI Engineer". Document work can stay in case studies. It is not the headline. The headline, featured order, services, and metadata should follow Computer Vision and AI automation.
2. **Show the hourly rate?** Decided 26 Sep 2026. Keep €45/hour. Show it once in the hero, in the invoice RATE field. Remove the second hero line, "Starting at €45/hour". Keep "from €45/hour" on the service offers. Do not change the amount, and do not replace it with a fixed-price sprint.
3. **Currency:** € on the site with $ on Upwork. Default: € on the site, stated once as "EU-based, invoiced in €".
4. **May you publish MAGNA specifics (37 s → 2.5 s, Hailo/SiMa)?** Decided 26 Sep 2026. No. Do not publish those timings or a case card built on them. They are not on the site now, and they stay off. The existing About line "Production inference work for MAGNA International" can stay. It does not include the numbers.
5. **What is the current JSS?** Default: show it with a date and an Upwork link, or remove it.
6. **Testimonials: can you show first name + initial, role and a link?** Default: initials, role and industry, plus "Verified Upwork review ↗".
7. **Photo:** do you have a colour, working-context photo? Default: use it in About and replace the hero portrait with a real detection frame.
8. **Add a booking link (Cal.com)?** Default: yes, as the secondary CTA.
9. **Offer a free feasibility check?** Default: yes, capped at N per month, with a 2-working-day turnaround.
10. **Sports footage:** do you have permission for visuals? Default: reproduce the pipeline on public-domain footage.
11. **Pose images:** is media permission recorded? Default: record it in `project-sources.yaml`, or regenerate the images on licensed ones.
12. **Keep the "profile invoice" hero concept?** Decided 26 Sep 2026. Yes. Keep the invoice card and the portrait badges (`engineer · 0.99`, `ID 001 · TRACKED`, `REC`). Do not replace them as part of this audit.

**Services (K-15, K-16).** Decided 26 Sep 2026. Show the three current offers open. Each card shows a white title, one sentence, the typical weeks, and "from €45/hour". Keep the in-and-out lists on the service page, or behind "Scope details". Do not publish a new offer ladder. The computer-vision offer stays "existing systems, 1–2 weeks".

---

## 12. ID crosswalk

K-01 through K-64 are the Kiro pass. F01 through F36 are the buyer-journey pass. One row is one defect unless the note says the overlap is only partial.

| IDs | Note |
|---|---|
| K-55, F01 | Same routing gap. Severity differs. Production 404 is the bar. |
| F02 | Buyer-journey only. Now written up above. The Kiro pass did not re-test it. |
| K-09, F04 | Empty About photo. |
| K-25, F05 | Debug labels. |
| K-02, K-30, F06 | Related. F06 is the invoice metaphor and the 12 px offer. K-02 is split positioning. K-30 is the type scale. |
| K-46, F07 | Mobile hero. F07 also requires the main action before decoration in the stacked layout. |
| K-27, F08 | Shared alignment. |
| K-28, F09 | Forced empty height. |
| K-60, F10 | Contrast and size. |
| K-41, F11 | Cookie banner. Kiro wants no spacer. The buyer pass requires Accept and Reject to leave content in the same place. |
| K-12, F12 | Testimonials. The buyer pass adds pause-on-focus and tiny controls. |
| K-42, F13 | Cursor. The buyer pass adds `cursor:none` when JavaScript is off. |
| F14, K-61 | Not the same defect. K-61 is headings. F14 is route focus, modifier-click, and one motion policy. The old Kiro crosswalk called this partial and stopped there. |
| K-15, F15 | Featured order and open services. |
| K-16, F16 | Offer fit. The new ladder is not an approved commitment. |
| K-19, F17 | Thin service pages. |
| K-20, F18 | Article ending, plus carrying the selected service or case into the form. |
| K-10, F19 | Reputation claims. |
| K-11, F20 | Unsupported comparisons. |
| K-07, F21 | Editorial notes. K-07 also includes a client first name in alt text. |
| K-07, K-08, F03 | Borrowed screenshots. The old crosswalk paired F03 only with K-07. Visible captions belong in the gallery and the enlarged view. K-08 is pose-image permission and duplicated PNGs. |
| K-33, K-06, F22 | Thin stories and missing sports visuals. F22 asks for judgment and evaluation on two or three stories, not a longer template on all twelve. |
| K-13, F23 | Inconsistent commercial promises. |
| K-47, F24 | Mobile contact order. |
| K-44, F25 | Validation focus. |
| K-24, F26, F27, F34 | Form example, receipt, privacy context, and measurement. |
| K-17, K-18, F28 | Rate wording and budget bands. The euro versus dollar point is from the Kiro pass. |
| K-51, F29 | Obsolete preload. |
| K-50, F30 | Hero loop. |
| K-52, F31 | Card image size. |
| K-56, F32 | Empty initial HTML. |
| K-54, F33 | Immutable cache on unhashed brand files. |
| K-53, F35 | Entry bundle. Measure after the obvious waste is gone. |
| K-26, F36 | Hero field spacing. F36's zoom checks are acceptance criteria, not tests already run. |

**In the Kiro pass and not in the buyer-journey pass:**

- K-40, the sticky header
- K-01, the portrait card copies Shahzeb
- K-43, chips cover the contact labels
- K-05, MAGNA proof is unused on the page
- K-03, use-case index
- K-04, motif rule
- K-22 and K-23, FAQ and process
- K-29, K-31, K-32, K-34 through K-39, case-study presentation
- K-45, focus rings
- K-48, smaller mobile details
- K-57 and K-58, metadata and JSON-LD
- K-63 and K-64, consent on the live build, and CSP
- Sections 5 and 6, the benchmark table and the animation playbook

## 13. Evidence index (`kiro-website-audit-2026-09-26-assets/`)

| File | Shows |
|---|---|
| `home-1440-02-accepted.png` | Hero after cookie accept: chip collisions, left-edge mismatch, lavender CTA |
| `vp-d-01b-hero-nobanner.png` / `sz-d-01-hero.png` | Your portrait card vs Shahzeb's (K-01) |
| `home-390-s-00.png`, `vp-m-01b-hero-nobanner.png`, `home-768-s-00.png` | Mobile and tablet hero (K-46) |
| `home-1440-s-01.png`, `home-1440-s-02.png` | Header gone after scroll; collapsed services and dead band |
| `home-1440-s-04.png` | Empty "PHOTO · FIELD" and 2-step process |
| `home-1440-s-07.png` | Debug labels in the final CTA and footer |
| `home-1440-fullpage-noscroll.png` | Sections invisible until scrolled (K-49) |
| `cs-1440-s-00.png` | Case-study cards with empty media and unreadable crops |
| `sports-1440-s-00.png` | Flagship CV case with no visuals |
| `yolo-1440-s-00.png`, `hc-1440-s-00.png` | Article template and oversized lead media |
| `svc-1440-s-01.png` | Service page: empty right side, low-contrast CTA |
| `contact-1440-s-00.png`, `contact-1440-errors.png`, `contact-390-s-00.png` | Covered labels, validation, mobile form position |
| `menu-390-open.png` | Mobile drawer |
| `sz-d-03.png`, `ss-d-01-hero.png`, `ext-itjim-d-01.png` | Benchmark references |

### Buyer-journey evidence (`assets/2026-09-26/`)

- [User-supplied hero spacing example](assets/2026-09-26/hero-spacing-user-example.png), for K-26 and F36.
- [Desktop hero](assets/2026-09-26/home-1440.png), [phone hero](assets/2026-09-26/home-390.png), [tablet hero](assets/2026-09-26/home-768.png).
- [Featured work](assets/2026-09-26/portfolio-1440.png), [services](assets/2026-09-26/services-1440.png), [About](assets/2026-09-26/about-1440.png), [testimonials](assets/2026-09-26/testimonials-390.png).
- [Contact arrival](assets/2026-09-26/route-_contact_-390.png), [contact form](assets/2026-09-26/contact-form-390.png), [validation](assets/2026-09-26/contact-empty-errors-390.png), [final CTA](assets/2026-09-26/cta-390.png).
- [Homepage and browser observations](assets/2026-09-26/browser-observations.json).
- [All-route observations](assets/2026-09-26/route-observations.json).
- [Consent, testimonial, and local performance probes](assets/2026-09-26/interaction-performance-probes.json).
- [Gallery, collection, empty-form, and offscreen checks](assets/2026-09-26/final-interaction-checks.json).

Kiro screenshots in the table above live in `../../kiro-website-audit-2026-09-26-assets/`. Source paths refer to commit `fff5306`. This merge changed the audit text only. It did not change the website.
