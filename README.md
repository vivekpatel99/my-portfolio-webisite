# Vivek Patel Portfolio

This is the source for [www.vivekapatel.com](https://www.vivekapatel.com): a React 18 + Vite portfolio site with a Convex-backed contact form. The frontend is a section-based portfolio and project/case-study experience; the backend currently stores anonymous contact leads and sends email notifications through Resend.

The repository is also wired for Hostinger Horizons, so some Vite plugins and browser `postMessage` handlers are platform integration code rather than ordinary app code. Treat those pieces carefully.

## Quick Start

Use Node `24` from `.nvmrc`.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `VITE_CONVEX_URL` in `.env.local` when you want the contact form to talk to Convex. For UI-only local work, the app can start without it, but contact submissions will fail with a clear disabled-client message.

## Core Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite on port `3000`. |
| `npm run build` | Generate `public/sitemap.xml`, build with Vite, then generate static route HTML under `dist/`. |
| `npm run preview` | Preview the production build on port `3000`. |
| `npm test` | Run Vitest unit tests, including Convex tests through `convex-test`. |
| `npm run qa:seo` | Check route SEO metadata for preview and production targets. |
| `npm run qa:playwright:passive` | Run passive Playwright QA across configured preview and production projects. |
| `npm run qa:playwright:ci` | Run the preview desktop/mobile Playwright subset used by CI. |
| `npm run qa:playwright:live-contact` | Opt-in live contact-form QA. This can create real Convex leads and send email. |
| `npm run convex:dev` | Start Convex local/dev workflow. |
| `npm run convex:smoke` | Submit a marked smoke-test lead to `VITE_CONVEX_URL`. This can trigger email if Resend is configured. |

There is no lint script currently, even though ESLint packages are installed.

## Application Shape

The app boots from `index.html` into `src/main.jsx`, which mounts React into `#root` and wraps the app with:

- `ConvexProvider` from `convex/react`
- `BrowserRouter`
- `ScrollToTop`
- `App`

Routes are centralized in `src/App.jsx` and animated with Framer Motion:

| Route | Component | Notes |
| --- | --- | --- |
| `/` | `src/pages/Home.jsx` | Main section-based portfolio page. |
| `/contact` | `src/pages/Contact.jsx` | Contact form backed by Convex. |
| `/project/:projectId` | `src/pages/Project.jsx` | Case-study route; unknown IDs toast and redirect home. |
| `/legal` | `src/pages/Legal.jsx` | Privacy/legal content. |
| `/data-policy` | `src/pages/DataPolicy.jsx` | Cookie/data policy content. |
| `*` | redirect to `/` | SPA fallback inside React Router. |

`src/components/Layout.jsx` is the shared shell around all routes. It owns the skip link, custom cursor, consent-gated Google Analytics and Sentry, header, footer, toaster, and cookie consent banner.

## Frontend Map

The home page is composed in `src/pages/Home.jsx`:

- `Hero`
- `TechStack`
- `Services`
- `About`
- `Experience`
- `Portfolio`
- `Testimonials`
- `Stats`
- `Connect`
- `CTA`

Most sections are wrapped in `SectionAnimator` for scroll-triggered Framer Motion animation.

Important frontend files:

| File | Purpose |
| --- | --- |
| `src/components/Header.jsx` | Fixed desktop/mobile navigation, hash navigation, contact CTA. |
| `src/components/Footer.jsx` | Footer links, cookie manager trigger, contact/social links. |
| `src/components/Services.jsx` | Local accordion state for service copy. |
| `src/components/Portfolio.jsx` | Portfolio cards and external project links. |
| `src/components/Experience.jsx` | Timeline/collapsible experience section. |
| `src/components/Stats.jsx` | Animated counters; accepts `customStats` for project pages. |
| `src/pages/Contact.jsx` | Contact form state, client-side validation, Convex mutation call, toasts, Sentry capture. |
| `src/pages/Project.jsx` | Hardcoded project case-study data and missing-project redirect. |
| `src/config/links.js` | Centralized social links, remote image URLs, logos, backgrounds, tech icons, gallery images. |
| `src/lib/seoConfig.js` | Site URL, default SEO, route-specific SEO config. |
| `src/lib/seo.js` | React Helmet SEO component. |
| `src/lib/consent.js` | Cookie consent persistence helpers. |
| `src/lib/sentryTelemetry.js` | Production-only Sentry init and capture helpers. |
| `src/lib/convexClient.js` | Convex URL validation and client creation. |

There are a few legacy or currently-unused frontend files, including `src/pages/CookiePolicy.jsx`, `src/pages/PrivacyPolicy.jsx`, `src/components/WelcomeMessage.jsx`, `src/components/CallToAction.jsx`, and `src/components/ErrorButton.jsx`.

## Styling And UI

Styling is Tailwind-first:

- `src/index.css` defines base CSS variables, dark theme defaults, scroll offsets, custom cursor behavior, reduced-motion behavior, scrollbar helpers, and text-gradient utilities.
- `tailwind.config.js` extends theme tokens, including `accent.purple` (`#9372FF`), CSS-variable colors, border radii, and accordion animations.
- `postcss.config.js` wires Tailwind and Autoprefixer.

Reusable UI primitives live in `src/components/ui/`. They are shadcn-style local wrappers around Radix UI, CVA, and Tailwind utilities. Use these first for buttons, inputs, textarea, select, checkbox, collapsible, toast, and toaster behavior.

`src/lib/utils.js` exposes the `cn()` helper for `clsx` + `tailwind-merge`.

## Convex Backend

Before changing Convex code, read:

```text
convex/_generated/ai/guidelines.md
```

That file contains project-local Convex rules that override generic assumptions. The main reminders are: validate all function args, use indexes instead of filters, keep public functions non-sensitive, derive auth server-side if auth is ever added, and avoid unbounded `.collect()` patterns.

Current backend shape:

| File | Purpose |
| --- | --- |
| `convex/schema.ts` | Defines the single `leads` table and indexes. |
| `convex/leads.ts` | Public lead submission mutation, internal email status mutation, internal Resend email action, email helpers. |
| `convex/lib/leadValidation.ts` | Shared lead validation and normalization. |
| `convex/migrations/importLeads.ts` | Internal migration helper for historical lead rows. |
| `convex/leads.test.ts` | Convex lead and email-helper tests. |
| `convex/migrations/importLeads.test.ts` | Migration helper tests. |
| `tools/convex-smoke-test.mjs` | HTTP-client smoke test that submits a marked lead. |

### Lead Data Model

The `leads` table stores:

- `name`
- `email`
- optional `budget`
- `description`
- `createdAt`
- optional email notification status/error fields
- optional `supabaseId` for migrated rows

Indexes:

- `by_createdAt`
- `by_supabaseId`
- `by_email`
- `by_email_and_createdAt`

`by_email_and_createdAt` is used for the current per-email rate limit.

### Contact Submission Flow

1. `src/pages/Contact.jsx` calls `useMutation(api.leads.submitLead)`.
2. `convex/leads.ts` validates and normalizes the payload with `validateLeadInput`.
3. The mutation rate-limits to three submissions per normalized email per hour.
4. The mutation inserts the lead with `emailNotificationStatus: "pending"`.
5. It schedules `internal.leads.sendContactEmail`.
6. The internal action calls Resend if `RESEND_API_KEY` is configured.
7. The action writes back `sent`, `missing_api_key`, `resend_error`, or `unexpected_error`.

There is no Convex auth configuration today. This is intentionally an anonymous insert-only contact form: public clients can submit leads, but there are no public read/update/delete functions.

Security caveats:

- Rate limiting is per email, not per IP/device.
- Parallel duplicate submissions are allowed by existing tests.
- XSS-like text is stored as plain text; keep React escaping intact if rendering leads anywhere in the future.

## Environment Variables

Frontend:

| Variable | Where | Notes |
| --- | --- | --- |
| `VITE_CONVEX_URL` | `.env.local`, Hostinger build env, GitHub repo vars | Required for production. Expected shape: `https://<deployment>.convex.cloud`, including regional Convex hosts. |

Convex dashboard:

| Variable | Notes |
| --- | --- |
| `RESEND_API_KEY` | Enables contact email notifications. Without it, leads are still saved and marked `missing_api_key`. |
| `CONTACT_RECIPIENT_EMAIL` | Notification recipient. Defaults in code if unset. |
| `RESEND_FROM_EMAIL` | Should be a verified-domain sender in production. Avoid Resend sandbox sender for production. |

QA:

| Variable | Notes |
| --- | --- |
| `QA_PREVIEW_URL` | Preview base URL for Playwright. Defaults to `http://127.0.0.1:3000`. |
| `QA_PROD_URL` | Production base URL for passive QA. Defaults to `https://www.vivekapatel.com`. |
| `QA_LIVE_CONTACT_BASE_URL` | Base URL for live contact submission tests. |
| `QA_LIVE_CONTACT_SUBMIT` | Must be `1` to include the live contact-submit project. |
| `QA_LIVE_CONTACT_EMAIL` | Sender email used by live contact QA. |

Sentry DSN and Google Analytics ID are currently hardcoded in `src/lib/sentryTelemetry.js` and `src/components/GoogleAnalytics.jsx`.

## SEO And Static Output

SEO is handled in several layers:

- Base meta tags and JSON-LD live in `index.html`.
- Runtime route tags are emitted by `src/lib/seo.js`.
- Route SEO data lives in `src/lib/seoConfig.js`.
- `tools/generate-sitemap.js` writes `public/sitemap.xml` for `https://www.vivekapatel.com`.
- `tools/generate-static-route-html.js` rewrites route-specific SEO tags into `dist/<route>/index.html` after the Vite build.

Do not replace `npm run build` with plain `vite build` in deploy or CI, because that skips sitemap and static route HTML generation.

## Testing And QA

Vitest:

- `vitest.config.ts` uses `edge-runtime` by default for Convex tests.
- `src/**/*.test.{jsx,tsx}` runs in `jsdom`.
- Playwright specs under `tests/qa/` are excluded from Vitest.

Important test coverage:

- `convex/leads.test.ts`: lead validation, inserts, optional budget, oversized fields, invalid email/budget, unicode, plain-text XSS-like payloads, rate limiting, duplicate parallel submits, Resend payload and error behavior.
- `convex/migrations/importLeads.test.ts`: historical lead import behavior and `supabaseId` idempotency.
- `src/pages/Contact.test.jsx`: mocked Convex mutation behavior for missing fields, invalid email, valid submit, and mutation failure.
- `src/lib/convexClient.test.js`: Convex URL validation and disabled-client behavior.
- `src/components/SentryTelemetry.test.jsx`: consent-gated Sentry behavior.

Playwright:

- Specs live in `tests/qa/`.
- Artifacts go to `playwright-output/`.
- Passive projects cover preview and production desktop/mobile.
- Live contact submission is opt-in only and can create real leads and email side effects.

See `docs/PRODUCTION_TEST_PLAN.md` before running production-impacting checks.

## Deployment

Production is hosted by Hostinger Horizons and built from GitHub `main`.

Expected deployment flow:

1. Open a branch.
2. Push and open a PR into `main`.
3. Let GitHub CI pass.
4. Merge to `main`.
5. Hostinger Horizons builds with `npm run build`.
6. Verify `/`, `/contact`, `/robots.txt`, and `/sitemap.xml` on the live domain.

CI in `.github/workflows/ci.yml`:

- Installs with `npm ci`.
- Validates `VITE_CONVEX_URL`.
- Runs `npm test`.
- Removes stale `dist`.
- Builds.
- Validates fresh build output.
- Checks that built files do not contain Supabase, local backend, or placeholder backend strings.
- Ensures `dist/` is not tracked.
- Installs Chromium.
- Runs SEO and passive Playwright QA against preview.

`dist/` is generated output and should not be committed.

## Hostinger Horizons Guardrails

This repository is synced with Hostinger Horizons. Be cautious around:

- `plugins/`
- the visual editor plugins in `vite.config.js`
- selection mode and iframe route restoration plugins
- injected Horizons error handlers
- `window.parent.postMessage()` integration patterns

`CLAUDE.md` has the strongest warning: do not modify or break Horizons-related code unless the task explicitly requires it and you understand the platform integration.

## Common Change Map

| Goal | Start Here |
| --- | --- |
| Update homepage section order | `src/pages/Home.jsx` |
| Edit hero/services/about/portfolio copy | The matching file in `src/components/` |
| Update social/profile/project image URLs | `src/config/links.js` |
| Add a portfolio card | `src/components/Portfolio.jsx`; update `src/config/links.js` for assets if needed. |
| Add a real project route | `src/pages/Project.jsx`, `src/lib/seoConfig.js`, `tools/generate-sitemap.js`, and route QA expectations. |
| Change contact form fields | `src/pages/Contact.jsx`, `convex/schema.ts`, `convex/lib/leadValidation.ts`, `convex/leads.ts`, tests. |
| Change lead notification email | `convex/leads.ts`; update tests around payload/status behavior. |
| Change SEO metadata | `src/lib/seoConfig.js`, `index.html` if base JSON-LD changes, then run build/SEO checks. |
| Change cookie/analytics behavior | `src/components/CookieConsentBanner.jsx`, `src/lib/consent.js`, `src/components/GoogleAnalytics.jsx`, `src/lib/sentryTelemetry.js`. |
| Change deployment behavior | `docs/deployment.md`, `.github/workflows/ci.yml`, Hostinger settings. |

## Existing Docs

- `AGENTS.md`: agent-specific Convex instruction pointer.
- `CLAUDE.md`: Claude/Horizons development constraints.
- `docs/deployment.md`: production deployment path and variables.
- `docs/PRODUCTION_TEST_PLAN.md`: passive and live production QA plan.
- `docs/convex-migration-notes.md`: Supabase-to-Convex migration notes.
- `docs/supabase-decommission-checklist.md`: historical Supabase decommission work.
- `docs/vivekapatel-domain-dns.md`: domain/DNS notes.
- `docs/changelog.md`: project changelog.
- `docs/reviews/`: prior codebase and migration QA reviews. Some older review findings have since been addressed.

## Generated And Ignored Artifacts

Common generated outputs:

- `dist/`
- `playwright-output/`
- `test-results/`
- Playwright reports
- Lighthouse cache
- `.env.local`
- Convex generated APIs under `convex/_generated/`

The root `.mcp.json` configures local tooling. Review it before sharing or publishing the repository because it may contain machine-specific or credential-like settings.

## Current Caveats

- The current app has one public Convex mutation and no authenticated backend area.
- Contact form abuse protection is minimal and email-based.
- Several docs in `docs/reviews/` describe past states; prefer current source files and current tests when they disagree.
- Some content is still hardcoded in component files rather than a CMS or data layer.
- Some image assets are remote URLs; visual regressions can come from upstream asset availability.
