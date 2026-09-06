# Gate 4: intent-aware estimate entry

The contact page may display and submit an optional, bounded estimate context. It accepts only allowlisted project types, timelines, blockers, published case-study slugs, service IDs, and derived scope-check decisions. The full diagnostic questionnaire and remaining answers stay in page memory, reset on leave or reload, and are never passed as an object. The optional handoff may carry only the derived decision and broad project type (or a published service area), which the visitor can review, edit, or remove before the existing explicit submit action.

Router state may carry only a bounded source projection from a case study or the diagnostic. `ContactRoute` consumes that state into component memory and immediately replaces the history entry with `null`. The context is not stored in the URL, browser storage, or an unsent draft; refresh and leaving the page reset it.

`submitLead` normalizes the optional context again on the server and stores only canonical IDs. Existing lead rows without it remain valid. The existing insert-then-schedule boundary remains unchanged: the scheduled action still receives its established arguments, claims the persisted lead, and builds notification text from canonical labels. Retries therefore re-read the stored context without copying it through scheduler arguments. Rate-limit indexes, limits, and cron behavior are unchanged.

`convex/schema.ts` mirrors the literal context enums because its Convex `v` validators must be declared in the schema. `normalizeInquiryContext` remains the server authority for allowed keys and origin pairs. A future enum change must update both the schema validator and `convex/lib/inquiryContext.ts`, then run the context contract tests.

The contact inquiry region blocks Sentry replay and UI breadcrumbs. Convex SDK logging is disabled because rejected server responses can contain request payloads. The UI records only a generic contact failure; known fixed rate-limit messages remain visible.

The responsive screenshot evidence in `gate-4-screenshots/` is captured by the passive preview suite at 320px, 390px, and 1280px. The fixed site header remains present in all runtime checks; the capture helper hides it only while cropping the tall contact form so it cannot cover the disclosure at the end of that artifact, then restores it.

## Scheduling decision and adapter boundary

Scheduling remains a later, separately approved product decision. No Calendly embed, booking URL, scheduling request, automatic priority, or provider dependency is introduced. The future adapter belongs after a successful `submitLead` response and must remain a separate, explicit visitor action. It must not sit inside validation, insertion, or the email retry loop: failure or unavailability of a scheduling provider must not lose an inquiry, repeat insertion, or prevent notification.

The existing `{ success: boolean }` submit result is the frontend completion boundary; the new `normalizeInquiryContext` / `InquiryContext` module is the bounded data boundary. A future adapter may consume an explicitly chosen allowlisted subset of that context only after its own disclosure and user action. It must never consume questionnaire state, browser history, free-text form values by default, or reinterpret a fit label as permission or priority. Provider choice, transfer fields, consent/disclosure, retention, and booking-failure behavior require separate evidence and acceptance. Gate 4 deliberately adds no speculative scheduling code.

For each screenshot artifact, the capture branch waits for and rejects the optional cookie banner through the existing UI before cropping the form. HTTP writes and WebSockets remain blocked. This removes the banner from the crop without altering the contact form or its runtime checks.
