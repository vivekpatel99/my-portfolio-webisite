---
name: task-delivery
description: Finish repository-changing tasks with verified PR delivery, preservation of existing work, and cleanup of task-owned temporary files and worktrees.
---

# Deliver a task and clean up

Use this workflow whenever a task creates or changes repository files. Follow
the user's explicit delivery scope and `AGENTS.md`. Read
`docs/git-workflow.md` for branch and release rules.

## Record ownership before editing

1. Record the current branch, HEAD, and intended PR base.
2. Create a unique temporary directory outside the repository.
3. Run `python3 .agents/skills/task-delivery/scripts/check.py snapshot /absolute/task-directory/baseline.json`.
4. Record task-owned repository paths, temporary paths, and process IDs in that
   directory. Record whether the checkout is primary, shared, or task-owned.
5. Create the task branch from current `develop`. If dirty work blocks a branch
   switch, preserve it and use a safe delivery method. Never reset it away.

If this skill is being added for the first time, capture the baseline before
creating it. Do not capture a new baseline to conceal task-created leftovers.
Keep the baseline outside the repository and do not publish its contents.

## Verify and create the PR

1. Run checks appropriate to the change and inspect the intended diff.
2. Stage only task-owned paths. Inspect the staged diff before committing.
3. Commit on the task branch and push it. Verify the remote branch SHA equals
   the delivered commit.
4. Create or update the PR into `develop`. Verify its base, head branch, and
   head SHA. Attach the PR to the Codex chat with `attach_artifact`.
5. Record the PR URL and verification results. State pending CI accurately.
   PR creation does not authorize merging or a production release.

For an explicit local-only task, retain only the requested deliverables and
report their paths. Describe their difference from the baseline. Do not claim
the PR delivery check passed while intentional local changes remain.

## Clean up and check the result

1. Stop only processes started for this task and no longer needed.
2. Remove task-created disposable files using the recorded ownership list.
   Move durable evidence into the PR before removing its temporary copy.
3. Run `python3 .agents/skills/task-delivery/scripts/check.py check /absolute/task-directory/baseline.json`.
   A nonzero exit means the dirty state differs from the baseline. Investigate
   every difference. Preserve another task's concurrent changes and report
   them explicitly. Never delete or commit another task's work to pass.
4. After PR verification, retire the task-owned worktree if nothing needs it.
   Inspect its dirty state, active processes, pushed commit, and needed ignored
   files first. Archive managed Codex worktrees with `archive_worktree`.
   Remove an ordinary worktree only when clean and unused, using
   `git worktree remove` without force from another checkout.
5. Preserve the primary checkout and shared, pinned, or in-use worktrees.
   If review or CI repair still needs a worktree, report the reason and retire
   it when that dependency ends. Keep the PR and remote branch available.
6. Report the PR URL, checks run, cleanup completed, and any retained dirty
   paths or worktree. Then remove the task's temporary directory if no required
   evidence or recovery data remains there.

The check compares dirty diffs and untracked file contents. It does not verify
the PR, remote SHA, ignored files, processes, or worktree ownership. Complete
those checks separately. If a required step is blocked, report the task as
incomplete with the exact blocker and remaining files.
