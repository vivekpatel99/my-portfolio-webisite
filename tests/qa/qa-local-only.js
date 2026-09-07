const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function assertLoopbackPreviewUrl(previewURL) {
  let parsed;
  try {
    parsed = new URL(previewURL);
  } catch {
    throw new Error('QA_LOCAL_ONLY requires a valid loopback preview URL');
  }

  if (
    !['http:', 'https:'].includes(parsed.protocol)
    || parsed.username
    || parsed.password
    || !LOOPBACK_HOSTS.has(parsed.hostname)
  ) {
    throw new Error('QA_LOCAL_ONLY requires a loopback preview URL');
  }
}

export function resolveLoopbackRedirectUrl(requestURL, location) {
  const redirectURL = new URL(location, requestURL).toString();
  assertLoopbackPreviewUrl(redirectURL);
  return redirectURL;
}

export function resolveQaTargets({ localOnly, previewURL, prodURL }) {
  if (localOnly) {
    assertLoopbackPreviewUrl(previewURL);
    return [['preview', previewURL]];
  }

  return [
    ['preview', previewURL],
    ['prod', prodURL],
  ];
}
