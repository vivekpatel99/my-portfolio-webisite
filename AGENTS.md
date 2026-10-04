<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## UI design decisions

- Read `DESIGN.md` before proposing, reviewing, or changing UI. Use its rule IDs
  in theme findings and respect confirmed decisions, existing references, and
  proposed defaults. Do not treat an existing reference as confirmed or as
  proposed.
- Read `docs/design-system.md` for form fields. Use `docs/theme-review.md` for
  whole-site review coverage. Update the guide when the user changes a decision.

## Git workflow

- `main` is the production branch. Never commit or push directly to it.
- `develop` is the integration and user-acceptance branch. Never commit or
  push directly to it.
- Start feature, ordinary fix, unreleased revert, and documentation branches
  from `develop`, then merge them into `develop` through a pull request after
  required checks pass.
- Promote a tested release with a pull request from `develop` to `main` only
  after explicit user approval. A local pass or a green integration PR does not
  authorize production release.
- Repair rejected changes with a follow-up branch and pull request. Revert a
  merged change with a dedicated revert branch and pull request; do not rewrite
  shared history.
- For a production rollback, branch from `main`, merge the reviewed revert into
  `main`, then immediately synchronize that rollback back into `develop`
  through a pull request.
- For an urgent production hotfix, branch from `main`, merge the reviewed fix
  into `main`, then immediately synchronize the same commit back into `develop`
  through a pull request.
- See `docs/git-workflow.md` for the complete branch, testing, release, and
  rollback procedure.
- Every PR into `develop` must include a standalone `Closes #123` line when
  all issue acceptance criteria are met, `Refs #123` for partial work, or
  `No issue: <specific reason>`. Use one line per same-repository issue.
  Merged `develop` PRs close only explicitly completed issues. Keep issues
  requiring production verification on `Refs` until that verification passes.

## Task completion and cleanup

- For every task that creates or changes repository files, follow
  `.agents/skills/task-delivery/SKILL.md`. This includes reports, skills,
  settings, and documentation. An explicit local-only user request overrides
  PR delivery, but still requires cleanup and a report of retained files.
- Before editing, record the branch, HEAD, dirty-file baseline, and task-owned
  paths. Preserve pre-existing changes and untracked files.
- Do not report completion until intended changes are verified, committed,
  pushed, and included in a PR targeting the branch required by the Git
  workflow: `develop` for ordinary work, or `main` for a production rollback
  or urgent hotfix, followed by its required synchronization PR to `develop`.
  Verify each remote commit and PR head. Creating a PR does not authorize
  merging or production release.
- Before finishing, run the delivery check against the starting baseline.
  Account for every new or changed local file. If delivery or cleanup is
  blocked, report the task as incomplete with the blocker and remaining paths.
- Store disposable scripts, screenshots, logs, and review output in a unique
  task directory outside the repository. Commit durable reports and their
  required assets through the task PR. Do not hide leftovers with `.gitignore`.
- After the pushed commit and PR are verified, stop task-owned processes and
  remove task-created temporary files. Never use broad cleanup commands such
  as `git clean -fd` or delete files merely because they are untracked.
- Retire a task-owned worktree after PR creation when no review, CI repair,
  server, or other task still needs it. Verify that required work is recoverable
  from the pushed branch and preserve needed ignored files before retirement.
  Use the Codex archive tool for managed worktrees. For ordinary worktrees,
  remove only a clean, unused checkout with `git worktree remove` without force.
  Preserve primary, shared, pinned, and in-use checkouts. Report the reason and
  next cleanup condition when a worktree must remain. Keep the open PR and its
  remote branch until merge or explicit abandonment.
- Use the current checkout by default. Create a worktree only when the user
  explicitly requests one. Concurrent tasks must not stage each other's files.
