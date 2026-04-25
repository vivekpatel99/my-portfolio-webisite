# Website Review — Merged Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use `- [ ]` checkbox syntax.

**Goal:** Fix every issue surfaced by the full-site review (privacy, routing, SEO, a11y, perf, content integrity) without breaking Hostinger Horizons integration. Merges the prior `2026-04-25-website-review-remediation.md` (test-first) and `2026-04-25-website-review-fixes.md` (P0/P1/P2 PR workflow) into a single, deduplicated execution plan.

**Architecture:** Four phases, each ending in a PR off `dev`.
- **Phase 0:** Branch + test harness (Vitest + Testing Library + Playwright) so behavior changes have regression coverage from the start.
- **Phase 1 (P0 ship-blockers):** Lead-gen reliability, GA Consent Mode v2, Sentry hardening (PII scrubbers), sitemap/route consistency, error boundary, 404 page, RLS + edge-function rate-limit, focus-visible ring + focusable `<main>`.
- **Phase 2 (P1 high-priority):** Accessibility (WCAG 2.2.2 marquee), SEO/metadata (helmet swap, robots, OG completeness, Sentry-as-processor), security headers (CSP report-only first), code splitting (function-form chunks + LCP preload), code quality.
- **Phase 3 (P2 cleanup):** Dead code, vendor chunks, micro-a11y, perf polish, ops docs, CI gate, Dependabot/audit-ci/gitleaks, Lighthouse CI budgets, WebSite JSON-LD, bundle analyzer.

**Tech Stack:** React 18, Vite 4, react-router-dom 6, react-helmet → `@dr.pogodin/react-helmet`, Framer Motion, Radix UI, Tailwind, Sentry, Supabase, Vitest, Testing Library, Playwright.

**Branching:** `feature/* → PR → dev → PR → main → manual deploy`. Each phase = one feature branch.

**Constraints:**
- Do NOT modify `plugins/`, the Horizons error handlers in `vite.config.js`, or `window.parent.postMessage` patterns.
- Use `bun` for package operations.
- Run `bun run lint` and `bun run build` before every commit.
- Convert relative dates to absolute when added to memory or commit messages.

---

## Phase 0 — Setup + Test Harness

### Task 0.1: Branch + baseline

**Files:** none (git only)

- [ ] **Step 1: Confirm clean working tree**

```bash
git status
```

Stash or commit anything unrelated before proceeding.

- [ ] **Step 2: Create Phase 1 branch off `dev`**

```bash
git fetch origin
git checkout dev
git pull
git checkout -b feature/p0-review-fixes
```

- [ ] **Step 3: Verify build is green before changes**

```bash
bun install
bun run lint
bun run build
```

Expected: lint clean, build succeeds, `public/sitemap.xml` regenerated.

---

### Task 0.2: Add regression test harness

Add this in the same `feature/p0-review-fixes` branch so subsequent P0 fixes ship with tests.

**Files:**
- Modify: `package.json`, `vite.config.js`
- Create: `src/test/setup.js`, `src/test/renderWithRouter.jsx`
- Create: `src/components/__tests__/layout-consent.test.jsx`
- Create: `src/pages/__tests__/project-routing.test.jsx`
- Create: `tools/__tests__/generate-sitemap.test.js`
- Create: `playwright.config.js`, `tests/e2e/site-smoke.spec.js`

- [ ] **Step 1: Add test deps + scripts in `package.json`**

```json
{
  "devDependencies": {
    "@playwright/test": "^1.54.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^25.0.1",
    "vitest": "^2.1.3"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 2: Create separate `vitest.config.js` (do NOT touch `vite.config.js` — Horizons constraint)**

```js
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      globals: true,
      css: true,
      exclude: ['tests/e2e/**', 'node_modules/**'],
    },
  })
);
```

Sidesteps the Horizons error-handler script injection during test runs. Vitest 2 auto-merges resolve/aliases.

- [ ] **Step 3: Test setup helpers**

`src/test/setup.js`:

```js
import '@testing-library/jest-dom';
```

`src/test/renderWithRouter.jsx`:

```jsx
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

export function renderWithRouter(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}
```

- [ ] **Step 4: Failing regression tests for the highest-risk bugs**

Cover these cases (one assertion file per concern):
- GA helper is invoked only after analytics consent is true.
- Layout renders exactly one toaster.
- Sitemap URLs are derived from the same project dataset as `Project.jsx` and contain no placeholder slugs.
- Invalid project routes do not silently conflict with slugs published elsewhere.

- [ ] **Step 5: Browser smoke (`tests/e2e/site-smoke.spec.js`)**

- Home loads with no analytics/telemetry network requests before consent.
- Accepting analytics loads GA exactly once.
- `/project/<valid-slug>` resolves to a real detail page (or, if no internal slugs exist, asserts the sitemap is empty of `/project/*`).
- Clicking header links from `/contact` lands on the correct home section.

- [ ] **Step 6: Capture failure baseline**

```bash
bun install
bun run test
```

Expected: tests run and fail on missing implementations.

- [ ] **Step 7: Commit harness**

```bash
git add package.json bun.lockb vite.config.js src/test src/components/__tests__ src/pages/__tests__ tools/__tests__ playwright.config.js tests/e2e
git commit -m "test: add regression harness (vitest + playwright)"
```

---

# PHASE 1 — P0 SHIP-BLOCKERS

## Task 1.1: Pass `hasConsent` to `<GoogleAnalytics />` + GA4 Consent Mode v2

**Issue:** Component bails when `hasConsent` is undefined → GA never loads even after consent. Additionally, GA4 Consent Mode v2 (required for EEA traffic, 2024+) expects a `'denied'` default fired BEFORE any tag, then `'update'` on accept.

**Files:** `src/components/Layout.jsx`, `src/components/GoogleAnalytics.jsx`, `index.html` (or `src/main.jsx`)

- [ ] **Step 1: Edit Layout to pass prop**

```jsx
// before
{gaConsent && <GoogleAnalytics />}
// after
{gaConsent && <GoogleAnalytics hasConsent={gaConsent} />}
```

- [ ] **Step 2: Inject Consent Mode v2 default at app mount (regardless of consent)**

In `src/main.jsx` or top of `Layout.jsx`, before any GA load:

```js
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500,
});
```

- [ ] **Step 3: On accept, update consent BEFORE loading `gtag.js`**

In `GoogleAnalytics.jsx` mount effect (gated by `hasConsent`):

```js
window.gtag('consent', 'update', { analytics_storage: 'granted' });
// then load gtag.js as before
```

- [ ] **Step 2: Manual verify in prod-mode preview**

```bash
bun run build && bun run preview
```

Private window → DevTools Network filter "googletag" → accept analytics → expect request to `googletagmanager.com/gtag/js?id=G-7E37RV2DDN`.

- [ ] **Step 3: Update `layout-consent.test.jsx`**

Assert no `window.gtag` before consent; `window.gtag` defined after accept; only one toast viewport in DOM.

- [ ] **Step 4: Lint + commit**

```bash
bun run lint
git add src/components/Layout.jsx src/components/__tests__/layout-consent.test.jsx
git commit -m "fix: pass hasConsent prop to GoogleAnalytics so GA loads in production"
```

---

## Task 1.2: Wrap Contact submit in `try/catch/finally`

**Issue:** No error handling → button stuck on "Sending…", lead lost on network errors, email-function failures swallowed silently.

**Files:** `src/pages/Contact.jsx`

- [ ] **Step 1: Add Sentry import**

```jsx
import * as Sentry from '@sentry/react';
```

- [ ] **Step 2: Replace `handleSubmit` (lines ~62–117) with**

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formState.name || !formState.email || !formState.description) {
    toast({
      title: 'Uh oh! Missing fields.',
      description: 'Please fill out all required fields before sending.',
      variant: 'destructive',
    });
    return;
  }

  setIsSubmitting(true);
  const leadData = {
    name: formState.name,
    email: formState.email,
    budget: formState.budget,
    description: formState.description,
  };

  try {
    const { error: dbError } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (dbError) {
      Sentry.captureException(dbError, { extra: { stage: 'supabase-insert' } });
      toast({
        title: 'Submission Failed',
        description:
          'Something went wrong saving your data. Please email me directly at ' +
          socialLinks.contactEmail + '.',
        variant: 'destructive',
      });
      return;
    }

    const { error: functionError } = await supabase.functions.invoke('contact-form-email', {
      body: JSON.stringify({ ...leadData, recipientEmail: socialLinks.contactEmail }),
    });

    if (functionError) {
      Sentry.captureException(functionError, {
        extra: { stage: 'email-function' },
      });
      // NOTE: do NOT attach leadEmail — contradicts Sentry sendDefaultPii: false (Task 1.6)
      toast({
        title: '⚠️ Saved, but email notification failed',
        description:
          'Your message is in the queue. As a backup, please also email ' +
          socialLinks.contactEmail + ' so I see it sooner.',
        variant: 'destructive',
      });
      setFormState({ name: '', email: '', budget: '', description: '' });
      return;
    }

    toast({
      title: '🚀 Message Sent!',
      description: "Thanks for reaching out! I'll get back to you within 24 hours.",
    });
    setFormState({ name: '', email: '', budget: '', description: '' });
  } catch (err) {
    Sentry.captureException(err, { extra: { stage: 'contact-submit-network' } });
    toast({
      title: 'Network Error',
      description:
        'Could not reach the server. Please email me directly at ' +
        socialLinks.contactEmail + '.',
      variant: 'destructive',
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

Form clears on success and partial-success but NOT on hard errors so the user can retry without retyping.

- [ ] **Step 3: Manual happy-path + offline test**

DevTools → Network → "Offline" → submit → expect destructive "Network Error" toast, button unsticks, form retains values.

- [ ] **Step 4: Commit**

```bash
bun run lint
git add src/pages/Contact.jsx
git commit -m "fix(contact): wrap submit in try/catch/finally; surface email failures to user and Sentry"
```

---

## Task 1.3: Sentry ErrorBoundary around routes

**Issue:** Render exception blanks the whole site.

**Files:**
- Create: `src/components/ErrorFallback.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create fallback**

```jsx
import { Link } from 'react-router-dom';
import { socialLinks } from '@/config/links';

const ErrorFallback = ({ resetError }) => (
  <div className="min-h-screen bg-[#0C0D0D] text-white flex items-center justify-center px-6">
    <div className="max-w-md text-center">
      <h1 className="text-3xl font-bold mb-4">Something went wrong.</h1>
      <p className="text-gray-400 mb-8">
        The page hit an unexpected error. The issue has been logged and I&apos;ll look into it.
        In the meantime, please reload, head home, or email me directly.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={resetError}
          className="px-6 py-3 rounded-full bg-accent-purple text-white font-semibold hover:bg-accent-purple/90"
        >
          Try Again
        </button>
        <Link to="/" className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/5">
          Go Home
        </Link>
        <a href={socialLinks.emailHref} className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/5">
          Email Me
        </a>
      </div>
    </div>
  </div>
);

export default ErrorFallback;
```

- [ ] **Step 2: Wrap routes**

```jsx
import * as Sentry from '@sentry/react';
import ErrorFallback from '@/components/ErrorFallback';

<Sentry.ErrorBoundary fallback={({ resetError }) => <ErrorFallback resetError={resetError} />}>
  <AnimatePresence mode="wait">
    <Routes location={location} key={location.pathname}>
      {/* existing routes — see Task 1.5 for catch-all change */}
    </Routes>
  </AnimatePresence>
</Sentry.ErrorBoundary>
```

- [ ] **Step 3: Smoke**

Temporarily `throw new Error('test')` in `Hero.jsx`, verify fallback, revert.

- [ ] **Step 4: Commit**

```bash
git add src/components/ErrorFallback.jsx src/App.jsx
git commit -m "feat: add Sentry ErrorBoundary around Routes with user-facing fallback"
```

---

## Task 1.4: Unify project data + sitemap (drop placeholder slugs)

**Issue:** Sitemap lists 6 slugs; only `social-media-app` exists in `projectData`. Every Google click hits "Project Not Found" + redirect.

**Decision:** Until real case studies are written, do NOT advertise project URLs. Extract a canonical dataset now so future case studies plug into one source of truth.

**Files:**
- Create: `src/data/projects.js`
- Modify: `src/components/Portfolio.jsx`, `src/pages/Project.jsx`, `tools/generate-sitemap.js`
- Tests: `src/pages/__tests__/project-routing.test.jsx`, `tools/__tests__/generate-sitemap.test.js`

- [ ] **Step 1: Canonical dataset `src/data/projects.js`** — framework-free (no `@/` aliases, no JSX, no `import.meta`) so `tools/generate-sitemap.js` can import directly via ESM. Drop the JSON-mirror hedge.

```js
export const projects = [
  // Add objects ONLY when a real case study exists.
  // Shape:
  // {
  //   slug: 'lowercase-url-safe',
  //   title: 'Display title',
  //   summary: 'One-line summary',
  //   detailType: 'internal' | 'external',
  //   externalLink: 'https://...',  // when detailType === 'external'
  //   image: '/assets/projects/foo.jpg',
  //   imageAlt: '...',
  //   datePublished: '2026-04-01',  // for sitemap lastmod + JSON-LD
  //   dateModified: '2026-04-15',
  //   author: 'Vivek Patel',
  // }
];

export function getProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug);
}

export function getInternalProjects() {
  return projects.filter((p) => p.detailType === 'internal');
}
```

- [ ] **Step 2: `Portfolio.jsx` — consume dataset, render real anchors**

(Combined with Task 2.3 — see there for anchor semantics. Import `projects` from `@/data/projects`.)

- [ ] **Step 3: `Project.jsx` — read from dataset, declarative redirect**

```jsx
import { useParams, Link, Navigate } from 'react-router-dom';
import { getProjectBySlug } from '@/data/projects';

const Project = () => {
  const { projectId } = useParams();
  const project = getProjectBySlug(projectId);

  useEffect(() => { window.scrollTo(0, 0); }, [projectId]);

  if (!project) return <Navigate to="/404" replace />;
  // ... render project ...
};
```

Drop `useNavigate` and the misleading "Project Not Found" toast.

- [ ] **Step 4: `tools/generate-sitemap.js` — derive from dataset**

```js
import { getInternalProjects } from '../src/data/projects.js';

const projectPages = getInternalProjects().map((p) => ({
  loc: `${BASE_URL}/project/${p.slug}`,
  lastmod: p.dateModified ?? p.datePublished, // per-project; do NOT default to today
  priority: '0.90',
}));
```

Direct ESM import — Node 18+ resolves `.js` ESM natively when the file uses `import/export`. JSON mirror was the very drift bug this task fixes.

Static pages (`/`, `/contact`, `/legal`, `/data-policy`) get a hand-maintained constant `lastmod`, NOT `today` — Google down-weights sitemaps where lastmod changes for unchanged URLs.

- [ ] **Step 4b: Gitignore `public/sitemap.xml`**

It's regenerated every build and currently committed (`git status` already shows drift). Append `public/sitemap.xml` to `.gitignore` and emit only into `dist/`. Remove the tracked file:

```bash
git rm --cached public/sitemap.xml
echo "public/sitemap.xml" >> .gitignore
```

- [ ] **Step 5: Tests**

- Every internally routable project appears in sitemap.
- No external/missing project appears in sitemap.
- `getProjectBySlug` resolves every internal slug.

- [ ] **Step 6: Regenerate + verify**

```bash
bun run build
cat public/sitemap.xml
```

Expected: only 4 `<url>` entries (`/`, `/contact`, `/legal`, `/data-policy`) until real case studies land.

- [ ] **Step 7: Commit**

```bash
git add src/data/projects.js src/components/Portfolio.jsx src/pages/Project.jsx tools/generate-sitemap.js public/sitemap.xml src/pages/__tests__/project-routing.test.jsx tools/__tests__/generate-sitemap.test.js
git commit -m "fix(seo): unify project data; drop placeholder slugs from sitemap"
```

---

## Task 1.5: Replace catch-all redirect with dedicated 404

**Issue:** `<Route path="*" element={<Navigate to="/" replace />} />` masks broken links and confuses crawlers.

**Constraint (flag in PR):** A pure SPA on Hostinger Apache CANNOT return a real HTTP 404 — the rewrite always sends `index.html` with status 200. Mitigations: (1) `<meta name="robots" content="noindex">` on NotFound (primary defense vs soft-404 indexing), (2) `ErrorDocument 404` in `.htaccess` for genuine static-asset misses (Task 2.12), (3) submit trimmed sitemap + URL Removal in Search Console for the 6 fictitious slugs the day Phase 1 ships.

**Files:**
- Create: `src/pages/NotFound.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `NotFound.jsx`**

```jsx
import { Helmet } from 'react-helmet'; // becomes react-helmet-async in Task 2.1
import { Link } from 'react-router-dom';

const NotFound = () => (
  <>
    <Helmet>
      <title>Page Not Found · Vivek Patel</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    <div className="min-h-[60vh] flex items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-4xl font-bold mb-3">Page not found</h1>
        <p className="text-gray-400 mb-6">The page you're looking for doesn't exist or has moved.</p>
        <Link to="/" className="inline-block px-6 py-3 rounded-full bg-accent-purple text-white font-semibold">
          Go home
        </Link>
      </div>
    </div>
  </>
);

export default NotFound;
```

- [ ] **Step 2: Wire route**

In `src/App.jsx`:

```jsx
<Route path="*" element={<NotFound />} />
<Route path="/404" element={<NotFound />} />
```

NotFound copy should also link to `/contact` and top portfolio anchors (not just `/`) so soft-404 pages still feed crawler graph.

- [ ] **Step 3: Commit**

```bash
git add src/pages/NotFound.jsx src/App.jsx
git commit -m "fix(seo): dedicated 404 page with noindex instead of silent home redirect"
```

---

## Task 1.6: Sentry hardening (PII + sample rates + propagation)

**Issue:** `sendDefaultPii: true` + 100% replay-on-error captures form values. `tracesSampleRate: 1.0` is heavy. `tracePropagationTargets` includes placeholder.

**Files:** `src/main.jsx`

- [ ] **Step 1: Replace Sentry init**

```jsx
const isProd = import.meta.env.PROD;

Sentry.init({
  dsn: 'https://b697debff1be30b835700c935a494249@o4510426517143552.ingest.de.sentry.io/4510426780532816',
  environment: isProd ? 'production' : 'development',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,        // contact-heavy site — typed description leaks via DOM mutations otherwise
      maskAllInputs: true,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: isProd ? 0.1 : 1.0,
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/(www\.)?vivekapatel\.com\//,
    /^https:\/\/[a-z0-9-]+\.supabase\.co\//,
  ],
  replaysSessionSampleRate: isProd ? 0.05 : 0,
  replaysOnErrorSampleRate: isProd ? 1.0 : 0,
  sendDefaultPii: false,
  beforeSend(event) {
    // Strip any leadEmail accidentally attached
    if (event.extra && 'leadEmail' in event.extra) delete event.extra.leadEmail;
    // Scrub email-shaped strings from exception messages (Supabase echoes inserted rows)
    if (event.exception?.values) {
      for (const v of event.exception.values) {
        if (v.value) v.value = v.value.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]');
      }
    }
    return event;
  },
  beforeBreadcrumb(crumb) {
    if (crumb.category === 'console') return null;
    if (crumb.category === 'fetch' && crumb.data?.url?.includes('contact-form-email')) {
      delete crumb.data.body;
    }
    return crumb;
  },
});
```

- [ ] **Step 2: Verify in preview**

`bun run build && bun run preview` → trigger a test error → confirm Sentry replay shows form input values as `***`. Confirm no `Cookie` / `X-Forwarded-For` headers in Sentry network calls.

- [ ] **Step 3: Commit**

```bash
git add src/main.jsx
git commit -m "fix(sentry): mask form inputs, drop PII, lower trace rate, fix propagation targets"
```

---

## Task 1.7: Verify Supabase RLS on `leads`

**Issue:** Anon key is OK only if RLS denies anon SELECT/UPDATE/DELETE.

- [ ] **Step 1: Verify in Supabase dashboard**

Project `xdmpdzdqjskvaqcgyurn` → Auth → Policies → table `leads`. Confirm:
- INSERT for `anon`: exists, ideally with column whitelist + length checks.
- SELECT/UPDATE/DELETE for `anon`: do NOT exist.

If SELECT is open to anon, lock it via SQL editor:

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_anon_insert"
  ON leads FOR INSERT TO anon
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 200
    AND char_length(email) BETWEEN 5 AND 320
    AND char_length(description) BETWEEN 1 AND 5000
  );
```

- [ ] **Step 2: Add edge-function rate limiting** (P0 — RLS only blocks read/update; anon insert flood is the real abuse vector)

In `contact-form-email` Supabase Edge Function, add IP-based throttle BEFORE invoking insert:
- Track `req.headers.get('x-forwarded-for')` in a Supabase `rate_limits` table or Deno KV.
- Reject with 429 if >5 submissions/IP/hour.
- Log Sentry breadcrumb on rejection (not full error — quiet by design).

- [ ] **Step 3: Open Cloudflare Turnstile follow-up issue** (next sprint)

```bash
gh issue create --repo vivekpatel99/my-portfolio-webisite \
  --title "Add Cloudflare Turnstile to contact form" \
  --body "Defense-in-depth on top of rate-limit (P0 in Phase 1). Add Turnstile invisible challenge before insert+invoke; verify token server-side in contact-form-email edge function."
```

- [ ] **Step 4:** Note RLS state + rate-limit verification in Phase 1 PR description.

---

## Task 1.8: Global focus-visible ring + focusable `<main>`

**Issue:** Header nav `<a>` (Header.jsx:83-91) has zero visible focus indicator. Skip-to-content link exists but `<main id="main-content">` is not focusable, so screen reader focus doesn't actually land there.

**Files:** `src/index.css` (or a Tailwind plugin), `src/components/Layout.jsx`, `Header.jsx`, `Footer.jsx`, `Portfolio.jsx`, social-icon buttons.

- [ ] **Step 1: Add `tabIndex={-1}` to `<main>` in `Layout.jsx`**

```jsx
<main id="main-content" tabIndex={-1}>
```

- [ ] **Step 2: Apply a global focus-visible ring recipe** to nav links, footer links, anchor cards, social icon buttons, dialog close buttons:

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C0D0D]
```

- [ ] **Step 3: Verify keyboard tab through Home — every interactive element has a visible ring.**

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "fix(a11y): global focus-visible ring; main is focusable for skip-to-content"
```

---

## Task 1.9: Phase 1 PR

- [ ] **Step 1: Push + open PR**

```bash
git push -u origin feature/p0-review-fixes
gh pr create --base dev --title "P0 review fixes: GA, contact form, error boundary, sitemap, 404, Sentry, focus-visible" --body "$(cat <<'EOF'
## Summary
- Test harness (vitest split config + playwright) added with regression coverage
- GA + GA4 Consent Mode v2 default-denied → update on accept; hasConsent prop wired
- Contact form: try/catch/finally, surface email failures to user + Sentry (no leadEmail in extras)
- Sentry ErrorBoundary with user-facing fallback
- Unified projects dataset (ESM, framework-free); sitemap gitignored; placeholder slugs removed
- Dedicated 404 page (noindex; copy links to /contact + portfolio anchors)
- Sentry: maskAllText+Inputs, sendDefaultPii: false, beforeSend scrubber, beforeBreadcrumb drops console + fetch body
- Supabase RLS verified + edge-function rate-limit on leads table
- Global focus-visible ring; main is focusable for skip-to-content

## RLS notes
[fill in: anon SELECT denied? policies present?]

## Test plan
- [ ] bun run lint clean, bun run test passes, bun run build clean
- [ ] Cookie banner → accept analytics → GA script request fires (prod-mode preview)
- [ ] Contact happy path: success toast, form clears
- [ ] Contact offline: destructive toast, button unsticks, form retained
- [ ] Triggered render error: ErrorFallback with Try Again / Home / Email
- [ ] /project/unknown → 404 page (noindex), not home redirect

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

# PHASE 2 — P1 HIGH-PRIORITY

Branch off `dev` AFTER Phase 1 merges:

```bash
git checkout dev && git pull
git checkout -b feature/p1-review-fixes
```

## Task 2.1: `react-helmet` → `@dr.pogodin/react-helmet`

**Issue:** `react-helmet@6.1.0` unmaintained; `react-helmet-async` was archived by Garmeeh in 2024 — do NOT migrate onto a dead dep. `@dr.pogodin/react-helmet` is the active fork (React 19+ ready, drop-in API).

**Files:** `package.json`, `src/main.jsx`, every file importing `react-helmet`.

- [ ] **Step 1: Swap dep**

```bash
bun remove react-helmet
bun add @dr.pogodin/react-helmet
```

- [ ] **Step 2: Wrap app in `HelmetProvider` (`src/main.jsx`)**

```jsx
import { HelmetProvider } from '@dr.pogodin/react-helmet';

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <BrowserRouter>
      <ScrollToTop />
      <App />
      <Toaster />
    </BrowserRouter>
  </HelmetProvider>
);
```

Keep exactly one `<Toaster />` (delete any duplicate inside Layout.jsx).

- [ ] **Step 3: Update imports**

```bash
grep -rln "from 'react-helmet'" src/ | xargs sed -i "s|from 'react-helmet'|from '@dr.pogodin/react-helmet'|g"
grep -rn "from 'react-helmet'" src/   # expect no output
```

- [ ] **Step 4: Remove duplicate global canonical from `App.jsx`**

Each page sets its own canonical via Helmet. Confirm:

```bash
grep -n 'rel="canonical"' src/pages/*.jsx
```

If a page is missing, add `<link rel="canonical" href="https://www.vivekapatel.com/<path>" />`. Currently only `Project.jsx` sets one — `Home`, `Contact`, `Legal`, `DataPolicy`, and `NotFound` all need their own.

- [ ] **Step 5: Verify**

DevTools Elements → `<head>` → exactly one `<link rel="canonical">` per route, no react-helmet warnings.

- [ ] **Step 6: Commit**

```bash
bun run lint
git add package.json bun.lockb src/
git commit -m "fix: switch react-helmet → react-helmet-async; remove duplicate canonical"
```

---

## Task 2.2: Mobile menu → Radix Dialog (focus trap, Escape, scroll-lock)

**Files:** `src/components/Header.jsx`

Replace bespoke open-state with `@radix-ui/react-dialog` (already installed).

- [ ] **Step 1: Replace mobile menu block**

```jsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Trigger asChild>
    <button aria-label="Open menu" className="min-h-11 min-w-11 inline-flex items-center justify-center md:hidden">
      <Menu size={28} />
    </button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
    <Dialog.Content className="fixed inset-y-0 right-0 w-full max-w-sm bg-[#0C0D0D] z-50 p-8 focus:outline-none" aria-label="Main menu">
      <Dialog.Title className="sr-only">Main Menu</Dialog.Title>
      <Dialog.Close asChild>
        <button aria-label="Close menu" className="absolute top-4 right-4 min-h-11 min-w-11 inline-flex items-center justify-center">
          <X size={28} />
        </button>
      </Dialog.Close>
      {/* nav links here */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

Radix gives focus trap, Escape, scroll-lock, focus restoration, `aria-modal`.

- [ ] **Step 2: Replace timing-based home-section navigation**

Do NOT use `setTimeout(..., 100)`. Mount a single `ScrollToHashElement` component in `Layout.jsx` (not per-page):

```jsx
function ScrollToHashElement() {
  const location = useLocation();
  useLayoutEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [location.key, location.hash]); // location.key handles same-hash-twice
  return null;
}
```

Click a nav link → navigate to `/#services`. The component listens to `location.key` (not just `.hash` — same hash twice won't re-fire otherwise) and uses `requestAnimationFrame`, not `setTimeout`.

- [ ] **Step 3: Tests** (`header-navigation.test.jsx`)

Cover Escape close, focus return, hash navigation from `/contact` to home section.

- [ ] **Step 4: Commit**

```bash
bun run lint
git add src/components/Header.jsx src/components/__tests__/header-navigation.test.jsx
git commit -m "fix(a11y): mobile menu uses Radix Dialog; hash nav replaces setTimeout scroll"
```

---

## Task 2.3: Portfolio cards as semantic anchors

**Files:** `src/components/Portfolio.jsx`, test `portfolio-links.test.jsx`

- [ ] **Step 1: Replace `<div role="button" tabIndex=0>`**

- Internal projects: `<Link to={`/project/${project.slug}`}>`
- External projects: `<a href={project.externalLink} target="_blank" rel="noopener noreferrer">`

Drop `role="button"`, `tabIndex`, `onKeyDown`, `onClick` shims.

- [ ] **Step 2: Tests** — middle-click + keyboard activation work; no `role=button` on cards.

- [ ] **Step 3: Commit**

```bash
bun run lint
git add src/components/Portfolio.jsx src/components/__tests__/portfolio-links.test.jsx
git commit -m "fix(a11y): portfolio cards use real anchors instead of div role=button"
```

---

## Task 2.4: Global `MotionConfig reducedMotion="user"` + custom-animation overrides

**Files:** `src/components/Layout.jsx`, `src/components/Testimonials.css`, `src/index.css`, optionally `TechStack.jsx`

- [ ] **Step 1: Wrap in `MotionConfig`**

```jsx
import { MotionConfig } from 'framer-motion';

return (
  <MotionConfig reducedMotion="user">
    {/* existing layout */}
  </MotionConfig>
);
```

- [ ] **Step 2: Audit `repeat: Infinity` + tailwind `animate-*`**

```bash
grep -rn "repeat: Infinity\|animate-pulse\|animate-bounce\|animate-spin" src/
```

Add `motion-reduce:animate-none` (Tailwind) to decorative looping animations.

- [ ] **Step 3: TechStack — drop eager image preloading**

In `src/components/TechStack.jsx`:
- Delete the mount-time `new Image()` preload loop.
- Keep lazy `<img loading="lazy">`.
- Disable marquee motion under reduced motion.

- [ ] **Step 4: Testimonials — explicit pause/play control + reduced motion (WCAG 2.2.2)**

`:hover` / `:focus-within` alone does NOT satisfy WCAG 2.2.2 — mouse users with vestibular disorders need a real mechanism. Add a visible Pause/Play toggle button above the scroller, controlled via a `data-paused` attribute that toggles the CSS animation-play-state.

`src/components/Testimonials.css`:

```css
.scroller[data-paused='true'] .scroller-inner,
.scroller:hover .scroller-inner,
.scroller:focus-within .scroller-inner {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .scroller-inner {
    animation: none;
    transform: none;
  }
}
```

`Testimonials.jsx`:

```jsx
const [paused, setPaused] = useState(false);
// ...
<button
  type="button"
  onClick={() => setPaused(p => !p)}
  aria-pressed={paused}
  className="mb-4 ..."
>
  {paused ? 'Play testimonials' : 'Pause testimonials'}
</button>
<div className="scroller" data-paused={paused}>...</div>
```

Each testimonial card stays a stable focusable link.

- [ ] **Step 4b: Audit raw Tailwind animations** — `MotionConfig` only short-circuits `motion.*` components, NOT raw CSS `animate-pulse`, `animate-spin`, `animate-bounce`. Add `motion-reduce:animate-none` to the Hero "Limited availability" pulse (Hero.jsx:98) and any `index.css` `@keyframes`.

- [ ] **Step 5: Verify**

DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. Page-entry transitions, scroll-pulse, marquee → static.

- [ ] **Step 6: Commit**

```bash
bun run lint
git add src/components/Layout.jsx src/components/TechStack.jsx src/components/Testimonials.jsx src/components/Testimonials.css src/index.css
git commit -m "fix(a11y,perf): respect prefers-reduced-motion; drop eager image preload"
```

---

## Task 2.5: Contact form — `aria-invalid` + inline errors

**Files:** `src/pages/Contact.jsx`, test `contact-accessibility.test.jsx`

- [ ] **Step 1: Field-level error state**

```jsx
const [errors, setErrors] = useState({});
```

In missing-fields branch:

```jsx
const fieldErrors = {};
if (!formState.name) fieldErrors.name = 'Name is required.';
if (!formState.email) fieldErrors.email = 'Email is required.';
if (!formState.description) fieldErrors.description = 'Project description is required.';
setErrors(fieldErrors);
document.getElementById(Object.keys(fieldErrors)[0])?.focus();
return;
// On a successful pass, clear: setErrors({});
```

- [ ] **Step 2: Wire `aria-invalid` + `aria-describedby` per field**

```jsx
<Input
  id="name"
  aria-invalid={!!errors.name}
  aria-describedby={errors.name ? 'name-error' : undefined}
  disabled={isSubmitting}
  /* ... */
/>
{errors.name && (
  <p id="name-error" role="alert" className="mt-2 text-sm text-red-400">{errors.name}</p>
)}
```

- [ ] **Step 3: Mark required asterisks decorative**

```jsx
Full Name <span aria-hidden="true">*</span>
```

- [ ] **Step 4: `aria-label` on icon-only social links**

```jsx
<a aria-label="Visit Vivek Patel on LinkedIn (opens in new tab)" ...>
<a aria-label="Visit Vivek Patel on GitHub (opens in new tab)" ...>
```

- [ ] **Step 5: Commit**

```bash
bun run lint
git add src/pages/Contact.jsx src/pages/__tests__/contact-accessibility.test.jsx
git commit -m "fix(a11y): contact form aria-invalid, inline errors, icon-only labels"
```

---

## Task 2.6: Footer hash links + Manage Consent button

**Files:** `src/components/Footer.jsx`

- [ ] **Step 1: Real anchors with smooth-scroll handler**

```jsx
const handleHashClick = (e, hash) => {
  if (location.pathname === '/') {
    e.preventDefault();
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
  }
};

<a href="/#services" onClick={(e) => handleHashClick(e, '#services')}>Services</a>
```

NOT `<Link to="/#services">` — react-router-dom won't scroll to hash. Sweep EVERY entry in `footerSections` that uses a hash href (currently all rendered as `<Link>`); convert all to plain `<a>`.

- [ ] **Step 2: Manage Consent → real button**

```jsx
<button
  type="button"
  onClick={() => window.dispatchEvent(new Event('manage-cookies'))}
  className="text-gray-400 hover:text-accent-purple transition-colors"
>
  Manage Consent
</button>
```

(Layout already listens for `manage-cookies`.)

- [ ] **Step 3: Cookie banner — close == reject optional + add expiry**

Currently `CookieConsentBanner.jsx:192-201` close hides UI without persisting → on next reload the 1.5s timer re-shows the banner (nag loop + GDPR-ambiguous). Persist on close:

```js
{ necessary: true, analytics: false, expiresAt: Date.now() + 6*30*24*60*60*1000 } // 6 months
```

On mount, ignore stored consent if `Date.now() > expiresAt` (re-prompt). GDPR best practice = 6–13 month re-prompt.

- [ ] **Step 4: Commit**

```bash
bun run lint
git add src/components/Footer.jsx src/components/CookieConsentBanner.jsx
git commit -m "fix: footer hash links scroll; Manage Consent is a button; explicit consent close"
```

---

## Task 2.7: `SupabaseAuthContext` — try/catch around `getSession`

**Files:** `src/contexts/SupabaseAuthContext.jsx`

- [ ] **Step 1: Wrap effect**

```jsx
useEffect(() => {
  let mounted = true;
  (async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (mounted) handleSession(data.session);
    } catch (err) {
      Sentry.captureException(err, { extra: { stage: 'auth-getSession' } });
      if (mounted) handleSession(null);
    }
  })();
  return () => { mounted = false; };
}, [handleSession]);
```

Add `import * as Sentry from '@sentry/react';`.

- [ ] **Step 2: Commit**

```bash
git add src/contexts/SupabaseAuthContext.jsx
git commit -m "fix: handle getSession failures so loading state doesn't hang"
```

---

## Task 2.8: Route-level code splitting

**Files:**
- Create: `src/components/RouteFallback.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Loading fallback**

```jsx
const RouteFallback = () => (
  <div role="status" aria-live="polite" className="min-h-screen bg-[#0C0D0D] flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-accent-purple border-t-transparent animate-spin motion-reduce:animate-none" />
    <span className="sr-only">Loading…</span>
  </div>
);

export default RouteFallback;
```

- [ ] **Step 2: Lazy non-critical routes**

```jsx
import { lazy, Suspense } from 'react';
import Home from '@/pages/Home'; // keep eager (LCP)
const Contact = lazy(() => import('@/pages/Contact'));
const Project = lazy(() => import('@/pages/Project'));
const Legal = lazy(() => import('@/pages/Legal'));
const DataPolicy = lazy(() => import('@/pages/DataPolicy'));
const NotFound = lazy(() => import('@/pages/NotFound'));

<Sentry.ErrorBoundary fallback={...}>
  <AnimatePresence mode="wait">
    <Suspense fallback={<RouteFallback />}>
      <Routes location={location} key={location.pathname}>
        {/* routes */}
      </Routes>
    </Suspense>
  </AnimatePresence>
</Sentry.ErrorBoundary>
```

- [ ] **Step 3: Verify split**

```bash
bun run build
ls -lh dist/assets/*.js
```

Expected: separate chunks for Contact / Project / Legal / DataPolicy / NotFound.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/components/RouteFallback.jsx
git commit -m "perf: route-level code-splitting for non-home pages"
```

---

## Task 2.9: Local-host external assets + repair metadata

**Files:** `src/config/links.js`, `index.html`, `src/pages/Legal.jsx`, `src/pages/DataPolicy.jsx`, `src/pages/Contact.jsx`, `public/assets/*`

- [ ] **Step 1: Audit external refs**

```bash
grep -rn "raw.githubusercontent" index.html src/
rg -n "og:image|twitter:image|vivek-patel.com|contact@vivek-patel.com|og-image.png" index.html src/pages src/config
```

- [ ] **Step 2: Download to `public/assets/`**

```bash
mkdir -p public/assets
# for each external URL: curl -L -o public/assets/<filename> '<url>'
```

- [ ] **Step 3: Canonical metadata in `src/config/links.js`**

```js
export const metaImages = {
  ogImage: '/assets/logos/white_background.png',
  twitterImage: '/assets/logos/white_background.png',
  jsonLdImage: '/assets/images/vivek-black-and-white.png',
};
```

- [ ] **Step 4: Replace stale legal domain/email + image refs**

In `Legal.jsx` and `DataPolicy.jsx` use:
- `https://www.vivekapatel.com`
- `vivekp.freelance@pm.me`

Replace any `og-image.png` reference with `metaImages.ogImage`.

- [ ] **Step 5: Align privacy/cookie wording with actual tracking after Phase 1**

Document Sentry status (strictly necessary vs analytics-gated) in `Legal.jsx` and `DataPolicy.jsx`. Both pages currently OMIT Sentry from the processor list — Sentry captures IP + replay and MUST be disclosed. Note `de.sentry.io` (EU residency, Frankfurt).

- [ ] **Step 5b: OG metadata completeness in `index.html`**

Currently missing: `og:image:width`, `og:image:height`, `og:image:alt`, `og:image:type`, `og:locale`, `twitter:site`, `twitter:creator`. Add all.

- [ ] **Step 5c: `public/robots.txt`**

```
User-agent: *
Allow: /
Disallow: /404
Sitemap: https://www.vivekapatel.com/sitemap.xml
```

- [ ] **Step 5d: Resource hints in `index.html`**

```html
<link rel="preconnect" href="https://xdmpdzdqjskvaqcgyurn.supabase.co" crossorigin>
<link rel="preconnect" href="https://o4510426517143552.ingest.de.sentry.io" crossorigin>
<!-- DO NOT preconnect GA — leaks intent before consent -->
<link rel="preload" as="image" fetchpriority="high" href="/assets/images/hero.webp">
```

Add `decoding="async"` + `fetchpriority="high"` to the Hero LCP `<img>`.

- [ ] **Step 6: Verify**

```bash
bun run build
ls dist/assets/
```

- [ ] **Step 7: Commit**

```bash
git add public/assets/ index.html src/config/links.js src/pages/Legal.jsx src/pages/DataPolicy.jsx src/pages/Contact.jsx
git commit -m "perf,seo: serve images locally; align legal copy and metadata assets"
```

---

## Task 2.10: Color contrast — bump `text-gray-500` → `text-gray-400`

**Files:** anywhere `text-gray-500` appears on dark bg

- [ ] **Step 1: Find offenders**

```bash
grep -rn "text-gray-500" src/ index.html
```

- [ ] **Step 2: Replace on dark bg**

`text-gray-400` (#9CA3AF on #0C0D0D ≈ 7.2:1) passes AA + AAA. Skip `bg-white` regions.

For `src/components/ui/input.jsx:9`: `placeholder:text-gray-500` → `placeholder:text-gray-400`.
For `Contact.jsx` `<SelectTrigger className="h-14 text-gray-400">`: drop the gray class so selected value renders white.

- [ ] **Step 3: Spot-check with DevTools contrast checker.**

- [ ] **Step 4: Commit**

```bash
bun run lint
git add src/
git commit -m "fix(a11y): bump text-gray-500 → text-gray-400 to meet WCAG AA contrast"
```

---

## Task 2.11: Connect.jsx Upwork URL fix

**Files:** `src/components/Connect.jsx`

- [ ] **Step 1: Replace string concatenation with URLSearchParams**

```js
const upworkUrl = new URL(socialLinks.upwork);
upworkUrl.searchParams.set('mp_source', 'portfolio');
upworkUrl.searchParams.set('utm_medium', 'connect_section');
// use upworkUrl.toString()
```

If preserving `mp_source=share` matters, set only `utm_*` via `URLSearchParams`.

- [ ] **Step 2: Commit**

```bash
git add src/components/Connect.jsx
git commit -m "fix: build Upwork tracking URL with URLSearchParams"
```

---

## Task 2.12: CSP + security headers (`public/.htaccess`)

**Files:** `public/.htaccess`, `public/ga-init.js` (new), `src/main.jsx` (Sentry tunnel)

**Strategy:**
1. Move GA bootstrap out of inline `<script>` into `public/ga-init.js` so script-src can drop `'unsafe-inline'`.
2. Enable Sentry `tunnel: '/sentry-tunnel'` (Hostinger redirect to ingest endpoint OR Supabase Edge Function proxy) → drops every `*.sentry.io` from `connect-src`.
3. Ship CSP in `Content-Security-Policy-Report-Only` first (≥7 days, monitor Sentry CSP reports), then flip to enforcement in a follow-up tiny PR.
4. `frame-ancestors 'self'` in PROD (Horizons editor is dev-only); `*.hostinger.com` allowance behind a separate dev rule. Drop `X-Frame-Options` (conflicts with `frame-ancestors`; modern browsers prefer CSP).

- [ ] **Step 1: Externalize GA bootstrap into `public/ga-init.js`**

So no inline `<script>` is needed anywhere → `'unsafe-inline'` for `script-src` becomes unnecessary.

- [ ] **Step 2: Enable Sentry tunnel** in `src/main.jsx` `Sentry.init`:

```js
tunnel: '/sentry-tunnel',
```

Configure the tunnel route via Hostinger redirect or a Supabase Edge Function that proxies to `https://o4510426517143552.ingest.de.sentry.io/api/.../envelope/`.

- [ ] **Step 3: Create `public/.htaccess` (REPORT-ONLY first)**

```apache
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Cross-Origin-Opener-Policy "same-origin-allow-popups"
  # NO Cross-Origin-Embedder-Policy — would break Horizons iframe
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=(), payment=(), usb=(), serial=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), clipboard-read=(), fullscreen=(self)"
  # X-Frame-Options DROPPED — conflicts with frame-ancestors and modern browsers prefer CSP
  Header always set Content-Security-Policy-Report-Only "default-src 'self'; \
    script-src 'self' https://www.googletagmanager.com; \
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; \
    font-src 'self' https://fonts.gstatic.com; \
    img-src 'self' data: https:; \
    connect-src 'self' https://*.supabase.co https://www.google-analytics.com; \
    frame-ancestors 'self'; \
    base-uri 'self'; \
    form-action 'self'; \
    report-uri https://o4510426517143552.ingest.de.sentry.io/api/4510426780532816/security/?sentry_key=b697debff1be30b835700c935a494249;"

  # index.html must not be long-cached or SPA shell updates won't ship
  <FilesMatch "index\.html$">
    Header always set Cache-Control "no-cache, must-revalidate"
  </FilesMatch>
</IfModule>

<IfModule mod_rewrite.c>
  Options -MultiViews
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

ErrorDocument 404 /index.html
```

- [ ] **Step 4: After ≥7 days of clean Sentry CSP reports, flip to enforcement** in a follow-up PR — replace `Content-Security-Policy-Report-Only` with `Content-Security-Policy`.

`'unsafe-inline'` for styles still required by Tailwind in dev; in prod CSS is in a file. If desired, gate styles via build env in a future task.

- [ ] **Step 2: Confirm Vite copies to `dist/`**

```bash
bun run build
ls -la dist/.htaccess
```

- [ ] **Step 3: After deploy**

```bash
curl -I https://www.vivekapatel.com/
```

- [ ] **Step 4: Commit**

```bash
git add public/.htaccess
git commit -m "feat(security): CSP + HSTS + security headers via .htaccess"
```

---

## Task 2.13: Phase 2 PR

```bash
git push -u origin feature/p1-review-fixes
gh pr create --base dev --title "P1 review fixes: a11y, helmet-async, perf, CSP" --body "$(cat <<'EOF'
## Summary
- react-helmet → react-helmet-async; remove duplicate canonical
- Mobile menu → Radix Dialog (focus trap, Escape, scroll-lock); hash nav replaces setTimeout
- Portfolio cards as real anchors
- Global MotionConfig reducedMotion="user"; TechStack eager-preload removed; Testimonials :focus-within pause
- Contact form aria-invalid + inline errors + icon-only labels
- Footer hash links scroll; Manage Consent is a button; cookie close behavior explicit
- SupabaseAuthContext getSession try/catch
- Route-level code-splitting
- Local-host favicon/OG/hero images; legal copy + metadata aligned
- text-gray-500 → text-gray-400 (AA contrast)
- Connect Upwork URL via URLSearchParams
- CSP + security headers

## Test plan
- [ ] bun run lint clean, bun run build clean, bun run test passes
- [ ] All routes render with single canonical, no helmet warnings
- [ ] Mobile menu: focus trap + Escape + body scroll lock
- [ ] Portfolio cards: middle-click + right-click work
- [ ] OS reduce-motion: animations disabled, marquee static
- [ ] Empty form submit: focus moves to first error, SR announces
- [ ] Footer hash links scroll on /, navigate-then-scroll elsewhere
- [ ] Built bundle has separate chunks per route
- [ ] Lighthouse a11y ≥ 95
- [ ] After deploy: curl -I shows CSP, HSTS

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

# PHASE 3 — P2 CLEANUP

```bash
git checkout dev && git pull
git checkout -b feature/p2-cleanup
```

## Task 3.1: Delete dead code

- [ ] **Step 1: Verify unimported**

```bash
for f in CookiePolicy PrivacyPolicy WelcomeMessage CallToAction ErrorButton; do
  echo "=== $f ==="
  grep -rn "$f" src/ index.html | grep -v "/$f.jsx:"
done
```

- [ ] **Step 2: Delete + commit**

```bash
git rm src/pages/CookiePolicy.jsx src/pages/PrivacyPolicy.jsx \
       src/components/WelcomeMessage.jsx src/components/CallToAction.jsx \
       src/components/ErrorButton.jsx
bun run lint && bun run build
git commit -m "chore: remove unused placeholder files"
```

---

## Task 3.2: Extract duplicated SVG icons

**Files:**
- Create: `src/components/icons/UpworkIcon.jsx`, `FreelancerIcon.jsx`, `FreelancerMapIcon.jsx`
- Modify: `Contact.jsx`, `Connect.jsx`, `Hero.jsx`, `Testimonials.jsx`

- [ ] **Step 1: Shared component, e.g.,**

```jsx
const UpworkIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z" />
  </svg>
);
export default UpworkIcon;
```

- [ ] **Step 2: Replace inline SVGs with imports; delete inline definitions.**

- [ ] **Step 3: Commit**

```bash
bun run lint && bun run build
git add src/components/icons/ src/pages/Contact.jsx src/components/{Connect,Hero,Testimonials}.jsx
git commit -m "refactor: extract Upwork/Freelancer icons to shared components"
```

---

## Task 3.3: Stable keys (replace `index`)

**Files:** `Stats.jsx:116`, `Connect.jsx:112`, `Experience.jsx:95,204`

- [ ] Replace `key={index}` with stable property: `key={item.label}`, `key={item.title}`, `key={tag}`. Verify uniqueness.

```bash
bun run lint
git add src/components/{Stats,Connect,Experience}.jsx
git commit -m "fix: use stable keys instead of array index"
```

---

## Task 3.4: Build scripts fail loudly

**Files:** `tools/generate-sitemap.js`, `tools/generate-llms.js`

- [ ] **Step 1:** Replace silent `console.error` with `console.error(err); process.exit(1)` for fatal errors.

- [ ] **Step 2:** For per-file errors that shouldn't abort, increment a counter and exit non-zero at end if `counter > 0`.

- [ ] **Step 2b:** Wire `generate-llms.js` into the build (currently NOT invoked):

```json
"build": "node tools/generate-sitemap.js && node tools/generate-llms.js && vite build"
```

- [ ] **Step 3: Verify** — temporarily inject syntax error in each generator, confirm build fails, revert.

```bash
git add tools/
git commit -m "fix(build): fail loudly on sitemap/llms generation errors"
```

---

## Task 3.5: Image `width`/`height` attributes

**Files:** `Project.jsx:170,184,191,220`, `Header.jsx:79,133`, `Footer.jsx:60`

- [ ] Add explicit `width`/`height` matching aspect to each `<img>`. Lighthouse CLS should approach 0.

```bash
git add src/
git commit -m "perf: add intrinsic width/height to images to prevent CLS"
```

---

## Task 3.6: Tap-target sizing (≥ 44px)

**Files:** `Header.jsx` mobile trigger, `Footer.jsx` social icons

- [ ] Add `min-h-11 min-w-11 inline-flex items-center justify-center` to icon-only buttons.

```bash
git add src/components/{Header,Footer}.jsx
git commit -m "fix(a11y): icon-only buttons meet 44px tap target"
```

---

## Task 3.7: Vendor chunk splitting

**Files:** `vite.config.js` (only `build.rollupOptions.output.manualChunks` — do NOT touch Horizons plugin/error-handler config)

- [ ] **Step 1: Add (function form — self-maintaining; object form errors on tree-shaken Radix deps)**

```js
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (!id.includes('node_modules')) return;
        if (/[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) return 'react-vendor';
        if (id.includes('@sentry')) return 'sentry';
        if (id.includes('framer-motion')) return 'framer';
        if (id.includes('@radix-ui')) return 'radix';
      },
    },
  },
},
```

- [ ] **Step 2: Verify**

```bash
bun run build
ls -lh dist/assets/*.js | sort -k5 -h
```

```bash
git add vite.config.js
git commit -m "perf: split vendor chunks (react, framer, sentry, radix)"
```

---

## Task 3.8: Remove stale `package-lock.json`

- [ ] **Step 1:** Confirm `bun.lockb` is the lockfile.

```bash
ls -la package-lock.json bun.lockb
git rm package-lock.json
git commit -m "chore: remove stale package-lock.json (bun.lockb is the lockfile)"
```

---

## Task 3.9: SR external-link hints + `aria-hidden` on decorative motion

**Files:** `Hero.jsx:38,141`, `Testimonials.jsx:57`, `Footer.jsx:88-98`, `Contact.jsx:329,352,360`

- [ ] **Step 1: External-link SR hint**

```jsx
<a href="..." target="_blank" rel="noopener noreferrer">
  Visit profile<span className="sr-only"> (opens in new tab)</span>
</a>
```

For icon-only: `aria-label="LinkedIn (opens in new tab)"`.

- [ ] **Step 2: `aria-hidden="true"` on Hero scroll indicator + decorative pulses.**

```bash
bun run lint
git add src/
git commit -m "fix(a11y): announce external links; aria-hidden decorative motion"
```

---

## Task 3.9b: CI gate (`lint → test → build → test:e2e`)

**Files:** `.github/workflows/ci.yml`

- [ ] On PRs to `dev` and `main`: run `bun install`, `bun run lint`, `bun run test`, `bun run build`, then `bunx playwright install --with-deps chromium && bun run test:e2e`.
- [ ] Block merges on red.
- [ ] Playwright runs against `bun run preview` on `localhost:3000` (NOT against Hostinger preview).
- [ ] Set `use: { trace: 'on-first-retry', screenshot: 'only-on-failure', video: 'retain-on-failure' }` in `playwright.config.js`. Upload artifacts on failure with 7d retention.

```bash
git add .github/workflows/ci.yml playwright.config.js
git commit -m "ci: lint+test+build+e2e gate on PRs to dev/main"
```

---

## Task 3.9c: Supply-chain hygiene (Dependabot + audit-ci + gitleaks)

**Files:** `.github/dependabot.yml`, `.github/workflows/security.yml`

- [ ] **Step 1: Dependabot** — weekly for npm + GitHub Actions:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
```

- [ ] **Step 2: `audit-ci --moderate`** in CI job.
- [ ] **Step 3: `gitleaks-action`** for secret scanning (Supabase service-role key must never leak; anon key in `customSupabaseClient.js` is intended public).
- [ ] **Step 4:** Enable GitHub secret scanning + push protection in repo settings.

```bash
git add .github/dependabot.yml .github/workflows/security.yml
git commit -m "ci: dependabot, audit-ci, gitleaks for supply-chain hygiene"
```

---

## Task 3.9d: Lighthouse CI budgets

**Files:** `.lighthouserc.json`, CI workflow

- [ ] Pin perf/a11y/SEO budgets (perf ≥ 0.85, a11y ≥ 0.95, seo ≥ 0.95). Regressions block merge. Repo already runs Lighthouse on `main`; this gates PRs.

```bash
git add .lighthouserc.json .github/workflows/lighthouse.yml
git commit -m "ci: pin Lighthouse perf/a11y/SEO budgets"
```

---

## Task 3.9e: `WebSite` JSON-LD + `BreadcrumbList`

**Files:** `index.html`, `src/pages/Project.jsx`

- [ ] Add `WebSite` JSON-LD to `index.html` (enables Google sitelinks search box). Currently `Person` + `ProfessionalService` only.
- [ ] Add `BreadcrumbList` JSON-LD on `/project/:slug` once real case studies exist.
- [ ] Per-project structured data: emit `CreativeWork` or `Article` with `image`, `datePublished`, `dateModified`, `author` from `src/data/projects.js`.

```bash
git add index.html src/pages/Project.jsx
git commit -m "feat(seo): WebSite + BreadcrumbList JSON-LD"
```

---

## Task 3.9f: Bundle analyzer

**Files:** `package.json`, `vite.config.js` (if a separate analyze config is preferred, create `vite.config.analyze.js` to keep Horizons constraints clean)

- [ ] Install `rollup-plugin-visualizer`. Add `"build:analyze": "ANALYZE=1 vite build"` script. Validates Task 3.7 actually reduced Home payload.

```bash
git add package.json vite.config.js
git commit -m "build: bundle analyzer to validate chunk splits"
```

---

## Task 3.10: Update production test plan

**Files:** `docs/PRODUCTION_TEST_PLAN.md`, `docs/changelog.md` (if used)

- [ ] **Step 1:**
- Remove stale `social-media-app` route check.
- Add 404 page check.
- Add "no tracking before consent" verification.
- Update metadata asset checks to point at real files.
- Mark mobile-menu keyboard testing as mandatory.

- [ ] **Step 2: Final repo-level verification**

```bash
bun run lint
bun run test
bun run build
bun run test:e2e
```

```bash
git add docs/PRODUCTION_TEST_PLAN.md docs/changelog.md
git commit -m "docs: update production test plan for review remediation"
```

---

## Task 3.11: Phase 3 PR

```bash
git push -u origin feature/p2-cleanup
gh pr create --base dev --title "P2 cleanup: dead code, vendor chunks, a11y polish" --body "$(cat <<'EOF'
## Summary
- Delete unused placeholder pages/components
- Extract Upwork/Freelancer icons to shared components
- Stable keys instead of array index
- Build scripts fail loudly on errors
- width/height on images (CLS)
- 44px tap targets on icon buttons
- Manual vendor chunk splitting
- Drop stale package-lock.json
- SR hints on external links + aria-hidden decorative motion
- Production test plan refreshed

## Test plan
- [ ] bun run lint, bun run test, bun run build, bun run test:e2e all clean
- [ ] Lighthouse a11y ≥ 95, CLS ≈ 0
- [ ] Separate vendor chunks visible in dist/

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Task 3.12: Major dependency migrations

Safe minor/patch bumps were already applied as part of Phase 3 prep (commit `chore(deps): bump safe minor/patch versions`). The remaining majors below are deferred to dedicated PRs because they have breaking changes that touch this codebase. **Do these one PR at a time, off `dev`, never bundle multiple majors in a single PR.**

Constraints reminder: anything that would force changes to `plugins/` or the `horizons-*` error handlers / `window.parent.postMessage` patterns in `vite.config.js` is hard-blocked. Vite must stay on a line Hostinger Horizons supports.

- **vite 4.5.5 → 8.0.10** — DEFER, possibly indefinitely.
  - Breaking: Node ≥ 20.19/22.12 required (v7+), default target bump to `baseline-widely-available` (v7), removal of CJS Node API (v6), `splitVendorChunkPlugin` removed (v6), `transformIndexHtml` `enforce`/`transform` hook signature changes.
  - Codebase impact: `vite.config.js` Horizons plugins (`horizons-vite-error`, `horizons-runtime-error`, `horizons-console-error`, iframe-route-restoration) all use the legacy plugin shape — Horizons sync would need to bless a new shape first.
  - Effort: **L** — own PR, blocked until Horizons confirms.
  - Touches: `vite.config.js`, `plugins/visual-editor/*`, `plugins/iframe-route-restoration/*`.

- **@vitejs/plugin-react 4.7 → 6.0.1** — DEFER (tied to Vite major).
  - Requires Vite ≥ 6. Bump together with Vite.
  - Effort: **S** once Vite is moved.

- **tailwindcss 3.3.3 → 4.2.4** — DEFER, own PR.
  - Breaking: new Oxide engine, CSS-first config (`@theme` replaces most of `tailwind.config.js`), `@tailwind base/components/utilities` directives replaced by `@import "tailwindcss"`, PostCSS plugin moved to `@tailwindcss/postcss`, deprecated utilities removed.
  - Codebase impact: `tailwind.config.js` (CSS variables for theming, `tailwindcss-animate` plugin), `postcss.config.js`, `src/index.css` directives, every `@apply` site. `tailwindcss-animate` is unmaintained for v4 — replace with `tw-animate-css`.
  - Effort: **L** — own PR. Run `npx @tailwindcss/upgrade` codemod first.
  - Touches: `tailwind.config.js`, `postcss.config.js`, `src/index.css`, `src/components/ui/*`.

- **react-router-dom 6.16.0 → 7.14.2** — DEFER, own PR.
  - Breaking: package merges `react-router` into `react-router-dom`, requires React ≥ 18, future flags from v6 become defaults (`v7_startTransition`, `v7_relativeSplatPath`, `v7_normalizeFormMethod`, `v7_fetcherPersist`, `v7_partialHydration`), `json()` / `defer()` deprecated.
  - Codebase impact: `src/main.jsx` (`BrowserRouter`), `src/App.jsx` (`Routes`/`Route`/`useLocation`/`Navigate`), `src/components/Layout.jsx` (`Outlet`), `src/components/CTA.jsx` (`useNavigate`), `src/components/Connect.jsx` (`Link`), `src/pages/*`. APIs used are stable across v6→v7 — main risk is splat path semantics on the `Project/:projectId` route.
  - Effort: **M** — own PR. Enable v7 future flags in v6 first to flush warnings, then bump.

- **framer-motion 10.16 → 12.38** — DEFER, own PR.
  - Breaking (v11): drops React 17 support, `LayoutGroup` API tweaks, `motion.*` SSR hydration changes. (v12): drops Node 18, `useScroll` `container` ref behavior change, `AnimatePresence` `mode="popLayout"` becomes default in some cases, `MotionConfig` reducedMotion default shift.
  - Codebase impact: heavy use across `src/components/SectionAnimator.jsx`, Hero/About/Portfolio/Services/Stats/Testimonials/Connect/CTA — all use basic `motion.*` + `AnimatePresence` + `useScroll`. Likely smooth, but every animation needs visual QA.
  - Effort: **M** — own PR. Bump to 11.x first as a checkpoint, then 12.x.

- **@sentry/react 7.100 → 10.50** — DEFER, own PR.
  - Breaking (v8): drops Node < 14.18, ESM-only, `BrowserTracing` class removed in favor of `browserTracingIntegration()` (already used here), `Replay` class → `replayIntegration()` (already used), `Hub`/`Scope` API replaced with `Sentry.getCurrentScope()` etc., `tracingOrigins` → `tracePropagationTargets`. (v9/v10): tightened sample-rate validation, default `sendDefaultPii: false`, integration import paths normalized.
  - Codebase impact: `src/main.jsx` already uses the new functional integrations, so the v7→v8 jump is mostly mechanical. Re-validate `tracesSampleRate`, `replaysSessionSampleRate`, and any `Sentry.captureException` call sites. Verify CSP `report-uri`/`report-to` endpoints still match Sentry v10 ingest URLs (cross-ref Task 1.x CSP).
  - Effort: **S–M** — own PR.

- **lucide-react 0.285 → 1.11** — DEFER, own PR.
  - Breaking: package went 1.0 GA; some icon names renamed/removed, tree-shaking now requires `lucide-react/icons/<name>` deep imports for best results, default stroke width tweaks.
  - Codebase impact: ~50 import sites across `src/components/*` and `src/pages/*`. Run `npx lucide-react-codemod` (if published) or grep-and-replace renamed icons.
  - Effort: **S** — own PR.

- **eslint 8.57 → 10.2 + eslint-config-react-app 7.0.1** — DEFER, own PR.
  - Breaking: ESLint 9 requires flat config (`eslint.config.js`), legacy `.eslintrc.*` removed in 10. `eslint-config-react-app` is unmaintained and does not ship a flat config.
  - Codebase impact: `.eslintrc.cjs` (or whichever), `package.json` `lint` script, lint-staged config. Replace `eslint-config-react-app` with a hand-rolled flat config using `@eslint/js` + `eslint-plugin-react` + `eslint-plugin-react-hooks` (already on v7) + `eslint-plugin-jsx-a11y` (already latest).
  - Effort: **M** — own PR. Coordinate with Task 3.9b (CI gate).

- **tailwind-merge 1.14 → 3.5** — DEFER, own PR (can ride with Tailwind v4 PR).
  - Breaking: v2 dropped CJS, v3 reworked the config schema (`extendTailwindMerge` shape changed), aligned with Tailwind v4 utility set.
  - Codebase impact: `src/lib/utils.js` (`cn()` helper) — single import site, but downstream `cn()` calls everywhere. Bump alongside Tailwind v4.
  - Effort: **S** when bundled with Tailwind v4.

- **react / react-dom 18.2 → 19.x** — DEFER, evaluate after the above.
  - Gated on: Sentry v10 (OK on 19), Framer Motion v12 (OK on 19), all Radix packages (current versions support 19), react-router-dom v7 (requires 19-ready). Do NOT bump until each of those PRs has landed.
  - Codebase impact: `package.json` `overrides` block pinning React 18 must be removed; `@types/react` / `@types/react-dom` to 19; possible `useRef` initial-arg requirement; `forwardRef` deprecation warnings in Radix wrappers under `src/components/ui/*`.
  - Effort: **L** — own PR, last in the sequence.

- **@types/node 20.x line** — STAY on 20.
  - Locked to Node 20 LTS to match Hostinger runtime. Bumping to 22/24/25 types would surface APIs not present at runtime. Latest 20.x (`20.19.39`) was applied as a safe bump.

**Suggested PR order:** lucide-react → framer-motion → @sentry/react → react-router-dom → eslint flat config → (Tailwind v4 + tailwind-merge) → (Vite 5/6 + plugin-react) — only if Horizons supports it → React 19.

---

# Final Verification Checklist

- [ ] `bun run lint`
- [ ] `bun run test`
- [ ] `bun run build`
- [ ] `bun run test:e2e`
- [ ] First load sends no GA requests before consent (Consent Mode v2 default-denied fired).
- [ ] On accept, GA Consent Mode v2 update fired before `gtag.js` loads.
- [ ] Sentry replay: typed form values masked as `***`; no `leadEmail` in event.extra; no email strings in exception messages.
- [ ] CSP shipped Report-Only ≥7 days; Sentry CSP report endpoint receiving violations; flip-to-enforce PR open.
- [ ] Mobile menu traps focus and closes on `Escape`; iOS body-scroll-lock verified on real device.
- [ ] Testimonials marquee: visible Pause/Play button operates; `aria-pressed` toggles.
- [ ] Tab through Home — every interactive element has a visible focus-visible ring.
- [ ] `<main id="main-content">` receives focus when skip-to-content is activated.
- [ ] `/#services`, `/#about`, `/#portfolio`, `/#testimonials` work from both home and non-home routes.
- [ ] Every URL in `public/sitemap.xml` returns real content.
- [ ] Legal pages show correct domain + contact email.
- [ ] Social preview tags reference assets that return 200.
- [ ] `curl -I` on prod shows CSP, HSTS, X-Content-Type-Options, Referrer-Policy.

# Final follow-up

After Phase 3 merges:

```bash
gh issue create --repo vivekpatel99/my-portfolio-webisite \
  --title "Polish: deferred items from review fixes plan" \
  --body "Micro-tasks deferred:
- Replace useNavigate+onClick with <Button asChild><Link> in Hero/CTA/Header/Footer
- motion.header → header (no animation props)
- Promote #0C0D0D to a Tailwind theme token
- BreadcrumbList + WebSite JSON-LD
- CookieConsentBanner → Radix Dialog
- CustomCursor: aria-hidden + reduce-motion
- Dep bumps (vite, framer-motion, lucide-react, @sentry/react, react-router-dom)
- Cloudflare Turnstile on contact form (cross-ref Phase 1 issue)"
```

---

# Self-Review

**Coverage check:** Every issue in the two source plans maps to a task here.

| Source | Item | Mapped task |
|---|---|---|
| B P0 #1 | GA prop + Consent Mode v2 default | 1.1 |
| B P0 #2 | Contact try/catch | 1.2 |
| B P0 #3 | Email-failure surfacing | 1.2 (bundled) |
| B P0 #4 | ErrorBoundary | 1.3 |
| B P0 #5 | Sitemap mismatch + gitignore + per-project lastmod | 1.4 |
| A Task 5.5 / B P0 (implicit) | Catch-all → 404 (SPA-cannot-return-real-404 flagged) | 1.5 |
| B P0 #6 | Sentry PII (beforeSend + beforeBreadcrumb + maskAllText) | 1.6 |
| B P0 #7 | Supabase RLS + edge-function rate-limit | 1.7 |
| Expert review | Focus-visible ring + focusable `<main>` | 1.8 |
| A Task 1 | Test harness (split vitest config) | 0.2 |
| B P1 #12 / A Task 5 | `@dr.pogodin/react-helmet` + per-page canonicals | 2.1 |
| A Task 5.2 / B P1 #8 | Mobile menu Radix + hash nav | 2.2 |
| B P1 #9 / A Task 5.3 | Portfolio anchors | 2.3 |
| B P1 #10 / A Task 6 | MotionConfig + TechStack preload + Testimonials Pause/Play (WCAG 2.2.2) + raw Tailwind animation audit | 2.4 |
| B P1 #11 / A Task 5.4 | Contact a11y | 2.5 |
| B P1 #15 | Footer hash sweep + Manage Consent button + persist-on-close + 6mo expiry | 2.6 |
| B P1 #18 | getSession try/catch | 2.7 |
| B P1 #13 | Code splitting | 2.8 |
| B P1 #14 / A Task 4 | Local images + legal copy + Sentry-as-processor + OG completeness + robots.txt + resource hints + LCP preload | 2.9 |
| B P1 #19 | Color contrast | 2.10 |
| A Task 7.1 | Connect Upwork URL | 2.11 |
| B P1 #17 | CSP/.htaccess (report-only first, no-unsafe-inline scripts via externalized GA + Sentry tunnel, frame-ancestors 'self' prod, COOP, expanded Permissions-Policy, ErrorDocument 404, index.html cache override) | 2.12 |
| B P2 dead code | 3.1 |
| B P2 SVG dedup | 3.2 |
| B P2 index keys | 3.3 |
| B P2 build fail-loud | 3.4 |
| B P2 image dims | 3.5 |
| B P2 tap targets | 3.6 |
| B P2 manualChunks | 3.7 |
| B P2 lockfile | 3.8 |
| B P2 SR hints | 3.9 |
| Expert review | CI gate (lint+test+build+e2e) | 3.9b |
| Expert review | Dependabot + audit-ci + gitleaks | 3.9c |
| Expert review | Lighthouse CI budgets | 3.9d |
| Expert review | WebSite + BreadcrumbList JSON-LD | 3.9e |
| Expert review | Bundle analyzer | 3.9f |
| A Task 7.2 | Production test plan | 3.10 |

**Deferred (separate follow-up issue):** magic color token, navigate→Link in CTAs, `motion.header` props, CookieConsentBanner Radix swap, CustomCursor reduce-motion, dep bumps, Cloudflare Turnstile (rate-limit ships in 1.7), `vite-imagetools` AVIF/WebP pipeline, CSP `'unsafe-inline'` removal for styles in prod, `modulepreload` for critical chunks (after 3.7).

**Conflicts/decisions added by expert review:**
- helmet: `react-helmet-async` is archived → switch to `@dr.pogodin/react-helmet`.
- Sentry PII: `extra.leadEmail` removed from 1.2; `beforeSend`/`beforeBreadcrumb` scrubbers added; `maskAllText: true` (was `false`).
- GA: Consent Mode v2 default-denied required (EEA 2024+).
- Marquee: `:focus-within` doesn't satisfy WCAG 2.2.2 → explicit Pause/Play button.
- Sitemap: gitignore + per-project `lastmod` (not `today` for unchanged URLs).
- CSP: report-only ≥7 days first; no inline scripts (externalize GA bootstrap + Sentry tunnel); `frame-ancestors 'self'` in prod (Horizons editor is dev-only); drop `X-Frame-Options` (conflicts).
- `manualChunks`: function form (object form errors on tree-shaken deps).
- Vitest config in separate file (not inside `vite.config.js` — Horizons constraint).
- Rate-limit on edge function escalated to P0 (alongside RLS); Turnstile remains follow-up.

**Conflicts resolved:**
- Sentry: keep init in `main.jsx` and harden (B) rather than extract+defer (A) — smaller blast radius; legal/cookie wording task in 2.9 documents actual behavior.
- Reduced motion: framework-native `MotionConfig` (B) over custom hook (A).
- Catch-all: dedicated 404 page (A) over silent home redirect (B).
- Project data: shared dataset (A) + interim "no slugs in sitemap" policy (B) combined.

**Placeholder scan:** No `TODO`/`TBD` markers in execution steps.
