#!/usr/bin/env bash
# Validates VITE_CONVEX_URL for CI jobs that bake it into a browser bundle,
# then exports it to later steps. The value is checked before it is written
# to GITHUB_ENV so a malformed value cannot inject extra environment entries.
set -euo pipefail

readonly PR_FALLBACK_URL="https://coordinated-mandrill-587.eu-west-1.convex.cloud"

if [[ -z "${VITE_CONVEX_URL:-}" ]]; then
  if [[ "${GITHUB_EVENT_NAME:-}" == "pull_request" ]]; then
    echo "::warning title=Missing Convex URL::Using the temporary PR fallback ${PR_FALLBACK_URL}"
    VITE_CONVEX_URL="${PR_FALLBACK_URL}"
  else
    echo "::error title=Missing Convex URL::Set the VITE_CONVEX_URL repository variable (or secret) to the production Convex deployment URL."
    exit 1
  fi
fi

if [[ ! "$VITE_CONVEX_URL" =~ ^https://[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)?\.convex\.cloud/?$ ]]; then
  echo "::error title=Invalid Convex URL::VITE_CONVEX_URL must be a production-like https://*.convex.cloud URL, including regional Convex hosts."
  exit 1
fi

if [[ "$VITE_CONVEX_URL" =~ ^https://(your-|example\.) || "$VITE_CONVEX_URL" =~ (placeholder|localhost|127\.0\.0\.1|\[::1\]) ]]; then
  echo "::error title=Unsafe Convex URL::VITE_CONVEX_URL must not point at a local or placeholder backend."
  exit 1
fi

echo "VITE_CONVEX_URL=$VITE_CONVEX_URL" >> "${GITHUB_ENV:?GITHUB_ENV must be set}"
