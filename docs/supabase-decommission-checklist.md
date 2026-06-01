# Supabase decommission checklist

Complete after Convex is live in production and contact form E2E passes (FRM-013–015).

## Supabase dashboard (`xdmpdzdqjskvaqcgyurn`)

- [ ] Export final `leads` CSV snapshot (archive locally)
- [ ] Run `npx convex run migrations/importLeads:importFromRows` with exported rows (see [`convex-migration-notes.md`](convex-migration-notes.md))
- [ ] Verify Convex row count matches export
- [ ] Disable or delete Edge Function `contact-form-email`
- [ ] Revoke / rotate **anon** JWT (was committed in git history)
- [ ] Pause or delete Supabase project after 7-day observation

## Convex production

- [ ] `npx convex deploy` (cloud deployment — set `CONVEX_DEPLOY_KEY` in CI)
- [ ] Set Convex dashboard env vars (see [`convex-migration-notes.md`](convex-migration-notes.md)):

| Variable | Required | Notes |
|----------|----------|-------|
| `RESEND_API_KEY` | Yes | Resend API key for outbound mail |
| `CONTACT_RECIPIENT_EMAIL` | Recommended | Notification inbox; defaults to `vivekp.freelance@pm.me` if unset |
| `RESEND_FROM_EMAIL` | **Yes in production** | Verified-domain sender (not `onboarding@resend.dev`) |

- [ ] Set `VITE_CONVEX_URL` in Hostinger Horizons build environment (see `.env.example`)

## Verification

- [ ] `grep -ri supabase dist/` returns nothing after rebuild
- [ ] Test lead insert + email on production
