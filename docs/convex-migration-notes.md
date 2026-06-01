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
- **Convex env vars (dashboard):**
  - `RESEND_API_KEY` — required for email delivery
  - `CONTACT_RECIPIENT_EMAIL` — defaults to `vivekp.freelance@pm.me` if unset
  - `RESEND_FROM_EMAIL` — optional; defaults to `onboarding@resend.dev` for testing

## Historical data import

1. Export CSV from Supabase Table Editor → `leads`.
2. Run `npx convex run migrations/importLeads:importFromRows --args '{"rows":[...]}'` (see `convex/migrations/importLeads.ts`).

## Frontend env (Horizons / CI — do not commit `.env`)

- `VITE_CONVEX_URL` — from `npx convex deploy` output or Convex dashboard

## Post-cutover

- Revoke Supabase anon key in dashboard.
- Archive Supabase project after 7-day observation.
