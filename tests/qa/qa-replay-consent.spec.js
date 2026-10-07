import { expect, test } from '@playwright/test';

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
