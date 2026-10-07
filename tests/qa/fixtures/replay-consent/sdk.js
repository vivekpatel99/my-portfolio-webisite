import * as real from '@sentry/react/esm/index.js';
export * from '@sentry/react/esm/index.js';

await new Promise((resolve) => { window.qa.releaseSdk = resolve; });

const fixtureOptions = (options) => ({
  ...options,
  useCompression: window.qa.compression === true,
  minReplayDuration: 0,
  flushMinDelay: 2000,
  flushMaxDelay: 5000,
  beforeAddRecordingEvent(event) {
    window.qa.recordingEvents.push(event);
    return event;
  },
});

export class Replay extends real.Replay {
  constructor(options) { super(fixtureOptions(options)); window.qa.replay = this; }
}
export const replayIntegration = (options) => new Replay(options);

export function makeFetchTransport() {
  const send = (envelope) => {
    window.qa.envelopes.push(envelope);
    if (window.qa.holdSends && envelope[1].some(([header]) => header.type === 'replay_event')) {
      return new Promise((resolve, reject) => {
        window.qa.sendsPending.push(() => window.qa.rejectHeldSend
          ? reject(new Error('synthetic network failure'))
          : resolve({ statusCode: 200 }));
      });
    }
    const isError = envelope[1].some(([header]) => header.type === 'event');
    return Promise.resolve({ statusCode: isError ? window.qa.errorStatus ?? 200 : 200 });
  };
  send.__sentry__baseTransport__ = true;
  return {
    send,
    flush: () => Promise.resolve(true),
  };
}

export function init(options) {
  window.qa.sdkVersion = real.SDK_VERSION;
  window.qa.initCount = (window.qa.initCount ?? 0) + 1;
  real.init({
    ...options,
    replaysSessionSampleRate: window.qa.mode === 'session' ? 1 : 0,
    replaysOnErrorSampleRate: 1,
    tracesSampleRate: 0,
    transport: options.transport ?? makeFetchTransport,
  });
  window.qa.client = real.getCurrentHub().getClient();
  if (window.qa.withdrawDuringInit) window.qa.telemetry.closeSentryTelemetry();
}
