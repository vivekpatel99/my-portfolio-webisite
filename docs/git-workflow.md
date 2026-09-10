# Git workflow

This repository uses two long-lived branches and short-lived working branches.

## Branch roles

| Branch | Purpose | Direct pushes |
| --- | --- | --- |
| `main` | Production-ready code and the source for live releases | Blocked |
| `develop` | Integrated user-acceptance version of the next release | Blocked |
| `codex/*`, `cursor/*`, or another short-lived branch | One bounded feature, fix, revert, or documentation change | Allowed |

`develop` is not a second production branch. It is the place where individually
reviewed changes are combined and tested together before release.

## Normal change flow

Ordinary feature, fix, documentation, and unreleased-revert work targets
`develop`; it must not bypass integration testing by targeting `main` directly.

1. Update local `develop` from `origin/develop` without rewriting history.
2. Create a short-lived branch from `develop`.
3. Implement one coherent issue and add proportionate tests.
4. Open a pull request into `develop`.
5. Require the `test-and-build` check to pass and resolve all review threads.
6. Merge the pull request into `develop`.
7. Test the complete website from `develop`, including interaction between
   changes. Record newly discovered defects as separate fixes.
8. Implement each defect on a short-lived branch and merge its pull request
   into `develop` after verification.

Do not fix or revert by committing directly on `develop`. The pull request is
the audit trail for why the integration changed.

## Production release

1. Confirm `develop` contains the exact release candidate.
2. Run unit tests, the production build, passive local browser QA, and the
   repository diff checks. Never use the live contact-submission test as a
   routine release check.
3. Open a pull request from `develop` to `main`.
4. Wait for required CI and review-thread resolution on the final head commit.
5. Review the complete local release candidate with the repository owner.
6. Merge only after explicit approval to release to production.
7. Verify the actual production deployment separately; a merged pull request
   or green CI result is not deployment proof.

## Reverts and hotfixes

- If an unreleased change is rejected on `develop`, create a revert or repair
  branch from `develop` and merge the corrective pull request into `develop`.
- If production must be rolled back, create a revert branch from `main`, verify
  it, and merge a pull request into `main`. Then synchronize the same rollback
  into `develop` through a pull request so the reverted change cannot return in
  the next release. Never force-push or reset shared branches.
- For an urgent production hotfix, branch from `main`. After the fix is merged
  into `main`, merge `main` back into `develop` through a pull request so the
  branches do not silently diverge.

## Protection policy

Both `main` and `develop` should enforce:

- changes only through pull requests;
- the `test-and-build` status check with the branch up to date;
- resolved review conversations before merge;
- protection for administrators as well as collaborators;
- blocked force-pushes and branch deletion.

This is a solo-maintainer repository, so the protection rule does not require a
separate approving reviewer. Explicit owner approval remains the release gate
for `develop` to `main`. If another trusted maintainer joins, require at least
one approval and dismiss stale approvals after new commits.

## Practical habits

- Keep each pull request small enough to understand and revert independently.
- Link the originating issue and state observable acceptance checks.
- Stage only task-owned paths; preserve unrelated local work.
- Prefer a new corrective commit or revert pull request over history rewriting.
- Delete short-lived remote branches after merge when they are no longer needed;
  retain `main` and `develop` permanently.
- Tag intentional production releases so deployed versions are easy to identify.
