import { COOKIE_CONSENT_KEY, readAnalyticsConsent, readAnalyticsConsentRevision, refreshCookieConsentFromStorage } from './consent.js';
import { resolveInquiryContext } from './inquiryContext.js';
import { absoluteUrl, routeSeo } from './seoConfig.js';

const SOURCES = new Set(['google', 'bing', 'linkedin', 'github']);

export function normalizeInquirySource(search, referrer) {
  const sources = new URLSearchParams(search).getAll('utm_source');
  if (sources.length) {
    const source = sources.length === 1 ? sources[0].trim().toLowerCase() : '';
    return SOURCES.has(source) ? source : 'other_campaign';
  }
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (host === 'vivekapatel.com') return 'direct';
    for (const source of SOURCES) {
      if (host === `${source}.com`) return source;
    }
  } catch { /* Untrusted referrers are reduced to one category. */ }
  return 'other_referral';
}

// Keep only this bounded value for the current document. Capture before SPA
// navigation or a later consent choice can remove the entry campaign URL.
const inquirySource = typeof window === 'undefined' ? 'direct'
  : normalizeInquirySource(window.location.search, document.referrer);
let activeTransport = null;

export function analyticsPageParameters(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const seo = routeSeo[path] ?? routeSeo[`${path}/`];
  const pagePath = seo ? new URL(absoluteUrl(seo.path)).pathname : '/not-found/';
  return {
    page_path: pagePath,
    page_location: absoluteUrl(pagePath),
    page_title: seo?.title ?? 'Page not found',
    page_referrer: '',
    campaign_source: inquirySource,
    campaign_medium: 'not_collected',
    campaign_name: 'not_collected',
    campaign_id: 'not_collected',
    campaign_term: 'not_collected',
    campaign_content: 'not_collected',
  };
}

// Only the enabled production GA component registers a transport. Unmount or
// consent disable invalidates its pending measurements without a replay queue.
export function registerInquiryAnalytics(trackingId) {
  const transport = { trackingId, revision: 0 };
  activeTransport = transport;
  const handleStorage = event => {
    if (event.key !== null && event.key !== COOKIE_CONSENT_KEY) return;
    refreshCookieConsentFromStorage();
    let granted = false;
    try { granted = JSON.parse(event.newValue)?.analytics === true; } catch { /* Fail closed. */ }
    if (!granted) transport.revision += 1;
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener('storage', handleStorage);
    if (activeTransport === transport) activeTransport = null;
  };
}

export function beginInquiryMeasurement(context) {
  if (!activeTransport || typeof window.gtag !== 'function' || !readAnalyticsConsent()) return null;
  const trusted = resolveInquiryContext(context?.type, context?.id);
  return {
    transport: activeTransport,
    consentRevision: readAnalyticsConsentRevision(),
    transportRevision: activeTransport.revision,
    completed: false,
    parameters: {
      inquiry_source: inquirySource,
      inquiry_type: trusted?.type ?? 'none',
      ...(trusted ? { inquiry_id: trusted.id } : {}),
    },
  };
}

export function completeInquiryMeasurement(measurement) {
  if (!measurement || measurement.completed) return;
  measurement.completed = true;
  if (measurement.transport !== activeTransport
    || measurement.consentRevision !== readAnalyticsConsentRevision()
    || measurement.transportRevision !== activeTransport.revision
    || !readAnalyticsConsent() || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', 'generate_lead', {
      ...analyticsPageParameters('/contact/'),
      ...measurement.parameters,
      send_to: activeTransport.trackingId,
    });
  } catch { /* Measurement must never change the accepted inquiry or log PII. */ }
}
