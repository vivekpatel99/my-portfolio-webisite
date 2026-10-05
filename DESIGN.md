# Portfolio theme guide

## Overview

The portfolio uses the visual language of document extraction and computer vision. Dark panels, purple corner brackets, readable content, and restrained technical labels establish the identity. Proposed default: the work and the estimate action remain the most important information.

This guide records the joint review decisions from 2 and 3 October 2026. It is the reference for future UI decisions and the whole-site theme review. It does not claim that the website already follows every rule.

Rule status has three meanings:

- **Confirmed** records a direct review decision from Vivek.
- **Existing reference** records an inspected implementation to preserve or reuse.
- **Proposed default** supplies a concrete starting point for visual review. It is not approval of an unseen implementation.

A finding cites one clause and that clause's status. Do not collapse a rule to a single status when its clauses differ.

Explicit later feedback from Vivek takes precedence. Update this guide with a changed decision instead of leaving conflicting instructions in multiple issues. Task issues define implementation scope. This guide does not authorize a sitewide implementation, merge, or deployment.

Confirmed: hero rules that conflict with the 3 October experiment in [Hero OCR annotation experiment](docs/qa/hero-ocr-labels-297.md) follow that experiment. Its pair cycle and requested removals are confirmed. Its inspected timing and label geometry are existing references. Confirmed: pending desktop visual agreement does not restore the earlier Rate exclusion, retained Tags label, OCR captions, document badge, Pause control, or three-highlight cycle.

Confirmed direction includes a professional portfolio without generic AI copy, consistent buttons, and selective use of the corner motif. Confirmed: confidence scores belong only on the hero profile fields and in a future OCR demonstration that stays separate from factual content, matching OC-01. Confirmed: do not add a separate caption to mark them. Confirmed: preserve client targeting and factual content during theme work.

The detailed form reference remains in [Form field style](docs/design-system.md). The procedure for the later review is [Review every page against the theme](docs/theme-review.md).

## Colors

### CO-01. Palette roles

The following values are existing references, not a new palette. They come from `src/index.css`, `tailwind.config.js`, `src/pages/Contact.css`, and the current layout components.

| Role | Existing reference | Use |
| --- | --- | --- |
| Page background | `#0C0D0D` | Main portfolio, reading pages, contact, and overlay background. |
| Primary action | Purple over `#0C0D0D` | Confirmed under BT-01: prominent estimate, inquiry, and contact-submit actions share the subtle purple top fading to black and opposing corners. Existing reference: `#7C3AED` remains the consent Accept fill; it does not define a separate prominent-action family. |
| Leading corner | `#8B5CF6` | Hero field brackets and leading accents on secondary panels. |
| Readable purple | `#A78BFA` | Accent text and focused form corners. |
| Focused form label | `#C4B5FD` | Labels attached to the focused form field. |
| Resting form corner | `#6B7280` | Empty and filled fields without focus. |
| Resting form label | `#B6B9C3` | Form labels before focus. |
| Main text | White or existing foreground token | Main values, headings, and action labels. |
| Secondary text | Existing grey text roles | Descriptions, captions, and supporting metadata. |

The global `--background` currently differs from the page background. Proposed default: treat that as an item to inspect during the future audit, not permission to change global tokens in this documentation task. Proposed default: resolve competing values by role before introducing shared tokens.

Proposed default: use purple for emphasis, focus, and the motif. Proposed default: preserve semantic colors for actual error, success, disabled, and selected states. Proposed default: decorative red REC marks in the portrait do not establish a sitewide error palette.

Proposed default: check contrast in the rendered state before promoting a color combination. Proposed default: a decorative corner cannot make otherwise unreadable text acceptable.

## Typography

### TY-01. Reading and technical type

The font roles below are existing references. The layout and legibility prescriptions are proposed defaults except where a confirmed issue decision is named.

- Existing reference: components use the Tailwind sans stack for reading and the Tailwind monospace stack for technical metadata. Existing reference: preserve that relationship. Existing reference: a font replacement needs a separate decision.
- Proposed default: headings and field values use the sans stack with clear size and weight hierarchy.
- Proposed default: descriptions, article text, testimonials, and legal text remain readable prose. Proposed default: do not turn them into uppercase technical readouts.
- Existing reference: small field labels, simulation metadata, and compact controls may use monospace.
- Confirmed: button intent is one readable family. Confirmed on 4 October 2026 under #296: prominent actions use the same sans-serif family and their existing label casing, with size differences for compact and large contexts. This supersedes the proposed uppercase monospace treatment. Confirmed: primary labels use weight 650 and secondary labels use 600. Existing reference: technical edge metadata keeps its monospace treatment.
- Existing reference: preserve one semantic h1 per page. Confirmed: in the hero, Role retains its h1 even when decorative labels move.
- Proposed default: do not shrink labels to force a frame to fit. Proposed default: expand the wrapper, wrap the value, or stack the layout.
- Confirmed: copy cleanup removes the redundant `PORTFOLIO · CASE STUDIES` eyebrow above the existing Featured Case Studies heading under #295. Confirmed on 5 October 2026: attach `Previous work` beside this heading's top-left corner using the Service Offers section label treatment, with a transparent background and no confidence score. This supersedes the earlier exclusion of a replacement edge label for this section. Confirmed: preserve the main h2, typography, content, opposing corners, purple emphasis, and geometry. Proposed default: do not remove every eyebrow automatically. Proposed default: retain one only when it adds information absent from the heading.

## Layout

### LY-01. Alignment and responsive spacing

The following are a proposed default, including the stacked mobile button layout from #296, and they do not record a completed responsive audit.

Proposed default: align section headings, paragraphs, cards, and actions to their shared content container. Proposed default: equivalent components use equivalent internal padding and gaps. Proposed default: context may change size without changing visual identity.

Proposed default: preserve readable line lengths and a clear gap between related sections. Proposed default: remove space only when the live composition demonstrates an imbalance. Proposed default: do not use a fixed screen-height spacer to solve a content-layout problem.

Proposed default: on narrow screens, stack paired primary and secondary hero actions at full available width. Proposed default: keep an explicit gap. Proposed default: labels, scores, and values remain within their own columns at 320px width and 200% browser zoom.

Proposed default: the breakpoint system follows the existing Tailwind configuration and component behavior. Proposed default: new breakpoint exceptions require demonstrated layout evidence. Proposed default: avoid independent desktop and mobile offsets for elements that share the same frame anchor.

## Elevation & Depth

### DP-01. Panel and action emphasis

The current dark fills and hero ambient treatment are existing references. The following limits on new effects are proposed defaults consistent with #294 and #296.

- Existing reference: dark fills and labeled corner frames separate the approved homepage panels. Existing reference: continuous outer panel borders are removed from those panels. Existing reference: the hero may retain its existing restrained ambient treatment.
- Proposed default: secondary cards remain quieter than the hero. Proposed default: button hierarchy comes from fill, outline, and spacing. Proposed default: additional gradients, glow, scanning effects, or technical badges are not a substitute for hierarchy. Proposed default: hover decoration stays within the component and does not move surrounding content.

## Shapes

### SH-01. Three distinct uses of corners

Proposed default: the three treatments below are the review vocabulary, not proof that every page already uses them. Confirmed location choices are in SH-02.

| Use | Meaning | Treatment |
| --- | --- | --- |
| Decorative panel or title frame | Groups a portrait, work item, scope, quote, or section title | Static corner strokes with an attached label. No confidence score or live-analysis claim. |
| Interactive form boundary | Identifies an editable control and its focus state | Four corners, grey at rest and purple on focus. Follow the contact-field reference. |
| Simulated extraction frame | Illustrates recognized fields in the hero or a future OCR demonstration | Four field corners with an attached label. Scores are illustrative display constants. Do not add a separate OCR caption to mark them. |

Confirmed on 3 October 2026: Vivek selected the Corners + labels prototype. Confirmed: the approved homepage cards use only top-left and bottom-right corner strokes with attached labels. Confirmed: they use corner frames instead of continuous outer borders and inset corner decorations. Confirmed: main section headings use the same label vocabulary with quieter opposing corners. Proposed default: decoration remains independent of focus indicators and OCR behavior.

Proposed default: These treatments share a visual vocabulary but do not share identical behavior. Proposed default: decorative brackets do not replace a focus indicator. Proposed default: a filled form field does not become an OCR result.

### SH-02. Placement map

The following map records the 3 October Corners + labels decision tracked in #294. Confirmed: strengthen existing frames before adding another boundary.

| Location | Framed content | Expression |
| --- | --- | --- |
| Hero profile invoice | Outer invoice panel | Confirmed: two opposing static corners and a prominent attached Profile Invoice title. Existing reference: preserve the invoice identifier and internal field animation. |
| Hero detected fields | Two selected values at a time | Existing reference: animated field corners, labels, and illustrative scores. The pair cycle follows the 3 October experiment, not the earlier three-highlight rotation. |
| Hero portrait | Outer portrait frame | Existing reference: preserve its stronger frame and unboxed engineer label with the existing score. Label alignment belongs to #297. |
| Homepage section headings | Main h2 headings, including About subsections and final CTA | Confirmed: two opposing corners with a descriptive attached label. Confirmed on 5 October 2026 under TY-01: Featured Case Studies uses the attached `Previous work` label matching Service Offers. |
| Featured work and case-study collection | Each project card | Confirmed: two opposing static corners and the existing category label attached to the edge. Existing reference: preserve card navigation and focus. |
| Service offers | Each service card | Confirmed: two opposing static corners and the service offer label on the edge. |
| Testimonials | Whole quote panel | Confirmed: two opposing static corners with testimonial and client metadata on the edge. Individual sentences remain unboxed. |
| About | Portrait and biography panels | Confirmed: two opposing static corners with portrait and biography labels on the edge. |
| Footer | Whole footer content panel | Confirmed: one corner frame and an attached label. Individual links remain unboxed. |
| Service detail | Engagement details and combined scope panels | Confirmed on 5 October 2026: shared opposing outer-edge corners with transparent `ENGAGEMENT DETAILS` and `PROJECT SCOPE` edge labels. Preserve scope separators, text, rates, and actions. |
| Contact | Main request form and What happens next panel | Confirmed on 5 October 2026: shared opposing outer-edge corners with transparent `PROJECT · REQUEST` and `PROCESS · NEXT STEPS` edge labels. Remove the redundant interior `CONTACT · DETECTED` metadata. Preserve the actual heading and content, input boundaries, and form behavior. |
| Case-study detail | Existing framed panels | Existing reference: separate review scope. The homepage decision does not establish completed implementation or verification for these routes. |

Confirmed on 4 October 2026: the contact page's Prefer email? card uses the shared top-left and bottom-right panel corners from SH-03 in place of its continuous border. Confirmed on 5 October 2026: add a transparent `EMAIL` label centered on the card's top-edge guide. This supersedes the earlier no-label exception. Confirmed: preserve the existing prompt, email link, fill, and opposing corners without a confidence score.

Confirmed: the case-study collection page uses top-left and bottom-right corners around its semantic h1, Selected Case Studies, with the shared heading geometry and rest/hover colors from SH-03. Existing reference: preserve its white and purple text. Confirmed on 5 October 2026: it has the transparent `PREVIOUS WORK` edge label from the shared heading family. This supersedes the earlier no-edge-label exception; there is no separate Collection badge.

Confirmed on 3 October 2026: all twelve approved completed case studies share one collection, sorted together by completion date. Confirmed: the first six remain the initial batch and Load more reveals the next six. Confirmed: AI Project Planning Assistant and Python CI Workflow Automation appear once in that same grid; there is no separate Other Work section. Existing reference: preserve the three handpicked homepage features, publication eligibility, and collection return position and loaded count. Existing reference: existing ten-card browsing snapshots remain valid and can load the final two cards.

Confirmed on 3 October 2026: testimonial controls show slide dots without a Pause/Play button. Confirmed: selecting a dot stops automatic rotation for the mounted carousel; all dots remain usable for reading other quotes. Existing reference: mouse hover and keyboard focus temporarily hold rotation, and reduced motion disables autoplay.

Proposed default: paragraphs, ordinary navigation links, individual footer links, legal text, gallery thumbnails, and captions receive no extra decorative boxes. Confirmed: the selected header navigation link is the scoped exception under NV-01. Proposed default: do not add a frame around every item inside a framed panel. Action styling remains under BT-01.

### SH-03. Frame geometry

Confirmed: the selected prototype uses 19px top-left and bottom-right corner strokes at 1px for section titles. Confirmed: panel frames use 23px strokes at 1.5px only in the top-left and bottom-right corners. Confirmed on 3 October 2026: both decorative corners on all shared panels and section titles are grey `#6B7280` at rest and purple `#A78BFA` on hover or keyboard focus within. Existing reference: strokes sit on the outer frame edge rather than inside another border. Confirmed: equivalent panels share this geometry.

Confirmed: attached labels sit after the top-left stroke, centered on the top-edge guide. Existing reference: they use compact monospace text. Confirmed on 3 October 2026: shared corner labels have transparent backgrounds, including section labels, card labels, the Profile Invoice title, footer label, and the final estimate label. Confirmed on 5 October 2026: case-study card label line boxes are centered on the top-edge guide with transparent backgrounds, superseding the former 3px gap above the image. Existing reference: the Profile Invoice title retains its larger sans-serif title size. Proposed default: reserve space for labels and preserve content padding. Existing reference: image cropping stays on the media container so the outer label remains visible.

Existing reference: case-study grids reserve 48px between rows for wrapped labels. Existing reference: the collection leaves 40px after its result count. Existing reference: the hero leaves at least 8px between the inference badge and the enlarged Profile Invoice title.

Existing reference: hero value corners use 12px strokes at 1px thickness. Existing reference: form corners use 16px at 1px at rest, then 18px at 2px on focus. Existing reference: the outer hero portrait remains stronger. Existing reference: these roles keep their existing behavior.

Proposed default: corner decoration does not intercept clicks, create tab stops, announce motion, cover content, or change layout bounds.

## Components

### BT-01. Button family

Confirmed intent from #296 is that buttons look like one family with small differences in emphasis. Proposed default: geometry, label treatment, border weight, arrow shape, and states remain consistent across pages outside the confirmed family below.

Confirmed on 3 October 2026: the hero's Request a Project Estimate and View Case Studies links, the header's Request Estimate link in the bar and drawer, the final Request a Project Estimate link, and the case-study collection's Back to home and Load more controls use the shared corner family. Confirmed: these actions have square surfaces with subtle purple at the top fading to black, no continuous border, and opposing corners that follow SH-03. Existing reference: all named actions share the existing final CTA background, `#0C0D0D` beneath a purple-to-transparent gradient covering the top 55%, with purple opacity 0.06 at rest and 0.1 on hover or keyboard focus. Confirmed: primary estimate links use weight 650; secondary actions use weight 600. Confirmed: estimate links and the hero View Case Studies link have one decorative trailing ArrowRight icon. Existing reference: Back to home retains its leading ArrowLeft; Load more stays text-only. Confirmed: each control has a separate keyboard focus outline at least 2px wide. Existing reference: preserve the existing text, accessible names, destinations, and navigation behavior.

| Variant | Purpose | Treatment |
| --- | --- | --- |
| Primary | Estimate and case-study inquiry navigation, contact submit | Confirmed: purple top fading to black, readable white text at weight 650, opposing corners, and one trailing arrow for navigation. Existing reference: submission shows a spinner only while pending. |
| Secondary | Hero View Case Studies, View All Services, and collection controls | Confirmed: matching background and corner geometry, text at weight 600. Existing reference: icons and target heights follow the named controls below. |
| Text action | Scope details, inline back links, footer navigation | Proposed default: readable link styling and visible focus without a filled button. |
| Utility | Gallery, menu, close, zoom, consent, retry | Proposed default: compact compatible styling with conventional icons and accessible names. The hero Pause control is not part of this family. |

Confirmed: the hero Pause control is removed and is not part of this family. Confirmed: the hero pair has matching heights when side by side. Existing reference: header estimate links use the compact variant with a minimum height of 44px; the final estimate link keeps its larger text and target width. Confirmed: the final CTA retains its existing `REQUEST · ESTIMATE` edge label, hidden from assistive technology, and removes the redundant leading boxed arrow. Confirmed on 5 October 2026: the named actions below receive transparent attached labels centered on the top edge, hidden from assistive technology. This supersedes the earlier no-extra-metadata clause. Hero and header estimates use `REQUEST · ESTIMATE`; the hero case-study action uses `PREVIOUS WORK`; service-detail estimate and View All Services use `PROJECT ESTIMATE` and `SERVICE OFFERS`; the case-study inquiry uses `PROJECT INQUIRY`; collection Back to home uses `HOME`; Load more uses `MORE WORK`, changing to `ALL WORK SHOWN` when exhausted; contact submission uses `PROJECT · REQUEST`. Confirmed: preserve action text, accessible names, compact sizing, focus outlines, loading and disabled behavior. No labels are added to selected navigation, plain links, utilities, or form inputs. Existing reference: the final View case studies link stays plain.

Existing reference: the collection's Back to home anchor uses the compact 44px variant. Existing reference: Load more uses the standard 56px variant and preserves the existing incremental loading and history state. Existing reference: its static HTML remains natively disabled. Existing reference: once exhausted, the control stays focusable with `aria-disabled` and guarded clicks. Existing reference: both disabled forms keep grey corners and the resting background on hover or focus, with reduced opacity and a disabled cursor. Existing reference: the exhausted control retains its keyboard focus outline.

Proposed default: all interactive variants have visible keyboard focus and clear hover, pressed, disabled, loading, and selected states where relevant. Confirmed under #296: normal standalone action targets are at least 44 by 44 CSS pixels. Existing reference: text links within prose keep their normal reading layout.

Existing reference: keep anchors for navigation and buttons for actions. Existing reference: preserve destinations, new-tab behavior, modal behavior, and submitting protection. Existing reference: a loading label must not shift the button or permit another submission. Existing reference: review consent and gallery callers before changing a generic button default.

Confirmed on 4 October 2026: Vivek approved extending this family to service-detail estimate and View All Services actions, the case-study Discuss a similar project action, and contact submission. Confirmed: standardize prominent-action label typography, preserve the approved background and corner geometry, and keep the final CTA's REQUEST · ESTIMATE label. This extends the earlier named-control scope rather than changing panel or form-field styling. Visual review of the delivered family remains required before merge.

Confirmed on 4 October 2026: text actions stay lightweight, and utility actions retain conventional icons without decorative corners. Confirmed: review their hover and keyboard focus, accessible targets, and distinct states while preserving behavior. Existing reference: generic Button defaults remain unchanged; compact menu, consent, and retry callers use scoped utility styling. Gallery controls retain conventional shapes and their selected and disabled states.

### OC-01. Simulated OCR placement

Confirmed on 2 October 2026, confidence numbers appear only on the hero profile fields and in a future OCR demonstration that stays separate from factual content. Confirmed: ordinary service cards, testimonials, biography panels, estimate actions, contact inputs, and legal pages receive no invented confidence scores.

Confirmed: the 2 October header qualifier is superseded. Confirmed: the 3 October experiment removes the `OCR simulation` and `OCR surface` captions at Vivek's request. That removal is confirmed. Confirmed: do not restore either caption, the earlier `field parse` label, or a visible header qualifier. Confirmed: the field scores themselves remain illustrative display constants and do not describe Vivek's professional record.

Existing project evidence may contain real model outputs. Existing reference: preserve their source meaning and provenance. Existing reference: do not rewrite genuine results to match the decorative constants below. Proposed default: any future live OCR demonstration must distinguish actual measured output from an illustrative display.

### OC-02. Labels attached to frame edges

Confirmed intent from #297 places the small field label on the frame's top-edge guide, after the top-left horizontal stroke. Confirmed: the value stays below the label inside the reserved field area.

Proposed default: center the label line box vertically on the top-edge guide. Confirmed: shared corner labels named in SH-03 have transparent backgrounds. Proposed default: a hero field label may use a matching background only where image detail would cross its text. Proposed default: avoid a heavy badge around plain field labels.

Confirmed: the 2 October inactive-label policy is superseded. Confirmed: unselected annotations fade with their corners and do not keep a stationary visible label. Confirmed: Rate is a rotating field, not a static label and score outside the frame cycle. Confirmed: `Tags` is removed because the topic chips are not detected fields; do not retain a Tags label or score. Those corrections are confirmed by the 3 October experiment. The experiment's measured attachment is an existing reference, not a competing proposed default: each invoice label begins 17 CSS pixels from the frame's left edge, a 5px gap after the 12px stroke, and its 12px line box is centered on the 6px top-edge guide. Existing reference: hidden annotations keep their reserved row and geometry.

Proposed default: the wrapper accommodates the full label and both top-corner clearances. Proposed default: long values wrap without moving the label into another field. Proposed default: preserve readable text at narrow widths.

Confirmed: anchor `engineer · 0.99` to the strongest outer portrait frame, after its top-left horizontal stroke. Confirmed: center the tag on that frame's top-edge guide. The experiment's existing reference places that tag 29px from the frame's left edge, a 5px gap after the 24px stroke, with the same plain grey label and quieter score as the invoice fields and no outlined badge. The outer `DOC · EXTRACT · 0.97` badge is removed; that removal is confirmed. Existing reference: preserve the lower ID and REC badges. Confirmed: keep the top tag clear of the face and top-right corner.

### OC-03. Hero confidence display

Distinct scores after each rotating invoice label remain confirmed. The six constants below are an existing reference from the 3 October experiment. They are not proposed defaults that may omit Rate or restore Tags, and desktop visual agreement is still pending and does not change this set.

| Field | Display |
| --- | --- |
| Name | `NAME · 0.99` |
| Role | `ROLE · 0.97` |
| Credential | `CREDENTIAL · 0.98` |
| Success | `SUCCESS · 0.96` |
| Rate | `RATE · 0.95` |
| Location | `LOCATION · 0.94` |

Proposed default: use two decimals, one separator, and a quieter score treatment. Proposed default: values stay fixed on refresh, rotation, and reduced motion. Confirmed: there is no Pause control. Proposed default: no random number changes, live OCR requests, or score timer are part of this display.

Existing reference: the portrait's existing 0.99 score remains a separate illustration detail. Confirmed: the document badge and its 0.97 score are removed; do not preserve that badge. Proposed default: decorative confidence does not modify job success, pricing, credentials, location, or project results. Proposed default: keep the real label accessible, exclude decorative score updates from announcements, and preserve the semantic heading.

### MO-01. Motion

The two-second hero annotation cadence is confirmed by #292. Confirmed: the 3 October experiment supersedes that issue's five-state, three-highlight sequence, the Rate exclusion, and Pause. The current confirmed cycle shows exactly two annotations:

1. Name and Role.
2. Credential and Success.
3. Rate and Location.

Confirmed: the cycle then returns to Name and Role. Existing reference: both outgoing annotations fade out over 100ms; then both incoming annotations fade in over 100ms. Those durations are an existing reference from the hero experiment, not a proposed return to the five-state sequence. Confirmed: boxes, labels, and fixed scores share opacity. Confirmed: a frame shows at most two annotations. Confirmed: values, the Role h1, and actions remain stationary. Confirmed: Rate is included. Confirmed: Tags are absent.

Pause is removed; that removal is confirmed. Confirmed: the cycle runs automatically while the hero is visible. Confirmed: reduced motion shows the static Name and Role pair with no annotation transition or timer. Confirmed: hidden, offscreen, and unmounted states stop rotation. Confirmed: returning starts a full interval without catch-up. Confirmed: do not add a control whose only purpose is to freeze this cycle.

Proposed default: other corner frames stay static. A brief 150 to 200ms hover or focus transition is the proposed default for clickable cards. Proposed default: no sitewide scanning loop, pointer-following brackets, or repeated idle pulse is added by the theme guide.

### IM-01. Portraits and project imagery

Proposed default: use Vivek's authentic portrait with recognizable likeness and natural proportions. Confirmed: the hero needs a closer head-and-shoulders crop under #293. Confirmed: the About photo has a separate 4:3 composition under #298.

Confirmed About headroom is exactly 5 CSS pixels between the topmost hair and the displayed image's top edge. Confirmed: measure within the photograph, excluding card padding and corner decoration. Confirmed: preserve the complete hairline and chin at each reviewed width.

Proposed default: do not silently apply that 5px requirement to the hero. Proposed default: its separate crop issue remains the authority. Proposed default: keep crop assets independent so one portrait change does not alter the other.

Confirmed on 4 October 2026: the hero uses a closer head-and-shoulders crop with exactly 3 CSS pixels above the topmost hair, measured within the photograph. Confirmed: preserve the full hairline and chin, the existing frame dimensions, and the separate About crop.

Proposed default: optional image generation for the About portrait preserves likeness and the authentic original. Proposed default: a generated edit requires Vivek's visual review. Proposed default: project screenshots and videos remain legible evidence with controls and captions clear of corners.

### FM-01. Forms and feedback

Existing reference: the [contact-field reference](docs/design-system.md) governs grey resting corners, purple focus, fill, label position, required indicators, and forced-colors behavior. Existing reference: preserve the control's actual accessible label.

Confirmed by OC-01: do not put simulated scores in contact fields.

Existing reference: keep empty, filled, focused, invalid, disabled, submitting, success, and retry states understandable. Existing reference: visible errors need text and a recovery action, not just a color change. Existing reference: theme work preserves the contact payload, transport, consent, and success behavior.

### NV-01. Navigation, overlays, and reading pages

Existing reference: the header, mobile menu, footer, consent dialog, gallery lightbox, and retry controls keep their current navigation and keyboard behavior. Existing reference: branding does not justify obstructing links or controls. Existing reference: button and focus styling follow BT-01, including that rule's own clause statuses.

Confirmed on 3 October 2026: the selected header link uses opposing top-left and bottom-right purple corners in place of its underline. Confirmed: apply the same selected treatment in the bar and drawer, with 12px strokes at 1px width and a horizontal 8px inset beyond the link edges so labels and navigation gaps stay in place. Confirmed: selected corners remain `#A78BFA` at rest; inactive links remain plain. Confirmed: every header navigation link has a target at least 44px wide and high and a separate 2px keyboard focus outline. Existing reference: preserve destinations, modified-click handling, smooth scrolling, menu closure, and focus restoration. Confirmed: use `aria-current="page"` for the active Case Studies route and `aria-current="location"` for the active homepage hash. Confirmed: do not add navigation labels or filled surfaces.

Proposed default: articles and legal pages use the same colors, type relationships, and spacing conventions with quieter decoration. Proposed default: reading text stays unboxed. Proposed default: not-found and route-error states retain a clear recovery action.

## Do's and Don'ts

- Confirmed: do use the SH-02 placement map before adding brackets.
- Confirmed: do use the shared corner family for the prominent navigation links, collection controls, and contact submission named in BT-01. Confirmed: text and utility actions stay lightweight and retain their conventional function.
- Confirmed: do keep simulated scores confined to the hero profile fields and a future OCR demonstration that stays separate from factual content, without a separate OCR caption.
- Proposed default: do reference a rule ID and the cited clause's own status when reporting a theme mismatch.
- Existing reference: preserve confirmed facts, real evidence, routes, and form behavior during visual work.
- Proposed default: don't invent credentials, project metrics, testimonials, client names, or conversion improvements.
- Proposed default: don't add duplicate borders behind corner-only form boundaries.
- Proposed default: don't use corner color as the only focus, selected, or error signal.
- Proposed default: don't shrink text or hide overflow to conceal a broken layout.
- Proposed default: don't claim the site passes this guide until every public route and required state has been reviewed.

Related implementation issues remain open: [#292](https://github.com/vivekpatel99/my-portfolio-webisite/issues/292), [#293](https://github.com/vivekpatel99/my-portfolio-webisite/issues/293), [#294](https://github.com/vivekpatel99/my-portfolio-webisite/issues/294), [#295](https://github.com/vivekpatel99/my-portfolio-webisite/issues/295), [#296](https://github.com/vivekpatel99/my-portfolio-webisite/issues/296), [#297](https://github.com/vivekpatel99/my-portfolio-webisite/issues/297), and [#298](https://github.com/vivekpatel99/my-portfolio-webisite/issues/298). This guide provides their shared reference and does not complete their UI acceptance criteria.
