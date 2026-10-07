import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SentryTelemetry from '@/components/SentryTelemetry';
import * as telemetry from '@/lib/sentryTelemetry';
import { saveCookieConsentPreferences } from '@/lib/consent';

window.qa = { telemetry, envelopes: [], recordingEvents: [], sendsPending: [], mode: 'session' };

const listeners = [];
const add = EventTarget.prototype.addEventListener;
const remove = EventTarget.prototype.removeEventListener;
EventTarget.prototype.addEventListener = function (type, listener, options) {
  const capture = typeof options === 'boolean' ? options : Boolean(options?.capture);
  if (!listeners.some((entry) => entry.target === this && entry.type === type && entry.listener === listener && entry.capture === capture)) {
    listeners.push({ target: this, type, listener, capture });
  }
  return add.call(this, type, listener, options);
};
EventTarget.prototype.removeEventListener = function (type, listener, options) {
  const capture = typeof options === 'boolean' ? options : Boolean(options?.capture);
  const index = listeners.findIndex((entry) => entry.target === this && entry.type === type && entry.listener === listener && entry.capture === capture);
  if (index !== -1) listeners.splice(index, 1);
  return remove.call(this, type, listener, options);
};
window.qa.listenerCount = () => listeners.length;
const post = Worker.prototype.postMessage;
Worker.prototype.postMessage = function (message, ...args) {
  if (window.qa.holdWorkerFinish && message.method === 'finish') {
    window.qa.releaseWorker = () => post.call(this, message, ...args);
    return;
  }
  return post.call(this, message, ...args);
};

function Fixture() {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('Stopped');
  useEffect(() => {
    const timer = setInterval(() => setStatus(window.qa.replay?.getReplayId() ? 'Recording' : 'Stopped'), 100);
    return () => clearInterval(timer);
  }, []);
  const choose = (analytics) => {
    saveCookieConsentPreferences({ analytics });
    setConsent(analytics);
  };
  return <>
    <SentryTelemetry hasConsent={consent} />
    <button onClick={() => choose(true)}>Accept</button>
    <button onClick={() => choose(false)}>Withdraw</button>
    <button onClick={() => window.qa.releaseSdk?.()}>Release SDK</button>
    <p role="status">{status}</p>
    <button onClick={() => { document.querySelector('#activity').textContent += ' activity'; }}>Interact</button>
    <p id="activity">MASKED_PUBLIC_TEXT</p>
    <input aria-label="Public input" defaultValue="MASKED_PUBLIC_INPUT" />
    <form data-sensitive-telemetry="true">
      <p>BLOCKED_CONTACT_TEXT</p>
      <input aria-label="Contact input" defaultValue="BLOCKED_CONTACT_INPUT" />
    </form>
  </>;
}

createRoot(document.getElementById('root')).render(<Fixture />);
