# Frontend skills for Codex and Kiro

Installed at repository scope on 2026-09-30. Use the
[audit and implementation prompts](kiro-opus-frontend-audit.md) in a new Codex
session. The audit produces verified issues and a report PR; later sessions fix
one issue or shared root cause at a time.

## Installed packages

| Skill | Purpose | Codex | Kiro |
| --- | --- | --- | --- |
| Impeccable | Design critique, layout, responsive behavior, motion, polish | `.agents/skills/impeccable/` | `.kiro/skills/impeccable/` |
| Vercel Web Design Guidelines | Interface and accessibility requirements | `.agents/skills/web-design-guidelines/` | `.kiro/skills/web-design-guidelines/` |
| Vercel React Best Practices | Compatible rendering, loading, and JavaScript performance rules | `.agents/skills/vercel-react-best-practices/` | `.kiro/skills/vercel-react-best-practices/` |

Impeccable uses the upstream compiled package for each provider. Its Codex and
Kiro references differ, so each provider has its own complete copy. The two
Vercel Kiro paths are relative symlinks to their Codex copies. They resolve
inside the repository and survive a normal macOS/Linux clone.

The packages were installed through the Codex skill installer's pinned GitHub
installation mode. [Provenance](frontend-skills-provenance.json) records exact
commits, upstream paths, declared versions, licenses, and local adjustments.
Impeccable's Apache license is copied from the pinned repository root. The
Vercel React skill declares MIT in its entrypoint; the pinned Vercel repository
has no standalone root license file. The web guideline skill declares no
license field. Two generated asset-producer handoff links have a documented local repair.
Reapply that repair when updating until upstream supplies the correction.

Sources: [Impeccable](https://github.com/pbakaus/impeccable),
[Vercel agent skills](https://github.com/vercel-labs/agent-skills), and
[current interface guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md).
Update deliberately from a reviewed upstream commit, then repeat discovery and
profile validation. Avoid an unpinned overwrite during an audit.

## Kiro profiles

Both workspace profiles explicitly set `model: claude-opus-5.5` and register all
three entrypoints as `skill://` resources:

- `portfolio_frontend_review`: read, grep, and glob only. Codex coordinates
  shell/browser evidence, GitHub writes, and report delivery.
- `portfolio_frontend_implement`: adds write and shell capabilities for the
  assigned issue. Those capabilities are untrusted by default; the caller must
  authorize them for the bounded implementation. Git delivery stays with Codex.

The profiles include this repository's `AGENTS.md` and design-system document.
They deliberately select their resources instead of loading unrelated copied
KinSame steering. They disable project MCP imports and do not install hooks or
change global settings. They do not delegate to another model.

Validate and list them from the repository root:

```sh
kiro-cli agent validate --path .kiro/agents/portfolio_frontend_review.json
kiro-cli agent validate --path .kiro/agents/portfolio_frontend_implement.json
kiro-cli agent list
```

For a bounded read-only review, supply an external prompt file:

```sh
kiro-cli chat --agent portfolio_frontend_review --agent-engine v2 \
  --no-interactive --effort high --trust-tools=read,grep,glob \
  < /absolute/task-directory/review-prompt.txt
```

The saved prompts require Opus to **invoke and use** the skills: read their
entrypoints, load relevant references, apply project-compatible rules, and
report what it actually read. Kiro's read-only profile cannot fetch web rules
or execute the Impeccable launcher. Codex must supply those outputs. A full
Impeccable critique needs isolated design and evidence assessments, which Codex
coordinates without giving the design reviewer the detector findings first.

## Verification and limits

Kiro CLI 2.26.0 validated both profiles and listed them as workspace agents.
A real noninteractive, read-only session exited successfully and read all
three entrypoints, Impeccable's `audit.md` and `critique.md`, a React rule,
`package.json`, and `Services.jsx`. Kiro correctly identified the React 18/Vite
stack and marked runtime geometry as unverified. Its tool trace confirmed the
reads. This was a discovery test, not a website audit.

The agent configured Opus 5.5, but the runtime did not expose served-model
identity. Recheck model availability and distinguish configuration from runtime
proof in future sessions. The smoke did not fetch current remote interface
guidelines; the coordinating agent must fetch them for actual reviews.

Both Impeccable launchers have executable permissions. The Kiro launcher passed
`engine-probe` with engine 0.1.8 and successfully loaded project context. It
found an existing visual implementation without `PRODUCT.md` or `DESIGN.md`;
scoped refinement can preserve the existing design without initializing either
file. Runtime downloads used an external temporary cache through
`IMPECCABLE_HOME`. No generated product context or automatic hooks were added.

All three Codex entrypoints passed the bundled skill frontmatter validator.
The native Kiro package uses its own upstream metadata shape; it was validated
through Kiro agent discovery and real resource loading. 188 original
package files match their pinned upstream content byte-for-byte; two generated
asset-producer references have the recorded relative-link repair. Local skill
references resolve, and both Vercel Kiro symlinks resolve to their Codex copies.

New Codex sessions discover `.agents/skills/`; Kiro discovers the workspace
profiles and their registered skills. React performance rules must be filtered
for React 18/Vite. Next.js server APIs and newer React APIs are not blanket
recommendations for this project. Keep the approved detection-frame identity,
invoice hero, portrait badges, commercial terms, and factual content.
