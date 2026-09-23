const OWNER_MODE_KEY = 'portfolio_owner_mode';

export function getOwnerMode() {
  if (typeof window === 'undefined') return false;
  try {
    const stored = window.localStorage.getItem(OWNER_MODE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

export function setOwnerMode(enabled) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OWNER_MODE_KEY, enabled ? 'true' : 'false');
  } catch {}
}

export function checkOwnerModeParam() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const me = params.get('me');
  if (me === '1') return true;
  if (me === '0') return false;
  return null;
}
