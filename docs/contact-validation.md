# Contact submission validation

`api.leads.submitLead` accepts a broad Convex argument validator so the application
can reject malformed contact shapes expressed as valid Convex values with one generic client error:
`We couldn't submit your request. Please check the form and try again.` The
application then accepts only an object with `name`, `email`, `description`, and
optional `budget`; unknown, missing, null, array, and non-string fields are rejected.
The mutation validates before it reads rate limits, writes a lead, or schedules the
email action. It does not log rejected input.
The generated client argument type remains strict. The contact form shows the fixed
validation message without sending expected validation rejections to diagnostics.

All length values count JavaScript UTF-16 code units. Bounds are inclusive:

| Field | Canonical minimum | Canonical maximum | Raw maximum |
| --- | ---: | ---: | ---: |
| Name | 1 | 200 | 400 |
| Email | 5 | 254 | 508 |
| Description | 1 | 5000 | 10,000 |
| Nonblank budget | 5 | 9 | 64 |

A missing or blank budget becomes absent; a nonblank budget must be exactly
`< €5k`, `€5k-€10k`, `€10k-€25k`, or `€25k+` after trimming.
Email retains the existing basic non-whitespace `local@domain.suffix` format check;
this is not a deliverability check or full RFC mailbox parser.
Name, email, and budget trim surrounding whitespace; email also
lowercases. Description trims surrounding whitespace and canonicalizes CRLF and lone
CR to LF, while preserving ordinary LF and tab characters for multiline text.

Raw input is bounded before normalization to prevent whitespace amplification.
Unsafe controls are checked before trimming so edge characters cannot disappear.
C0, DEL, and C1
controls are rejected in all single-line fields. Description permits tab and LF after
line-ending normalization, but rejects the other C0 controls, DEL, and C1 controls.
All fields reject bidi override/isolate controls; name, email, and budget also reject
Unicode line and paragraph separators. Other format characters, including emoji ZWJ,
remain allowed.

Convex may reject malformed transport payloads before a function begins running. This
contract covers valid Convex values that reach the mutation handler; transport errors
are framework responses and cannot be normalized by application code. Historical
imports retain their own strict row validator and explicitly project contact fields
before shared validation so `createdAt` stays import metadata.

The explicit submission and import insert allowlists remain the persistence boundary
from PR #51. No stored rows or retry behavior are migrated. Rate-limit failures keep
their existing fixed messages, which contain no submitted values.

Local verification: `npm test` and `./node_modules/.bin/tsc --noEmit -p convex/tsconfig.json`.
If regeneration is necessary, use only the local-safe command
`./node_modules/.bin/convex codegen --system-udfs --typecheck enable`.
Passive browser QA exercises empty or invalid forms against loopback previews;
verification must not submit a valid production contact request.
