# Review every page against the theme

Read [the portfolio theme guide](../DESIGN.md) before the review. Review the guide's proposed defaults with Vivek before using them as final implementation requirements. This procedure prepares the next task. It records no completed sitewide audit.

## Prepare the review

1. Record the checked branch, commit, build type, browser engine and version, and actual browser viewport dimensions.
2. Check whether an equivalent issue or PR already exists before creating another ticket.
3. Enumerate current public routes from `src/App.jsx`, public case-study slugs from `src/data/caseStudies.js`, and service IDs from `src/data/serviceOffers.js`.
4. Record every resulting URL individually. Include every published case study and service detail, even when they share a component.
5. Run the local production preview. Use isolated synthetic transport for contact states, with external lead submission blocked.

Do not expose private or draft case studies to complete route coverage. Use the validated public projection and publication behavior.

## Cover every page and state

| Route or area | Required coverage | Theme rules |
| --- | --- | --- |
| `/` | Hero, featured work, services, testimonials, About, final CTA. Check each hash arrival and scroll transition. | All applicable rules. |
| `/case-studies/` | Every public card in the single completion-date collection. The first six are the initial batch and Load more reveals the rest. There is no separate Other Work section. Check empty results, return position, and loaded count. | All applicable rules. |
| `/case-studies/` without JavaScript | Load the prerendered production page in a browser with JavaScript disabled before navigation. Check the first six cards, the natively disabled Load more button, and the `noscript` navigation labeled More case studies with links to every remaining public story. Inspect link destinations, keyboard access, contrast, and wrapped text at the review viewports and zoom. | All applicable rules, including BT-01. |
| `/project/:projectId/` | Every public case study. Check cover, media variants, gallery, lightbox, captions, article hierarchy, back links, and estimate action when present. | All applicable rules. |
| `/project/:projectId/` without JavaScript | Disable JavaScript before navigating to every public project URL in the production preview. Inspect the prerendered article, cover, back links, and estimate action when present. For galleries, inspect direct media links and every caption, including the additional captions exposed through `noscript`. Verify destinations, keyboard access, contrast, media legibility, and wrapped text at the review viewports and zoom. | All applicable rules. |
| `/services/:serviceId` | Every service ID. Check summary, scope, exclusions, rate, and estimate action. | All applicable rules. |
| `/services/:serviceId` without JavaScript | Disable JavaScript before navigating to every public service URL in the production preview. Inspect prerendered summary, scope, exclusions, rate, back links, and estimate action. Verify destinations, keyboard access, contrast, and wrapped text at the review viewports and zoom. | All applicable rules. |
| `/contact/` | Empty, filled, focused, invalid, disabled, submitting, success, and retry states. Validate draft restoration where supported. Enable forced-colors mode and inspect empty and filled fields at rest and with keyboard focus. Verify the 1px CanvasText resting outline and 2px Highlight focused outline remain visible. | All applicable rules, including FM-01. |
| `/legal/` | Whole page, heading hierarchy, links, and shared shell. | All applicable rules. |
| `/data-policy/` | Whole page, heading hierarchy, links, and consent entry points. | All applicable rules. |
| Unknown URL, invalid project, invalid service | Not-found appearance and recovery links. | All applicable rules. |
| Route failure | Inner `RouteErrorBoundary` around the route outlet in `src/components/Layout.jsx` (`src/components/RouteErrorBoundary.jsx`). Check "This page didn't load", Retry, and Back to Home. The shared shell stays mounted. Use a controlled local failure inside the outlet. | All applicable rules. |
| Global failure | Outer `ErrorBoundary` mounted in `src/main.jsx` (`src/components/ErrorBoundary.jsx`). This is the fallback when Header, Footer, Layout, or the route fallback itself throws. Its UI is distinct: a full-screen "Something went wrong." message and a "Back to home" link, with no Retry and no shared shell. Use a controlled local failure outside the inner boundary. | All applicable rules. |
| Route loading | Uncached visit to a lazy route only: `/contact/`, `/services/:serviceId`, `/legal/`, or `/data-policy/`. Hold the route chunk in a local production preview. `src/components/Layout.jsx` renders `src/components/RouteLoading.jsx` inside the shared shell. Known services show their current heading and summary, Back to Services, and visible Loading service details status. Other lazy routes and unknown service IDs show a Loading page heading and status. The status retains `role="status"` and `aria-label="Loading page"` for retry focus recovery. Check current metadata, readable wrapping, keyboard navigation, and first-visit consent at desktop, 390px, and 320px in Chromium and WebKit. Release or reject the chunk, and navigate while it is held; verify one current visible heading, correct final content, and existing error/retry recovery. Header and footer stay mounted. Loading has no Retry or error copy; those belong to RouteErrorBoundary. Home, case studies, project pages, and the catch-all not-found route are eager. Record controlled pending behavior separately from measured loading duration or CLS. | All applicable rules. |
| Shared shell | Header, active navigation, mobile menu, footer, consent banner and dialog, notifications. Also the keyboard skip link in src/components/Layout.jsx (visible on focus only) and CustomCursor (src/components/CustomCursor.jsx): it replaces the native cursor only for fine pointers without reduced motion. Check skip-link contrast and focus, and the cursor's fine-pointer, coarse-pointer, and reduced-motion states. Verify the native cursor remains visible with JavaScript disabled, entry scripts blocked or delayed, and before the first mouse movement. On the first movement, verify the custom dot appears at the pointer before the native cursor is hidden. | All applicable rules. |

Use a route-by-state coverage table. A row is complete only after its applicable states and content have been inspected. Shared components do not prove every page fits its own content. Theme rules are not a closed sample. A non-home row is complete only after every applicable rule has been inspected, including panel emphasis, frame geometry, type, and spacing (DP-01, SH-03, TY-01, LY-01, and peers) when that page uses those elements. Do not finish the review from buttons and navigation alone.

## Inspect appearance and behavior

Capture the desktop 1440 by 900 layout, the review's 980 by 1324 layout, mobile 390 by 844, and narrow 320 by 740. Record actual dimensions if the browser uses a different viewport. Check native 200% browser zoom and reduced motion. Include forced-colors mode for the contact form as specified in its coverage row.

Run the applicable visual and keyboard states in both Chromium and WebKit before marking coverage complete. Include desktop and mobile focus, cursor, and route-recovery states, plus contact color-scheme and typography coverage, following the repository QA matrices. Record unsupported platform states explicitly; verify contact forced-colors outlines in an engine that supports forced-colors mode.

For each applicable component, inspect resting appearance, mouse hover, keyboard focus, touch appearance, long text, and supported disabled or loading states. Inspect modal entry, focus containment, Escape, and focus return when those behaviors apply.

Compare equivalent roles side by side. Check button geometry and emphasis, corner density, label alignment, confidence placement, portrait crop, type hierarchy, spacing, contrast, clipping, and layout shift. Do not add decorative frames to solve an alignment problem.

Read the entire page. A screenshot of the first viewport does not cover content below it. Verify real image decoding and gallery controls. Theme review does not authorize a real contact submission or production deployment.

## Record each finding

Each ticket contains the following evidence:

- Exact URL, component, commit, viewport, and interaction state.
- Screenshot or short clip with enough surrounding context to understand the mismatch.
- Theme rule ID, the exact clause cited, and that clause's own status: confirmed, existing reference, or proposed default. Do not assign one status to a whole rule when its clauses differ. Do not record an existing reference as confirmed or as proposed. Do not invent a status for a clause that does not state one.
- Observed appearance or behavior and the expected change.
- Scope, affected callers, related issues, and behavior that must be preserved.
- Observable acceptance criteria and desktop, mobile, zoom, keyboard, and motion checks that apply.

Keep a proposed design choice out of the defect list until Vivek decides it. Label uncertain behavior as needing reproduction. Do not report a factual claim or missing asset as confirmed solely from decoration or one stale screenshot.

Update #294 for corner consistency, #296 for the shared button family, and #297 for hero label attachment and simulated scores when the new finding fits their existing scope. Use a separate issue when the behavior, page, or verification is independently deliverable.

## Hand off implementation

Finish the review with a complete route inventory, a coverage table, remaining untested states, and prioritized issue links. A blocking interaction defect takes priority over decoration. Group shared-style changes by component ownership so fixes do not conflict.

Implement reviewed findings in bounded follow-up PRs. Each PR references the guide rule and the originating issue, provides appropriate visual evidence, and preserves unrelated work. Confirm fixes on the exact delivered commit. Merge and production release remain separate decisions.
