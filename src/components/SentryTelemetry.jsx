import { useEffect } from 'react';
import {
  closeSentryTelemetry,
  initializeSentryTelemetry,
} from '@/lib/sentryTelemetry';

const SentryTelemetry = ({ hasConsent }) => {
  useEffect(() => {
    if (hasConsent) {
      void initializeSentryTelemetry();
      return undefined;
    }

    void closeSentryTelemetry();
    return undefined;
  }, [hasConsent]);

  return null;
};

export default SentryTelemetry;
