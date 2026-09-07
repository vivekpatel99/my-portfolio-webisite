/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import {
  SENSITIVE_TELEMETRY_ATTRIBUTE,
  SENSITIVE_TELEMETRY_SELECTOR,
  isSensitiveTelemetrySource,
  shouldDropSensitiveTelemetry,
  shouldDropSensitiveUiBreadcrumb,
} from './sensitiveTelemetry';

describe('sensitive telemetry regions', () => {
  it('recognizes a descendant of the generic marker', () => {
    document.body.innerHTML = `<section ${SENSITIVE_TELEMETRY_ATTRIBUTE}="true"><button>synthetic action</button></section>`;
    const button = document.querySelector('button');

    expect(isSensitiveTelemetrySource(button)).toBe(true);
    expect(isSensitiveTelemetrySource({ target: button })).toBe(true);
    expect(shouldDropSensitiveTelemetry({ telemetrySource: button })).toBe(true);
  });

  it('drops only UI breadcrumbs from marked regions', () => {
    document.body.innerHTML = `<section ${SENSITIVE_TELEMETRY_ATTRIBUTE}="true"><button>synthetic action</button></section>`;
    const button = document.querySelector('button');

    expect(shouldDropSensitiveUiBreadcrumb({ category: 'ui.click' }, { event: { target: button } })).toBe(true);
    expect(shouldDropSensitiveUiBreadcrumb({ category: 'fetch' }, { event: { target: button } })).toBe(false);
    expect(shouldDropSensitiveUiBreadcrumb({ category: 'ui.click' }, { event: { target: document.body } })).toBe(false);
  });
});
