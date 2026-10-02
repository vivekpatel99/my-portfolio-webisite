# Portfolio theme guide

## Overview

The portfolio uses the visual language of document extraction and computer vision. Dark panels, purple corner brackets, readable content, and restrained technical labels establish the identity. The work and the estimate action remain the most important information.

This guide records the joint review decisions from 2 October 2026. It is the reference for future UI decisions and the whole-site theme review. It does not claim that the website already follows every rule.

Rule status has three meanings:

- **Confirmed** records a direct review decision from Vivek.
- **Existing reference** records an inspected implementation to preserve or reuse.
- **Proposed default** supplies a concrete starting point for visual review. It is not approval of an unseen implementation.

Explicit later feedback from Vivek takes precedence. Update this guide with a changed decision instead of leaving conflicting instructions in multiple issues. Task issues define implementation scope. This guide does not authorize a sitewide implementation, merge, or deployment.

Confirmed direction includes a professional portfolio without generic AI copy, consistent buttons, and selective use of the corner motif. Confidence scores belong only in the hero profile and clearly marked OCR demonstrations. Preserve client targeting and factual content during theme work.

The detailed form reference remains in [Form field style](docs/design-system.md). The procedure for the later review is [Review every page against the theme](docs/theme-review.md).

## Colors

### CO-01. Palette roles

The following values are existing references, not a new palette. They come from `src/index.css`, `tailwind.config.js`, `src/pages/Contact.css`, and the current layout components.

| Role | Existing reference | Use |
| --- | --- | --- |
| Page background | `#0C0D0D` | Main portfolio, reading pages, contact, and overlay background. |
| Primary action | `#7C3AED` | Filled estimate and submission actions. Current hero hover uses `#6D28D9`. |
| Leading corner | `#8B5CF6` | Hero field brackets and leading accents on secondary panels. |
| Readable purple | `#A78BFA` | Accent text and focused form corners. |
| Focused form label | `#C4B5FD` | Labels attached to the focused form field. |
| Resting form corner | `#6B7280` | Empty and filled fields without focus. |
| Resting form label | `#B6B9C3` | Form labels before focus. |
| Main text | White or existing foreground token | Main values, headings, and action labels. |
| Secondary text | Existing grey text roles | Descriptions, captions, and supporting metadata. |

The global `--background` currently differs from the page background. Treat that as an item to inspect during the future audit, not permission to change global tokens in this documentation task. Resolve competing values by role before introducing shared tokens.

Use purple for emphasis, focus, and the motif. Preserve semantic colors for actual error, success, disabled, and selected states. Decorative red REC marks in the portrait do not establish a sitewide error palette.

Check contrast in the rendered state before promoting a color combination. A decorative corner cannot make otherwise unreadable text acceptable.

## Typography

### TY-01. Reading and technical type

The font roles below are existing references. The layout and legibility prescriptions are proposed defaults except where a confirmed issue decision is named.

Existing components use the Tailwind sans stack for reading and the Tailwind monospace stack for technical metadata. Preserve that relationship. A font replacement needs a separate decision.

- Headings and field values use the sans stack with clear size and weight hierarchy.
- Descriptions, article text, testimonials, and legal text remain readable prose. Do not turn them into uppercase technical readouts.
- Small field labels, simulation metadata, and compact controls may use monospace.
- Confirmed button intent is one readable family. The proposed default is uppercase monospace with modest tracking, following the angular header and contact controls. Final size, weight, and tracking require a representative button review under #296.
- Preserve one semantic h1 per page. In the hero, Role retains its h1 even when decorative labels move.
- Do not shrink labels to force a frame to fit. Expand the wrapper, wrap the value, or stack the layout.

Confirmed copy cleanup removes the redundant `PORTFOLIO · CASE STUDIES` eyebrow above the existing Featured Case Studies heading under #295. Do not remove every eyebrow automatically. Retain one only when it adds information absent from the heading.

## Layout

### LY-01. Alignment and responsive spacing

The following are proposed review defaults, including the stacked mobile button layout from #296. They do not record a completed responsive audit.

Align section headings, paragraphs, cards, and actions to their shared content container. Equivalent components use equivalent internal padding and gaps. Context may change size without changing visual identity.

Preserve readable line lengths and a clear gap between related sections. Remove space only when the live composition demonstrates an imbalance. Do not use a fixed screen-height spacer to solve a content-layout problem.

On narrow screens, stack paired primary and secondary hero actions at full available width. Keep an explicit gap. Labels, scores, and values remain within their own columns at 320px width and 200% browser zoom.

The breakpoint system follows the existing Tailwind configuration and component behavior. New breakpoint exceptions require demonstrated layout evidence. Avoid independent desktop and mobile offsets for elements that share the same frame anchor.

## Elevation & Depth

### DP-01. Panel and action emphasis

The current dark fills and hero ambient treatment are existing references. The following limits on new effects are proposed defaults consistent with #294 and #296.

Dark fills, thin edges, and corner accents separate panels. The hero may retain its existing restrained ambient treatment. Secondary cards remain quieter than the hero.

Button hierarchy comes from fill, outline, and spacing. Additional gradients, glow, scanning effects, or technical badges are not a substitute for hierarchy. Hover decoration stays within the component and does not move surrounding content.

## Shapes

### SH-01. Three distinct uses of corners

| Use | Meaning | Treatment |
| --- | --- | --- |
| Decorative panel frame | Groups a portrait, work item, scope, quote, or next action | Quiet opposing corners. No confidence score or live-analysis claim. |
| Interactive form boundary | Identifies an editable control and its focus state | Four corners, grey at rest and purple on focus. Follow the contact-field reference. |
| Simulated extraction frame | Illustrates recognized fields in the hero or a marked OCR demonstration | Four field corners with an attached label. Scores are visibly identified as illustrative when simulated. |

These treatments share a visual vocabulary but do not share identical behavior. Decorative brackets do not replace a focus indicator. A filled form field does not become an OCR result.

### SH-02. Placement map

The following map was confirmed during the joint review and is tracked in #294. Strengthen existing frames before adding another boundary.

| Location | Framed content | Expression |
| --- | --- | --- |
| Hero profile | Three selected field values | Strongest field expression. Rotation belongs to #292. |
| Hero portrait | Outer portrait frame | Strong portrait expression. Label alignment belongs to #297. |
| Featured work and case-study collection | Each project card | Shared opposing corners with equivalent hover and focus feedback. |
| Case-study detail | Outer gallery or standalone cover | One subtle static frame clear of controls and image content. |
| Service offers | Each service card | Quiet existing accents. |
| Service detail | Scope and estimate panels | Same visual roles as service cards. |
| Testimonials | Whole quote panel | Quiet existing accents. Individual sentences remain unboxed. |
| About | Portrait and biography panels | Quiet existing accents. |
| Final homepage CTA | Primary estimate action | Clear action hierarchy with restrained framing. |
| Contact | Form panel and editable fields | Panel decoration plus the existing interactive field treatment. |

Headings, paragraphs, navigation links, footer links, legal text, gallery thumbnails, and captions receive no extra decorative boxes. Do not add a frame around every item in a framed panel.

### SH-03. Frame geometry

Existing hero value corners use 12px strokes at 1px thickness. Existing form corners use 16px at 1px at rest, then 18px at 2px on focus. Preserve these distinct role references until a specific visual change is reviewed.

Secondary panels use a purple leading corner and a muted white opposing corner. Match weight, length, and inset between equivalent panels. Their final shared dimensions remain a proposed implementation choice for #294. The outer portrait can remain stronger.

Corner decoration does not intercept clicks, create tab stops, announce motion, cover content, or change layout bounds.

## Components

### BT-01. Button family

Confirmed intent from #296 is that buttons look like one family with small differences in emphasis. Geometry, label treatment, border weight, arrow shape, and states remain consistent across pages.

| Variant | Purpose | Proposed default |
| --- | --- | --- |
| Primary | Estimate navigation and contact submission | Angular purple fill, readable white label. A trailing arrow accompanies navigation where useful. |
| Secondary | Browse case studies and other prominent alternatives | Same geometry and label treatment, dark fill, visible outline. |
| Text action | Scope details, back links, footer navigation | Readable link styling and visible focus without a filled button. |
| Utility | Gallery, menu, close, zoom, pause, consent, retry | Compact compatible styling with conventional icons and accessible names. |

The proposed geometry is square corners for prominent actions. Header controls can be smaller than hero actions. The hero pair has matching heights when side by side. Size differences must remain recognizable variants of the same family.

All interactive variants have visible keyboard focus and clear hover, pressed, disabled, loading, and selected states where relevant. Normal standalone action targets are at least 44 by 44 CSS pixels under #296. Text links within prose keep their normal reading layout.

Keep anchors for navigation and buttons for actions. Preserve destinations, new-tab behavior, modal behavior, and submitting protection. A loading label must not shift the button or permit another submission. Review consent and gallery callers before changing a generic button default.

Use restrained corners on prominent CTAs when they improve continuity. Utility controls and text links do not each need a decorative frame. Review the repeated `REQUEST · ESTIMATE` label and extra glyph in the final CTA under #296.

### OC-01. Simulated OCR placement

Confirmed on 2 October 2026, confidence numbers appear only in the hero profile and clearly marked OCR demonstrations. Ordinary service cards, testimonials, biography panels, estimate actions, contact inputs, and legal pages receive no invented confidence scores.

The hero header replaces `field parse` with `OCR simulation`. The qualifier stays visible without hover. It describes the display, not Vivek's professional record.

Existing project evidence may contain real model outputs. Preserve their source meaning and provenance. Do not rewrite genuine results to match the decorative constants below. Any future live OCR demonstration must distinguish actual measured output from an illustrative display.

### OC-02. Labels attached to frame edges

Confirmed intent from #297 places the small field label on the frame's top-edge guide, after the top-left horizontal stroke. The value stays below the label inside the reserved field area.

The proposed initial gap is 4 to 6 CSS pixels after the stroke. Center the label line box vertically on the top-edge guide. Give the label a matching background where needed so edges or image detail do not cross its text. Avoid a heavy badge around plain field labels.

Reserve the same guide and label position when corners fade out. Unselected fields keep their label stationary. Rate and Tags retain a label and score but receive no rotating value frame. Their label follows the same alignment grid without adding visible corners.

The wrapper accommodates the full label and both top-corner clearances. Long values wrap without moving the label into another field. Preserve readable text at narrow widths.

Anchor `engineer · 0.99` to the strongest outer portrait frame, after its top-left horizontal stroke. Center the tag on that frame's top-edge guide. Preserve the existing tag appearance and lower ID and REC badges. Keep the top tag clear of the face and top-right corner.

### OC-03. Hero confidence display

Distinct scores after each label are confirmed. The following exact constants are proposed display values from #297, awaiting visual review.

| Field | Display |
| --- | --- |
| Name | `NAME · 0.99` |
| Role | `ROLE · 0.97` |
| Credential | `CREDENTIAL · 0.98` |
| Success | `SUCCESS · 0.96` |
| Rate | `RATE · 0.95` |
| Location | `LOCATION · 0.94` |
| Tags | `TAGS · 0.93` |

Use two decimals, one separator, and a quieter score treatment. Values stay fixed on refresh, pause, rotation, and reduced motion. No random number changes, live OCR requests, or score timer are part of this display.

The portrait's existing 0.99 and document badge's 0.97 are separate illustration details. Decorative confidence does not modify job success, pricing, credentials, location, or project results. Keep the real label accessible, exclude decorative score updates from announcements, and preserve the semantic heading.

### MO-01. Motion

The two-second hero highlight change is confirmed by #292. Its proposed sequence uses five stable states:

1. Name, Role, Credential.
2. Role, Credential, Success.
3. Credential, Success, Location.
4. Success, Location, Name.
5. Location, Name, Role.

Each stable state has exactly three highlights. Fade the outgoing corners before the incoming corners within about 200ms total. A short transition with two visible highlights is allowed. Text, labels, scores, and buttons remain stationary. Rate and Tags are excluded.

Pause freezes the selection. Reduced motion shows a static Name, Role, Credential selection. Hidden, offscreen, and unmounted states stop rotation. Resume begins a full interval without catch-up ticks. Controls remain keyboard operable and visibly focused.

Other corner frames stay static. A brief 150 to 200ms hover or focus transition is the proposed default for clickable cards. No sitewide scanning loop, pointer-following brackets, or repeated idle pulse is added by the theme guide.

### IM-01. Portraits and project imagery

Use Vivek's authentic portrait with recognizable likeness and natural proportions. The hero needs a closer head-and-shoulders crop under #293. The About photo has a separate 4:3 composition under #298.

Confirmed About headroom is exactly 5 CSS pixels between the topmost hair and the displayed image's top edge. Measure within the photograph, excluding card padding and corner decoration. Preserve the complete hairline and chin at each reviewed width.

Do not silently apply that 5px requirement to the hero. Its separate crop issue remains the authority. Keep crop assets independent so one portrait change does not alter the other.

Optional image generation for the About portrait preserves likeness and the authentic original. A generated edit requires Vivek's visual review. Project screenshots and videos remain legible evidence with controls and captions clear of corners.

### FM-01. Forms and feedback

The [contact-field reference](docs/design-system.md) governs grey resting corners, purple focus, fill, label position, required indicators, and forced-colors behavior. Preserve the control's actual accessible label. Do not put simulated scores in contact fields.

Keep empty, filled, focused, invalid, disabled, submitting, success, and retry states understandable. Visible errors need text and a recovery action, not just a color change. Theme work preserves the contact payload, transport, consent, and success behavior.

### NV-01. Navigation, overlays, and reading pages

The header, mobile menu, footer, consent dialog, gallery lightbox, and retry controls share the button and focus rules. Keep their navigation and keyboard behavior intact. Branding does not justify obstructing links or controls.

Articles and legal pages use the same colors, type relationships, and spacing conventions with quieter decoration. Reading text stays unboxed. Not-found and route-error states retain a clear recovery action.

## Do's and Don'ts

- Do use the SH-02 placement map before adding brackets.
- Do use the same button family across header, hero, service, project, and contact actions.
- Do keep simulation visibly qualified and confined to the approved locations.
- Do reference a rule ID when reporting a theme mismatch.
- Do preserve confirmed facts, real evidence, routes, and form behavior during visual work.
- Don't invent credentials, project metrics, testimonials, client names, or conversion improvements.
- Don't add duplicate borders behind corner-only form boundaries.
- Don't use corner color as the only focus, selected, or error signal.
- Don't shrink text or hide overflow to conceal a broken layout.
- Don't claim the site passes this guide until every public route and required state has been reviewed.

Related implementation issues remain open: [#292](https://github.com/vivekpatel99/my-portfolio-webisite/issues/292), [#293](https://github.com/vivekpatel99/my-portfolio-webisite/issues/293), [#294](https://github.com/vivekpatel99/my-portfolio-webisite/issues/294), [#295](https://github.com/vivekpatel99/my-portfolio-webisite/issues/295), [#296](https://github.com/vivekpatel99/my-portfolio-webisite/issues/296), [#297](https://github.com/vivekpatel99/my-portfolio-webisite/issues/297), and [#298](https://github.com/vivekpatel99/my-portfolio-webisite/issues/298). This guide provides their shared reference and does not complete their UI acceptance criteria.
