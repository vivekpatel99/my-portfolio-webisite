import { expect, test } from '@playwright/test';

test('withdrawn global errors cannot become client reports after reaccept', async ({ page }) => {
  await setup(page, 'buffer');
  await accept(page);
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await stopped(page);
  await page.evaluate(async () => {
    window.dispatchEvent(new ErrorEvent('error', {
      message: 'WITHDRAWN_OUTCOME_ERROR',
      error: new Error('WITHDRAWN_OUTCOME_ERROR'),
    }));
    await window.qa.client.flush();
  });
  await accept(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => window.qa.envelopes.filter(([, items]) => (
    items.some(([header]) => header.type === 'client_report')
  )))).toEqual([]);
  expect(await page.evaluate(() => window.qa.client._outcomes)).toEqual({});
  await page.evaluate(() => window.qa.telemetry.captureException(new Error('CURRENT_OUTCOME_ERROR')));
  await expect.poll(() => page.evaluate(() => JSON.stringify(window.qa.envelopes))).toContain('CURRENT_OUTCOME_ERROR');
});

async function setup(page, mode) {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    const localBlob = url.protocol === 'blob:' && new URL(url.pathname).hostname === '127.0.0.1';
    return url.hostname === '127.0.0.1' || localBlob ? route.continue() : route.abort();
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Accept', exact: true })).toBeVisible();
  await page.evaluate((value) => { window.qa.mode = value; }, mode);
}

async function accept(page) {
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  await page.waitForFunction(() => window.qa.releaseSdk);
  await page.evaluate(() => window.qa.releaseSdk());
  await page.waitForFunction(() => window.qa.replay?.getReplayId());
  expect(await page.evaluate(() => window.qa.sdkVersion)).toBe('7.120.4');
}

async function stopped(page) {
  await expect.poll(() => page.evaluate(() => Boolean(window.qa.replay.getReplayId()))).toBe(false);
  expect(await page.evaluate(() => ({
    recorder: Boolean(window.qa.replay._replay._stopRecording),
    enabled: window.qa.replay._replay.isEnabled(),
    buffer: Boolean(window.qa.replay._replay.eventBuffer),
  }))).toEqual({ recorder: false, enabled: false, buffer: false });
  expect(await page.evaluate(() => sessionStorage.getItem('sentryReplaySession'))).toBeNull();
}

for (const mode of ['session', 'buffer']) {
  test(`${mode}: withdraw discards unsent recording and reaccept starts one recorder`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await setup(page, mode);
    await accept(page);
    expect(await page.evaluate(() => window.qa.replay._replay.recordingMode)).toBe(mode);
    expect(await page.evaluate(() => Boolean(window.qa.replay._replay._stopRecording))).toBe(true);
    expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('sentryReplaySession')).id))
      .toBe(await page.evaluate(() => window.qa.replay.getReplayId()));
    const activeListeners = await page.evaluate(() => window.qa.listenerCount());
    await page.getByRole('button', { name: 'Interact', exact: true }).click();
    await page.getByLabel('Public input').fill('MASKED_TYPED_INPUT');
    await page.getByLabel('Contact input').fill('BLOCKED_TYPED_INPUT');
    await page.waitForFunction(() => window.qa.replay._replay.eventBuffer.events.some((event) => event.type === 2));
    const recording = await page.evaluate(() => JSON.stringify(window.qa.replay._replay.eventBuffer.events));
    for (const marker of ['MASKED_PUBLIC_TEXT', 'MASKED_PUBLIC_INPUT', 'MASKED_TYPED_INPUT', 'BLOCKED_CONTACT_TEXT', 'BLOCKED_CONTACT_INPUT', 'BLOCKED_TYPED_INPUT']) {
      expect(recording).not.toContain(marker);
    }
    const beforeWithdrawal = await page.evaluate(() => window.qa.envelopes.length);
    await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
    await stopped(page);
    expect(await page.evaluate(() => window.qa.listenerCount())).toBeLessThan(activeListeners);
    const recorded = await page.evaluate(() => window.qa.recordingEvents.length);
    await page.getByRole('button', { name: 'Interact', exact: true }).click();
    await page.evaluate(async () => {
      window.qa.telemetry.captureException(new Error('WITHDRAWN_ERROR'));
      window.dispatchEvent(new ErrorEvent('error', { error: new Error('WITHDRAWN_GLOBAL_ERROR') }));
      await window.qa.replay.flush();
    });
    await page.waitForTimeout(5500);
    expect(await page.evaluate(() => window.qa.envelopes.length)).toBe(beforeWithdrawal);
    expect(await page.evaluate(() => window.qa.recordingEvents.length)).toBe(recorded);

    for (let cycle = 0; cycle < 2; cycle += 1) {
      await accept(page);
      expect(await page.evaluate(() => window.qa.initCount)).toBe(1);
      expect(await page.evaluate(() => window.qa.listenerCount())).toBe(activeListeners);
      const replayId = await page.evaluate(() => window.qa.replay.getReplayId());
      await page.getByRole('button', { name: 'Interact', exact: true }).click();
      await page.evaluate(() => {
        window.qa.telemetry.captureException(new Error('ALLOWED_BACKGROUND_ERROR'));
        window.qa.telemetry.captureException(new Error('BLOCKED_CONTACT_ERROR'), {
          telemetrySource: document.querySelector('[data-sensitive-telemetry]'),
        });
      });
      if (mode === 'buffer') {
        await expect.poll(() => page.evaluate(() => window.qa.replay._replay.recordingMode)).toBe('session');
      }
      await page.evaluate(() => window.qa.replay.flush());
      await expect.poll(() => page.evaluate(() => window.qa.envelopes.filter(([, items]) => items.some(([header]) => header.type === 'replay_event')).length)).toBeGreaterThan(cycle);
      const envelopes = await page.evaluate(() => JSON.stringify(window.qa.envelopes));
      expect(envelopes).toContain(replayId);
      expect(envelopes).toContain('ALLOWED_BACKGROUND_ERROR');
      expect(envelopes).not.toContain('BLOCKED_CONTACT_ERROR');
      expect(envelopes).not.toContain('telemetry.consent_epoch');
      await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
      await stopped(page);
    }
    expect(errors).toEqual([]);
  });
}

test('withdraw during SDK download prevents later startup', async ({ page }) => {
  await setup(page, 'session');
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  await page.waitForFunction(() => window.qa.releaseSdk);
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await page.evaluate(() => window.qa.releaseSdk());
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.qa.initCount ?? 0)).toBe(0);
  await accept(page);
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await stopped(page);
});

test('withdraw during synchronous SDK setup defeats its delayed Replay timer', async ({ page }) => {
  await setup(page, 'session');
  await page.evaluate(() => { window.qa.withdrawDuringInit = true; });
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  await page.waitForFunction(() => window.qa.releaseSdk);
  await page.evaluate(() => window.qa.releaseSdk());
  await page.waitForFunction(() => window.qa.initCount === 1);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.qa.recordingEvents)).toEqual([]);
  expect(await page.evaluate(() => window.qa.replay.getReplayId())).toBeUndefined();
});

for (const mode of ['session', 'buffer']) {
  test(`${mode}: a dispatched segment may finish, but pending recording is not exported during immediate reaccept`, async ({ page }) => {
    await setup(page, mode);
    await accept(page);
    await page.evaluate(() => {
      window.qa.holdSends = true;
      window.qa.pendingFlush = window.qa.replay.flush();
    });
    await page.waitForFunction(() => window.qa.sendsPending.length > 0);
    const beforeWithdrawal = await page.evaluate(() => window.qa.envelopes.length);
    await page.getByRole('button', { name: 'Interact', exact: true }).click();
    await page.waitForFunction(() => window.qa.replay._replay.eventBuffer.hasEvents);
    await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
    expect(await page.evaluate(() => Boolean(window.qa.replay._replay._stopRecording))).toBe(false);
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    expect(await page.evaluate(() => Boolean(window.qa.replay.getReplayId()))).toBe(false);
    await page.evaluate(() => {
      window.qa.holdSends = false;
      window.qa.sendsPending.splice(0).forEach((finish) => finish());
    });
    await page.waitForFunction(() => window.qa.replay.getReplayId());
    expect(await page.evaluate(() => window.qa.envelopes.length)).toBe(beforeWithdrawal);
    expect(await page.evaluate(() => window.qa.initCount)).toBe(1);
    await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
    await stopped(page);
  });
}

for (const rejects of [false, true]) {
  test(`buffer: error-triggered ${rejects ? 'failed' : 'successful'} send cannot restart a withdrawn recorder`, async ({ page }) => {
    await setup(page, 'buffer');
    await accept(page);
    const activeListeners = await page.evaluate(() => window.qa.listenerCount());
    await page.evaluate((reject) => {
      window.qa.holdSends = true;
      window.qa.rejectHeldSend = reject;
      window.qa.telemetry.captureException(new Error('SYNTHETIC_BUFFER_TRIGGER'));
    }, rejects);
    await page.waitForFunction(() => window.qa.sendsPending.length > 0);
    const sent = await page.evaluate(() => window.qa.envelopes.length);
    await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
    await page.evaluate(() => { window.qa.shutdown = window.qa.telemetry.closeSentryTelemetry(); });
    await page.evaluate(async () => {
      window.qa.holdSends = false;
      window.qa.sendsPending.splice(0).forEach((finish) => finish());
      await window.qa.shutdown;
    });
    await stopped(page);
    expect(await page.evaluate(() => window.qa.listenerCount())).toBeLessThan(activeListeners);
    expect(await page.evaluate(() => window.qa.envelopes.length)).toBe(sent);
    await accept(page);
    expect(await page.evaluate(() => window.qa.listenerCount())).toBe(activeListeners);
    await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
    await stopped(page);
  });
}

test('withdraw during an expired session refresh prevents asynchronous recorder setup', async ({ page }) => {
  await setup(page, 'session');
  await accept(page);
  await page.evaluate(async () => {
    const recorder = window.qa.replay._replay;
    const initializeSampling = recorder.initializeSampling.bind(recorder);
    window.qa.refreshSamplingAttempts = 0;
    recorder.initializeSampling = (...args) => {
      window.qa.refreshSamplingAttempts += 1;
      return initializeSampling(...args);
    };
    recorder.session.started = Date.now() - recorder.getOptions().maxReplayDuration - 1;
    window.dispatchEvent(new Event('focus'));
    await window.qa.telemetry.closeSentryTelemetry();
  });
  await expect.poll(() => page.evaluate(() => window.qa.refreshSamplingAttempts)).toBe(1);
  await stopped(page);
});

test('a rejected error response does not promote a buffered replay', async ({ page }) => {
  await setup(page, 'buffer');
  await accept(page);
  await page.evaluate(() => {
    window.qa.errorStatus = 429;
    window.qa.telemetry.captureException(new Error('SYNTHETIC_REJECTED_ERROR'));
  });
  await page.waitForFunction(() => window.qa.envelopes.some(([, items]) => items.some(([header]) => header.type === 'event')));
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.qa.replay._replay.recordingMode)).toBe('buffer');
  expect(await page.evaluate(() => window.qa.envelopes.some(([, items]) => items.some(([header]) => header.type === 'replay_event')))).toBe(false);
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await stopped(page);
});

for (const mode of ['session', 'buffer']) {
  test(`${mode}: withdraw during real compression finish stops the recorder and permits reaccept`, async ({ page }) => {
    await setup(page, mode);
    await page.evaluate(() => { window.qa.compression = true; });
    await accept(page);
    await page.waitForFunction(() => window.qa.replay._replay.eventBuffer.type === 'worker');
    await page.evaluate(() => {
      window.qa.holdWorkerFinish = true;
      window.qa.pendingFlush = window.qa.replay.flush();
    });
    await page.waitForFunction(() => window.qa.releaseWorker);
    await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
    expect(await page.evaluate(() => Boolean(window.qa.replay._replay._stopRecording))).toBe(false);
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    await page.evaluate(() => { window.qa.holdWorkerFinish = false; window.qa.releaseWorker(); });
    await page.waitForFunction(() => window.qa.replay.getReplayId(), null, { timeout: 2000 });
    expect(await page.evaluate(() => window.qa.initCount)).toBe(1);
    expect(await page.evaluate(() => window.qa.envelopes.some(([, items]) => items.some(([header]) => header.type === 'replay_event')))).toBe(false);
    await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
    await stopped(page);
  });
}

for (const mode of ['session', 'buffer']) {
  for (const pendingWork of ['send', 'compression']) {
    test(`${mode}: withdraw waits for a mutation-limit stop with pending ${pendingWork}`, async ({ page }) => {
      await setup(page, mode);
      await page.evaluate((work) => { window.qa.compression = work === 'compression'; }, pendingWork);
      await accept(page);
      if (pendingWork === 'compression') {
        await page.waitForFunction(() => window.qa.replay._replay.eventBuffer.type === 'worker');
      }
      const activeListeners = await page.evaluate(() => window.qa.listenerCount());
      await page.evaluate((work) => {
        const recorder = window.qa.replay._replay;
        const stop = recorder.stop.bind(recorder);
        recorder.stop = (options) => {
          const pending = stop(options);
          if (options.reason === 'mutationLimit') {
            window.qa.internalStopReason = options.reason;
            window.qa.internalStop = pending;
          }
          return pending;
        };
        window.qa.holdSends = work === 'send';
        window.qa.holdWorkerFinish = work === 'compression';
        window.qa.pendingFlush = window.qa.replay.flush();
      }, pendingWork);
      await page.waitForFunction((work) => work === 'send'
        ? window.qa.sendsPending.length > 0 : window.qa.releaseWorker, pendingWork);
      await page.evaluate(() => {
        window.qa.replay._replay.getOptions().mutationLimit = 1;
        for (let index = 0; index < 20; index += 1) {
          document.body.appendChild(document.createElement('span'));
        }
      });
      await page.waitForFunction(() => window.qa.internalStopReason === 'mutationLimit');
      expect(await page.evaluate(() => window.qa.internalStopReason)).toBe('mutationLimit');
      expect(await page.evaluate(() => window.qa.replay._replay.isEnabled())).toBe(false);
      const sent = await page.evaluate(() => window.qa.envelopes.length);
      await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
      await page.getByRole('button', { name: 'Accept', exact: true }).click();
      await page.waitForTimeout(250);
      expect(await page.evaluate(() => Boolean(window.qa.replay.getReplayId()))).toBe(false);
      await page.evaluate(async (work) => {
        window.qa.replay._replay.getOptions().mutationLimit = 10000;
        if (work === 'send') {
          window.qa.holdSends = false;
          window.qa.sendsPending.splice(0).forEach((finish) => finish());
        } else {
          window.qa.holdWorkerFinish = false;
          window.qa.releaseWorker();
        }
        await window.qa.internalStop;
      }, pendingWork);
      await page.waitForFunction(() => window.qa.replay.getReplayId(), null, { timeout: 2000 });
      await page.waitForTimeout(250);
      expect(await page.evaluate(() => Boolean(window.qa.replay._replay._stopRecording))).toBe(true);
      expect(await page.evaluate(() => window.qa.listenerCount())).toBe(activeListeners);
      expect(await page.evaluate(() => window.qa.envelopes.length)).toBe(sent);
      await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
      await stopped(page);
    });
  }
}

for (const mode of ['session', 'buffer']) {
  test(`${mode}: expired refresh retains pending compression until reaccept is safe`, async ({ page }) => {
    await setup(page, mode);
    await page.evaluate(() => { window.qa.compression = true; });
    await accept(page);
    await page.waitForFunction(() => window.qa.replay._replay.eventBuffer.type === 'worker');
    await page.evaluate(() => {
      window.qa.holdWorkerFinish = true;
      window.qa.pendingFlush = window.qa.replay.flush();
    });
    await page.waitForFunction(() => window.qa.releaseWorker);
    await page.evaluate(() => {
      const recorder = window.qa.replay._replay;
      const stop = recorder.stop.bind(recorder);
      recorder.stop = (options) => {
        window.qa.refreshStopReason = options.reason;
        return stop(options);
      };
      recorder.session.started = Date.now() - recorder.getOptions().maxReplayDuration - 1;
      window.dispatchEvent(new Event('focus'));
    });
    expect(await page.evaluate(() => window.qa.refreshStopReason)).toBe('refresh session');
    await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => Boolean(window.qa.replay.getReplayId()))).toBe(false);
    await page.evaluate(() => { window.qa.holdWorkerFinish = false; window.qa.releaseWorker(); });
    await page.waitForFunction(() => window.qa.replay.getReplayId(), null, { timeout: 2000 });
    expect(await page.evaluate(() => Boolean(window.qa.replay._replay._stopRecording))).toBe(true);
    expect(await page.evaluate(() => window.qa.envelopes.length)).toBe(0);
    await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
    await stopped(page);
  });
}

for (const mode of ['session', 'buffer']) {
  test(`${mode}: a performance-event failure inside flush cannot deadlock native stop`, async ({ page }) => {
    await setup(page, mode);
    await accept(page);
    await page.evaluate(() => {
      const recorder = window.qa.replay._replay;
      const stop = recorder.stop.bind(recorder);
      recorder.stop = (options) => {
        window.qa.failureStopReason = options.reason;
        return stop(options);
      };
      const buffer = recorder.eventBuffer;
      const add = buffer.addEvent.bind(buffer);
      buffer.addEvent = (event) => event.data?.tag === 'performanceSpan'
        ? Promise.reject(new Error('SYNTHETIC_PERFORMANCE_FAILURE')) : add(event);
      recorder.replayPerformanceEntries.push({
        type: 'navigation.push', name: 'synthetic', start: Date.now() / 1000, end: Date.now() / 1000, data: {},
      });
      window.qa.flushSettled = false;
      window.qa.pendingFlush = window.qa.replay.flush().finally(() => { window.qa.flushSettled = true; });
    });
    await page.waitForFunction(() => window.qa.failureStopReason === 'addEvent');
    await page.waitForFunction(() => window.qa.flushSettled, null, { timeout: 2000 });
    await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
    await accept(page);
    expect(await page.evaluate(() => Boolean(window.qa.replay._replay._stopRecording))).toBe(true);
    await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
    await stopped(page);
  });
}

test('navigation tracing cannot cross a withdrawn consent interval', async ({ page }) => {
  await setup(page, 'session');
  await page.evaluate(() => { window.qa.tracing = true; });
  await accept(page);
  await page.evaluate(async () => {
    window.qa.sdk.getActiveTransaction().finish();
    await window.qa.client.flush();
  });
  await expect.poll(() => page.evaluate(() => window.qa.envelopes.some(([, items]) => items.some(([header, event]) => header.type === 'transaction' && event.contexts.trace.op === 'pageload')))).toBe(true);
  await page.evaluate(() => {
    window.qa.allowedTrace = window.qa.sdk.startTransaction({ name: 'CONSENTED_TRACE' });
    window.qa.allowedTrace.finish();
  });
  await expect.poll(() => page.evaluate(() => JSON.stringify(window.qa.envelopes))).toContain('CONSENTED_TRACE');
  await page.evaluate(() => {
    history.pushState({}, '', '/before-withdrawal');
    window.qa.previousTrace = window.qa.sdk.getActiveTransaction();
  });
  expect(await page.evaluate(() => window.qa.previousTrace.isRecording())).toBe(true);
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await stopped(page);
  await page.evaluate(() => {
    history.pushState({}, '', '/WITHOUT_CONSENT');
    window.qa.withdrawnTrace = window.qa.sdk.getActiveTransaction();
  });
  await accept(page);
  await page.evaluate(async () => {
    window.qa.previousTrace.finish();
    window.qa.withdrawnTrace.finish();
    await window.qa.client.flush();
  });
  const sent = await page.evaluate(() => window.qa.envelopes.flatMap(([, items]) => items.filter(([header]) => header.type === 'transaction').map(([, event]) => event.transaction)));
  expect(sent).not.toContain('WITHOUT_CONSENT');
  expect(sent).not.toContain('/before-withdrawal');
  expect(await page.evaluate(() => window.qa.withdrawnTrace.isRecording())).toBe(false);
  await page.evaluate(async () => {
    history.pushState({}, '', '/AFTER_REACCEPT');
    window.qa.sdk.getActiveTransaction().finish();
    await window.qa.client.flush();
  });
  await expect.poll(() => page.evaluate(() => JSON.stringify(window.qa.envelopes))).toContain('AFTER_REACCEPT');
});

test('a queued transaction is discarded after withdrawal and reaccept', async ({ page }) => {
  await setup(page, 'session');
  await page.evaluate(() => { window.qa.tracing = true; });
  await accept(page);
  await page.evaluate(() => {
    window.qa.client.addEventProcessor((event) => event.transaction === 'QUEUED_TRACE'
      ? new Promise((resolve) => { window.qa.releaseTrace = () => resolve(event); })
      : event);
    window.qa.sdk.startTransaction({ name: 'QUEUED_TRACE' }).finish();
  });
  await page.waitForFunction(() => window.qa.releaseTrace);
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await stopped(page);
  await accept(page);
  await page.evaluate(async () => {
    window.qa.releaseTrace();
    await window.qa.client.flush();
    window.qa.sdk.startTransaction({ name: 'FRESH_TRACE' }).finish();
    await window.qa.client.flush();
  });
  await expect.poll(() => page.evaluate(() => JSON.stringify(window.qa.envelopes))).toContain('FRESH_TRACE');
  expect(await page.evaluate(() => JSON.stringify(window.qa.envelopes))).not.toContain('QUEUED_TRACE');
});

test('a late error response cannot promote a later consent period', async ({ page }) => {
  await setup(page, 'buffer');
  await accept(page);
  await page.evaluate(() => {
    window.qa.holdErrorResponse = true;
    window.qa.telemetry.captureException(new Error('OLD_PENDING_ERROR'));
  });
  await page.waitForFunction(() => window.qa.releaseErrorResponse);
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await stopped(page);
  await page.waitForTimeout(2100);
  await accept(page);
  const id = await page.evaluate(() => window.qa.replay.getReplayId());
  await page.evaluate(async () => {
    window.qa.holdErrorResponse = false;
    window.qa.releaseErrorResponse();
    await window.qa.client.flush();
  });
  await page.waitForTimeout(5500);
  expect(await page.evaluate(() => window.qa.replay._replay.recordingMode)).toBe('buffer');
  expect(await page.evaluate(() => window.qa.replay.getReplayId())).toBe(id);
  expect(await page.evaluate(() => window.qa.envelopes.filter(([, items]) => items.some(([header]) => header.type === 'replay_event')).length)).toBe(0);
  await page.evaluate(() => window.qa.telemetry.captureException(new Error('FRESH_ERROR')));
  await expect.poll(() => page.evaluate(() => window.qa.replay._replay.recordingMode)).toBe('session');
});

test('a scheduled error promotion cannot affect a later consent period', async ({ page }) => {
  await setup(page, 'buffer');
  await accept(page);
  await page.evaluate(() => {
    window.qa.holdErrorResponse = true;
    window.qa.telemetry.captureException(new Error('OLD_SCHEDULED_ERROR'));
  });
  await page.waitForFunction(() => window.qa.releaseErrorResponse);
  await page.evaluate(() => {
    const schedule = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => {
      if (!delay) {
        window.setTimeout = schedule;
        window.qa.releasePromotionTimer = () => callback(...args);
        return schedule(() => {}, 60_000);
      }
      return schedule(callback, delay, ...args);
    };
    window.qa.holdErrorResponse = false;
    window.qa.releaseErrorResponse();
  });
  await page.waitForFunction(() => window.qa.releasePromotionTimer);
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await stopped(page);
  await accept(page);
  await page.evaluate(() => window.qa.releasePromotionTimer());
  await page.waitForTimeout(5500);
  expect(await page.evaluate(() => window.qa.replay._replay.recordingMode)).toBe('buffer');
  expect(await page.evaluate(() => window.qa.envelopes.filter(([, items]) => items.some(([header]) => header.type === 'replay_event')).length)).toBe(0);
  await page.evaluate(() => window.qa.telemetry.captureException(new Error('FRESH_TIMER_ERROR')));
  await expect.poll(() => page.evaluate(() => window.qa.replay._replay.recordingMode)).toBe('session');
});

test('a queued error is discarded after withdrawal and reaccept', async ({ page }) => {
  await setup(page, 'buffer');
  await accept(page);
  await page.evaluate(() => {
    window.qa.client.addEventProcessor((event) => event.exception?.values?.[0]?.value === 'QUEUED_OLD_ERROR'
      ? new Promise((resolve) => { window.qa.releaseQueuedError = () => resolve(event); })
      : event);
    window.qa.telemetry.captureException(new Error('QUEUED_OLD_ERROR'));
  });
  await page.waitForFunction(() => window.qa.releaseQueuedError);
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await stopped(page);
  await accept(page);
  await page.evaluate(async () => {
    window.qa.releaseQueuedError();
    await window.qa.client.flush();
  });
  await page.waitForTimeout(5500);
  expect(await page.evaluate(() => JSON.stringify(window.qa.envelopes))).not.toContain('QUEUED_OLD_ERROR');
  expect(await page.evaluate(() => window.qa.replay._replay.recordingMode)).toBe('buffer');
  await page.evaluate(() => window.qa.telemetry.captureException(new Error('CURRENT_ERROR')));
  await expect.poll(() => page.evaluate(() => JSON.stringify(window.qa.envelopes))).toContain('CURRENT_ERROR');
  await expect.poll(() => page.evaluate(() => window.qa.replay._replay.recordingMode)).toBe('session');
});
