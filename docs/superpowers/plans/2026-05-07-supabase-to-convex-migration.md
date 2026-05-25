# Supabase To Convex Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the portfolio website's current Supabase backend surface to Convex with the least app churn possible.

**Architecture:** Add Convex as the app-wide data provider in `src/main.jsx`, move the `/contact` submit path to Convex functions, and remove Supabase only after the contact path and legal copy are migrated. Treat historical Supabase lead import as optional because the current repo only proves one active `leads` write path and no read path.

**Tech Stack:** React 19, Vite 8, Bun, Convex, React Router 7, Tailwind CSS, Sentry, GitHub issue `#19`.

---

## Current Evidence

- Active tracking issue: `#19` "Migrate portfolio backend from Supabase to Convex" is open and in Project `Personal Projects Manager` with status `Todo`.
- Supabase client: `src/lib/customSupabaseClient.js` hardcodes the project URL and anon key.
- Contact write path: `src/pages/Contact.jsx` inserts `{ name, email, budget, description }` into Supabase table `leads`.
- Email side effect: `src/pages/Contact.jsx` invokes Supabase Edge Function `contact-form-email` with lead data plus `recipientEmail`.
- Auth surface: `src/contexts/SupabaseAuthContext.jsx` wraps Supabase auth APIs, but current `src` search found no `AuthProvider` or `useAuth` consumer.
- Legal copy: `src/pages/Legal.jsx` names Supabase as the contact-form database/backend processor.
- Tooling: `bun`, `node`, `npx`, and `gh` are installed locally. `convex` and `supabase` are not globally installed.
- MCP/docs: `.mcp.json` configures Playwright MCP and Context7 MCP only; no Convex/Supabase-specific MCP server is configured. Context7 docs are available and were used for Convex and Supabase CLI references. No Convex/Supabase-specific MCP resources or templates are currently exposed in this session.
- Lockfiles: the repo policy prefers `bun.lock`, and `.gitignore` ignores `package-lock.json`, but `package-lock.json` is still tracked. Do not mix npm lockfile cleanup into the migration unless explicitly approved.

## Guardrails

- Do not touch `plugins/`, Horizons Vite error handlers, or `window.parent.postMessage()` patterns.
- Keep routing in `src/App.jsx`; add the Convex provider at `src/main.jsx`.
- Use Bun for dependency changes.
- Use `bunx supabase@latest` or `npx supabase` for one-off Supabase CLI access because Supabase CLI is not globally installed.
- Do not run `bun run build` unless you are ready to inspect generated `dist/` churn.
- Do not remove Supabase dependency until `rg -n "supabase|Supabase|customSupabaseClient|AuthProvider|useAuth" src package.json` proves no active imports remain.
- Do not delete tracked `package-lock.json` unless you deliberately choose the dependency-lock cleanup path in Task 6.

## Recommended Tools

- Skills:
  - `superpowers:subagent-driven-development` for implementation by task.
  - `superpowers:test-driven-development` for the contact submit path.
  - `superpowers:verification-before-completion` before claiming the migration is done.
  - `superpowers:requesting-code-review` before PR/merge.
- CLI:
  - `bun add convex`
  - `bunx convex dev`
  - `bunx convex deploy`
  - `bunx convex env set CONTACT_EMAIL_TO`
  - `bunx convex env set CONTACT_EMAIL_FROM`
  - `bunx convex env set RESEND_API_KEY`
  - `bunx supabase@latest functions download contact-form-email --project-ref xdmpdzdqjskvaqcgyurn --use-api` if Supabase auth is available.
  - `bunx supabase@latest db dump --data-only -f supabase-leads-data.sql` if historical leads must be imported.
  - `gh issue view 19 --repo vivekpatel99/my-portfolio-webisite`
  - `gh pr create --base dev --head feature/supabase-to-convex --title "Migrate contact backend from Supabase to Convex"`
- MCP:
  - Context7 for current Convex and Supabase CLI docs.
  - GitHub connector or `gh` CLI for issue/PR tracking.
  - No installed Convex/Supabase MCP is required for this migration.
  - Avoid Playwright MCP for UI verification in this repo; use Playwright CLI per `CLAUDE.md`.

## Migration Strategy

1. Ship the current contact form through Convex first.
2. Preserve the current user behavior: a saved lead is success; email notification failure is logged but nonfatal.
3. Remove dead Supabase auth code unless a current consumer is found before implementation.
4. Update legal copy only after Convex is the live backend.
5. Import historical Supabase leads only if they are needed for business records. The site does not read old leads, so this should not block cutover.
6. Use Resend for the replacement email notification if the current Supabase function cannot be recovered.

---

### Task 1: Create Feature Branch And Verify Baseline

**Files:**
- Read: `AGENTS.md`
- Read: `CLAUDE.md`
- Read: `.claude/CLAUDE.md`
- Read: `package.json`
- Read: `src/pages/Contact.jsx`
- Read: `src/main.jsx`

- [ ] **Step 1: Confirm branch and clean worktree**

Run:

```bash
git branch --show-current
git status --short
```

Expected:

```text
dev
```

If there are unrelated local changes, do not overwrite them. Either pause or create a feature branch that preserves them.

- [ ] **Step 2: Create the migration branch**

Run:

```bash
git checkout -b feature/supabase-to-convex dev
```

Expected: branch is `feature/supabase-to-convex`.

- [ ] **Step 3: Capture current Supabase call sites**

Run:

```bash
rg -n "supabase|Supabase|customSupabaseClient|AuthProvider|useAuth|contact-form-email|leads" src package.json
```

Expected: only `src/lib/customSupabaseClient.js`, `src/pages/Contact.jsx`, `src/contexts/SupabaseAuthContext.jsx`, and `package.json` appear.

- [ ] **Step 4: Baseline lint**

Run:

```bash
bun run lint
```

Expected: lint passes before migration changes.

- [ ] **Step 5: Commit nothing**

This task is setup only. Do not commit.

---

### Task 2: Install And Initialize Convex

**Files:**
- Modify: `package.json`
- Modify: `bun.lock`
- Create: `convex/schema.js`
- Create: `convex/contact.js`
- Create: `convex/README.md`

- [ ] **Step 1: Add Convex dependency**

Run:

```bash
bun add convex
```

Expected: `package.json` includes `convex`, and `bun.lock` is updated.

- [ ] **Step 2: Initialize Convex project files**

Run:

```bash
bunx convex dev
```

Expected: Convex creates the `convex/` project files and provides a `VITE_CONVEX_URL` value for local development.

- [ ] **Step 3: Add the leads schema**

Create or replace `convex/schema.js` with:

```js
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    budget: v.optional(v.string()),
    description: v.string(),
    recipientEmail: v.string(),
    createdAt: v.number(),
    emailStatus: v.union(v.literal('not_sent'), v.literal('sent'), v.literal('failed')),
    emailError: v.optional(v.string()),
  }).index('by_createdAt', ['createdAt']),
});
```

- [ ] **Step 4: Add initial contact functions**

Create `convex/contact.js` with:

```js
import { v } from 'convex/values';
import { action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';

const leadArgs = {
  name: v.string(),
  email: v.string(),
  budget: v.optional(v.string()),
  description: v.string(),
  recipientEmail: v.string(),
};

export const createLead = internalMutation({
  args: leadArgs,
  handler: async (ctx, args) => {
    return await ctx.db.insert('leads', {
      ...args,
      createdAt: Date.now(),
      emailStatus: 'not_sent',
    });
  },
});

export const markEmailSent = internalMutation({
  args: { leadId: v.id('leads') },
  handler: async (ctx, { leadId }) => {
    await ctx.db.patch(leadId, { emailStatus: 'sent', emailError: undefined });
  },
});

export const markEmailFailed = internalMutation({
  args: { leadId: v.id('leads'), emailError: v.string() },
  handler: async (ctx, { leadId, emailError }) => {
    await ctx.db.patch(leadId, { emailStatus: 'failed', emailError });
  },
});

export const submitLead = action({
  args: leadArgs,
  handler: async (ctx, args) => {
    const leadId = await ctx.runMutation(internal.contact.createLead, args);
    return { leadId };
  },
});
```

- [ ] **Step 5: Document required Convex environment values**

Create `convex/README.md` with:

```md
# Convex Backend Notes

Required client environment:

- `VITE_CONVEX_URL`: generated by Convex and required by the Vite app.

Required server environment:

- `CONTACT_EMAIL_TO`: recipient for portfolio lead notifications.
- `CONTACT_EMAIL_FROM`: verified sender for contact form notifications.
- `RESEND_API_KEY`: Resend API key, set with `bunx convex env set`.

Current migration scope:

- `leads` table replaces Supabase table `leads`.
- `contact.submitLead` replaces Supabase insert plus `contact-form-email` invoke.
```

- [ ] **Step 6: Run Convex codegen/dev check**

Run:

```bash
bunx convex dev --once
```

Expected: Convex validates `convex/schema.js` and `convex/contact.js`, and generates `convex/_generated`.

- [ ] **Step 7: Commit Convex scaffold**

Run:

```bash
git add package.json bun.lock convex
git commit -m "feat: add convex backend scaffold"
```

---

### Task 3: Wire Convex Provider Into React

**Files:**
- Modify: `src/main.jsx`

- [ ] **Step 1: Add Convex provider**

Modify `src/main.jsx` so the render tree becomes:

```jsx
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import * as Sentry from '@sentry/react';
import App from '@/App';
import ScrollToTop from '@/components/ScrollToTop';
import '@/index.css';
import { Toaster } from '@/components/ui/toaster';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// existing Sentry.init stays here unchanged

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ConvexProvider client={convex}>
      <ScrollToTop />
      <App />
      <Toaster />
    </ConvexProvider>
  </BrowserRouter>
);
```

Keep the existing `Sentry.init` block unchanged except for import ordering needed by ESLint/Prettier.

- [ ] **Step 2: Run lint**

Run:

```bash
bun run lint
```

Expected: lint passes or only reports errors caused by missing generated Convex files. If generated files are missing, rerun `bunx convex dev --once`.

- [ ] **Step 3: Commit provider wiring**

Run:

```bash
git add src/main.jsx
git commit -m "feat: provide convex client to app"
```

---

### Task 4: Move Contact Submit Path To Convex

**Files:**
- Modify: `src/pages/Contact.jsx`
- Modify: `convex/contact.js`

- [ ] **Step 1: Replace Supabase import**

In `src/pages/Contact.jsx`, replace:

```js
import { supabase } from '@/lib/customSupabaseClient';
```

with:

```js
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
```

- [ ] **Step 2: Add action hook**

Inside `Contact`, after state declarations, add:

```js
const submitLead = useAction(api.contact.submitLead);
```

- [ ] **Step 3: Replace Supabase submit body**

Replace the Supabase insert/function block in `handleSubmit` with:

```js
try {
  await submitLead({
    ...leadData,
    recipientEmail: socialLinks.contactEmail,
  });

  toast({
    title: '🚀 Message Sent!',
    description: "Thanks for reaching out! I'll get back to you within 24 hours.",
  });
  setFormState({ name: '', email: '', budget: '', description: '' });
} catch (error) {
  console.error('Error submitting contact form:', error);
  toast({
    title: 'Submission Failed',
    description: 'Something went wrong saving your data. Please try again later.',
    variant: 'destructive',
  });
} finally {
  setIsSubmitting(false);
}
```

Remove the earlier `setIsSubmitting(false)` and duplicate success toast/reset after the Supabase calls.

- [ ] **Step 4: Keep partial-email behavior inside Convex**

Confirm `convex/contact.js` catches email failures and still returns `{ leadId }`. A saved lead must remain a successful user submission.

- [ ] **Step 5: Run lint**

Run:

```bash
bun run lint
```

Expected: lint passes.

- [ ] **Step 6: Commit contact migration**

Run:

```bash
git add src/pages/Contact.jsx convex/contact.js
git commit -m "feat: submit contact leads through convex"
```

---

### Task 5: Replace The Email Function Dependency

**Files:**
- Modify: `convex/contact.js`
- Modify: `convex/README.md`

- [ ] **Step 1: Recover current Supabase function behavior if possible**

If Supabase access is available, run:

```bash
npx supabase functions download contact-form-email --project-ref xdmpdzdqjskvaqcgyurn --use-api
```

Expected: the downloaded function shows which email provider and payload format are currently used.

If access is not available, preserve only the proven frontend contract: recipient email plus lead fields.

- [ ] **Step 2: Choose simplest email provider**

Use the existing provider from `contact-form-email` if recovered. If it is not recovered, use Resend through `fetch` from the Convex action.

- [ ] **Step 3: Set Convex environment variables**

Run interactively or via stdin so secrets do not enter shell history:

```bash
bunx convex env set CONTACT_EMAIL_TO
bunx convex env set CONTACT_EMAIL_FROM
bunx convex env set RESEND_API_KEY
```

Expected: `bunx convex env list` shows the variable names.

- [ ] **Step 4: Implement provider call**

If the existing Supabase function is not recovered, update `submitLead` in `convex/contact.js` so it sends through Resend after the lead is saved:

```js
export const submitLead = action({
  args: leadArgs,
  handler: async (ctx, args) => {
    const leadId = await ctx.runMutation(internal.contact.createLead, args);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.CONTACT_EMAIL_FROM,
          to: args.recipientEmail,
          subject: `New portfolio lead from ${args.name}`,
          text: [
            `Name: ${args.name}`,
            `Email: ${args.email}`,
            `Budget: ${args.budget || 'Not provided'}`,
            '',
            args.description,
          ].join('\n'),
        }),
      });

      if (!response.ok) {
        throw new Error(`Email provider failed with ${response.status}`);
      }

      await ctx.runMutation(internal.contact.markEmailSent, { leadId });
    } catch (error) {
      await ctx.runMutation(internal.contact.markEmailFailed, {
        leadId,
        emailError: error instanceof Error ? error.message : String(error),
      });
    }

    return { leadId };
  },
});
```

If using a provider SDK, keep the same input fields and nonfatal catch behavior.

- [ ] **Step 5: Update backend notes**

Update `convex/README.md` with the actual provider variable names and the command used to set them.

- [ ] **Step 6: Run Convex validation**

Run:

```bash
bunx convex dev --once
```

Expected: Convex functions validate.

- [ ] **Step 7: Commit email replacement**

Run:

```bash
git add convex/contact.js convex/README.md
git commit -m "feat: send contact notifications from convex"
```

---

### Task 6: Remove Supabase Runtime Code

**Files:**
- Delete: `src/lib/customSupabaseClient.js`
- Delete: `src/contexts/SupabaseAuthContext.jsx`
- Modify: `package.json`
- Modify: `bun.lock`
- Modify or delete: `package-lock.json`

- [ ] **Step 1: Reconfirm auth context is unused**

Run:

```bash
rg -n "AuthProvider|useAuth|SupabaseAuthContext|customSupabaseClient|supabase|Supabase" src
```

Expected: no active usages except files scheduled for deletion and legal copy scheduled for Task 7.

- [ ] **Step 2: Delete dead Supabase files**

Run:

```bash
rm src/lib/customSupabaseClient.js src/contexts/SupabaseAuthContext.jsx
```

- [ ] **Step 3: Remove Supabase package**

Run:

```bash
bun remove @supabase/supabase-js
```

Expected: `package.json` no longer includes `@supabase/supabase-js`.

- [ ] **Step 4: Decide tracked npm lockfile handling**

Because `package-lock.json` is tracked even though `.gitignore` says this repo uses `bun.lock`, choose one path:

Preferred narrow cleanup:

```bash
git rm package-lock.json
```

Alternative if the team wants to keep the npm lockfile:

```bash
npm install --package-lock-only
```

Expected: `package-lock.json` no longer contains `@supabase/supabase-js`, or the file is removed in the same dependency cleanup commit.

- [ ] **Step 5: Run Supabase absence check**

Run:

```bash
rg -n "supabase|Supabase|customSupabaseClient|contact-form-email|@supabase/supabase-js" src package.json bun.lock package-lock.json
```

Expected: only legal copy remains, or no results if legal copy was already updated.

- [ ] **Step 6: Run lint**

Run:

```bash
bun run lint
```

Expected: lint passes.

- [ ] **Step 7: Commit removal**

Run:

```bash
git add src/lib/customSupabaseClient.js src/contexts/SupabaseAuthContext.jsx package.json bun.lock package-lock.json
git commit -m "chore: remove supabase runtime dependency"
```

---

### Task 7: Update Legal And Deployment Documentation

**Files:**
- Modify: `src/pages/Legal.jsx`
- Modify: `docs/changelog.md`
- Modify: `docs/PRODUCTION_TEST_PLAN.md` if contact-form backend verification steps are listed there.

- [ ] **Step 1: Update processor copy**

In `src/pages/Legal.jsx`, replace the Supabase processor item with Convex and Resend. If Task 5 kept a different recovered email provider, substitute that actual provider name before committing:

```jsx
<li>
  <strong>Convex:</strong> For database hosting and backend services (contact form
  submissions).
</li>
<li>
  <strong>Resend:</strong> For contact form notification emails.
</li>
```

Use the actual provider name from Task 5 if it is not Resend.

- [ ] **Step 2: Update changelog**

Add a dated entry to `docs/changelog.md`:

```md
## 2026-05-07

- Migrated the contact form backend from Supabase to Convex.
- Replaced the Supabase `contact-form-email` dependency with Convex-hosted notification handling.
- Updated privacy processor copy for the backend provider change.
```

- [ ] **Step 3: Update production test plan if needed**

Search:

```bash
rg -n "contact form|Supabase|Convex|backend|email" docs/PRODUCTION_TEST_PLAN.md
```

If there is a contact-form backend verification row, update it to require Convex persistence and email notification verification.

- [ ] **Step 4: Commit docs/legal**

Run:

```bash
git add src/pages/Legal.jsx docs/changelog.md docs/PRODUCTION_TEST_PLAN.md
git commit -m "docs: update backend provider references"
```

---

### Task 8: Optional Historical Leads Import

**Files:**
- Create: `tools/import-supabase-leads-to-convex.mjs`
- Optional input: `tmp/supabase-leads.json`

Skip this task unless historical contact leads must be preserved in Convex.

- [ ] **Step 1: Export Supabase leads**

If Supabase access is available, run:

```bash
npx supabase db dump --data-only --use-copy -f tmp/supabase-leads-data.sql
```

Expected: `tmp/supabase-leads-data.sql` contains exported data. Do not commit `tmp/`.

- [ ] **Step 2: Prefer manual CSV/JSON export for small data**

For a small `leads` table, export CSV or JSON from Supabase dashboard and convert to:

```json
[
  {
    "name": "Example",
    "email": "example@example.com",
    "budget": "Not specified",
    "description": "Original message",
    "recipientEmail": "contact@example.com",
    "createdAt": 1760000000000,
    "emailStatus": "sent"
  }
]
```

- [ ] **Step 3: Add internal import mutation**

Add this to `convex/contact.js`:

```js
export const importLead = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    budget: v.optional(v.string()),
    description: v.string(),
    recipientEmail: v.string(),
    createdAt: v.number(),
    emailStatus: v.union(v.literal('not_sent'), v.literal('sent'), v.literal('failed')),
    emailError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('leads', args);
  },
});
```

- [ ] **Step 4: Add one-off import script**

Create `tools/import-supabase-leads-to-convex.mjs`:

```js
import fs from 'node:fs/promises';
import { ConvexHttpClient } from 'convex/browser';
import { internal } from '../convex/_generated/api.js';

const convexUrl = process.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error('VITE_CONVEX_URL is required');
}

const filePath = process.argv[2];
if (!filePath) {
  throw new Error('Usage: node tools/import-supabase-leads-to-convex.mjs tmp/supabase-leads.json');
}

const rows = JSON.parse(await fs.readFile(filePath, 'utf8'));
const client = new ConvexHttpClient(convexUrl);

for (const row of rows) {
  await client.mutation(internal.contact.importLead, row);
}

console.log(`Imported ${rows.length} leads`);
```

- [ ] **Step 5: Run import**

Run:

```bash
VITE_CONVEX_URL="$VITE_CONVEX_URL" node tools/import-supabase-leads-to-convex.mjs tmp/supabase-leads.json
```

Expected: script prints imported count and Convex dashboard shows leads.

- [ ] **Step 6: Delete one-off import script unless future imports are expected**

Run:

```bash
rm tools/import-supabase-leads-to-convex.mjs
```

Expected: no one-off importer remains in source unless intentionally kept.

---

### Task 9: End-To-End Verification

**Files:**
- Modify only if needed based on verification failures.

- [ ] **Step 1: Run final Supabase absence check**

Run:

```bash
rg -n "supabase|Supabase|customSupabaseClient|contact-form-email|@supabase/supabase-js" .
```

Expected: no runtime source/package references. Historical docs may still mention old Supabase review plans; do not edit old archived plans unless required.

- [ ] **Step 2: Run lint**

Run:

```bash
bun run lint
```

Expected: pass.

- [ ] **Step 3: Run build**

Run:

```bash
bun run build
```

Expected: pass. Inspect generated `dist/` changes before committing.

- [ ] **Step 4: Start local app**

Run:

```bash
bun run dev
```

Expected: local app serves on port `3000`.

- [ ] **Step 5: Verify `/contact` manually or with Playwright CLI**

Submit a valid contact form. Expected:

- Success toast appears.
- Form resets.
- Convex dashboard/logs show a new `leads` row.
- Email provider receives or logs the notification attempt.
- If email fails, Convex row remains saved with `emailStatus: "failed"` and user still sees the success state only if lead persistence succeeded.

- [ ] **Step 6: Inspect git diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only source/docs/dependency files intended for the migration are changed. Do not accidentally include unrelated `.claude/session-*` files or generated `dist/` unless the PR intentionally tracks them.

- [ ] **Step 7: Final commit if verification changed files**

Run:

```bash
git add docs/PRODUCTION_TEST_PLAN.md convex/contact.js src/pages/Contact.jsx
git commit -m "test: verify convex contact migration"
```

Only run this if verification required tracked test/documentation changes.

---

### Task 10: PR And Issue Update

**Files:**
- No source files.

- [ ] **Step 1: Push branch**

Run:

```bash
git push -u origin feature/supabase-to-convex
```

- [ ] **Step 2: Create PR**

Run:

```bash
gh pr create --base dev --head feature/supabase-to-convex --title "Migrate contact backend from Supabase to Convex" --body "$(cat <<'EOF'
## Summary
- Adds Convex backend/client wiring for the portfolio contact form.
- Moves contact lead persistence and notification handling off Supabase.
- Removes Supabase runtime dependency after migration.
- Updates legal/backend provider copy.

## Verification
- bun run lint
- bun run build
- Manual or Playwright `/contact` submission
- Convex lead row/log verification

Fixes #19
EOF
)"
```

- [ ] **Step 3: Update issue**

Run:

```bash
gh issue comment 19 --repo vivekpatel99/my-portfolio-webisite --body "Migration PR opened. Verification includes lint, build, contact-form submission, and Convex lead/email checks."
```

Expected: issue `#19` has a PR-linked implementation update.

---

## Rollback Plan

If contact submissions fail after deployment:

1. Revert the PR from `dev` or `main`.
2. Restore Hostinger/Horizons environment to the previous Supabase-backed build.
3. Confirm `/contact` writes to Supabase again.
4. Keep Convex project data for debugging, but do not delete Supabase until production contact submissions are stable.

## Decision Needed Before Implementation

Choose the email provider path:

- Recover and port the current Supabase `contact-form-email` provider if Supabase CLI/dashboard access exists.
- Use a new provider from Convex actions if the Supabase function source is unavailable.

Choose historical data policy:

- Skip import for fastest migration because the app does not read old leads.
- Import old leads into Convex if those records are business-critical.
