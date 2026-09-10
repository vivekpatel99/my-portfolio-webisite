# Case-study release checklist

This is a finite handoff for a separately authorized production release. The
current six local stories are metadata-only draft dispositions; none has
publication approval or a live URL.

## Proposed stories requiring fresh approval

Before release, the reviewer must identify the exact candidate bytes by their
SHA-256 digest and approve the public text and any referenced final image
bytes. The six proposed IDs and slugs are:

| ID | Slug | Reviewed candidate bytes | Image bytes | Publication approval |
| --- | --- | --- | --- | --- |
| `ai-invoice-processing-automation` | `ai-invoice-processing-automation` | SHA-256 recorded after final review | `none` unless a reviewed cover/inline image is selected | pending |
| `photo-ocr-extraction` | `photo-ocr-extraction` | SHA-256 recorded after final review | `none` unless a reviewed cover/inline image is selected | pending |
| `supporting-computer-vision` | `supporting-computer-vision` | SHA-256 recorded after final review | `none` unless a reviewed cover/inline image is selected | pending |
| `n8n-python-ai-agents` | `n8n-python-ai-agents` | SHA-256 recorded after final review | `none` unless a reviewed cover/inline image is selected | pending |
| `healthcare-document-intelligence` | `healthcare-document-intelligence` | SHA-256 recorded after final review | `none` unless a reviewed cover/inline image is selected | pending |
| `sports-video-analytics-yolo` | `sports-video-analytics-yolo` | SHA-256 recorded after final review | `none` unless a reviewed cover/inline image is selected | pending |

For each selected story, confirm that the reviewed digest covers the exact
candidate file, that every image digest covers the final approved bytes, and
that the approval names the same ID and slug. The three retained legacy
identities (`n8n-openai-data-extraction`, `invoice-ocr-extraction`, and
`yolo-computer-vision-optimization`) remain under their existing validated
baseline retention until exact identity review; no proposed story transfers
their claims or route.

## Software and provenance checks

- Run `npm test`, `npm run build`, and `git diff --check` from the website
  checkout.
- Run local SEO and browser checks with both targets pinned to loopback:
  `QA_LOCAL_ONLY=1 QA_ARTIFACT_SAFE_MODE=1 QA_PREVIEW_URL=http://127.0.0.1:3100 QA_PROD_URL=http://127.0.0.1:3100 npm run qa:seo` and
  `QA_LOCAL_ONLY=1 QA_ARTIFACT_SAFE_MODE=1 QA_PREVIEW_URL=http://127.0.0.1:3100 QA_PROD_URL=http://127.0.0.1:3100 npm run qa:playwright:ci`.
  Do not use the unqualified passive command for this acceptance evidence;
  its defaults can include a live target.
- Confirm CI runs those checks against the exact release commit after the
  release commit is identified; record the commit SHA with the results.
- Run preparation with explicit `--source` paths, inspect the candidate, then
  preview it on loopback. Confirm preview is refused when `CI` is set or
  `NODE_ENV=production` and that its output is outside production inputs.
- Compute the candidate SHA-256 only after the final text, public metadata, and
  image bytes are reviewed. Stage with that digest, reviewer, UTC timestamp,
  and HTTPS evidence URL. A stale or mismatched digest must leave the previous
  staged store unchanged.
- Confirm the compiler and staging checks accept only PNG, JPEG, and WebP
  bytes whose actual format matches the `.png`, `.jpg`, `.jpeg`, or `.webp`
  public filename. Confirm private notes, source paths, draft media, and
  approval metadata are absent from `dist/`.
- Confirm a private-note or ignored-frontmatter-only edit leaves the candidate
  bytes unchanged; public metadata and image-byte edits require a new digest
  and approval.
- Inspect generated article HTML, cards, canonical metadata, sitemap entries,
  route allowlisting, and referenced asset files. A successful preparation or
  build is local release evidence, not proof of publication.

## Host and withdrawal checks

Before an authorized release, verify the static host's Apache integration uses
the generated `.htaccess` project allowlist and returns real 404 responses for
unknown or withdrawn slugs. The hosting step must remove obsolete generated
article files and unique assets; an upload-only step is insufficient for a
withdrawal. Preserve assets still referenced by another published story.

Only after explicit release authorization may the operator check the actual
live URL status, canonical metadata, unique asset status, sitemap entry, and
withdrawal deletion behavior. If a deployment result is uncertain, inspect the
actual host state before retrying. Do not treat an upload-only result as a
withdrawal confirmation.
