import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSrc = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('telemetry config', () => {
  it('does not hardcode a production GA ID or Sentry DSN', () => {
    const ga = readSrc('src/components/GoogleAnalytics.jsx');
    const sentry = readSrc('src/lib/sentryTelemetry.js');

    expect(ga).not.toMatch(/G-[A-Z0-9]{6,}/);
    expect(sentry).not.toMatch(/https:\/\/\S+@\S+\.ingest\S+/);
    expect(ga).toContain('import.meta.env.VITE_GA_TRACKING_ID');
    expect(sentry).toContain('import.meta.env.VITE_SENTRY_DSN');
  });

  it('treats missing, blank, and placeholder values as off', () => {
    const ga = readSrc('src/components/GoogleAnalytics.jsx');
    const sentry = readSrc('src/lib/sentryTelemetry.js');

    expect(ga).toContain('VITE_GA_TRACKING_ID?.trim()');
    expect(ga).toContain('if (!hasConsent || !GA_TRACKING_ID)');
    expect(sentry).toContain('VITE_SENTRY_DSN?.trim()');
    expect(sentry).toContain("SENTRY_DSN === 'your-sentry-dsn-here'");
    expect(sentry).toContain('process.env.NODE_ENV !== \'production\'');
  });

  it('keeps GA off on localhost and 127.0.0.1', () => {
    const ga = readSrc('src/components/GoogleAnalytics.jsx');
    expect(ga).toContain("hostname === 'localhost' || hostname === '127.0.0.1'");
  });
});
