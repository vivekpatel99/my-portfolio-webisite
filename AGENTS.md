# AGENTS.md

This repository keeps its canonical project instructions in existing Claude files. Read them before doing substantive work:

1. `./CLAUDE.md`
2. `./.claude/CLAUDE.md`

Treat those files as the source of truth for project behavior, workflow, architecture, constraints, and verification.

## Codex Notes

- Do not duplicate or rewrite the instruction content from the Claude files unless the user asks for that explicitly.
- Apply the rules from both referenced files together. If they appear to conflict, prefer the more specific file for the current context.
- Where `.claude/CLAUDE.md` refers to Claude-specific features or terminology, use the closest Codex-native equivalent.
- Where `.claude/CLAUDE.md` says to use sub-agents, use Codex agent delegation tools when they are available in the current session.
- Follow the Husky/pre-commit workflow documented in `./CLAUDE.md` and `./.claude/CLAUDE.md`; this file only points to that canonical guidance.
- If conversation history is compacted, cleared, or resumed after a gap, reread this file plus `./CLAUDE.md`, `./.claude/CLAUDE.md`, and any session tracking files those instructions require.
- Keep changes surgical. This file is only the Codex entrypoint, not a second source of truth.
