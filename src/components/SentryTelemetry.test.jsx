/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SentryTelemetry from './SentryTelemetry';
import {
  closeSentryTelemetry,
  initializeSentryTelemetry,
} from '@/lib/sentryTelemetry';

vi.mock('@/lib/sentryTelemetry', () => ({
  closeSentryTelemetry: vi.fn(),
  initializeSentryTelemetry: vi.fn(),
}));

describe('SentryTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not initialize telemetry without analytics consent', () => {
    render(<SentryTelemetry hasConsent={false} />);

    expect(initializeSentryTelemetry).not.toHaveBeenCalled();
    expect(closeSentryTelemetry).toHaveBeenCalledTimes(1);
  });

  it('initializes telemetry when analytics consent is granted', () => {
    render(<SentryTelemetry hasConsent />);

    expect(initializeSentryTelemetry).toHaveBeenCalledTimes(1);
  });

  it('closes telemetry after consent is revoked', () => {
    const { rerender } = render(<SentryTelemetry hasConsent />);

    rerender(<SentryTelemetry hasConsent={false} />);

    expect(initializeSentryTelemetry).toHaveBeenCalledTimes(1);
    expect(closeSentryTelemetry).toHaveBeenCalledTimes(1);
  });
});
