# Review every page against the theme

Read [the portfolio theme guide](../DESIGN.md) before the review. Review the guide's proposed defaults with Vivek before using them as final implementation requirements. This procedure prepares the next task. It records no completed sitewide audit.

## Prepare the review

1. Record the checked branch, commit, build type, and actual browser viewport dimensions.
2. Check whether an equivalent issue or PR already exists before creating another ticket.
3. Enumerate current public routes from `src/App.jsx`, public case-study slugs from `src/data/caseStudies.js`, and service IDs from `src/data/serviceOffers.js`.
4. Record every resulting URL individually. Include every published case study and service detail, even when they share a component.
5. Run the local production preview. Use isolated synthetic transport for contact states, with external lead submission blocked.

Do not expose private or draft case studies to complete route coverage. Use the validated public projection and publication behavior.

## Cover every page and state

| Route or area | Required coverage | Theme rules |
| --- | --- | --- |
| `/` | Hero, featured work, services, testimonials, About, final CTA. Check each hash arrival and scroll transition. | All applicable rules. |
| `/case-studies/` | Every public card, category or filter states when present, empty results, and return position. | SH-02, BT-01, NV-01. |
| `/project/:projectId/` | Every public case study. Check cover, media variants, gallery, lightbox, captions, article hierarchy, back links, and estimate action when present. | SH-02, BT-01, OC-01, IM-01, NV-01. |
| `/services/:serviceId` | Every service ID. Check summary, scope, exclusions, rate, and estimate action. | SH-02, BT-01, NV-01. |
| `/contact/` | Empty, filled, focused, invalid, disabled, submitting, success, and retry states. Validate draft restoration where supported. | BT-01, FM-01. |
| `/legal/` | Whole page, heading hierarchy, links, and shared shell. | CO-01, TY-01, LY-01, NV-01. |
| `/data-policy/` | Whole page, heading hierarchy, links, and consent entry points. | CO-01, TY-01, LY-01, NV-01. |
| Unknown URL, invalid project, invalid service | Not-found appearance and recovery links. | BT-01, NV-01. |
| Route failure | Existing route-error boundary, Retry, and Back Home. Use controlled local failure. | BT-01, NV-01. |
| Shared shell | Header, active navigation, mobile menu, footer, consent banner and dialog, notifications. | BT-01, FM-01 where relevant, NV-01. |

Use a route-by-state coverage table. A row is complete only after its applicable states and content have been inspected. Shared components do not prove every page fits its own content.

## Inspect appearance and behavior

Capture the desktop 1440 by 900 layout, the review's 980 by 1324 layout, mobile 390 by 844, and narrow 320 by 740. Record actual dimensions if the browser uses a different viewport. Check native 200% browser zoom and reduced motion.

For each applicable component, inspect resting appearance, mouse hover, keyboard focus, touch appearance, long text, and supported disabled or loading states. Inspect modal entry, focus containment, Escape, and focus return when those behaviors apply.

Compare equivalent roles side by side. Check button geometry and emphasis, corner density, label alignment, confidence placement, portrait crop, type hierarchy, spacing, contrast, clipping, and layout shift. Do not add decorative frames to solve an alignment problem.

Read the entire page. A screenshot of the first viewport does not cover content below it. Verify real image decoding and gallery controls. Theme review does not authorize a real contact submission or production deployment.

## Record each finding

Each ticket contains the following evidence:

- Exact URL, component, commit, viewport, and interaction state.
- Screenshot or short clip with enough surrounding context to understand the mismatch.
- Theme rule ID and whether the rule is confirmed or still proposed.
- Observed appearance or behavior and the expected change.
- Scope, affected callers, related issues, and behavior that must be preserved.
- Observable acceptance criteria and desktop, mobile, zoom, keyboard, and motion checks that apply.

Keep a proposed design choice out of the defect list until Vivek decides it. Label uncertain behavior as needing reproduction. Do not report a factual claim or missing asset as confirmed solely from decoration or one stale screenshot.

Update #294 for corner consistency, #296 for the shared button family, and #297 for hero label attachment and simulated scores when the new finding fits their existing scope. Use a separate issue when the behavior, page, or verification is independently deliverable.

## Hand off implementation

Finish the review with a complete route inventory, a coverage table, remaining untested states, and prioritized issue links. A blocking interaction defect takes priority over decoration. Group shared-style changes by component ownership so fixes do not conflict.

Implement reviewed findings in bounded follow-up PRs. Each PR references the guide rule and the originating issue, provides appropriate visual evidence, and preserves unrelated work. Confirm fixes on the exact delivered commit. Merge and production release remain separate decisions.
