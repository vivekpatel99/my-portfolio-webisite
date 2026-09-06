# Website Improvement Goal Sequence

This roadmap deliberately separates product decisions, implementation, independent testing, and release acceptance. Run one implementation goal in a fresh Codex task from the latest accepted `main`. Do not start the next goal until the current implementation has passed automated checks, received a fresh-context review, been manually accepted by Vivek, and been merged.

Production deployment, public claims, marketplace publishing, external calendar changes, analytics-provider changes, and real contact submissions remain under Vivek's explicit approval.

## Gate 1 — Evidence and positioning truth

Related GitHub tracker: #12.

```text
/goal Make vivekapatel.com communicate one evidence-backed commercial position without overstating results. Work from the current accepted main branch in an isolated worktree. Read CONTEXT.md, docs/reviews/2026-09-05-astra-codebase-audit.md, src/data/caseStudies.js, and the live website; then discover any other relevant sources. Build a durable claim ledger that classifies each public metric, testimonial, credential, rate, availability statement, and outcome as directly verified, related credential, target/estimate, or unsupported. Never convert an estimate or related benchmark into a project result.

Use that ledger to implement a coherent positioning direction across the hero, proof strip, services, About content, testimonials, SEO, and relevant tests. Resolve internal contradictions such as mixed specialties, duplicated or stale project counts, ambiguous scarcity language, and rates that conflict with linked marketplace profiles. Prefer one clear umbrella promise with honest best-fit and not-best-fit guidance. Remove or replace generic stock proof only when repository evidence supports the replacement. You may make copy and architecture decisions, but stop and report any public claim that needs Vivek's factual approval rather than inventing it.

Complete three passes: evidence/claim consistency, responsive accessibility and interaction review, and full regression verification using the repository's native tests, build, SEO checks, and relevant passive Playwright suites. Do not push, merge, deploy, edit marketplace profiles, or submit a valid contact form. Deliver the implementation, claim ledger, exact unresolved approval questions, and reproducible verification evidence. An evidence-backed and internally consistent positioning foundation on the latest accepted main is your /goal. Work completely autonomously and do not ask me for anything until you are all done.
```

Manual acceptance focus: Does the positioning feel true? Are the claims attributable? Does the primary buyer immediately understand when to hire Vivek?

## Gate 2 — Deep, evidence-safe Case Studies

Related GitHub tracker: #3.

```text
/goal Turn the current Case Studies into evidence-safe technical stories that prove judgment rather than display generic metrics. Start from the latest accepted main in an isolated worktree after Gate 1 is merged. Read CONTEXT.md, src/data/caseStudies.js, src/pages/Project.jsx, and docs/PRODUCTION_TEST_PLAN.md; discover the rendering, SEO, sitemap, and test consumers before changing the content model.

Implement an enforceable Publishing Status and Portfolio-safe Content path for each Case Study. Deepen the stories around the actual situation, constraints, decisions, implementation approach, evidence, result, limitations, and related credentials. Direct project results must remain separate from experience gained on other engagements. Do not fabricate metrics, client identities, dates, screenshots, or causality; clearly downgrade or omit unsupported material. Improve navigation between related Case Studies and matching services where useful. Fix the existing looping/autoplay media accessibility problem and ensure every visual has a meaningful fallback. Keep unpublished material out of rendered routes, SEO, and sitemap output.

Complete three passes: schema/content validation with negative fixtures, UI/accessibility testing across every published Case Study and unknown routes, and full regression verification with unit tests, build, SEO checks, and relevant desktop/mobile Playwright suites. Preserve canonical trailing-slash behavior. Do not publish private source material, push, merge, deploy, or submit forms. Deliver the implementation, evidence gaps, publishing-state behavior, and verification artifacts. Deep, truthful, accessible Case Studies generated only from approved Portfolio-safe Content on the latest accepted main are your /goal. Work completely autonomously and do not ask me for anything until you are all done.
```

Manual acceptance focus: Does every Case Study clearly distinguish fact, inference, and related experience? Does the page show how Vivek thinks?

## Gate 3 — Project Fit Diagnostic

Related GitHub tracker: #2.

```text
/goal Build a focused Project Fit Diagnostic that helps prospective clients decide whether Vivek is the right engineer for their problem. Start from the latest accepted main in an isolated worktree after Gate 2 is merged. Read the accepted positioning and claim ledger, src/components/Services.jsx, src/data/caseStudies.js, and src/pages/Home.jsx; discover the surrounding accessibility and QA conventions before designing the feature.

This is not a job-description scoring tool and not an LLM chatbot. Create a privacy-friendly, deterministic client-side diagnostic for problems such as messy document or web data, slow or unreliable computer vision, fragile AI/n8n workflows, and out-of-scope requests. It must return Strong Fit, Possible Fit, or Not Recommended with plain-language reasons, relevant verified proof, likely risks, a suitable engagement path, and an honest alternative when the work is outside scope. Avoid fake percentages, pseudo-AI language, uploads, external calls, and dark-pattern qualification. Make progress reversible, keyboard accessible, mobile friendly, reduced-motion safe, and shareable without encoding sensitive answers in a URL.

Complete three passes: decision-table tests covering every answer path and contradictory input, interaction/accessibility tests including restart and back navigation, and full build/SEO/passive Playwright regression checks with a measured bundle-impact report. Do not collect or transmit answers yet, alter the backend, push, merge, deploy, or submit forms. Deliver the working diagnostic, documented decision rules, limitations, and reproducible evidence. An honest, deterministic Project Fit Diagnostic integrated into the accepted visitor journey on the latest accepted main is your /goal. Work completely autonomously and do not ask me for anything until you are all done.
```

Manual acceptance focus: Try deliberately good, ambiguous, and bad-fit scenarios. Confirm that the tool is useful even when it says “not recommended.”

## Gate 4 — Intent-aware estimate flow

Related GitHub tracker: #9.

```text
/goal Preserve visitor intent from services, Case Studies, and the Project Fit Diagnostic through a low-friction estimate request. Start from the latest accepted main in an isolated worktree after Gate 3 is merged. Read convex/_generated/ai/guidelines.md first, then inspect src/pages/Contact.jsx, convex/schema.ts, convex/leads.ts, and the accepted diagnostic implementation. Discover all lead validation, email, migration, privacy, consent, and QA consumers before changing the data flow.

Implement a contextual inquiry experience that can carry the originating offer, Case Study, fit outcome, project type, timeline, and current blocker into the form without silently submitting or exposing sensitive data in URLs. Keep optional fields genuinely optional, clearly explain what will be sent, minimize stored data, and preserve direct manual entry for visitors who skip the diagnostic. Any schema evolution must remain compatible with existing Convex documents and email retry behavior. Do not add automatic budget-based priority claims or a Calendly dependency; instead leave a clean adapter point and document the later decision. Preserve anonymous insert-only backend security and existing rate limits.

Complete three passes: frontend/backend validation and compatibility tests, interaction/accessibility testing for every entry path and failure state, and full Convex/unit/build/SEO/passive Playwright verification. Never run the live-contact suite, mutate production Convex data, send email, push, merge, or deploy. Deliver the implementation, migration reasoning, privacy impact, and exact verification commands. A contextual, privacy-conscious estimate flow that preserves qualified visitor intent on the latest accepted main is your /goal. Work completely autonomously and do not ask me for anything until you are all done.
```

Manual acceptance focus: Enter from every service, Case Study, and diagnostic outcome. Confirm the form feels shorter and more relevant, not more invasive.

## Gate 5 — Functional visual proof

Related GitHub tracker: #6.

```text
/goal Add one distinctive visual demonstration that proves Vivek's computer-vision or extraction expertise without becoming decorative performance debt. Start from the latest accepted main in an isolated worktree after Gate 4 is merged. Inspect src/pages/Project.jsx, public/assets/case-studies, src/index.css, and the archived design direction in GitHub PR #31; discover current media, reduced-motion, responsive, and performance tests before selecting the demonstration.

Create a functional visual metaphor rather than a generic particle background. Detection brackets, feature points, scan regions, confidence labels, before/after comparison, or structured-output reveal may be reused only when they explain real evidence. Prefer repository-owned, Portfolio-safe assets and a deterministic local interaction. Do not accept visitor uploads, run browser ML models, introduce Three.js, call external AI services, or imply that a staged demonstration is a live client system. Provide clear captions, keyboard and touch operation, a non-motion fallback, media controls, and explicit labelling of demonstration versus measured production result. Keep the visual language selective so the site remains professional.

Complete three passes: evidence and semantic review, device/accessibility/reduced-motion interaction testing, and performance plus full regression verification. Compare initial JavaScript, media weight, FCP/LCP risk, and visual behavior against the accepted baseline. Do not push, merge, deploy, or alter public evidence. Deliver the demonstration, rationale, asset provenance, performance delta, screenshots, and test evidence. One accessible, truthful, high-signal visual proof experience on the latest accepted main is your /goal. Work completely autonomously and do not ask me for anything until you are all done.
```

Manual acceptance focus: Can a non-technical buyer explain what the demonstration proves? Does it feel like Vivek's work rather than an AI-themed effect?

## Gate 6 — Approval-gated evidence intake

Related GitHub tracker: #18.

```text
/goal Build a local, approval-gated evidence intake path that prevents the portfolio from becoming stale without ever auto-publishing marketplace or private-client material. Start from the latest accepted main in an isolated worktree after Gate 5 is merged. Read CONTEXT.md, the accepted Case Study publishing implementation, src/data/caseStudies.js, and .github/workflows/ci.yml; discover existing source-project conventions and generated SEO/sitemap consumers.

Design the smallest useful workflow for ingesting candidate reviews, projects, credentials, or Case Study updates into a reviewable draft format. The default path must be local files or an explicitly supplied export—not scraping, OAuth, browser automation, credentials, scheduled production writes, or direct commits. Every candidate needs provenance, capture date, platform, evidence classification, privacy review, Publishing Status, and an explicit human approval transition before it can affect rendered pages. The workflow must reject malformed, duplicate, unsupported, unpublished, or potentially sensitive content and leave existing published material unchanged on failure. Adding another source should require an adapter, not changes to publishing policy.

Complete three passes: fixture-based ingestion and idempotency tests, adversarial privacy/publishing-state tests, and full generated-output/build/SEO regression verification. Use only synthetic or already approved fixtures. Do not connect live marketplaces, store credentials, schedule jobs, push, merge, deploy, or publish content. Deliver the local workflow, schemas, operator documentation, failure recovery, and verification evidence. A deterministic evidence inbox with explicit human approval before any portfolio publication on the latest accepted main is your /goal. Work completely autonomously and do not ask me for anything until you are all done.
```

Manual acceptance focus: Import a synthetic update, reject it, approve another, rerun it, and verify that nothing can bypass review.

## Gate 7 — Measurement and release hardening

Related GitHub tracker: #14.

```text
/goal Establish privacy-respecting conversion measurement and produce a release-candidate verification report for the complete accepted website sequence. Start from the latest accepted main in an isolated worktree only after Gates 1–6 are merged. Read docs/reviews/2026-09-05-astra-codebase-audit.md, docs/PRODUCTION_TEST_PLAN.md, src/components/GoogleAnalytics.jsx, and src/lib/consent.js; discover all telemetry, consent, diagnostic, contact, Case Study, and performance paths.

Define a minimal event vocabulary for anonymous journey steps such as service selection, Case Study engagement, diagnostic start/completion/outcome class, contextual contact start, validation failure, and successful submission acknowledgement. Implement only events that answer an explicit product question, and load or emit nothing before valid analytics consent. Do not add Hotjar, PostHog, Clarity, session recording, fingerprinting, free-text capture, or sensitive diagnostic answers. Document which questions cannot be answered safely. Reconcile stale documentation and ensure the final system still has a narrow telemetry seam.

Complete three passes: consent/revocation and event-payload tests, full local functional/accessibility/SEO/performance verification, and an adversarial release review comparing current behavior with every accepted gate. Run only passive production checks; never submit a real lead or claim production Lighthouse results when infrastructure blocks measurement. Do not push, merge, deploy, modify analytics dashboards, or close the release gate yourself. Deliver a release-candidate report, event dictionary, remaining risks, exact manual checks, and reproducible artifacts. A privacy-safe, fully verified release candidate for the complete website improvement sequence on the latest accepted main is your /goal. Work completely autonomously and do not ask me for anything until you are all done.
```

Manual acceptance focus: Verify consent denial and revocation, inspect event payloads, then perform the final cross-device production review after deployment approval.

## Fresh-context tester goal — run after every implementation gate

Create this as a separate read-only task after the implementation task reports completion. Replace `[GATE]`, `[BRANCH OR COMMIT]`, and `[EXPECTED OUTCOME]` before starting.

```text
/goal Independently test [GATE] at [BRANCH OR COMMIT] against its original goal and the latest accepted main. [EXPECTED OUTCOME] is the claimed result. Use a fresh context and behave as an adversarial release reviewer. Do not modify source files, generated files, Git state, GitHub, production data, analytics settings, marketplace content, or deployment state. Never submit a valid contact form or send email.

Read the implementation goal, inspect the actual diff and commit history, then discover the affected interfaces and repository-native verification commands. Test in distinct lanes: specification and evidence integrity; desktop UI and navigation; mobile, keyboard, focus, reduced-motion, and accessibility; data/privacy/security behavior; performance, SEO, console, and regression behavior. Use a real browser against a local production preview for interactive checks. Passive production comparison is allowed only when it creates no external side effect. Re-run relevant focused tests plus the full native test/build gates; do not accept screenshots or the implementation task's summary as proof.

Return one verdict: SHIP, FIX FIRST, or RETHINK. Map every goal requirement to observed evidence, include exact reproduction steps for failures, distinguish defects from tool limitations, and list all untested or manually gated behavior. Confirm repository state is byte-for-byte unchanged by the review except ignored test artifacts, and report any broader sandbox permissions as residual risk. An independent, evidence-backed acceptance verdict for [GATE] at [BRANCH OR COMMIT] is your /goal. Work completely autonomously and do not ask me for anything until you are all done.
```

## Sequence control

For each gate:

1. Create a fresh implementation task from the latest accepted `main` and paste that gate's `/goal`.
2. Review its actual diff and verification evidence.
3. Create a separate fresh tester task with the tester goal.
4. Resolve every `FIX FIRST` or `RETHINK` finding in the implementation task and repeat testing.
5. Vivek manually tests and explicitly accepts the result.
6. Only then create/push the PR, review CI, merge it, verify the new `main`, and start the next gate.

