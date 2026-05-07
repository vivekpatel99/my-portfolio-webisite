# CLAUDE.md

Behavioral guidelines + project-specific guidance for Claude Code (claude.ai/code) when working in this repository.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## Behavioral Guidelines

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure `bun run lint` and the build pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project Constraints

**DO NOT modify or break Horizons-related code.** This project is synced with Hostinger Horizons platform. The following must remain unchanged:
- `plugins/` directory (visual-editor, selection-mode, iframe-route-restoration)
- Error handlers in `vite.config.js` (horizons-vite-error, horizons-runtime-error, etc.)
- `window.parent.postMessage()` patterns for Horizons communication

If a task seems to require touching this code, stop and ask first (rule #1).

## Git Workflow

**Branch Structure:**
- `main` = Production (strict protection, manual deploy to Hostinger)
- `dev` = Development/staging (PR required)
- `feature/*` = Feature branches (created from dev)

**NEVER commit directly to main or dev. Always use PRs.**

Workflow: `feature/* → PR → dev → PR → main → manual deploy`

```
feature/* ──PR──> dev ──PR──> main ──manual──> Hostinger (production)
                   │            │
                   │            └── CI: Build + Lint + Lighthouse
                   └── CI: Build + Lint
```

## Commands

```bash
# Development
bun run dev          # Start dev server on port 3000

# Production
bun run build        # Generate sitemap + build for production
bun run preview      # Preview production build on port 3000

# Code Quality
bun run lint         # Run ESLint
bun run lint:fix     # Run ESLint with auto-fix
bun run format       # Format code with Prettier
bun run format:check # Check formatting
bun run precommit    # Run staged-file checks used by .husky/pre-commit
bun run verify       # Run full pre-push verification (lint + build)
bun run prepare      # Install Husky git hooks after dependency install

# Browser automation / UI verification (Playwright CLI — NOT MCP)
bunx playwright --help                # CLI reference
bunx playwright codegen http://localhost:3000   # Record interactions
# Ad-hoc checks: write a tiny script under tools/ or playwright-output/
#   then run: bunx playwright test <file>  (or use `node` with chromium API)

# Performance / SEO
bunx lhci autorun    # Local Lighthouse CI (uses lighthouserc.json)
```

## UI Verification Policy

**Use Playwright CLI, not the Playwright MCP server** (token efficiency — MCP responses are large).

When a task requires verifying UI, accessibility, or visual behavior:
1. Start `bun run dev` (or `bun run preview` for prod build).
2. Write a short Playwright script (one-off file in `playwright-output/` or `tools/`) that:
   - Navigates to the page, waits for the relevant section, asserts what matters.
   - Captures a screenshot to `screenshots/` only if visual confirmation is needed.
3. Run via `bunx playwright test <file>` or a plain `node` script using `chromium` from `@playwright/test`.
4. Delete throwaway scripts after the task — don't leave dead automation behind.

Prefer text assertions (selectors, accessible names, computed styles) over screenshot diffs unless the task is explicitly visual.

Verification before claiming done: `bun run lint` and `bun run build` must pass. For UI changes, also run a Playwright check.

## Git Hooks

Husky hooks are installed through `bun run prepare` and Git should report `core.hooksPath` as `.husky/_`.

- `.husky/pre-commit` blocks direct commits to `main` and `dev`, then runs `bun run precommit`.
- `bun run precommit` runs `lint-staged`, which fixes staged source files, root JS/JSON config files, and docs files with ESLint/Prettier where configured.
- `.husky/pre-push` runs `bun run verify`.
- `bun run verify` runs `bun run lint && bun run build`.

If a hook fails, fix the reported issue and rerun the same command manually before retrying the Git operation. Do not use `--no-verify` unless the user explicitly approves a one-off bypass.

## Architecture

React portfolio website for Vivek Patel (vivekapatel.com), built with Vite using a section-based single-page architecture.

### Tech Stack
- **React 18** with react-router-dom for routing
- **Vite** for build tooling with custom plugins in `plugins/`
- **Tailwind CSS** with CSS variables for theming (dark mode by default, bg: #0C0D0D)
- **Framer Motion** for animations
- **Radix UI** primitives for accessible UI components (in `src/components/ui/`)
- **Sentry** for error tracking

### Key Structure

- `src/pages/` — Route pages (Home, Contact, Project/:projectId, Legal, DataPolicy)
- `src/components/` — Home page sections (Hero, TechStack, Services, About, Experience, Portfolio, Testimonials, Stats, Connect, CTA) and shared components
- `src/components/ui/` — Radix-based UI primitives (button, input, toast, select, etc.)
- `src/lib/utils.js` — Contains `cn()` helper for Tailwind class merging
- `src/config/links.js` — External links configuration
- `tools/generate-sitemap.js` — Sitemap generator (runs automatically on build)

### Layout Pattern
`Layout.jsx` wraps all routes with Header, Footer, CustomCursor, GoogleAnalytics (consent-gated), and CookieConsentBanner. Uses `<Outlet />` for nested routes.

### Path Aliasing
`@/` maps to `src/` directory (configured in vite.config.js).

### Animations
`SectionAnimator` component wraps home page sections for scroll-triggered animations via Framer Motion.
