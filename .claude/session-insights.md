# Session Insights

- Root `CLAUDE.md` says this is a React 18 portfolio website built with Vite, Tailwind CSS, Framer Motion, Radix UI primitives, and Sentry.
- Root `CLAUDE.md` lists `bun` commands for development, build, linting, formatting, and preview.
- `.claude/CLAUDE.md` explicitly says to use `bun` for package management.
- Project constraints prohibit modifying Horizons-related code, including `plugins/`, Horizons error handlers in `vite.config.js`, and `window.parent.postMessage()` communication patterns.
- Repo workflow emphasizes surgical changes and only touching files directly required by the task.
- Session tracking files in `.claude/` are required so work can continue after memory compaction or clearing.
- Current task is closeout for `feature/upgrade-latest-packages`, not new feature implementation.
- Main session refreshed stale latest-package versions after outdated checks found newer releases.
- Verification already run for this closeout: `bun install --frozen-lockfile`, `bun run lint`, `bun outdated`, `npm outdated --json`, `npm audit --audit-level=high`, `bun run build`, and a Playwright preview smoke check.
- Remaining work is git closeout only: commit the branch changes, merge through the repo workflow to `dev`, then verify the merged `dev` state.
- Do not edit package files, docs/plans, `dist`, `public`, or code during this session-tracking update.
- Preserve unrelated edits by others; only the three `.claude/session-*` files are owned by this tracking update.
