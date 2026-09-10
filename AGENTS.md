<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Git workflow

- `main` is the production branch. Never commit or push directly to it.
- `develop` is the integration and user-acceptance branch. Never commit or
  push directly to it.
- Start feature, fix, revert, and documentation branches from `develop`, then
  merge them into `develop` through a pull request after required checks pass.
- Promote a tested release with a pull request from `develop` to `main` only
  after explicit user approval. A local pass or a green integration PR does not
  authorize production release.
- Repair rejected changes with a follow-up branch and pull request. Revert a
  merged change with a dedicated revert branch and pull request; do not rewrite
  shared history.
- For an urgent production hotfix, branch from `main`, merge the reviewed fix
  into `main`, then immediately synchronize the same commit back into `develop`
  through a pull request.
- See `docs/git-workflow.md` for the complete branch, testing, release, and
  rollback procedure.
