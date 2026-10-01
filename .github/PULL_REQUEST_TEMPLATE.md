## What changed

<!-- Describe one coherent change and link its issue. -->

## Issues

<!-- Use one standalone line per issue, outside this comment.
Closes #123 means every acceptance criterion is met and the issue should close
when this PR merges into develop. Fixes/Resolves are also supported.
Refs #123 means partial work or remaining acceptance/release checks; keep it open.
For work without an issue, write No issue: followed by a specific reason.
Only same-repository #number references are supported by the develop automation.
Do not put production-verification issues on a Closes line before live verification.
-->

## Target branch

- [ ] `develop` for integration and user-acceptance testing
- [ ] `main` for an explicitly approved production release, urgent hotfix, or
      reviewed production rollback

## Verification

- [ ] Relevant automated tests pass
- [ ] Production build passes
- [ ] User-facing behavior was checked locally when applicable
- [ ] No live contact submission or production mutation was performed
- [ ] Unrelated local work was preserved

## Release boundary

<!-- State whether this PR is integration-only or explicitly authorized for production. -->
