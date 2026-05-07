# Codex Claude Mirroring Design

**Goal**

Mirror this repository's Claude Code operating rules into Codex without duplicating instruction text, so future updates remain centralized in the existing Claude files.

**Decision**

Use a thin root `AGENTS.md` as Codex's native project entrypoint and keep the existing `CLAUDE.md` and `.claude/CLAUDE.md` as the canonical instruction sources.

**Why**

- Codex natively looks for `AGENTS.md`, so a small wrapper is the cleanest integration point.
- Referencing the Claude files avoids drift from duplicated instruction text.
- Codex-specific behavior belongs in `.codex/config.toml`, not in copied prose.

**Planned Changes**

1. Add `AGENTS.md` at the repository root.
2. In `AGENTS.md`, instruct Codex to read `CLAUDE.md` and `.claude/CLAUDE.md` as the source of truth.
3. Add only Codex-specific translations in `AGENTS.md`, especially where Claude-specific terms need a Codex equivalent.
4. Add `.codex/config.toml` with current Codex-supported project settings from the latest official docs.

**Instruction Model**

- `CLAUDE.md` remains the source of truth for project constraints, architecture notes, verification commands, and Horizons-specific safety rules.
- `.claude/CLAUDE.md` remains the source of truth for repo workflow expectations such as GitHub issue review, task tracking, and compacted-context recovery files.
- `AGENTS.md` acts as the Codex-native index into those files plus a small Codex adaptation layer.

**Codex-Specific Adaptations**

- Where `.claude/CLAUDE.md` says to use sub-agents, Codex should use its own agent delegation tools when available.
- Where context is compacted or cleared, Codex should reread `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, and the session tracking files referenced there.
- Codex configuration should prefer project-local `.codex/config.toml` instead of embedding tool settings in prose.

**Configuration Choices**

- Set a current Codex model default in `.codex/config.toml`.
- Set `personality = "pragmatic"` to match the intended working style.
- Set `web_search = "live"` so Codex defaults to fresh web results when browsing is needed.
- Add `project_doc_fallback_filenames = ["CLAUDE.md"]` as a safety net, while keeping `AGENTS.md` primary.

**Non-Goals**

- Do not rewrite or merge the Claude files into a Codex-only instruction file.
- Do not change existing project workflow, architecture, or Horizons constraints.
- Do not add user-level Codex settings outside this repository.
