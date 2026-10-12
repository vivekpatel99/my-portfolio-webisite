# Content, Trust & Conversion Audit — vivekapatel.com

- Scope: `develop` @ `fff5306`, rendered at http://127.0.0.1:4173 on 2026-09-26 (1440×900, Playwright), with source reads of `src/`, `publication/` and `index.html`.
- Proof sources: `/Users/viv/Freelance/case_study_to_proposal_hub` (CONTEXT.md, profiles-descriptions/*, CV PDF v3.3.2, case-studies/README.md, proof-index.json, website-case-studies/catalog.json, project-sources.yaml).
- Read-only: no source, config or git changes. The only artifacts are this file and Playwright output under `.kiro-audit-tmp/content/`.
- Hub path shorthand: `HUB/` = `/Users/viv/Freelance/case_study_to_proposal_hub/`. `CV` = `HUB/cvs/Vivek_Patel_upwork_CV_ v3.3.2.pdf`.
- `[VERIFY]` = the owner must confirm this before publishing. Nothing here invents metrics or clients.

## Verdict in one paragraph

The H1 says "Computer Vision & AI Engineer", but most of the page argues something else. The hero artwork is an invoice being OCR'd. The first two featured case studies are n8n and invoice OCR. The first service is data extraction, and the SEO description leads with web scraping. Meanwhile, the strongest verified CV credentials are hidden or missing: MAGNA R&D work with CUDA, ONNX and hardware accelerators, the 37 s → 2.5 s stitching speed-up, and the MSc thesis on object tracking. Trust also takes three self-inflicted hits:
1. Internal editorial and audit notes appear on public pages ("Not for proposals", "This story replaces…", "temporary stand-in for Andrew engagement screenshots").
2. Every case-study outcome ends with a legal-style disclaimer.
3. The About section contradicts that with "I deliver measurable results".

Fixing positioning, removing leaked internal notes and surfacing the MAGNA proof are mostly copy changes (effort S) with the highest revenue impact.

---

## Findings

Severity: P0 = actively losing trust or leads now. P1 = major conversion or credibility gap. P2 = meaningful polish. P3 = minor.

### CT-01 · P0 · Internal editorial/audit notes and a client first name are published on case-study pages
**Evidence** (all render on the live site):
- `publication/staged-case-study-publication.js:2301`, shown as the depth card and article summary: "A Python lab demo overlays object detections and uncalibrated distances on a scene. Not a benchmark. Not for proposals."
- `…:555`: "This is a lab demo, not client-ready evidence and not for proposals."
- `…:657-658`, image alt and caption: "…not an accuracy benchmark, and not for proposals."
- Live page title: "Lab Demo of Depth-Based Spatial Analysis Between Detected Objects".
- `…:2096` / `:2450`, pose outcome: "This story replaces the older mixed pose/stitching description." This line also appears in `HUB/website-case-studies/yolo-computer-vision-optimization.md`, last line.
- `…:1342-1402`, n8n gallery alts: "…temporary stand-in for Andrew engagement screenshots". This names a client, although `HUB/case-studies/proof-index.json` sets `client_name_usage: omit` for `n8n-sql-query-agent`.
- `…:1428`: "Original client-supplied PostgreSQL table overview used as project input; not an agent-result screenshot".
- `…:178`: "historical screenshot annotations are not independently verified benchmarks".

**Why it matters:** A CTO who reads "Not for proposals" or "This story replaces…" concludes the site is unfinished, or that the work is being hedged. The client first name in alt text breaks the anonymity rule the hub itself sets. The depth project is also undersold. The hub registers it as a delivered, approved client project: `proof-index.json` → `depth-based-distance-estimation`, claim "I built a Python component that combines object detection and depth estimation for reviewable scene analysis", completed 2025-09 per `catalog.json`. The site calls it a "Lab Demo".

**Fix:** Remove every process note from public copy, and put one neutral scope line in the article meta instead of the prose.
- Depth title: "Object Detection + Monocular Depth for Scene-Level Distance Estimates".
- Depth summary: "A Python component that combines an object detector with Depth Anything V2 to estimate relative distances and navigation zones in a scene."
- Depth caption: "Demo output from the delivered component; distances are uncalibrated estimates."
- Replace "stand-in for Andrew…" alts with "Representative n8n workflow (illustrative, from other portfolio work)", or remove those images.
- Edit the source stories (hub `website-case-studies/*.md` or the publication manifest) and re-stage.

**Effort:** S

### CT-02 · P0 · Positioning is split four ways; CV is the headline but not the argument
**Evidence:**
- Hero artwork is a document parse: "Profile Invoice", "INV-VP-0045", "OCR surface", "doc · extract · 0.97" (`src/components/Hero.jsx:188,192,193,174`).
- Hero bio: "I build detectors, document extractors, and n8n workflows that turn camera feeds and messy files into reliable production data." (`Hero.jsx:280`)
- Hero tags are ordered `['OCR', 'CV', 'n8n']` (`Hero.jsx:292`).
- Featured case-study order: n8n → invoice OCR → pose (`publication/case-study-featured.js:3-7`).
- Service order: data extraction → CV → AI workflow (`src/data/serviceOffers.js:10,33,55`).
- About: "End-to-end: vision + scraping + AI agents" (`About.jsx:62`).
- Meta description: "Expert in web scraping, n8n automation, YOLO, PyTorch, and LangChain" (`src/lib/seoConfig.js:10`, `index.html:22-23`).
- The Upwork profile positions him the other way round: "Primary services: AI automation, document data extraction, OCR, n8n, and Python / Supporting services: computer vision" (`HUB/profiles-descriptions/current-profile.md`).

**Why it matters:** In the 5-second test, a Head of Engineering sees an invoice, OCR and n8n, then an H1 that says CV. The page never says who he builds for or what outcome they get. Generalist signals push the price anchor toward "automation freelancer". A CV buyer shortlists a specialist.

**Fix:** Pick one lead, and let OCR (itself a vision problem) and automation become supporting capabilities. The recommended umbrella is "Computer Vision & Vision-Based Document AI". Drop scraping from the homepage and SEO; keep it in the collection. Replace the invoice mock with a frame and detection visual from real CV work (see CT-20). See the "Positioning & hero copy" section below.

**Effort:** M (copy S, hero visual M)

### CT-03 · P0 · The strongest verified CV proof is missing or reduced to one vague bullet
**Evidence:**
- The only MAGNA mention: "Production inference work for MAGNA International" and "CUDA, ONNX, edge deployment specialist" (`About.jsx:56,59`), about 3,600 px down the page.
- `docs/changelog.md:19` records removing "unsourced 94% savings".
- But the CV (`CV`, MAGNA International R&D Advanced Engineering, Jul 2023–May 2025) documents it: "Optimized real-time image stitching algorithms using CUDA and OpenCV, improving processing speed from 37s to 2.5s"; "Engineered and deployed vision pipelines for autonomous systems using Python and GStreamer"; "Developed (Pytorch), benchmarked, and optimized ONNX-based AI models on hardware accelerators (NVIDIA, Hailo, SiMa AI)".
- The CV skills list "NVIDIA TensorRT".
- The CV thesis entry: "Closed loop Object Tracking based on Image Recognition… deployed on ZYNQ ZYBO-7000… 6 DOF robotic arm".

**Why it matters:** A concrete latency number, named accelerators and a tier-1 automotive R&D employer are exactly what separate a CV engineer from a YOLO tutorial user. None of this is above the fold.

**Fix:** Add a hero proof line: "At MAGNA R&D I cut a real-time image-stitching step from 37 s to 2.5 s with CUDA and OpenCV, and benchmarked ONNX models on NVIDIA, Hailo and SiMa.ai accelerators." [VERIFY: the employer NDA allows the number and naming. The hub treats this as a "public profile claim, not proof yet" (`HUB/profiles-descriptions/upwork-work-profile.md`), but the owner's CV is its source, and it is employment work, so present it as "at MAGNA", not as a freelance client result.] Add an employment case card, "Real-time image stitching speed-up (MAGNA R&D, 2023–2025)", in text only.

**Effort:** S

### CT-04 · P1 · Leaked developer/HUD labels read as debug output
**Evidence:**
- "NAV · SITE" (`Header.jsx:189,247`) and "FOOTER · SITE" (`Footer.jsx:19`).
- "ROUTE · /CONTACT/ · NO MAILTO" (`CTA.jsx:74`).
- "SECONDARY PATH · FORM REMAINS PRIMARY" (`Contact.jsx:219`).
- The submit button reads "SUBMIT · FIELD" (`Contact.jsx:355`).
- "NAME · FIELD" / "EMAIL · FIELD" / "BUDGET · FIELD" / "MESSAGE · FIELD" sit above the real labels (`Contact.jsx:242…`).
- "CONTACT · DETECTED" (`Contact.jsx:237`) and "CTA · DETECTED" (`CTA.jsx:28`).
- "TESTIMONIALS · DETECTED", "CLIENT RESPONSE · DETECTED", "BBOX · ACTIVE", "Field 02 / 10" (`Testimonials.jsx:45,107,113,77`).
- "ABOUT · DETECTED", "PHOTO · FIELD", "BIO · FIELD" (`About.jsx:8,22,31,42`).
- Hero: "field · 0.99…0.94", "credential · 0.99", "success · 0.99", "Inference online", "engineer · 0.99", "ID 001 · TRACKED", "REC" (`Hero.jsx:154-380`).

**Why it matters:** One motif is memorable; more than 30 labels are noise. Some of them ("NO MAILTO", "FORM REMAINS PRIMARY") are internal design decisions that visitors read literally. A submit button labelled "SUBMIT · FIELD" costs conversions at the most important click on the site.

**Fix:**
- Keep the detection motif only where it carries meaning: one hero visual, plus the eyebrow on section headings, turned into real words ("SELECTED WORK", "SERVICES").
- Delete "NAV · SITE", "FOOTER · SITE", "ROUTE…", "SECONDARY PATH…", the "· FIELD" chips, "BBOX · ACTIVE" and "CLIENT RESPONSE · DETECTED".
- Submit button: "Send project details".
- Hero confidence chips: at most one ("engineer · 0.99" on the photo is enough wit).

**Effort:** S

### CT-05 · P1 · Copy claims "measurable results", while every case study disclaims measurement
**Evidence:**
- "I optimize complex AI systems for production… I deliver measurable results faster than typical agency timelines." (`About.jsx:49`)
- The case-study outcomes say the opposite:
  - "No public tracking-accuracy, latency or time-saving figure is claimed." (`staged-case-study-publication.js:1887`)
  - "No measured accuracy, throughput or savings figure is claimed" (`:158`)
  - "no measured coverage, accuracy or time-saving figure is claimed" (`:1201`)
  - "No standalone Python service or measured savings figure is claimed" (`:1419`)
  - "No booking completion, unrestricted access guarantee or measured success rate is claimed." (`:513`)
- "Faster than typical agency timelines" has no source in the hub.
- "Testimonials" is headed "CLIENT RESULTS / Real projects. Real impact." (`Testimonials.jsx:48,51`), but the quotes contain no results.

**Why it matters:** The contradiction is visible within one scroll. The disclaimers are honest, but written as audit language they read as "this didn't work". Buyers remember the last sentence of a case study.

**Fix:**
- About bio: "I build computer-vision pipelines and make them fast enough for production hardware. At MAGNA R&D that meant CUDA/OpenCV stitching (37 s → 2.5 s) and ONNX models benchmarked on NVIDIA, Hailo and SiMa.ai accelerators [VERIFY per CT-03]. As a freelancer I deliver detection, tracking and pose pipelines with documented, Docker-ready handoffs."
- Case-study outcomes: end on the verified qualitative result, for example "The client continued into a second, longer engagement" for sports, backed by contracts 42484707 → 42568179 in `HUB/website-case-studies/catalog.json` and the testimonial "We will continue working together on my project!" (`src/data/testimonials.js:73`).
- Move limits into a short "Scope" meta row, e.g. "Scope: batch analysis of recorded footage".
- Rename "CLIENT RESULTS" to "WHAT CLIENTS SAY" and delete "Real projects. Real impact."

**Effort:** S

### CT-06 · P1 · "100% Job Success" and "5★ Average Rating" are not supported by the hub
**Evidence:**
- "100% Job Success" / "Client delivery record" (`Hero.jsx:249`).
- Contact proof strip: "100% Job Success on Upwork", "5★ Average Rating" (`Contact.jsx:186,191`).
- The hub's live snapshot (2026-08-24) records "Top Rated Plus, $45/hr, Linz, $43,307 earned, 21 jobs, 15 reviews". It has no JSS figure (`HUB/profiles-descriptions/current-profile.md`, `upwork-work-profile.md`).
- `testimonials.js` lists 10 entries at 5.0, including 3 "Direct" entries, so "5★ average" mixes Upwork and non-Upwork ratings.

**Why it matters:** JSS changes over time. A stale or wrong 100% that a buyer checks on Upwork destroys trust in every other claim.

**Fix:**
- [VERIFY] the current JSS on the live profile, and show the date: "Top Rated Plus · 100% Job Success (Upwork, Sep 2026)".
- Link the badge to `socialLinks.upwork`.
- Replace "5★ Average Rating" with the verifiable "15 Upwork reviews · 21 jobs" [VERIFY current counts; the hub marks this snapshot as internal].

**Effort:** S

### CT-07 · P1 · Hourly-rate-first pricing undercuts a CV specialist, and the currency conflicts with Upwork
**Evidence:**
- The rate appears on nearly every surface:
  - Hero: "€45/hour" (`Hero.jsx:263`) and "Starting at €45/hour" (`Hero.jsx:413`), both above the fold.
  - Services intro: "Hourly engagements, from €45/hour" (`Services.jsx:33`), plus a RATE row on every service.
  - CTA: "RATE · from €45/hour" (`CTA.jsx:37`).
  - Service detail pages (`ServiceDetail.jsx:41`).
  - Meta and JSON-LD `"priceRange": "€45/hour"` (`index.html:22,50,79`) and `seoConfig.js:10,41`.
- Upwork shows "$45/hr" (`HUB/profiles-descriptions/current-profile.md`).

**Why it matters:**
- An hourly figure is the first number a CTO sees, before any proof, so he is anchored on cost rather than outcome.
- €45 differs from the $45 on Upwork, and a buyer who cross-checks sees two prices.
- The services are sold as fixed-duration sprints, but priced by the hour, which is a mixed signal.

**Fix:**
- Remove the rate from the hero, CTA and meta.
- Price outcomes instead:
  - "Paid feasibility sprint: fixed price, 1 week [VERIFY price]".
  - "Build and optimization projects: fixed scope, quoted after feasibility".
- Keep one FAQ line: "Ongoing or ad-hoc work is available hourly from €X [VERIFY rate; align with Upwork's currency]."
- If a price must stay visible, show a project floor ("Projects typically start at €X [VERIFY]"), not an hourly rate.

**Effort:** S

### CT-08 · P1 · Budget bands do not match the offers
**Evidence:**
- `src/lib/budgetOptions.js:1`: `['< €5k', '€5k-€10k', '€10k-€25k', '€25k+']`.
- The services are "Typically 1–2 weeks" / "2–4 weeks" (`serviceOffers.js:15-16,38-39,60-61`) at €45/h.
- At 40–80 h, a 1–2-week sprint costs about €1.8k–€3.6k. So most offers fall into the lowest band, and the "€25k+" band (over 550 h) is effectively empty.

**Why it matters:** The dropdown doesn't help qualify leads, and a small buyer sees "< €5k" as the bottom tier, which is an awkward signal.

**Fix:** Use bands that match the product ladder:
- "Feasibility check (< €2k)"
- "€2k–€5k sprint"
- "€5k–€15k build"
- "€15k+ / ongoing"
- "Not sure yet"

[VERIFY the thresholds against the owner's pricing.]

**Effort:** S

### CT-09 · P1 · The CV service excludes what CV buyers most often need, and contradicts delivered work
**Evidence:**
- `serviceOffers.js:33-47`: "COMPUTER VISION PRODUCTION OPTIMIZATION — For existing YOLO, OCR, OpenCV, ONNX, or edge-AI systems…"
- Its out-of-scope list includes "Building a computer-vision product from scratch" and "Training a new model from zero".
- The delivered projects do exactly that:
  - Pose: "A packaged Python project for training and testing YOLO pose models" (`HUB/website-case-studies/yolo-computer-vision-optimization.md`).
  - Sports: a full pipeline built for the client (`HUB/website-case-studies/sports-video-analytics-yolo.md`).
  - CV Objective: "Object Detection and Tracking (Model training and Optimisation)".

**Why it matters:** The most common inbound CV request is "can you detect/track X in our footage?". The only CV offer turns that buyer away, while two of three services are automation.

**Fix:** Use a CV-first ladder:
1. **Vision Feasibility Sprint** (1 week). Scope: your sample images or video → baseline detector/tracker run → an error analysis and data needs → a go/no-go note and a fixed quote.
2. **Custom Vision Pipeline Build** (2–6 weeks [VERIFY]). Scope: detection, tracking or pose on your data; training scripts; review overlays and JSON/CSV exports; Docker/GPU run path; documentation. This matches the sports and pose deliverables.
3. **Inference Optimization & Edge Deployment** (1–3 weeks). Scope: profiling; CUDA/OpenCV; ONNX/TensorRT export; benchmarks on your target hardware (NVIDIA; Hailo/SiMa.ai experience from MAGNA per `CV`).

Secondary line under the services: "Also: Document AI and OCR extraction, and n8n automation for the data your models produce" (links to the existing offers). Keep "Hardware procurement or plant-floor install" as out of scope.

**Effort:** M

### CT-10 · P1 · Featured work leads with automation; the best CV case is hidden and has no images
**Evidence:**
- Featured list: `'n8n-openai-data-extraction', 'invoice-ocr-extraction', 'yolo-computer-vision-optimization'` (`publication/case-study-featured.js:3-7`).
- The sports story is the strongest CV project, but it is not featured, sits on the collection page by date, and renders with `#IMGS 0` (live `/project/sports-video-analytics-yolo/`). Its catalog record:
  - Contract titles include "Senior Computer Vision Engineer for Sports Video Analytics (Ball, Player & Event Tracking)".
  - It was a repeat engagement from 2025-12-21 to 2026-06-30, plus a consultation.
  - Its cover is "synthetic data; not a delivered-product screenshot" (`HUB/website-case-studies/catalog.json`).

**Why it matters:** The homepage's first case study is an n8n spreadsheet workflow, and a CV buyer stops reading there.

**Fix:**
- Featured order: sports video → pose (6 real overlays) → MAGNA stitching (employment, text; see CT-03). Invoice-photo OCR (bounding-box visuals) can be the fourth or appear in "Also".
- Give the sports article a real visual. Two options:
  - A synthetic or public-footage overlay GIF produced with the same pipeline [VERIFY footage licence].
  - Client-approved frames. `project-sources.yaml` limits sports to `anonymous-case-study-text`, so media needs separate permission.

**Effort:** S to change the order; M for visuals

### CT-11 · P1 · Case studies lack the structure buyers scan for
**Evidence:**
- The articles have only "The problem / What I built / The outcome" (live `/project/*`).
- They have no role, duration, team size, tech-stack block, hardware, or data volume, and no linked client quote.
- "Reviewable" appears in 5 of 10 titles: "Reviewable Body-Pose Detection…", "…to Reviewable Tracks and Event Tags", "…to Reviewable Client Data", "…to Reviewable Excel Rows", "…Back to a Reviewable Spreadsheet" (live `/case-studies/`).
- Card summaries end defensively: "Not live scoring.", "Not clinical EHR. Not medical records." (`staged-case-study-publication.js:1752,683`).

**Why it matters:** CTOs skim a meta row (stack, timeline, result), then the visuals. Repetitive titles blur the projects together, and the negative summaries make the first impression one of limitation.

**Fix:**
- Template: Title (outcome-first) → meta row (Client type · Duration · Role · Stack) → Challenge → Approach (with diagram or overlay) → Result (verified qualitative, or a metric when one exists) → Client quote (matching testimonial) → Scope note (one neutral line) → CTA.
- Example sports meta: "Sports analytics client · Dec 2025–Jun 2026 · Sole CV engineer [VERIFY] · Python, YOLO pose, tracking, Docker/GPU".
- Title: "Player Tracking, Ball Trajectories and Shot Detection from Match Video".
- Pull quote: testimonial `sports-cv-ball-player-2026-01`.

**Effort:** M

### CT-12 · P1 · The About section shows an empty photo placeholder
**Evidence:**
- About renders a placeholder with the literal text "PHOTO · FIELD" twice (`About.jsx:20-32`, confirmed live).
- `profileImages.aboutPhoto: '/assets/images/vivek-black-and-white.webp'` exists (`src/config/links.js:23`) and is used in the hero.

**Why it matters:** An empty box in the "WHO I AM" section looks unfinished, and it is the section a buyer checks to see who they would hire.

**Fix:** Use a different, warmer photo than the hero (a working shot at a desk with a board or camera setup is ideal [VERIFY one exists]). Otherwise, reuse the portrait and remove the placeholder.

**Effort:** S

### CT-13 · P1 · Testimonials are hard to verify, rotate one at a time, and some source labels look wrong
**Evidence:**
- 7 of 10 are attributed to "Upwork Client", with no link and no country (`src/data/testimonials.js`).
- A carousel auto-rotates every 6 s and shows 1 of 10 (`Testimonials.jsx:8,77`).
- Only one quote is from a CV project: "I am super happy with Vivek! We will continue working together…" (`testimonials.js:73`).
- `testimonials.js:84-86` credits "Stephan P." with "Automated Data Extraction Workflow (n8n / Flowise / Langflow)" and `source: "Direct"`. The hub maps that story to Upwork contract 41832077 (`catalog.json`, `n8n-openai-data-extraction`) and records the limit "Not healthcare or Flowise/Langflow delivery" (`HUB/case-studies/README.md`).
- "Andrew W. / Feasibility check: n8n workflow for local transcription / Direct" (`testimonials.js:106-110`). The catalog describes this as an Upwork "local-transcription feasibility contract".
- Two entries have `feedbackDate: null`.
- The section title is an `<h1>` (`Testimonials.jsx:47`), making it the second H1 on the page and larger (58 px) than the real H1 (26 px).

**Why it matters:** Anonymous quotes without a link look invented. A wrong "Direct" label, or a stack in a project title that the hub says wasn't delivered, is a verifiable inconsistency.

**Fix:**
- Replace the carousel with a static grid of 3 quotes: sports CV, "Machine Learning Engineer (Data and Infrastructure Focus)" (the strongest technical review, `testimonials.js:50`), and invoice AI.
- Label each "Verified Upwork review · Jan 2026 ↗", linking to the profile.
- [VERIFY] the source of the three "Direct" entries.
- Trim "(n8n / Flowise / Langflow)" to "Automated Data Extraction Workflow" unless Flowise/Langflow was delivered.
- Make the section heading an `h2`.

**Effort:** S

### CT-14 · P1 · Credentials sit at the bottom of a 5,863 px page
**Evidence:**
- Order: Hero → Portfolio → Services → Testimonials → About → CTA (`src/pages/Home.jsx:15-21`).
- Measured heading tops: "WHO I AM" at 3637 px; "READY TO START YOUR PROJECT?" at 5158 px.
- Sections use `min-h-[900px]` (`About.jsx:5`, `Services.jsx:26`, `CTA.jsx:23`), so sparse sections still fill a full screen.

**Why it matters:** Who he is (MAGNA, MSc, CUDA) is the main reason to trust a solo engineer. Here it comes after the pitch and the reviews, and the padding makes the scroll feel long.

**Fix:** See "Proposed homepage information architecture". Move a condensed proof bar into the hero, and drop the forced `min-h`.

**Effort:** M

### CT-15 · P1 · Pose images may exceed the recorded reuse scope
**Evidence:**
- `HUB/project-sources.yaml` → `supporting-computer-vision`: `reuse_scope: anonymous-case-study-text`.
- `HUB/case-studies/README.md`: "Demo permission is separate from anonymous text reuse."
- The live pose article shows 7 images from that project.
- `catalog.json` notes "reused from the locally approved gallery correction", so an approval may exist but is not recorded in the source registry.

**Why it matters:** This is a confidentiality and trust risk if the client didn't approve the visuals, and these are the only real CV visuals on the site.

**Fix:** [VERIFY] with the owner, then record media permission (for example `reuse_scope: anonymous-case-study-and-demo`) in `project-sources.yaml`. If it can't be confirmed, regenerate the overlays on licensed stock or self-shot images with the same model.

**Effort:** S

### CT-16 · P2 · The hero fails the 5-second test visually
**Evidence:**
- At 1440×900, the H1 "Computer Vision & AI Engineer" is 26 px. Every other section heading is 38–58 px (measured).
- The cookie banner pushes the hero about 80 px down.
- In the screenshot, the "INFERENCE ONLINE" chip overlaps the "DOC · EXTRACT · 0.97" chip, and "PROFILE INVOICE" is clipped.
- The rate is shown twice above the fold (`Hero.jsx:263,413`).
- There is no line that says who he builds for or what outcome they get.

**Fix:** Structure the hero as: H1 as the positioning line (40–56 px) → one-sentence subhead → two CTAs → proof bar (Top Rated Plus · ex-MAGNA R&D · MSc · Linz, EU). Let the visual be a real detection frame. Fix the chip collision. Copy options are in the "Positioning & hero copy" section.

**Effort:** M

### CT-17 · P2 · There is one high-commitment CTA and no low-friction path
**Evidence:**
- "Request a Project Estimate" (`Hero.jsx:397`, `CTA.jsx:62`, `ServiceDetail.jsx:80`), and "Request Estimate" in the header (`Header.jsx:209`).
- Case articles end with "Discuss a similar project →".
- The CTA section reads "RATE · from €45/hour · ESTIMATES · via contact form" (`CTA.jsx:37`).
- There is no calendar booking and no sample-data offer.

**Why it matters:** An estimate request asks the buyer to write a spec. CV buyers often have footage but no spec, and a feasibility offer is the natural first step for them.

**Fix:**
- Primary CTA: "Book a 20-min technical call" (Cal.com or Calendly link [VERIFY availability]).
- Secondary CTA: "Send sample footage for a free feasibility check".
- Final CTA heading: "Have footage and a question? Let's check if it's solvable." Body: "Send 10–20 sample images or a short clip. Within 2 working days you get a short note on feasibility, data needs and a recommended first sprint [VERIFY turnaround]."
- Keep the frequency as it is (header, hero, after services, final, and article end).

**Effort:** S (copy), M (booking integration)

### CT-18 · P2 · No risk reversal beyond the 30-day support
**Evidence:**
- The only guarantee: "30 days of post-delivery support and a complimentary optimization pass" (`About.jsx:98`).
- Contact "What happens next" steps (`Contact.jsx:40-44`) have no timing, no NDA mention and no IP/data-handling statement.
- The Upwork profile has usable GDPR and on-prem messaging: "On-premise or self-hosted options…", "GDPR-aware AI automation for European teams" (`HUB/profiles-descriptions/Upwork General Profile - All Work.txt`).

**Fix:**
- Add a "How engagements work" block: 1) Feasibility sprint (fixed price, go/no-go), 2) Build in milestones, 3) Handoff with documentation, Docker and a 30-day support window. Only mention a warranty wording the owner confirms.
- Add FAQ items: "Can you sign an NDA?", "Who owns the code and model weights?", "Can data stay on our servers?" (on-prem, GDPR-aware per the Upwork profile) [VERIFY each].
- Step timings: "Reply within 1 working day → scoped proposal within 3 working days" [VERIFY].

**Effort:** S

### CT-19 · P2 · The contact form is low-friction but tuned for OCR buyers, and leaks leads to marketplaces
**Evidence:**
- 4 fields, 3 required (name, email, description; budget is optional). Low friction; keep it that way.
- Description placeholder: "Example: We need invoice OCR or a data extraction workflow that exports clean records to our CRM within 4 weeks..." (`Contact.jsx:318`).
- The name placeholder "Alex from Acme Ops" (`:251`) is fine.
- The error toast reads "Uh oh! Missing fields." (`:114`).
- The "Or connect on your preferred platform" block (`Contact.jsx:365`, links at `:34-37`) sends visitors to Freelancer.com and FreelancerMap.
- There is no field for a sample-data link.

**Fix:**
- Placeholder: "Example: We have 2 hours of warehouse camera footage and need to count pallets per shift on a Jetson-class device…" Drop "Jetson" unless the owner has done it [VERIFY]; "on an NVIDIA edge device" is safe per `CV`.
- Add an optional field, "Link to sample images/video (Drive, Dropbox)".
- Error toast: "Please fill in the required fields."
- Keep only Upwork (for review verification), LinkedIn, GitHub and email. Remove Freelancer.com and FreelancerMap from the contact page.

**Effort:** S

### CT-20 · P2 · Response-time and process promises are inconsistent
**Evidence:**
- Response time is phrased three ways:
  - "I typically respond within 24 hours" (`Contact.jsx:179`).
  - "I'll get back to you within 24 hours." (`:161`)
  - "Get a quote within 24 hours." (`seoConfig.js:41`), which is a quote, not a reply.
- "A clear project roadmap with milestones delivered within 24 hours of kickoff." (`About.jsx:83`)
- "Bi-weekly progress updates…" (`About.jsx:88`) is ambiguous (twice a week, or every two weeks?). With 1–2-week sprints it could mean zero or one update.
- "complimentary optimization pass" appears only in About. Elsewhere the promise is "30 days of support" (`CTA.jsx:34`) and, on Upwork, a "30-day post-deployment warranty".

**Fix:**
- Use one phrase everywhere: "Reply within 1 working day."
- Updates: "Written progress update at least twice a week, plus a demo at each milestone" [VERIFY cadence].
- Either drop "complimentary optimization pass" or state it everywhere [VERIFY].

**Effort:** S

### CT-21 · P2 · Weak headlines and clichés
**Evidence:**
- "WHO I AM" (`About.jsx:11`), "WHEN YOU HIRE ME" (`:71`), "MY PROCESS" (`:105`), "READY TO START YOUR PROJECT?" (`CTA.jsx:31`), "SERVICE OFFERS" (`Services.jsx:30`).
- "No surprises." (`About.jsx:88`).
- "Here's exactly what to expect." (`:74`).
- "production-grade performance standards", "not just prototypes" (`:117`).
- "Production-ready" appears 3+ times (`About.jsx:74,93`, `CTA.jsx:34`).
- "Let's build your next AI solution together… so your team never feels stuck." (`CTA.jsx:34`).
- "Real projects. Real impact." (`Testimonials.jsx:51`).

**Fix:** Write headlines that carry a claim:

| Now | Suggested |
|---|---|
| WHO I AM | "Automotive R&D rigor, freelance speed" (details below) |
| WHEN YOU HIRE ME | "What you get in every engagement" |
| MY PROCESS | "From sample footage to deployed model" |
| READY TO START…? | "Have footage and a question?" |
| SERVICE OFFERS | "Three ways to work together" |

Replace "production-ready" with specifics: "Dockerized, documented, with tests and a GPU run path". That wording is taken from the sports deliverable (`HUB/website-case-studies/sports-video-analytics-yolo.md`).

**Effort:** S

### CT-22 · P2 · SEO and social metadata dilute the CV positioning
**Evidence:**
- `seoConfig.js:10`: "Expert in web scraping, n8n automation, YOLO, PyTorch, and LangChain. Top Rated Plus on Upwork. €45/hour."
- Keywords include "Web Scraping Expert" (`:12`).
- `index.html:50`: "Expert in Computer Vision, Web Scraping & n8n Automation. €45/hour."
- JSON-LD `knowsAbout` / `serviceType` include "Web Scraping" (`index.html:70,80`).
- OG description: "Portfolio and projects of Vivek Patel, AI and Computer Vision Engineer." (`:35`), which is generic.
- The index.html meta (`:22`) lacks "Top Rated Plus", but `seoConfig.js:10` has it.

**Fix:**
- New description: "Freelance computer vision engineer in Linz, Austria. Detection, tracking and pose pipelines, plus CUDA/ONNX/TensorRT inference optimization. Ex-MAGNA R&D [VERIFY]. Top Rated Plus on Upwork."
- `knowsAbout`: Computer Vision, Object Detection, Object Tracking, Pose Estimation, OCR, PyTorch, OpenCV, ONNX, TensorRT, CUDA.
- Drop the price from the meta.
- Keep `index.html` and `seoConfig.js` in sync.

**Effort:** S

### CT-23 · P2 · The About differentiators are vague
**Evidence:** "Production inference work for MAGNA International" / "CUDA, ONNX, edge deployment specialist" / "End-to-end: vision + scraping + AI agents" (`About.jsx:56-62`).

**Fix:** Replace with:
- "R&D software engineer at MAGNA International (2023–2025): CUDA/OpenCV real-time stitching, GStreamer vision pipelines, ONNX models benchmarked on NVIDIA, Hailo and SiMa.ai" (`CV`).
- "MSc Advanced Electronics (FH Joanneum); thesis on closed-loop object tracking deployed on a Zynq board driving a 6-DOF robot arm" (`CV`).
- "Top Rated Plus on Upwork: detection, tracking, pose and document-AI projects since 2025" (`current-profile.md`, `CV`).
- "Works in English; German B1" (`CV`), which matters for DACH buyers.

**Effort:** S

### CT-24 · P3 · The surveillance-style motif on his own portrait
**Evidence:** "ID 001 · TRACKED", a red "REC" dot and "engineer · 0.99" on the portrait; alt text "Tracked engineer portrait" (`Hero.jsx:358,377,380`).

**Why it matters:** It's clever, but "REC/TRACKED" on a face can read as surveillance to EU buyers who care about privacy, and the page itself doesn't mention privacy.

**Fix:** Keep one "engineer · 0.99" chip and drop "REC". Alt text: "Portrait of Vivek Patel".

**Effort:** S

### CT-25 · P3 · Capitalization and consistency nits
**Evidence:**
- "Github" / "Linkedin" should be GitHub / LinkedIn (`Footer.jsx:31-32`).
- "View Case Studies" (`Hero.jsx:405`) vs "View case studies" (`CTA.jsx:70`).
- "Contact Me" (`Footer.jsx:28`) vs "Request Estimate".
- All-caps service titles are stored as data (`serviceOffers.js:11,34,56`) and render as a 7xl H1 (`ServiceDetail.jsx:36`). Store them in title case and uppercase with CSS.
- "Transfering code in n8n workflow" (`testimonials.js:65`) is the client's typo; show "Transferring…" or a cleaner label.
- "Maintainable n8n Pipelines and a Read-Only SQL Agent" conflicts with the hub limit "No comprehensive read-only security guarantee" (`HUB/case-studies/README.md`). Use "…an SQL Agent with Query Checks".

**Effort:** S

### CT-26 · P3 · GitHub is barely linked
**Evidence:**
- GitHub appears only in the footer and as a contact-page icon (`Footer.jsx:31`, `Contact.jsx`).
- The public profile shows 41 repositories and the bio "I am a Computer Vision and AI Engineer" (observed 2026-09-26).
- The CV lists owned projects: "Football Players Tracking System" (YOLO multi-object tracking), "Medical Image Segmentation" (VGG-FCN, PyTorch Lightning, Hydra, GitHub Actions), "AI Project Planning Agent".

**Fix:**
- Add an "Open source" strip with 2–3 pinned CV repos, each with a README GIF [VERIFY which are public and presentable].
- Pin them on GitHub.
- The planning agent is already registered as "implementation-only" public proof (`proof-index.json`).

**Effort:** S–M

---

## Positioning & hero copy (verified facts only)

**Positioning statement (internal):** For product and engineering teams who need a vision model to work on their own footage and hardware, Vivek Patel is a Linz-based computer vision engineer. He takes detection, tracking and pose pipelines from feasibility to an optimized, documented handoff, drawing on automotive R&D experience at MAGNA (CUDA, ONNX, hardware accelerators) and Top Rated Plus freelance delivery.

**Option A — Performance-led (best for CTOs with an existing model)**
- H1: "Computer vision that runs fast enough for production."
- Sub: "I build detection, tracking and pose pipelines in PyTorch and OpenCV, then optimize them for real hardware with CUDA, ONNX and TensorRT. At MAGNA R&D I cut a real-time image-stitching step from 37 s to 2.5 s." [VERIFY NDA]
- CTAs: "Book a 20-min technical call" · "See CV case studies"

**Option B — Outcome-led (best for sports, ops and QC teams with footage)**
- H1: "From raw video to tracks, events and data your team can check."
- Sub: "Freelance computer vision engineer. I've delivered player/ball tracking and shot detection for sports video, pose estimation for fitness, and detection-plus-depth scene analysis, each with review overlays and Docker-ready handoff."
- CTAs: "Send sample footage" · "See the work"

**Option C — Vision + Document AI umbrella (keeps the OCR/automation revenue without diluting it)**
- H1: "Vision AI engineer for video, images and scanned documents."
- Sub: "Detection, tracking and OCR pipelines that turn visual data into structured records, and the automation that moves them into your systems. Ex-MAGNA R&D, Top Rated Plus on Upwork."
- CTAs: "Book a call" · "See case studies"

**Proof bar (all options):** Top Rated Plus · Upwork ↗ | Ex-MAGNA International R&D (2023–2025) | MSc Advanced Electronics, FH Joanneum | Linz, Austria · EN / DE B1

Recommendation: A or B as the H1, with C's scope shown as the secondary "Also" strip. Option C is the fallback if the owner decides OCR and n8n must stay primary for revenue; the Upwork profile does lead with them.

---

## CV-engineer credibility signals

| Signal | On site? | Available proof | Cheapest high-impact step |
|---|---|---|---|
| Detection/overlay visuals | Partial: pose stills only; sports has 0 images | Pose overlays (see CT-15 permission); invoice-photo bbox image; depth demo image | Put the pose overlay and depth demo on homepage cards (S) |
| Demo video/GIF | None (`#VIDEO 0`) | Sports pipeline has "Debug overlays, optional clips" (text-only permission); CV "Football Players Tracking System" (owned) | 10-second GIF from the owned football-tracking repo on public or licensed footage [VERIFY] (M) |
| Metrics table (mAP, FPS, latency on hardware) | None | Only the MAGNA 37 s → 2.5 s | Self-run benchmark: one YOLO model, PyTorch vs ONNX vs TensorRT on your GPU and CPU; publish as an "Inference optimization teardown" article (M, fully owned, no client data) |
| Hardware targets | "edge deployment" only | NVIDIA, Hailo, SiMa.ai (`CV`); Zynq ZYBO-7000 (thesis) | Name them in About and the CV service (S) |
| Deployment diagram | None for CV | Sports: stage caching, Docker/GPU path; depth: detector / depth / navigation modules | One simple pipeline diagram per CV case (S–M) |
| Open-source repos | Footer link only | 41 public repos; CV key projects | "Open source" strip + pinned repos (S) |
| Technical writing | None | — | The benchmark teardown above doubles as the first post (M) |
| Datasets handled | Not stated | Sports: single-camera match footage; pose: YOLO-format dataset | Add a "Data" row to case meta (S) |
| Employer/education credibility | Buried, vague | MAGNA, FH Joanneum MSc, Nirma B.Tech, 7 years' software engineering (Upwork profile) | Hero proof bar (S) |

The three cheapest wins: MAGNA proof in the hero (S), the pose overlay and depth demo as homepage visuals (S), and one benchmark article built on owned code (M).

---

## Verified facts available but unused (or buried)

| Fact | Source | Site status |
|---|---|---|
| MAGNA International R&D Advanced Engineering, Software Engineer, Jul 2023–May 2025 | `CV` | Vague bullet only, `About.jsx:56` |
| Real-time image stitching, CUDA + OpenCV, 37 s → 2.5 s | `CV`; also Upwork profile text | Removed (changelog:19) — [VERIFY NDA] |
| Vision pipelines for autonomous systems with Python + GStreamer | `CV` | Missing |
| PyTorch → ONNX models benchmarked on NVIDIA, Hailo, SiMa.ai accelerators; NVIDIA TensorRT | `CV` | Reduced to "CUDA, ONNX, edge deployment specialist" |
| MAGNA Powertrain Software Test Engineer 2019–2023 (MATLAB/Simulink, Jenkins, Python integration testing) | `CV` | Missing; supports "thorough QA" (testimonial `software-engineer-duncan`) |
| MSc Advanced Electronics, FH Joanneum Graz; thesis "Closed loop Object Tracking based on Image Recognition" on Zynq + 6-DOF arm | `CV` | Missing |
| B.Tech Instrumentation & Control, Nirma University; bachelor project "Object Follower Robot Vision Based" | `CV` | Missing |
| "Master's in Embedded Systems + 7 years' Software Engineering" | `HUB/profiles-descriptions/Upwork General Profile - All Work.txt` | Missing. The degree wording differs from the CV ("Advanced Electronics"); [VERIFY] and use the CV wording |
| Top Rated Plus; 21 jobs; 15 reviews; Linz | `HUB/profiles-descriptions/current-profile.md` (snapshot 2026-08-24, internal) | Only TRP shown; counts [VERIFY live] |
| Sports CV repeat engagement, Dec 2025 → Jun 2026 (contracts 42484707, 42568179; consult 42454964) | `HUB/website-case-studies/catalog.json` | Not featured; no mention of the repeat engagement |
| Registered CV claims (sports events export; pose training + overlays; detection + depth) | `HUB/case-studies/proof-index.json` | Present but hedged; depth mislabelled "Lab Demo" |
| ML infrastructure engagement + strong technical testimonial | `catalog.json` (42693066); `src/data/testimonials.js:50` | Hidden in carousel position 5 of 10 |
| Languages: English fluent, German B1 | `CV` | Missing |
| GDPR-aware / on-prem / self-hosted delivery messaging | Upwork General Profile text | Missing |
| 30-day post-deployment warranty wording | Upwork General Profile text | Site says "support" (consistent enough; pick one term) |
| Owned public projects: Football Players Tracking, Medical Image Segmentation, LangGraph planning agent | `CV`; `proof-index.json` (planning agent, implementation-only) | Only the planning agent is in "Other work" |

---

## Proposed homepage information architecture

1. **Header**: "Vivek Patel" wordmark; nav: Work · Services · About · Contact; CTA "Book a call". *Purpose:* orientation, persistent CTA; no HUD labels.
2. **Hero**: CV positioning H1, one-line subhead, two CTAs (call / send footage), one real detection visual, proof bar (TRP ↗, ex-MAGNA R&D, MSc, Linz · EN/DE). *Purpose:* pass the 5-second test for a CTO.
3. **Selected CV work (3 cards)**: sports tracking → pose → MAGNA stitching (employment, text). Each card shows its stack and a one-line verified result. *Purpose:* prove the specialism immediately.
4. **Services (3 CV-first offers)**: Feasibility Sprint → Pipeline Build → Inference Optimization & Edge Deployment, with duration and a "starts at" figure [VERIFY] and no hourly rate. *Purpose:* turn interest into a clear first purchase.
5. **How engagements work**: feasibility → milestones → handoff + 30-day support; NDA/IP/on-prem notes. *Purpose:* risk reversal, and answer "what happens next".
6. **What clients say (3 static quotes)**: sports CV, ML infrastructure, invoice AI; each "Verified Upwork review · date ↗". *Purpose:* verifiable social proof.
7. **About**: real photo; MAGNA R&D + test-engineering background; thesis; hardware; languages; GitHub strip. *Purpose:* the "why this person" depth for technical buyers.
8. **Also: Document AI & automation**: one strip linking to invoice OCR, schedule PDF and n8n cases. *Purpose:* keep the adjacent revenue without diluting the lead.
9. **FAQ**: pricing model, NDA, IP/weights ownership, data residency/GDPR, hardware targets, response time. *Purpose:* remove the last objections before contact.
10. **Final CTA**: "Have footage and a question?" + feasibility-check offer + "Reply within 1 working day". *Purpose:* capture undecided visitors.
11. **Footer**: links, legal, GitHub / LinkedIn / Upwork. *Purpose:* housekeeping, without the "FOOTER · SITE" label.

## Lead-magnet ideas suited to CV buyers

- **Free vision feasibility check**: "Send 10–20 images or a 30-second clip. Within 2 working days you get a one-page note: can it be detected or tracked, what data is missing, and a recommended first sprint." [VERIFY capacity and turnaround] Consistent with the Upwork line "Send me the workflow, one sample document… I'll outline the shortest reliable path".
- **Inference speed checklist (PDF)**: "12 checks before you buy bigger GPUs", from profiling to ONNX/TensorRT export and pre-/post-processing on GPU. Grounded in the MAGNA CUDA/ONNX work.
- **Paid mini-benchmark**: "Your model on your target hardware: PyTorch vs ONNX vs TensorRT latency report", at a fixed price [VERIFY]. It's a natural entry point to the optimization service.
