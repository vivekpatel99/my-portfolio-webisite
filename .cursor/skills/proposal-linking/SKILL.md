---
name: proposal-linking
description: Use when drafting or revising an Upwork proposal, pitch, or cover letter that might auto-link vivekapatel.com case studies. Guardrails for which portfolio URLs may be pasted.
---

# Proposal linking

Import `auditProposalText`, `classify`, and `SITE_RATE` from `map.js` in this folder.

Choose at most two `kind: 'ready'` rows in `map.js` that match the job. Read `ENTRIES` directly. Never iterate the sitemap, the case study collection, featured slugs, or `caseStudySlugs`.

## Job-signal matching

Pick one row per strong signal. Use at most two links total.

| Job signals | Prefer (pick 1, at most 2 total) |
| --- | --- |
| n8n, workflow automation, ETL, webhook pipelines | n8n-openai-data-extraction |
| invoice automation, AP workflows, document intake | ai-invoice-processing-automation |
| OCR, PDF parsing, scanned documents, field extraction | invoice-ocr-extraction |
| YOLO, object detection, CV performance, edge inference | yolo-computer-vision-optimization |

When two rows both fit, pick the single strongest match. Do not link two invoice stories unless the post explicitly spans OCR and end-to-end automation as separate proof needs.

## Audit before send

Run `auditProposalText` on the finished draft. Send only if `ok` is true.

If `ok` is false, read `error` and `rejected`. Drop blocked or unknown URLs. If `error` is `cap`, keep at most two distinct ready links from `links`.

## Rate and proof

If the proposal mentions the site rate, use `SITE_RATE` (`€45/hour`). Do not invent proof, logos, client names, or metrics. Do not auto-link the homepage until GitHub #119 closes. Rate copy already on the site does not lift that ban.

## Refresh

When a blocked row's GitHub issues close, edit `ENTRIES` in `map.js` to mark that path ready or remove the row. Do not invent ready URLs. Do not pretend issues 121 through 129 are done until they actually close.
