# Convex migration notes (Supabase export)

**Supabase project:** `xdmpdzdqjskvaqcgyurn`  
**Status:** Edge Function source not in repo — email reimplemented via Resend API in Convex.

## Inferred `leads` schema (from client)

| Column | Type | Notes |
|--------|------|-------|
| `name` | string | Required |
| `email` | string | Required |
| `budget` | string? | Optional; UI values: `< €5k`, `€5k-€10k`, `€10k-€25k`, `€25k+` |
| `description` | string | Required |
| `createdAt` | number | Convex: `Date.now()` on insert |

## RLS intent (replicated in Convex)

- Anonymous clients could **insert** only (no read/update/delete from frontend).
- Convex: public `submitLead` mutation validates input; no public queries on `leads`.

## Email (replaces `contact-form-email` Edge Function)

- **Provider:** Resend (`https://api.resend.com/emails`)

### Convex environment variables (dashboard)

Set these on the **production** deployment in the Convex dashboard (Settings → Environment variables). Do not commit values to git.

| Variable | Required | Notes |
|----------|----------|-------|
| `RESEND_API_KEY` | Yes | Resend API key; email is skipped with a log error if missing (lead still saved). |
| `CONTACT_RECIPIENT_EMAIL` | Recommended | Inbox for contact notifications; defaults to `vivekp.freelance@pm.me` if unset. |
| `RESEND_FROM_EMAIL` | **Yes in production** | Sender address, e.g. `Portfolio Contact <hello@yourdomain.com>`. Must use a **verified domain** in Resend. Do not rely on the sandbox `onboarding@resend.dev` in production. |

### Frontend environment variables (Horizons / CI)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_CONVEX_URL` | Yes | Deployment URL from `npx convex deploy` or dashboard; see `.env.example`. |

## Historical data import

1. Export CSV from Supabase Table Editor → `leads`.
2. Run `npx convex run migrations/importLeads:importFromRows --args '{"rows":[...]}'` (see `convex/migrations/importLeads.ts`).

## Post-cutover

- Revoke Supabase anon key in dashboard.
- Archive Supabase project after 7-day observation.
