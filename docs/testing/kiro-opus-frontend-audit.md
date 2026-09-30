# Run the frontend audit with Kiro Opus 5.5

Copy the following prompt into a new Codex session opened at the repository root.
This prompt authorizes an audit, verified GitHub issues, and a report PR. Website
fixes run in later sessions, one issue or shared root cause at a time.

```text
Create a goal to audit current develop, verify findings, create a deduplicated
GitHub backlog, and deliver a sanitized report PR targeting develop. Continue
until that objective is complete or a concrete blocker requires my input.
Use Kiro Claude Opus 5.5 for the deep source investigation. Use Codex for
orchestration, browser evidence, checks, GitHub writes, and delivery.

Read AGENTS.md and task-delivery. Record the branch, HEAD, current remote
develop SHA, canonical GitHub repository, and dirty-file baseline. Use the
current checkout and preserve unrelated work. Do not create a worktree or
switch an in-use checkout away from another task. Audit the verified develop
target, and label any local differences. Never commit directly to develop/main.

Audit the public Horizons React 18/Vite website and local production build.
Do not expand into the separate private case-study library. Read the existing
design-system, visual QA, and audit documents as context. Historical findings
need reproduction against current code. Copied KinSame/kalgo steering and its
automatic context-file writes do not apply to this website task.

Explicitly invoke and use all three installed skills, not merely name them:
- .kiro/skills/impeccable/SKILL.md. Use audit and critique guidance now.
- .kiro/skills/web-design-guidelines/SKILL.md. Fetch current Vercel guidelines.
- .kiro/skills/vercel-react-best-practices/SKILL.md. Load relevant rule files.

Read each entrypoint and the references needed for its assigned lane. Record
the skill and rule paths actually used. Apply only React 18/Vite-compatible
rules. Project requirements override generic aesthetic preferences. Do not
introduce Next.js APIs, a new framework, or unnecessary dependencies.

Use the installed portfolio_frontend_review Kiro agent. It pins Opus 5.5,
exposes these skills as resources, and has read-only tools. Recheck model
availability and CLI version before running. Do not silently substitute Auto.
Distinguish requested configuration from provider-reported runtime identity.

If the local kiro-delegate wrapper is present, read its skill and actual script
before using it. The current script is under .agents/skills/kiro-delegate/scripts,
not .cursor. Set KIRO_REVIEW_AGENT=portfolio_frontend_review,
KIRO_MODEL=claude-opus-5.5, KIRO_EFFORT=high, KIRO_AGENT_ENGINE=v2, and
KIRO_IGNORE_THREAD=1. Give each call unique external prompt/output paths.
An installed wrapper is not required: the agent can also run directly using
kiro-cli chat --agent portfolio_frontend_review --agent-engine v2
--no-interactive --effort high --trust-tools=read,grep,glob, with a prompt file
on stdin. Inspect exit status, nonempty output, and errors independently.

Codex must execute any Impeccable context/detector/browser steps needed by the
skill, and supply outputs to the assigned evidence reviewer. Keep detector
findings out of the independent design assessment. Use an external
task directory for runtime caches and disposable evidence. Set IMPECCABLE_HOME
to that directory when running the Impeccable launcher. Do not install hooks,
initialize new product/design documents, or change skill packages as a side
effect. Report unavailable detector or launcher steps and follow the skill's
documented fallback. For current Web Interface Guidelines, Codex fetches the
official source and supplies the resulting file to Kiro. Do not claim Kiro
ran browser or shell checks when Codex performed them.

Establish the intended design contract before judging consistency. Preserve
the dark Computer Vision identity, violet detection frames, invoice hero,
portrait badges, real project evidence, and existing commercial terms.
Inventory detection cards, form fields, media, controls, and their deliberate
exceptions. Compare frame geometry, color roles, typography, containers,
gutters, spacing, card headings, body text, metadata, actions, and states.
Do not demand identical decoration everywhere or remove approved elements.

Run independent, bounded Opus source-review lanes:
1. Design consistency, bounding boxes, card geometry, and typography.
2. Responsive layout, navigation, galleries, and public routes.
3. Animation, reduced motion, accessibility, and keyboard interaction.
4. Production loading, assets, effects, rendering, and performance.
5. Interaction correctness, error states, and meaningful test coverage.

Cover the whole frontend rather than only recent diffs. Give each reviewer
exact paths, inspected SHA, requirements, and available browser evidence.
Reviewers must not edit or create issues. They share the workspace and must
preserve other tasks. Parallelize independent reading; serialize shared
browser actions and writes. Keep context focused and consolidate by root cause.

For Impeccable critique, Codex coordinates the required isolated Assessment A
(design judgment) and Assessment B (detector/browser evidence). Give A a fresh
Opus review session and keep B evidence out of A. A must finish before detector
findings enter the synthesis context. Use a separate evidence agent for B;
Codex supplies its shell/browser results. The read-only Kiro profile must not
claim to have performed both assessments or nested delegation. Record method,
agent IDs, actual checks, and any degraded-mode reason. Respect bounded visual
verification passes. Skip interactive critique questions with the explicit line
"Questions skipped: audit and issue backlog already authorized." Put any useful
critique snapshot in the delivered report, rather than incidental .impeccable
state. The user-authorized report path overrides generic snapshot persistence.

Inventory all public routes and visitor journeys. Inspect development behavior
and a fresh production build on verified unused loopback ports. Use T3 preview
tools when available, beginning with preview_status and preview_open. Inspect
package/QA scripts before executing npm test, npm run build, applicable passive
browser checks, local SEO checks, and isolated contact lifecycle checks.
Use QA_LOCAL_ONLY=1, QA_ARTIFACT_SAFE_MODE=1, and the actual QA_PREVIEW_URL where
applicable. Inspect artifact paths; safe mode does not relocate every output.
Keep disposable outputs outside the repo, or relocate only task-owned files.

Check all routes at representative desktop/mobile sizes. Include 320, 390,
768, 1024, and 1440px for layout boundaries, plus 200% zoom, keyboard, normal
and reduced motion, breakpoint transitions, history, direct entry, and refresh.
Measure card edges and text/action alignment with varied title/description
lengths and missing optional data using isolated synthetic fixtures. Inspect
clipping, overflow, sticky overlaps, galleries, menus, consent states, and
contact validation/failure states. Successful contact delivery must be mocked.

Profile production loading and interactions before recommending performance
changes. Check bundles, media, fonts, layout shifts, rerenders, long tasks,
and animation work while active, idle, offscreen, and reduced-motion. Avoid
blanket memoization, arbitrary fixed card heights, and unmeasured rewrites.
Record the route/viewport/state/action coverage matrix and actual browser
engines. Local results are not field Core Web Vitals or Apache hosting proof.
Existing WebKit projects cover focus regressions, not the entire website.

Independently verify each finding. Require its audited SHA, affected routes,
actual/expected behavior, reproduction and viewport, source pointers, sanitized
evidence, impact, confidence/limits, smallest correction, measurable acceptance
criteria, validation plan, and dependencies. Separate confirmed defects,
measured optimizations, design/motion enhancements, and unverified hypotheses.
Use P0-P3 severity based on actual impact. Do not file taste as a bug.

Propose purposeful motion using existing libraries where practical. Every
enhancement needs its purpose, trigger, reduced-motion alternative, performance
constraints, and acceptance criteria. Shared design/layout repairs precede
dependent component polish and animation. Do not claim a bug-free website.

Read existing open/closed issues and relevant pending/merged PRs. Check again
before creation. Reuse matching issues in the report without closing, reopening,
or relabeling them. I authorize new issues for independently verified defects,
measured optimization opportunities, and clearly identified design/motion
enhancements. Do not ask permission for each issue. Do not file hypotheses.
Only Codex creates issues after reconciling reviewer reports. Group repeated
symptoms of one shared defect, but keep unrelated fixes separate. Use existing
appropriate labels, sanitized evidence, and temporary gh --body-file inputs.
Check for an existing issue before retrying an uncertain creation result.

Deliver docs/audits/<date>-frontend-quality-audit.md and necessary sanitized
evidence through a documentation branch and PR into develop. Include the
prioritized backlog, issue URLs, reused issues, dependency order, coverage,
actual checks, skill/model provenance, and limitations. Follow task-delivery
and register the PR with T3 when linking tools are available.

Do not implement website fixes, merge, deploy, publish case studies, submit
real leads, or mutate production data. Stop task-owned processes and remove
disposable artifacts while preserving the baseline. Mark the goal complete
only when the audit, verified issues, report PR, and cleanup are delivered.
Finish with links, remaining gaps, and the best first implementation issue.
```

## Fix one issue in a later session

```text
Create a goal to implement GitHub issue <URL> with Kiro Claude Opus 5.5,
verify its acceptance criteria, obtain an independent review, and deliver
a scoped PR targeting develop. Continue through verification and cleanup.

Recheck the issue against current develop. Follow AGENTS.md and task-delivery.
Use the current checkout, preserve unrelated work, and do not create a worktree.
Reproduce first. Use portfolio_frontend_implement for the implementation and
a fresh portfolio_frontend_review session for requirements and code review.
Explicitly invoke the installed Impeccable, web-design-guidelines, and
React best-practices skills. Use relevant layout/adapt/harden/optimize/animate
guidance for this issue and polish guidance for its final review. Record the
references actually used. Enable write/shell tools only for scoped implementation. In a headless run,
use --trust-tools=read,grep,glob,write,shell with this implementation profile,
a bounded issue prompt, and a recorded file allowlist; do not use --trust-all-tools.
The profile keeps writes untrusted by default. For this workflow, the caller
explicitly authorizes the assigned source edits and local verification commands;
Kiro must leave staging, commits, pushes, issue writes, and cleanup to Codex.
Codex runs the Impeccable context helper once and supplies fresh official web
interface guidelines to both implementation and review sessions. Codex runs
required detectors after implementation, and verifies their reported findings.

Codex independently inspects the diff and verifies rendered behavior. Preserve
approved visuals and factual content. Fix the shared root cause within scope.
Check relevant desktop/mobile geometry, states, keyboard access, and normal/
reduced motion. Compare performance under identical conditions when relevant.
Run appropriate checks and deliver a scoped commit, pushed branch, and PR into
develop. Verify remote/PR SHAs and register the PR with T3. Update the issue with
the PR and evidence; keep it open until acceptance and merge conditions are met.
Do not merge or deploy. Clean task-owned artifacts and processes. Finish with
the PR, changes, checks, and material limitations, then complete the goal.
```
