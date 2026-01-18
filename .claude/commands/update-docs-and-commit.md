# Update Docs and Commit

Usage: /update-docs-and-commit [optional commit message or description]

What it does:
1. Analyzes git changes (status + diff)
2. Updates docs/changelog.md - adds entries for new features/fixes
3. Updates docs/architecture.md - only if structural changes occurred
4. Updates docs/project_status.md - moves completed items, updates progress
5. Stages and commits all changes

The command is conservative by design - it only updates docs that genuinely need updates based on the actual code changes.

## Instructions

1. Run `git status` and `git diff` to understand what changed
2. Read the current state of these files:
   - docs/changelog.md
   - docs/architecture.md
   - docs/project_status.md
3. Based on the changes:
   - **changelog.md**: Add a new entry under the appropriate section (Added, Changed, Fixed, Removed) with today's date if significant changes were made
   - **architecture.md**: Only update if new modules, components, or structural changes were introduced
   - **project_status.md**: Update progress on tasks, move completed items, add any new tasks discovered
4. Stage all changes including the doc updates
5. Create a commit with the provided message or generate an appropriate one based on the changes

## Commit Message Format

If no message provided, generate one like:
```
feat: <brief description of main change>

- Updated changelog with new features/fixes
- [if applicable] Updated architecture docs
- [if applicable] Updated project status

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## User Input

$ARGUMENTS
