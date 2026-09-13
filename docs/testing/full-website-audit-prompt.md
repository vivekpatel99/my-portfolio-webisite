# Full portfolio website audit — new-session prompt

Copy the prompt below into a new session opened in `/Users/viv/Freelance/my-website/horizons-website`.

---

Audit my entire portfolio website for functional correctness, efficiency, code quality, redundant/dead code, test quality and client-facing UI quality. Act as the lead QA engineer and portfolio frontend reviewer. Use separate agents as specified below. Interact with the actual UI, verify findings, then create actionable GitHub issues for confirmed problems. This prompt explicitly authorizes creating those issues after your verification and deduplication; do not ask for approval again for each issue. Do not implement the fixes in this session.

## Context and intended outcome

The website should help potential clients quickly understand my services, assess real project evidence, and contact me. Case studies should feel visually consistent and be easy to add, update or remove. Evaluate usefulness and clarity, not decoration alone. Do not rank the case studies by client attractiveness yet; that is reserved for a separate session.

The current work spans two repositories:

- Website: `/Users/viv/Freelance/my-website/horizons-website`, expected feature branch `fix/restore-completed-case-study-cards`.
- Private content library: `/Users/viv/Freelance/case_study_to_proposal_hub/website-case-studies`, expected parent repo branch `website/case-study-library`.

The full library has 12 draft candidates. Eight use source-project media; four retain explicitly labelled illustrations because original screenshots do not exist. Original-media provenance and exclusions are recorded in `docs/ORIGINAL-MEDIA-AUDIT.md` and `docs/original-media-sources.json` inside the library. Do not confuse the library preview with content already staged for the actual website. Do not claim illustrations are delivered-product screenshots, or mix images between projects. Some completion dates and exact engagement mappings remain unresolved in `catalog.json`.

These are starting pointers, not verified current facts. Discover and record the actual branches, HEADs, dirty status, remotes, served processes and dataset counts before testing. Preserve unrelated staged, modified and untracked work in both repos. Use the current checkout; do not create worktrees. Never commit or push directly to `main` or `develop`. Do not switch away from unfinished task work merely to match these expected names.

## Scope and boundaries

Audit all discovered routes, reusable components, data/publication tooling, static output, backend boundaries, build configuration and tests. Read applicable AGENTS.md instructions and repository QA documentation first. Read Convex's generated guidelines before assessing its APIs.

Use local servers and passive testing. Do not deploy, merge, publish/stage/withdraw case studies, change production data, send email, create a valid contact lead, run live-contact/Convex smoke mutations, or contact clients. Exercise successful form/backend behavior using isolated mocks or the existing local test environment. Label mocked results as such. GitHub issue creation is the only authorized remote write. Never include credentials, staff rosters, private client data, absolute private source paths or unsanitized traces in issues.

Do not edit application behavior to make tests pass. You may create temporary diagnostic tests/scripts and audit reports. Keep audit artifacts separate from product files. Do not install broad audit tooling or upgrade dependencies without a concrete need. Existing lint/type errors, unavailable tools, or blocked checks should be recorded accurately, not silently skipped.

## Team: independent bounded reviewers

Explicitly delegate these lanes. If only four concurrent agent slots are available, run three reviewers alongside the lead, then reuse a finished slot for the fourth lane. Give each agent the verified HEADs, URLs, scope, safety boundaries and report format. Tell them they are not alone in the workspace and must not revert others' work. Reviewers are read-only and must not create GitHub issues; the lead owns deduplication and issue creation.

1. **Code and efficiency reviewer:** architecture, data flow, maintainability, duplication, dead code/assets/dependencies, build/runtime performance, error handling and security/privacy boundaries. Cover code beyond the latest diff.
2. **Desktop frontend tester:** independently browse every local route and major user journey using actual browser interaction. Evaluate desktop/tablet design, information hierarchy, usability, portfolio credibility and unnecessary UI.
3. **Mobile and accessibility frontend tester:** independently browse at small widths and with keyboard/reduced motion/zoom. Evaluate touch behavior, responsive layout, accessibility and interaction edge cases.
4. **Test-quality reviewer:** inspect the tests and identify missing behavioral coverage, weak assertions, excessive mocks, vacuous passing tests, nondeterminism and missing edge cases. Connect gaps to concrete failure modes.

The lead inventories routes, runs baseline checks, investigates cross-cutting failures, independently reproduces each proposed issue, assembles the report and creates deduplicated GitHub issues.

## Establish the test targets

1. Record both repository HEADs and dirty status. Identify the website GitHub remote with `gh repo view`; never assume the remote or issue destination.
2. Inventory actual public routes from routing and generated output, including home, service/section anchors, case-study collection, each published detail route, contact, legal/privacy pages and 404 handling. Also inventory every draft-library detail route.
3. Identify processes listening on ports before reusing or restarting them. Confirm served content corresponds to the recorded checkout/build. Do not stop unrelated processes.
4. Run the website in development and inspect a production build on a separate unused loopback port. Test deep-link loading and refresh in the built version, not only client-side navigation.
5. Prepare the complete draft library with:

   `npm run case-study:library -- prepare --directory /Users/viv/Freelance/case_study_to_proposal_hub/website-case-studies --all`

   Serve it with:

   `npm run case-study:preview -- --candidate .case-study-preview/library/candidate.json --port 4173`

6. Clearly distinguish findings affecting the actual website, production build, private library preview or draft content. Preview-only navigation and unpublished notices are not public website defects simply because they exist.

## Baseline verification

Inspect package scripts and QA configuration before execution. Use the package manager/lockfile already established. Run the unit suite and production build, plus applicable existing local passive browser and SEO checks. Current starting commands include:

- `npm test`
- `npm run build`
- `QA_LOCAL_ONLY=1 QA_ARTIFACT_SAFE_MODE=1 QA_PREVIEW_URL=http://127.0.0.1:<verified-port> npm run qa:playwright:ci`

Replace the port placeholder before running. Inspect the SEO and other QA scripts for target defaults before using them; avoid accidentally hitting production. Run existing lint/type checks only if configured, and identify coverage tooling before invoking it. Capture command, duration, exit code and relevant output. Do not call a check passed if it did not run. Separate existing failures from new regressions and environment/network limitations. Never treat a high coverage percentage or green suite as proof of meaningful coverage.

## Code, efficiency and dead-code audit

- Trace component/data boundaries, publication pipeline, asset delivery, route generation and error handling. Identify excessive coupling, repeated business logic, needless complexity and inconsistent sources of truth with concrete examples.
- Find unreachable functions/components/routes/styles, unused exports/dependencies/assets and duplicate implementations. Verify dynamic imports, generated usage, CSS class construction, build plugins, CLI entrypoints and test-only consumers before declaring anything dead. A text search alone is insufficient.
- Measure built JS/CSS/image sizes, route payloads and major loading costs. Check image dimensions, layout shifts, lazy loading, oversized gallery media, duplicate downloads, fonts, cache behavior and unnecessary requests.
- Investigate observable slow interactions, rerenders, expensive computations and resource leaks. Use profiling/timing evidence; distinguish development overhead, cold/warm cache and blocked external requests.
- Assess input validation, failure/retry/loading/empty states, stale data, malformed slugs, unsafe URLs, content escaping, contact validation and relevant backend authorization boundaries. Do not run destructive or live mutation probes.
- Recommend the smallest useful correction, not a framework migration or speculative refactor.

## Independent frontend interaction audit

Both UI testers must actually interact with the browser; source inspection and screenshots alone do not satisfy this lane. Record a route/viewport/action coverage matrix.

Test representative widths such as 360, 390, 768, 1024 and 1440 pixels, plus 320 where meaningful. Check keyboard-only use, visible focus, tab order, 200% zoom and reduced motion. Verify real headings/landmarks, labels, contrast, alt text, touch targets and accessible control states. Use automated accessibility tools if available, with manual confirmation.

Follow realistic journeys: first-time visitor scans the home page → understands services → opens relevant work → inspects original images → returns to the collection → explores another project → reaches contact. Check browser Back/Forward, reload, direct detail links, invalid URLs, anchors and any filters/sorting/reset controls that actually exist.

For each route, look for:

- Broken links/buttons, dead interactions, misleading click areas and nested/overlapping controls.
- Mobile menu problems, horizontal overflow, clipped text/images, sticky overlaps, excessive blank space, layout jumps and inconsistent spacing/type styles.
- Gallery thumbnail selection, captions, aspect ratios, image loading failures, navigation controls and keyboard behavior where those features exist.
- Inconsistent card sizes, unreadable image overlays, wrong project imagery and ambiguous illustration labels.
- Unnecessary badges, repeated headings, decorative controls that imply nonexistent behavior, redundant CTAs and internal implementation/review language exposed to public visitors.
- Weak service/project clarity, unsupported claims, confusing dates, insufficient evidence or a difficult contact path.
- Loading, empty, one-item, many-item and error states; long titles, long descriptions and missing optional fields via isolated fixtures where needed.
- Contact field validation for empty/whitespace input, malformed email, long text, repeated submission, pending and failure states. Successful delivery must be mocked; never create a real lead.

Separate functional/accessibility defects from optional visual preferences. A design concern needs a specific user impact and page evidence; do not file personal taste as a bug. Preserve the requested dark, image-led portfolio style and uniform cards.

## Test-quality and edge-case audit

Map core behavior to existing tests and identify the meaningful gaps. Inspect whether tests assert outcomes a visitor or system consumer relies on, rather than mirroring implementation details. Check disabled/skipped tests, always-true assertions, swallowed errors, brittle selectors, timing sleeps, order dependence, shared mutable fixtures and mocks that bypass the behavior being claimed.

Prioritize edge cases involving case-study identity, duplicate slugs, add/update/remove lifecycle, publication approval/digest checks, unknown completion dates, missing images, image provenance, gallery-only assets, escaping, malformed input, direct route loads, 404s, contact failures and accessibility. Verify any existing protections before proposing duplicate tests.

When useful, demonstrate a gap with a narrowly scoped temporary regression test or controlled local fixture. Do not mutate source to manufacture a failure. For each gap, state the plausible regression that would slip through and the smallest behavioral assertion that would detect it. Avoid recommending blanket snapshot tests or arbitrary coverage targets.

## Findings and verification gate

Have every reviewer return findings using this structure:

- Short title, lane, affected target and severity.
- Observed behavior versus expected behavior.
- Exact reproduction steps, route, viewport and input/state.
- File/line references at the recorded HEAD where applicable.
- Evidence: sanitized screenshot reference, failing assertion, console/network error or measured result.
- User/business impact, confidence and limitations.
- Smallest suggested fix and testable acceptance criteria.

Use P0 critical, P1 high, P2 normal and P3 low based on actual impact. Do not inflate cosmetic issues. Maintain a separate list of unverified suspicions and optional design suggestions; these must not become confirmed-defect issues.

The lead must independently reproduce or substantiate findings, reconcile reviewer disagreements and merge duplicates by root cause. Do not create one issue per viewport or screenshot when they describe the same defect. Do not combine unrelated fixes into a giant issue.

## Reports and GitHub issues

Write `docs/audits/<date>-portfolio-audit.md` with tested HEADs, scope, commands/results, route/interaction coverage, prioritized verified findings, test gaps, limitations and untested areas. Keep private source evidence in the content library or local ignored artifacts; sanitize the website report before committing it or copying details to GitHub.

Before creating issues, read existing open issues and relevant recently closed issues in the verified website repository. Reuse an existing issue for the same root cause: list its URL in the report rather than posting duplicate comments or reopening it. Use existing labels only when they fit.

Create a new GitHub issue for each remaining verified actionable finding. Issue bodies must contain: problem and impact, affected target/HEAD, reproduction, expected/actual results, sanitized evidence, code pointers, proposed scope, acceptance criteria and validation plan. Explicitly mark preview-only or draft-content findings. Do not upload raw browser traces or private project screenshots. For multiline `gh` issue bodies, write a temporary body file and use `--body-file`.

Only the lead creates issues, after all reviewer reports are reconciled. Record each returned issue URL immediately; check for an existing issue before retrying an uncertain create result. If GitHub access fails, preserve ready-to-submit issue bodies locally and report the exact blocker; do not claim issues were created.

Commit only the sanitized audit report and intentional audit artifacts on an allowed feature/documentation branch. Do not include unrelated work, product fixes, generated build output or private content. Do not push, create a release, merge or deploy.

Finish with a concise summary of what was tested, confirmed issues by priority with GitHub links, existing issues reused, major test-quality gaps and any remaining limits. Clearly distinguish completed testing from planned or blocked checks.
