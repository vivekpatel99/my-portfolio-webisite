# Deployment

## Production Path

Hostinger Horizons builds this Vite app from the GitHub `main` branch.

- Build command: `npm run build`
- Build output: `dist`
- Node version: `.nvmrc`
- Required frontend build variable: `VITE_CONVEX_URL`

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

Convex backend email variables are set in the Convex dashboard:

- `RESEND_API_KEY`
- `CONTACT_RECIPIENT_EMAIL`
- `RESEND_FROM_EMAIL`

## Push Workflow

1. Open a branch for changes.
2. Push the branch and open a PR into `main`.
3. Wait for GitHub CI to pass.
4. Merge to `main`.
5. Hostinger Horizons auto-builds and refreshes the site.
6. Verify `/`, `/contact`, `/robots.txt`, and `/sitemap.xml` on the live domain.

For contact-form changes, submit one clearly marked QA lead after deploy and
confirm that the lead and email notification reach the expected production
systems.
