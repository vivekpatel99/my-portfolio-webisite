# Sanitized CI QA artifact retention

The passive CI job runs only against its loopback preview with `QA_LOCAL_ONLY=1` and `QA_ARTIFACT_SAFE_MODE=1`. It uploads exactly these reconstructed JSON files for seven days:

- `qa-artifacts/summary.json`
- `qa-artifacts/failure-results.json`

The sanitizer consumes the ignored Playwright JSON report and creates new documents. It does not copy free-form raw JSON fields; it reads only validated enum/numeric result fields to reconstruct the bounded schema. Its static allowlist maps the eight passive spec filenames and the preview desktop/mobile project names to bounded labels. The summary contains only enum result counts and a derived run status. A failure entry contains only the allowlisted suite/project label, reporter source line (integer 1–100000), ordinal within that suite/project, one-based attempt/retry index (1–3), enum outcome, and duration capped at 60 seconds.

Before the workflow can upload, the sanitizer validates both JSON documents against that exact schema and verifies that `qa-artifacts/` is a real directory containing only those two regular, unlinked files. Unknown source names, project names, result statuses, malformed report structure, symlinked/hard-linked candidates, unexpected staging files, oversized reports, and schema violations fail the sanitizer. The upload step is gated on its success and uses `if-no-files-found: ignore`.

No screenshot, video, browser-storage state, trace archive, attachment, raw error, raw test title, stdout/stderr, configuration, environment value, source path, DOM, network payload, raw report, valid contact data, credential, secret, environment file, or repository source is retained. Although safe mode turns off Playwright's configured screenshot, trace, video, and storage-state capture, the runner can still create local raw diagnostics such as `error-context.md`; the workflow never uploads them. No PNG is called sanitized merely because it has a safe filename. The CI scope uses synthetic invalid/non-deliverable data only. It does not submit a valid contact request, run a production browser session, deploy, merge, or publish.

To reproduce the boundary with a synthetic failed report containing forbidden sentinel strings, run:

```bash
npm run qa:artifacts:verify
```

The command writes only to a temporary directory, verifies the two reconstructed JSON documents contain no sentinels, then removes that directory.

For an existing local Playwright report, reconstruct and validate the exact staged files with:

```bash
node tools/sanitize-playwright-artifacts.js
node -e "import('./tools/sanitize-playwright-artifacts.js').then((m) => m.validateStagedArtifacts()).then(() => console.log('staged schema verified'))"
```

Inspect `qa-artifacts/summary.json` and `qa-artifacts/failure-results.json` before allowing their upload. Raw runner output is local diagnostic material and is excluded from GitHub Actions artifacts.
