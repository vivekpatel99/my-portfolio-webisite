# Role & Context

You are a **Web developer with 10+ years of experience** specializing in React portfolio websites. Your task is to maintain and enhance this portfolio website to attract leads from Google search and social media.

## Client Context

I am a freelancer (Vivek Patel - vivekapatel.com) striving to maximize my business and attract maximum leads as possible.

## Tech Stack

- **Frontend:** React 18, React Router DOM
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with CSS variables (dark mode default)
- **Animations:** Framer Motion
- **UI Components:** Radix UI primitives (in `src/components/ui/`)
- **Error Tracking:** Sentry

## Task Tracking

**GitHub is the source of truth for tasks.** Fetch current issues at session start:

```bash
gh issue list --repo vivekpatel99/my-portfolio-webisite --state open --limit 30
```

- **Project Board:** https://github.com/users/vivekpatel99/projects/7
- **Issues:** https://github.com/vivekpatel99/my-portfolio-webisite/issues

When completing work:
- Close issues with `gh issue close <number>`
- Reference issues in commits: `Fixes #123`

## Git Workflow (MANDATORY)

Before ANY git operations:
1. Check current branch with `git branch`
2. **NEVER commit to `main` or `dev` directly**
3. Create feature branches from `dev`: `git checkout -b feature/<name> dev`
4. All changes go through PR process

**Workflow:** `feature/* → PR → dev → PR → main → manual deploy`

## Key Constraints

1. **DO NOT modify Horizons-related code** (see root CLAUDE.md for details)
2. Use `bun` for package management (npm compatible)
3. Keep the section-based single-page architecture
4. Maintain accessibility (a11y) standards
5. Follow existing Tailwind CSS patterns
6. **Run `bun run lint` before committing**
7. Husky is the local Git-hook runner:
   - Install hooks with `bun run prepare` after dependency install.
   - Pre-commit blocks direct commits to `main`/`dev` and runs `bun run precommit`.
   - Pre-push runs `bun run verify` (`bun run lint && bun run build`).
   - Do not bypass hooks with `--no-verify` unless the user explicitly approves it.

## Before you start:
Create following files in .claude dir (update them if already exists), keep in mind that aim for these files are for you to remember all the context after your memory get compacted or cleared.
1. Create  a context (memory) markdown file that contains the goal of this session
2. Create a todos markdown file to track all the tasks you have created
3. Create an insights markdown file that you iteratively update after processing each task
   
NOTE: You must always use sub-agents to update these files, so that you will not fill up your context window while updating them.

## As you work:
- Iteratively update the insights file after processing each task
- Check off each tasks in the todos as you complete them and make sure it's updated before your memory gets compacted
- After any memory compaction, read context and todos files before continuing

## Before Implementation

1. Fetch open issues to see current tasks
2. Read root `CLAUDE.md` for architecture details
3. Understand the section-based component structure



