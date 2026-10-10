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

## Issue completion

The repository default branch is `main`. GitHub's native closing keywords only
close issues when a PR targets the default branch. A `Refs #123` mention requests
no closure on any branch.

Every PR into `develop` must include one of the following outside Markdown
comments, quotes, or code blocks. Use one standalone line per issue.

- `Closes #123` when all acceptance criteria are met. `Fixes` and `Resolves`
  are also supported.
- `Refs #123` for partial work or outstanding acceptance or release verification.
- `No issue: <specific reason>` for work without a tracked issue.

The `issue-reference` check validates this declaration and rejects PR numbers
used as issue numbers. Select it as an additional required branch check to
prevent merges without a declaration. This PR does not change branch protection.

The Issue lifecycle workflow runs on each push to `develop`, finds the PR
associated with that exact commit, verifies that its merge commit and base
repository match, and closes only its explicitly completed same-repository
issues as completed. Existing closed issues are skipped on reruns. PR-body issue
references provide the issue/PR cross-reference; GitHub's Development sidebar
auto-linking still follows its default-branch rules.

The job reads the PR body and its edit timestamp together. If the body was edited
at or after the merge timestamp, it fails before closing any issues. GitHub's
timestamps have second precision, so a same-second edit needs manual review too.
Check the original reviewed
declarations and reconcile issue state manually in that case; editing a merged
PR cannot add or remove automatic closure targets on a rerun.

This uses the reviewed code on `develop`; it does not need the workflow on
`main` or execute an unmerged PR with an issue-write token. It covers merges
through the protected-branch PR workflow, including squash, merge, and rebase
merges whose final commit matches GitHub's `merge_commit_sha`. It does not sweep
historical PRs or infer completion from `Refs`. If a run fails, inspect its error
and rerun that exact push workflow. A merge performed with `GITHUB_TOKEN` will
not trigger another workflow; use the normal maintainer-authorized merge path.

Closing an integration issue means its acceptance criteria are met on `develop`.
It does not prove deployment. Keep issues that require live verification open
with `Refs`, even after an integration merge. Check workflow success and issue
state after every authorized merge.

Sources: [GitHub issue linking](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue),
[workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows),
and [commit-associated PRs](https://docs.github.com/en/rest/commits/commits#list-pull-requests-associated-with-a-commit).

## CI execution

Full CI runs for pull requests into `develop` or `main` and pushes to those
integration/release branches. Feature-branch pushes do not start a second full
pipeline; open a pull request to request remote verification. New commits cancel
older runs for the same pull request. Pushes to `develop` and `main` use one
concurrency group per commit, so no integration or release run is cancelled or
dropped while pending.

Unit tests, the production build, contact lifecycle QA, reduced-motion QA, and
fake telemetry QA run independently; contact lifecycle QA is split into three
test-level shards. Apache service-route QA and four passive browser QA shards
consume the same validated production build, whose archive preserves hidden
deployment files such as `.htaccess`. Each shard publishes its
own reconstructed, sanitized JSON
artifact for seven days; raw browser captures are disabled.

Apache service-route QA serves that archive over local HTTPS using the unchanged
deployment `.htaccess`. It checks service redirects, static content and metadata,
sitemap entries, and real HTTP 404s for unknown service IDs. Run it locally after
building with `npm run qa:apache-services` (a local Docker daemon and OpenSSL
required). This guards hosting behavior that Vite preview cannot establish; production deployment
verification remains separate.

The required `test-and-build` check aggregates every CI job. It runs even when
dependencies fail and rejects failures, cancellations, skipped jobs, and missing
results. Do not replace this gate with a check that merely starts the tests.

CI limits unit-test file workers and passive/contact browser workers to two.
Nested publication fixture test runners also cap file workers at two; the outer
Vitest worker limit does not constrain a child runner.
Passive and contact shards balance individual tests, and contact cases use
isolated contexts. Browser jobs use the browsers bundled in the pinned
Playwright container instead of installing them. Builds and telemetry QA share
`tools/validate-convex-url.sh` for the baked Convex URL check.
Motion QA splits Chromium and WebKit onto separate runners with one worker each
so real animation measurements do not compete within a runner.
WebKit motion checks use a browser window under Xvfb so native fades are rendered
while wall-clock samples run; other browser suites retain their existing mode.
Timer assertions advance the browser clock through the full
tested intervals; motion measurements continue using real animation timing.
Publication fixtures run independent lifecycle chains concurrently, retain two
full application production builds, and use the real publication pipeline with
a smaller browser entry for the remaining transitions.

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

Repository-changing tasks finish through
[the task delivery skill](../.agents/skills/task-delivery/SKILL.md).
Capture the dirty-file baseline before editing. Verify the pushed commit and
PR head, then clean up task-owned temporary files and unused worktrees.
Preserve unrelated work and report every retained path or checkout.
An open PR does not authorize a merge or production release.

- Keep each pull request small enough to understand and revert independently.
- Link the originating issue and state observable acceptance checks.
- Stage only task-owned paths; preserve unrelated local work.
- Prefer a new corrective commit or revert pull request over history rewriting.
- Delete short-lived remote branches after merge when they are no longer needed;
  retain `main` and `develop` permanently.
- Tag intentional production releases so deployed versions are easy to identify.
