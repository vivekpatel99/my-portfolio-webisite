# Codex Claude Mirroring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Codex-native project entrypoint and config that mirror existing Claude instructions by reference instead of duplication.

**Architecture:** Keep `CLAUDE.md` and `.claude/CLAUDE.md` as the canonical instruction sources. Add a thin `AGENTS.md` wrapper for Codex plus a project-local `.codex/config.toml` for Codex-native settings.

**Tech Stack:** Markdown project instructions, Codex project config (`.codex/config.toml`)

---

### Task 1: Add Codex Project Instructions

**Files:**
- Create: `AGENTS.md`
- Reference: `CLAUDE.md`
- Reference: `.claude/CLAUDE.md`

- [ ] **Step 1: Write the root Codex entrypoint**

Create `AGENTS.md` that:
- points Codex to `./CLAUDE.md` and `./.claude/CLAUDE.md`
- declares those files the source of truth
- adds only Codex-specific translation notes

- [ ] **Step 2: Verify paths and wording**

Run: `sed -n '1,220p' AGENTS.md`
Expected: references to both Claude files and no duplicated long instruction blocks

### Task 2: Add Project Codex Configuration

**Files:**
- Create: `.codex/config.toml`

- [ ] **Step 1: Write the project-scoped Codex config**

Create `.codex/config.toml` with:
- schema header
- current supported keys only
- project defaults for model, personality, and live web search
- fallback filename support for `CLAUDE.md`

- [ ] **Step 2: Verify config readability**

Run: `sed -n '1,220p' .codex/config.toml`
Expected: valid TOML structure with no deprecated key usage

### Task 3: Record the Design and Plan

**Files:**
- Create: `docs/superpowers/specs/2026-04-25-codex-claude-mirroring-design.md`
- Create: `docs/superpowers/plans/2026-04-25-codex-claude-mirroring.md`

- [ ] **Step 1: Save the approved design**

Write the design rationale and decisions into the spec file.

- [ ] **Step 2: Save the implementation plan**

Write the execution plan into the plan file.

- [ ] **Step 3: Verify created artifacts**

Run: `rg -n "CLAUDE.md|AGENTS.md|config.toml" docs/superpowers/specs docs/superpowers/plans AGENTS.md .codex/config.toml`
Expected: matching references in the new files
