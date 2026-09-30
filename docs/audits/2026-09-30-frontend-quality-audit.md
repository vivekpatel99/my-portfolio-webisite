# Frontend quality audit — 30 September 2026

The audited integration build has a usable public route structure and passing existing checks, with 10 newly filed reproduced defects, one measured optimization and one recovery enhancement. Twelve new issues are ready for scoped follow-up work. Start with [#225: testimonial pause and touch targets](https://github.com/vivekpatel99/my-portfolio-webisite/issues/225). This report implements no website fixes and does not claim the website is bug-free.

## Target and scope

- Canonical repository: `vivekpatel99/my-portfolio-webisite`.
- Starting checkout: `develop` at `5c334874952bdd48ddafbeae74c29bf5ad528cda`.
- Verified remote develop and audited SHA: `2df30703fb450d6ae47a5f47ed45e10f119abd20`. Both Git remote and GitHub branch API agreed again before backlog/report delivery.
- Report branch: `docs/2026-09-30-frontend-quality-audit`, based on that SHA. Current primary checkout; no worktree was created.
- Scope: public React 18/Vite frontend, source, local development behavior and fresh production output. The separate private case-study library was not inspected. Contact success/failure used an in-memory transport; zero real leads were submitted.
- A dirty-file baseline was recorded before work. Existing untracked skills, audit instructions, Kiro configuration and QA material were preserved and excluded from the report commit. Those local tools were audit inputs, not part of the audited develop tree. No copied KinSame steering or automatic context-file writes were applied.

## Prioritized backlog

P1 means a significant accessibility or visitor-control problem. P2 covers bounded interaction defects and measured work reduction. No P0 finding was verified. Each linked issue records the audited SHA, routes, actual/expected behavior, reproduction, source, smallest correction, acceptance criteria, validation, evidence, dependencies and limits. The same complete records are in [findings.json](assets/2026-09-30/findings.json).

| ID | Priority | Classification | Issue |
|---|---|---|---|
| F01 | P1 | Confirmed defect | [#225](https://github.com/vivekpatel99/my-portfolio-webisite/issues/225) Add a usable pause control and touch targets to testimonials |
| F02 | P2 | Confirmed defect | [#226](https://github.com/vivekpatel99/my-portfolio-webisite/issues/226) Honor reduced motion on contact and policy page entrances |
| F03 | P2 | Confirmed defect | [#227](https://github.com/vivekpatel99/my-portfolio-webisite/issues/227) Keep the native pointer until the custom cursor is enabled |
| F04 | P2 | Confirmed defect | [#228](https://github.com/vivekpatel99/my-portfolio-webisite/issues/228) Remove the consent spacer after Reject |
| F05 | P2 | Confirmed defect | [#229](https://github.com/vivekpatel99/my-portfolio-webisite/issues/229) Apply consent choices when local storage writes fail |
| F06 | P2 | Confirmed defect | [#230](https://github.com/vivekpatel99/my-portfolio-webisite/issues/230) Preserve contact focus and a lasting request receipt |
| F07 | P2 | Confirmed defect | [#231](https://github.com/vivekpatel99/my-portfolio-webisite/issues/231) Show a safe retry message for unknown contact transport errors |
| F08 | P2 | Measured optimization | [#232](https://github.com/vivekpatel99/my-portfolio-webisite/issues/232) Stop idle and offscreen hero animation work |
| F09 | P2 | Confirmed defect | [#233](https://github.com/vivekpatel99/my-portfolio-webisite/issues/233) Restore collection position after Other Work articles |
| F10 | P2 | Confirmed defect | [#234](https://github.com/vivekpatel99/my-portfolio-webisite/issues/234) Keep mobile menu controls reachable in short viewports |
| F11 | P2 | Design enhancement | [#235](https://github.com/vivekpatel99/my-portfolio-webisite/issues/235) Preserve navigation when a route chunk fails |
| F12 | P2 | Confirmed defect | [#236](https://github.com/vivekpatel99/my-portfolio-webisite/issues/236) Make the testimonials title a section heading |

The carousel advanced from 02 to 03 after a touch selection and 6.5 seconds, with no pause control. Its inactive slide controls are 5×5 CSS px, active 8×8, with roughly 18px center spacing. The WCAG pause and target-size requirements are relevant; this is a bounded assessment, not a conformance certificate.

The contact defects were observed only with synthetic failures and success. Focus fell to BODY after each outcome, the receipt disappeared within ten seconds, and an unknown synthetic request-ID error appeared verbatim. The submit activation was a Playwright click; keyboard-triggered lifecycle impact requires follow-up validation. Existing invalid-field focus and duplicate-send protection still pass; these new issues concern subsequent transport outcomes.

Hero optimization is supported by local production measurements: **3,840 custom-property writes during two idle seconds, 3,856 after pointer movement and 3,856 offscreen**. The sample used 1440×900, normal motion, three two-second phases, pointer movement to (700,300), then scrolling to the footer, with counters reset per phase and external network blocked. Thirteen named hero CSS animations remained running offscreen. No >50ms long task was observed. These counts justify stopping unnecessary work, not a claim of jank, battery savings or field performance gains.

For short mobile drawers, controls fit at 320px height. At 256px and 200px height, the last control ends around y=306, the drawer does not scroll, and lower controls cannot be fully revealed. The issue is intentionally narrower than the reviewer's initial 320px-height claim.

## Reused issues and history

Matching existing issues were referenced without closing, reopening or relabeling them. All 105 historical issues and recent PRs were read; the issue list was refreshed before creation and checked again before each new issue write.

| Existing record | Current audit disposition |
|---|---|
| [#191](https://github.com/vivekpatel99/my-portfolio-webisite/issues/191), closed | Residual hero-label acceptance gap: the inference pill and document label overlap vertically by 12px at all five widths. Assessment A identified the collision visually; geometry independently confirms it. Preserve invoice, badges and frames. Reuse this exact existing scope rather than creating a duplicate. |
| [#189](https://github.com/vivekpatel99/my-portfolio-webisite/issues/189), closed | Route focus and header modifier-click fixes pass existing QA. Primary estimate controls still use button-driven navigation; native link behavior is a remaining semantic enhancement within the earlier navigation scope. No duplicate issue. |
| [#154](https://github.com/vivekpatel99/my-portfolio-webisite/issues/154), closed; [#169](https://github.com/vivekpatel99/my-portfolio-webisite/issues/169), closed | Reuse the approved single-quote/detected-field design for any purposeful quote transition. New #225 addresses independently reproduced pause/target defects; do not replace the approved design or quotes. |
| [#192](https://github.com/vivekpatel99/my-portfolio-webisite/issues/192), closed | Forced section-height repair is present. Container-width differences and current vertical rhythm do not establish a new defect. |
| [#188](https://github.com/vivekpatel99/my-portfolio-webisite/issues/188), closed | Labels and invalid-submit focus are fixed. #230/#231 concern later transport feedback, not a reopened label defect. |
| [#187](https://github.com/vivekpatel99/my-portfolio-webisite/issues/187), open; PR [#222](https://github.com/vivekpatel99/my-portfolio-webisite/pull/222), open | Existing public-copy/privacy queue remains separate. Reuse its record; this audit did not access private evidence or publish its identifying details. |
| [#186](https://github.com/vivekpatel99/my-portfolio-webisite/issues/186), open | All three service routes work in local static output. This does not resolve the deployed-host verification requirement. |
| [#193](https://github.com/vivekpatel99/my-portfolio-webisite/issues/193), closed; PR [#209](https://github.com/vivekpatel99/my-portfolio-webisite/pull/209), merged | Obsolete preload repair is present; no duplicate. |
| [#218](https://github.com/vivekpatel99/my-portfolio-webisite/issues/218), closed; PR [#219](https://github.com/vivekpatel99/my-portfolio-webisite/pull/219), merged | Source/default-visible section repair and current passive checks pass. |
| [#190](https://github.com/vivekpatel99/my-portfolio-webisite/issues/190), open; PRs [#215](https://github.com/vivekpatel99/my-portfolio-webisite/pull/215), [#216](https://github.com/vivekpatel99/my-portfolio-webisite/pull/216), merged | Preserve all three portrait badges. No new badge issue was reproduced. |
| [#183](https://github.com/vivekpatel99/my-portfolio-webisite/issues/183), open | Historical audit queue remains context, not evidence that every older finding is current. |

Suggested order: #225 first; coordinate #228/#229 at the shared consent-state boundary; then contact #230/#231, reduced motion #226 and pointer fallback #227. Address the existing #191 shared hero spacing before dependent hero polish; measure #232 under identical conditions. Navigation #233/#234 and semantic #236 can be separate small fixes. Schedule recovery enhancement #235 after the confirmed interaction defects. Do not batch unrelated website fixes into the report PR.

## Design contract and geometry

The current approved dark Computer Vision identity is the design authority: violet `#8B5CF6` detection frames, invoice hero, portrait with three proof badges, real project evidence, and existing commercial terms. Context helper execution found no PRODUCT.md or DESIGN.md; no replacement design documents were initialized.

| Surface | Required role and deliberate exception |
|---|---|
| Hero invoice and portrait | Offset detection annotations, corner brackets, violet field, portrait badges. Separate overlapping labels without removing these elements. |
| Featured, collection and service cards | Detection framing and semantic title/body/metadata/actions. Long content may grow a row; identical pixel heights across unrelated card families are not required. |
| Contact fields | Grey `#6b7280` corners at rest; `#a78bfa` focus corners. Labels, helpful errors and usable pending/retry/success states take precedence over decorative consistency. |
| Galleries and article media | Preserve actual evidence aspect ratios, readable image viewing, accessible controls and scrollable thumbnail strips. A plain media stage is a deliberate exception to framed cards. |
| Controls and footer | Visible focus, adequate hit areas, native navigation semantics. Footer/article reading widths may be quieter/narrower than hero content. |
| Typography | Sans headings/body with compact mono detection labels and metadata. Keep text readable; fix subsection semantics independently of visual sizing. |

At a 1280px viewport, measured header/about/testimonial/footer inner widths were 1120px (x=72.5), portfolio 1169px (x=48), services 1080px (x=92.5), and CTA 920px (x=172.5). These reflect separate composition and reading roles. Generic uniform-width or new token-system demands would change the approved design without verified benefit.

Three isolated synthetic fixtures rendered the actual CaseStudyCard: short content, a long wrapped title/description with optional metadata, and missing optional image/category/date/link data. All five widths had zero document overflow or clipping. Grid rows stretched equally where shared, while longer content grew naturally. Missing images leave a reserved media region in this fixture; no current public missing-image defect was verified. Action-baseline alignment is an optional future content-design question, not an arbitrary fixed-height prescription. [Measurements](assets/2026-09-30/layout-observations.json).

Six selected gallery images at 390px produced stage heights approximately 101, 202, 97, 127, 260 and 216px. This follows heterogeneous evidence aspect ratios. Thumbnail auto-alignment can move scroll position. No new fixed-gallery-height defect was filed.

## Independent critique and detector synthesis

Assessment A was a fresh read-only Opus-configured session for design judgment and lane 1 (`33d9f96f-1649-4c0c-9dbc-a2ae72bd55bd`). It inspected verified desktop/mobile home captures, approved requirements and frontend source. It finished before detector results entered synthesis. Assessment B was a separate evidence session (`686387a8-ef2d-4206-a79d-6efdafc02556`) that received Codex-produced detector/browser/probe artifacts and no A or other reviewer output. Codex performed all browser, shell, fixture, detector and test execution. Reviewers performed read-only file and image inspection; neither nested delegation nor browser execution was claimed.

The two public hero captures used by A are retained: [desktop](assets/2026-09-30/home-desktop-capture.png), [mobile](assets/2026-09-30/home-mobile-capture.png). Image pixel dimensions are 1280×889 and 780×1688 respectively; screenshot scaling is separate from the geometry matrix viewport widths. They show the label collision and contain no client/private form data.

A's provisional Nielsen snapshot was **22/32 (69%)**, with flexibility and help/documentation marked not applicable, and two moderate cognitive-load concerns. These are design judgments informed by bounded captures/source, not a validated whole-site usability score. Strengths were the recognizable invoice/detection identity, clear service offers and substantial proof browsing. Confirmed control/feedback problems outrank preferences about widths, borders or gallery decoration.

Coordinator audit health snapshot: accessibility 2/4, performance 2/4, responsive layout 3/4, theme consistency 3/4, integrity/recovery 3/4 (**13/20**). This is a qualitative triage summary of the evidence in this report, not an automated benchmark.

The Impeccable context helper and CLI detector ran with external runtime storage. Two warnings were checked:

- `side-tab` at CaseStudyArticle.css:50 is a thin article-blockquote accent, not the card pattern alleged by the detector. No bug filed.
- `gradient-text` at index.css:118 is an unused utility with no rendered matching element. Optional P3 dead-style cleanup; no design issue filed.

Codex initialized detector overlays on home, collection, contact and one article in a fresh evidence browser tab. Script loading and overlay nodes were observed, but console output did not identify their rules/elements. T3 subsequently disconnected. Persistent user-visible overlay state and rule attribution are unverified; overlays did not generate issues. No hooks or skill-package edits were made. The detector server's task-created state file was removed after its owned process stopped.

B correctly rejected stale home-history data and no-JS empty-route conclusions. B's zero hero-write statement came from an inconclusive T3 summary and is superseded by the independent working production probe above. Its P1 ratings for the consent gap and Other Work return were reduced to P2 because the observed impact is bounded and recoverable. B noted the then-minimal decision log; the delivered [decision trail](assets/2026-09-30/decisions.tsv) records subsequent reconciliation checkpoints retrospectively and labels them as such. B is an independent input, not a blanket endorsement of every final coordinator finding.

Questions skipped: audit and issue backlog already authorized.

## Purposeful motion proposals

These are follow-up proposals using existing Framer Motion/CSS, not implemented changes. Shared spacing/state repairs precede animation polish.

| Proposal | Purpose and trigger | Reduced motion | Performance and acceptance |
|---|---|---|---|
| Persistent contact receipt (#230) | Confirm a completed mocked/request outcome after success; move focus to the receipt. | Show final receipt immediately. | Optional opacity-only ~150ms entrance; no height animation or delayed focus. Receipt remains after ten seconds and retry values remain on failure. |
| Controlled quote change (reuse #154, after #225) | Make manual/allowed automatic quote changes legible while respecting visitor pause state. | Instant text replacement, static automatic state. | Optional 120–180ms opacity transition with no layout animation. Keep focus, preserve quote text and user pause, avoid overlapping unreadable quotes. |
| Visible hero activity (#232, after #191 spacing) | Preserve useful normal in-view depth feedback after pointer movement; stop irrelevant activity. | Static final composition. | Stop after convergence and when offscreen; no new dependency. Two idle/offscreen seconds must show zero hero property writes while normal interaction retains the effect. |

## Coverage and checks

The route inventory contains 21 tested URLs: home, collection, contact, two policies, three service routes, twelve project routes and an unknown-route fallback. The build generated 21 static HTML outputs including 404. [Exact routes](assets/2026-09-30/routes.json).

| Coverage | Engine / viewport / state | Result or limit |
|---|---|---|
| Public route geometry | T3 Chrome 152 / Electron 44; 21×320/390/768/1024/1440, height 900; normal motion | 105 cells; zero document horizontal overflow and zero broken loaded images. Eight out-of-bounds sets were intentional horizontal gallery strips. |
| Normal/reduced route entrances | Local Playwright Chromium; 21×390/1440×normal/reduce | 84 cells, root transforms sampled at mount/~100/~300ms. Three routes still translate under reduce (#226). |
| Development and synthetic cards | Isolated Vite server, T3; three actual-component fixtures across five widths | Corrected early import/cache harness failures before accepting rendered evidence. Final fixture results pass geometry checks. |
| 200% reflow | T3 and local Chromium; CSS zoom=2 on home/contact/collection/service/article | No document overflow. Native browser zoom shortcuts did not change scale; native 200% zoom remains unverified. |
| Keyboard and breakpoint transitions | Existing Chromium desktop/mobile passive checks; WebKit focus projects | Menu trapping, Escape, gallery opener restoration, route focus and 768px inert cleanup pass. No full WebKit/Firefox audit or screen-reader speech session. |
| Touch, history and fallback | Chromium synthetic touch, isolated storage and aborted lazy asset | Carousel defect; Other Work return 1213→0; home Back preserved 898→898; JS-off native cursor hidden; chunk fallback has working Home link but replaces navigation shell. |
| Direct entry, refresh, collection/gallery journeys | Existing route/navigation/SEO suites plus representative observational probes | Local behavior checked; browser rendering does not prove deployed rewrite/cache behavior. |
| Contact lifecycle | Isolated in-memory transport | Duplicate-send, preserved failure inputs and successful retry pass; additional probes reproduce focus, receipt and unknown-error gaps. |
| Consent | Chromium Accept/Reject/reload and throwing setItem | Reject leaves 72px spacer; throwing Reject leaves banner and pageerror. Other action failure paths are fix acceptance work, not claimed observed failures. |
| Production loading/animation | Fresh local build, unthrottled Chromium | Entry 486.08kB /150.84kB gzip; deferred Sentry chunk 331kB. Warm local LCP sample ~60ms and layout shifts ~0.03338 are not field metrics. Idle/active/offscreen work measured. |

Executed checks:

- `npm test`: **559 tests / 54 files passed**.
- `npm run build`: passed; **21 static routes, 36 public links checked**.
- Local SEO with `QA_LOCAL_ONLY=1`, `QA_ARTIFACT_SAFE_MODE=1`, actual loopback preview URL: passed.
- Applicable passive browser QA with external reporter/output paths: **341 passed, 7 skipped**. WebKit projects cover focus regressions only.
- Existing isolated contact lifecycle: **1 passed**. Extended synthetic contact observation: **1 passed**; its raw-error assertion records current bad behavior, not desired behavior.
- Additional observation probes and corrected reruns produced the linked geometry, motion, consent, history, fallback and performance evidence. They are observation harnesses, not website fixes or newly committed regression tests.

No full test suite pass proves the new audit criteria already pass. Their uncovered behavior is precisely the follow-up backlog.

## Skill and model provenance

Read and applied `.kiro/skills/impeccable/SKILL.md` with `reference/audit.md` and complete `reference/critique.md`; `.kiro/skills/web-design-guidelines/SKILL.md`; and `.kiro/skills/vercel-react-best-practices/SKILL.md`. Lane 3 also loaded `impeccable/reference/animate.md:1–120`. Codex fetched the [official current Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) on 30 September 2026 and supplied that copy to reviewers.

React rule files actually read across the sessions, under `.kiro/skills/vercel-react-best-practices/rules/`: `rerender-no-inline-components.md`, `js-batch-dom-css.md`, `rerender-use-ref-transient-values.md`, `bundle-conditional.md`, `bundle-preload.md`, `bundle-dynamic-imports.md`, `client-localstorage-schema.md`, `rerender-derived-state-no-effect.md`, `client-passive-event-listeners.md`, `bundle-defer-third-party.md`, `rendering-resource-hints.md`. Codex additionally checked `client-event-listeners.md` and `rendering-animate-svg-wrapper.md`. Only React 18/Vite-compatible advice was applied; no Next.js or React 19 APIs were introduced.

Five bounded source lanes ran as separate read-only Kiro sessions: design/A, responsive/routes, motion/accessibility, loading/performance, and interactions/test coverage. B ran separately after A. CLI **2.26.0** listed `claude-opus-5.5`; `portfolio_frontend_review` pins that model, engine v2, requested effort high, read/grep/glob only. Six wrapper attempts returned empty results and were independently rejected; six direct sessions completed with exit 0 and nonempty successful output. **The provider did not report served-model identity**, so this is verified configuration/availability evidence, not runtime identity proof. [Session IDs and actual read calls](assets/2026-09-30/review-provenance.json).

The repository kiro-delegate skill and actual script were read before use. Direct fallback was allowed by the audit prompt; no silent Auto substitution occurred. Codex used task-delivery and the pstack orchestration, evidence and writing guidance. The Prove It Works principle governed acceptance: source hypotheses were tested against actual rendered behavior before issue creation.

## Excluded claims and remaining gaps

- Home Back reset is refuted by the corrected departure measurement (898→898). Other Work return remains reproduced separately.
- T3 requestAnimationFrame probes returned no frames even for a scheduled control callback. All T3 timing counts were discarded; production work counts come from functioning local Chromium.
- No-JS `/case-studies` without a trailing slash returned a SPA fallback in local preview. This does not disprove the generated static page; no empty-content issue was filed.
- Large image candidates (1008px portrait rendered at 236px, 73KB; featured PNG ~510KB) and route-bundle deferral may deserve measured experiments. No before/after optimization or field impact was established, so no additional issue was filed for them.
- Dedicated font/render-count traces, physical touch, assistive-technology speech, full WebKit/Firefox coverage, native 200% zoom, deployed Apache rewriting/caching and real contact delivery remain unverified. Hero reduced-motion behavior was source/route sampled, not independently profiled for battery/CPU impact.
- Early blank screenshots, stale summaries and failed harness runs were discarded or explicitly corrected. Raw Kiro streams, thought chunks, detector token, full form/page body, absolute user paths and private client material are not delivered.

## Delivery and cleanup

A fresh independent Codex report review found no blocking defects. Its accepted corrections tightened source pointers, image-inspection attribution and probe conditions. The PR contains only this report and sanitized evidence under `docs/audits/assets/2026-09-30/`. Open issues and remote report branch remain for review; this PR does not authorize merging or production release. Existing generated `dist` was refreshed by the build and reused Vite/contact cache directories may have regenerated ignored files; authored dirty/untracked baseline content was preserved. No attempt was made to restore disposable cache bytes or remove unrelated QA folders.

Task-owned development/production/detector processes and external disposable artifacts are stopped/removed after PR verification. The primary checkout stays on the report branch. Delivery verification compares dirty contents with the original baseline, checks remote commit/PR head, and inventories task-owned cleanup separately. CI state is reported at PR delivery, not inferred from local checks.
