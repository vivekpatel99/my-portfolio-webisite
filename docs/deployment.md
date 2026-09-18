# Deployment

## Production Path

Hostinger Horizons builds this Vite app from the GitHub `main` branch.

- Build command: `npm run build`
- Build output: `dist`
- Node version: `.nvmrc`
- Required frontend build variable: `VITE_CONVEX_URL`

Case-study records are compiled from the private publication manifest on every
Vite build and dev reload. The build copies only referenced, hash-approved
case-study assets and emits the route allowlist and sitemap into `dist/`; do
not manually copy a case-study file into deployable output. When this branch is
combined with the provenance guard from PR #53, retain its additive command:
`npm run provenance:deploy && vite build && node tools/generate-sitemap.js && node tools/generate-static-route-html.js`.

`dist/` is generated output and is intentionally not tracked in git. Static assets
that must be copied into production belong in `public/`.

## Required Variables

Set the same production Convex URL in both places:

- Hostinger Horizons build environment: `VITE_CONVEX_URL`
- GitHub repository variable: `VITE_CONVEX_URL`

The expected value shape is:

```text
https://<deployment-name>.convex.cloud
```

Regional Convex deployments can include extra labels, for example:

```text
https://<deployment-name>.<region>.convex.cloud
```

Convex backend email variables are set in the Convex dashboard:

- `RESEND_API_KEY`
- `CONTACT_RECIPIENT_EMAIL`
- `RESEND_FROM_EMAIL`

## Push Workflow

1. Open a short-lived branch from `develop`.
2. Push the branch and open a PR into `develop`.
3. Wait for GitHub CI to pass, merge, and complete integrated user-acceptance
   testing from `develop`.
4. After explicit production-release approval, open a PR from `develop` into
   `main` and wait for the final GitHub CI run.
5. Merge the approved PR into `main`.
6. Hostinger Horizons auto-builds and refreshes the site.
7. Purge the Hostinger/CDN cache after the new build is live, especially after
   Vite bundle changes. HTML is configured to revalidate, while hashed
   `/assets/` files are cached long-term.
8. Verify both apex HTTP and HTTPS redirects preserve paths and query strings
   after the purge:
   - `curl -sSI 'http://vivekapatel.com/contact?source=test'`
   - `curl -sSI 'https://vivekapatel.com/contact?source=test'`
   - Confirm both responses include `Location: https://www.vivekapatel.com/contact?source=test`.
9. Verify `/`, `/contact`, `/robots.txt`, and `/sitemap.xml` on the live domain.
10. Verify a missing asset such as `/assets/not-a-real-bundle.js` returns `404`
   instead of rewriting to the homepage.

Urgent production hotfixes may branch from `main`, but the merged hotfix must
also be synchronized back into `develop` through a PR. See `git-workflow.md`.

For contact-form changes, submit one clearly marked QA lead only after explicit
approval for live side effects, then confirm that the lead and email
notification reach the expected production systems.
