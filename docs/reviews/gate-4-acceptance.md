# Gate 4 acceptance evidence

Refs #9. Delivery scope is a **draft PR only**. Vivek's manual acceptance, ready-for-review, merge, deployment and issue closure remain separate.

## Accepted base and isolation

- Branch: `codex/gate-4-intent-aware-estimate`, existing isolated clone `/private/tmp/gate-4-intent-aware-estimate`.
- Accepted base/main: `78ad8cc2bcfc14262ffac8ada169d74185534288`, freshly rechecked before delivery.
- Reviewed implementation commit: `cf97eb5b2697f2e39818e7ee272cb9a413a48e86`.
- Gate 3 / PR #38 merged at `cd35e406c97d41670de1c3d8ace043a81b6852f5`. GitHub compare confirmed it is an ancestor of the accepted base (three ahead, zero behind).
- PR #37 is merged at `78ad8cc2bcfc14262ffac8ada169d74185534288`. The original checkout remains on `codex/pr37-ci-fix` at **branch HEAD** `4731dc7a36e3870acc96f57fdf192f623084b7dc`, with only its pre-existing `.agents/sol-advisor` deletion. These two SHAs are distinct. Read-only checks confirmed the original checkout remained unchanged.

The final draft PR records the delivery head, including this documentation commit. No worker had GitHub-write authority. No changes were made to the original checkout or PR #37.

## Native routing and independent final verdicts

Astra inspected native session `turn_context.model` and `effort`, plus worker identity/parent metadata, before authorizing each new worker. Dispatch model requests and worker self-descriptions were not used as authority. Original-task routing was independently rechecked in its session files. No substitute model, external CLI agent, or nested worker was used in this continuation.

| Role | Native session | Observed runtime / outcome |
| --- | --- | --- |
| Original parent | `01a076f4-1b5e-7183-995d-bc22dc2e822d` | Astra / medium |
| Original read-only inventory | `01a076f5-0f64-7642-a0b3-11cf66017dbf` | Luna / max |
| Original architecture critique | `01a076f6-0559-7023-b10d-95b45cf55570` | Sol / high |
| Original implementation/corrections | `01a076f6-8faa-7e40-8191-affca2b3a974` | Terra / high |
| Delivery parent and direct verification | `01a07729-1e7f-7e11-be6e-1005344144a5` | Astra / medium |
| First continuation code review | `01a07729-cff4-73f0-91c6-e10dc7b26dc3` | Sol / high; SHIP before final-field correction |
| First continuation product review | `01a0772a-0312-7673-b05d-b64153d7c1ae` | Sol / high; found final-field reset defect |
| Serialized continuation corrections | `01a0772e-9213-7ee2-8336-00b6d7bfcf75` | Terra / high in both correction turns |
| Intermediate code review | `01a07730-7c9e-74f0-97d2-62f8fb3ead73` | Sol / high; found browser-test readiness race |
| Intermediate product review | `01a07730-bcbf-7681-8436-9dba549365c4` | Sol / high; SHIP before QA correction |
| **Final code/privacy/security/accessibility review** | `01a07739-7e22-7a91-99a5-5835698ced75` | **Sol / high; SHIP** |
| **Final product-contract review** | `01a07739-b828-78f0-b0c7-81c59d02cdcb` | **Sol / high; SHIP** |

Both final reviewers inspected the complete corrected tracked/untracked tree against the accepted base. Final code review independently passed 114 focused tests, all 181 unit tests, Convex TypeScript checking, and all 18 Gate 4 browser checks on a fresh strict-port loopback server. Final product review independently passed 114 focused tests and inspected all three screenshots. Both returned no blocking findings. Astra then repeated the acceptance checks below. Earlier verdicts were not substituted for these final verdicts.

## Corrections established by review

1. The diagnostic disclosure now truthfully describes the derived scope-check result and possible broad project-type/service-area projection. Legal, README and exact disclosure tests agree.
2. Clearing the last direct timeline or blocker now removes context entirely, hides the preview and omits `inquiryContext` from submission. Regression tests assert exact omission and preserve case-study provenance when an independent optional field is cleared.
3. Reset/privacy browser tests wait for the Contact form to mount before negative assertions. The malformed-state test waits before injection and after reload, then polls the unchanged combined URL/history/storage raw-marker assertion. A read-only browser probe established that the previous failure was a lazy-route test race, not retained state after route initialization. Assertions were strengthened, not removed or weakened.

## Architecture, schema and privacy

See [the architecture and scheduling decision](gate-4-intent-aware-estimate.md). All services, all three published Case Studies and all diagnostic outcomes construct bounded allowlisted projections. Contact consumes validated router state into component memory and replaces the current history state with `null` in a layout effect. Optional selectors and canonical labels show the context before the existing explicit submit. Edits/removal precede submission; unsent data resets on refresh/leaving, and failures preserve component state for correction.

The optional `leads.inquiryContext` stores canonical IDs/enums only. No raw questionnaire object, remaining diagnostic answers, sensitive/free text in URLs or browser storage, or unsent draft persistence was added. Historical rows and old imports remain compatible; no backfill or production migration ran. Server validation rejects unknown keys/values and inconsistent source pairs before insertion/scheduling. Existing scheduler arguments, indexes, limits and cron behavior are unchanged. Email claims and retries read saved context and format server-owned labels in the plain-text body. No public read/update/delete endpoint was added.

The diagnostic's classification, precedence, proof, poor-fit alternatives, claims and publication filters remain unchanged. Context is informational, not verified fit, a promise, priority or booking. Contact and diagnostic regions exclude replay/UI breadcrumbs; Convex SDK logging is disabled to avoid rejected-payload console leakage. Contact emits a fixed generic telemetry error and only fixed allowlisted user-facing errors. No Calendly, analytics expansion, deployment, production mutation or valid live-contact run occurred.

Scheduling remains a separately approved later decision at the documented post-success adapter boundary. It is outside validation, insertion and the email retry loop.

## Final direct Astra verification after both SHIP verdicts

| Check | Result |
| --- | --- |
| Focused suite: inquiry context, leads, imports, Contact, diagnostic, telemetry, Convex client, case studies, positioning | 122/122 passed across 9 files |
| Full Vitest | 181/181 passed across 24 files |
| Offline Convex codegen with TypeScript enabled | Passed |
| Separate `tsc -p convex/tsconfig.json --noEmit` | Passed |
| Production build | Passed; 8 static routes including 404 generated |
| Local SEO | Passed; affirmative JSON-LD check |
| Full passive Playwright, all four projects | **407 passed, 11 intentional skips, 0 failures, 0 flaky** |
| Whitespace and reviewed-file integrity | Clean; no reviewed source/artifact bytes changed during final verification |

Unit checks started at 17:03:56 Vienna on 6 September 2026. Final passive run started `2026-09-06T15:05:26.254Z`, duration 191.663 seconds. Both `QA_PREVIEW_URL` and `QA_PROD_URL` were `http://127.0.0.1:3127`, with `QA_LOCAL_ONLY=1`, `QA_LIVE_CONTACT_SUBMIT=0`, two workers and a fresh `--strictPort` preview. The preview was stopped afterward. Test JSON is `playwright-output/qa-results.json`; local logs use `/private/tmp/gate4-delivery-astra-{focused,full,codegen,tsc,build,seo,passive}.log`.

Reproduction commands:

```sh
npm test -- convex/lib/inquiryContext.test.ts convex/leads.test.ts convex/migrations/importLeads.test.ts src/pages/Contact.test.jsx src/components/ProjectFitDiagnostic.test.jsx src/lib/sentryTelemetry.test.js src/lib/convexClient.test.js src/data/caseStudies.test.js src/data/positioning.test.js
npm test
./node_modules/.bin/convex codegen --system-udfs --typecheck enable
./node_modules/.bin/tsc -p convex/tsconfig.json --noEmit
VITE_CONVEX_URL=https://coordinated-mandrill-587.eu-west-1.convex.cloud npm run build
npm run preview -- --host 127.0.0.1 --port 3127 --strictPort
# In another terminal while that loopback preview is running:
QA_LIVE_CONTACT_SUBMIT=0 QA_LOCAL_ONLY=1 QA_PREVIEW_URL=http://127.0.0.1:3127 QA_PROD_URL=http://127.0.0.1:3127 npm run qa:seo
QA_LIVE_CONTACT_SUBMIT=0 QA_LOCAL_ONLY=1 QA_PREVIEW_URL=http://127.0.0.1:3127 QA_PROD_URL=http://127.0.0.1:3127 npm run qa:playwright:passive -- --workers=2
```

Ordinary Convex 1.41 codegen requires deployment selection. Astra inspected the installed CLI: hidden `--system-udfs` runs local module/server/API generation and TypeScript checking without deployment credentials or network analysis. This repository has no components; generated files are included. This is not live deployment/schema validation. Toolchain: Node 26.8.1, npm 12.0.2, Convex 1.41.0, Vitest 4.1.8, Playwright 1.60.0. Existing Browserslist/Node warnings remain. No dependency, lockfile or CI workflow changes were made.

## Screenshots, remaining risks and manual acceptance

- [320px form](gate-4-screenshots/context-320.png)
- [390px form](gate-4-screenshots/context-390.png)
- [1280px form](gate-4-screenshots/context-1280.png)

Screenshots use synthetic unsent marker text. The capture helper rejects optional cookies and temporarily hides/restores the fixed header only for the tall form crop; runtime focus/layout/axe assertions keep it present. These disclosure-corrected captures remain visually representative after the nonvisual reset and QA fixes. Astra and final Sol reviewers visually inspected them. Gate 4 browser tests block HTTP writes and WebSockets. Successful persistence/email behavior uses isolated Convex tests and injected fetch mocks, never a live submission.

Non-blocking maintenance risk: literal allowlists are mirrored across schema, mutation validators and the domain module. Future enum changes require synchronized edits and contract tests. Local checks do not validate live Convex schema/configuration or native Safari/VoiceOver.

Manual acceptance: try each service, each published Case Study and all three fit outcomes; review displayed context; edit timeline/blocker; change project type and read the source-replacement notice; remove context; select and clear a final direct timeline/blocker. Check direct entry and refresh/back/forward reset, keyboard/touch, reduced motion and 320/390/1280 widths. Use invalid/empty values for submission validation and focus checks. Native Safari/VoiceOver and deployed configuration remain separate manual checks. Do not send valid contact data as a smoke test.
