/** @vitest-environment jsdom */
import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useContactDraft } from './useContactDraft';
import { registerInquiryAnalytics } from './inquiryAnalytics';
import { saveCookieConsentPreferences } from './consent';

const emptyFields = { name: '', email: '', budget: '', description: '' };
const filledFields = {
  name: 'Synthetic QA Contact',
  email: 'qa-contact@example.invalid',
  budget: '€5k-€10k',
  description: 'First line\nSecond line',
};

function unloadIsPrevented() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

beforeEach(() => {
  const draft = renderHook(() => useContactDraft());
  act(() => draft.result.current.setFormState(emptyFields));
  draft.unmount();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('tab-memory contact draft', () => {
  it('seeds an editable public context once, preserves other fields, and retains it across remounts', () => {
    const first = renderHook(() => useContactDraft());
    act(() => first.result.current.setFormState({ ...emptyFields, name: 'Already entered', budget: '€5k-€10k' }));
    act(() => first.result.current.applyInquiryContext('?service=ai-workflow-buildout'));
    expect(first.result.current.formState).toEqual({ ...emptyFields, name: 'Already entered', budget: '€5k-€10k', description: "I'd like to discuss AI Workflow Buildout." });
    act(() => first.result.current.applyInquiryContext('?service=data-extraction-automation-sprint'));
    expect(first.result.current.inquiryContext.id).toBe('ai-workflow-buildout');
    first.unmount();
    const returned = renderHook(() => useContactDraft());
    expect(returned.result.current.inquiryContext.id).toBe('ai-workflow-buildout');
    act(() => returned.result.current.setFormState(fields => ({ ...fields, description: 'My own editable inquiry' })));
    expect(returned.result.current.formState.description).toBe('My own editable inquiry');
  });

  it('warns before unload only after the visitor adds or edits data beyond an untouched seed', () => {
    const draft = renderHook(() => useContactDraft());
    act(() => draft.result.current.applyInquiryContext('?service=ai-workflow-buildout', 'untouched-seed'));
    const seed = draft.result.current.formState.description;
    expect(unloadIsPrevented()).toBe(false);
    act(() => draft.result.current.setFormState(fields => ({ ...fields, name: 'Private visitor input' })));
    expect(unloadIsPrevented()).toBe(true);
    act(() => draft.result.current.setFormState(fields => ({ ...fields, name: '' })));
    expect(unloadIsPrevented()).toBe(false);
    act(() => draft.result.current.setFormState(fields => ({ ...fields, description: `${seed} My own details.` })));
    expect(unloadIsPrevented()).toBe(true);
    act(() => draft.result.current.setFormState(fields => ({ ...fields, description: seed })));
    expect(unloadIsPrevented()).toBe(true);
    act(() => draft.result.current.setFormState(emptyFields));
    expect(unloadIsPrevented()).toBe(false);
  });

  it('never overwrites a populated or pending inquiry, and clears context only on success', () => {
    const draft = renderHook(() => useContactDraft());
    act(() => draft.result.current.setFormState(filledFields));
    act(() => draft.result.current.applyInquiryContext('?service=ai-workflow-buildout'));
    expect(draft.result.current.formState).toEqual(filledFields);
    expect(draft.result.current.inquiryContext).toBeNull();
    act(() => draft.result.current.setFormState(emptyFields));
    act(() => draft.result.current.applyInquiryContext('?service=ai-workflow-buildout'));
    let submission;
    act(() => { submission = draft.result.current.beginSubmission(); });
    act(() => draft.result.current.applyInquiryContext('?service=data-extraction-automation-sprint'));
    expect(draft.result.current.inquiryContext.id).toBe('ai-workflow-buildout');
    act(() => draft.result.current.finishSubmission(submission, false, 'Synthetic failure'));
    expect(draft.result.current.inquiryContext.id).toBe('ai-workflow-buildout');
    act(() => { submission = draft.result.current.beginSubmission(); });
    act(() => draft.result.current.finishSubmission(submission, true));
    expect(draft.result.current.inquiryContext).toBeNull();
  });

  it('keeps a completed contact history entry blank but seeds a fresh same-item CTA', () => {
    const draft = renderHook(() => useContactDraft());
    act(() => draft.result.current.applyInquiryContext('?service=ai-workflow-buildout', 'first-visit'));
    let submission;
    act(() => { submission = draft.result.current.beginSubmission(); });
    act(() => draft.result.current.finishSubmission(submission, true));
    act(() => draft.result.current.applyInquiryContext('?service=ai-workflow-buildout', 'first-visit'));
    expect(draft.result.current.formState).toEqual(emptyFields);
    expect(draft.result.current.outcome.status).toBe('success');
    act(() => draft.result.current.applyInquiryContext('?service=ai-workflow-buildout', 'new-visit'));
    expect(draft.result.current.inquiryContext.id).toBe('ai-workflow-buildout');
    expect(draft.result.current.formState.description).toBe("I'd like to discuss AI Workflow Buildout.");
    expect(draft.result.current.outcome).toBeNull();
  });

  it('retains completion markers for both earlier and later successful contact entries', () => {
    const draft = renderHook(() => useContactDraft());
    let submission;
    act(() => draft.result.current.applyInquiryContext('?service=ai-workflow-buildout', 'completed-A'));
    act(() => { submission = draft.result.current.beginSubmission(); });
    act(() => draft.result.current.finishSubmission(submission, true));
    act(() => draft.result.current.applyInquiryContext('?service=data-extraction-automation-sprint', 'completed-B'));
    act(() => { submission = draft.result.current.beginSubmission(); });
    act(() => draft.result.current.finishSubmission(submission, true));
    for (const [search, key] of [['?service=ai-workflow-buildout', 'completed-A'], ['?service=data-extraction-automation-sprint', 'completed-B']]) {
      act(() => draft.result.current.applyInquiryContext(search, key));
      expect(draft.result.current.formState).toEqual(emptyFields);
      expect(draft.result.current.inquiryContext).toBeNull();
      expect(draft.result.current.outcome.status).toBe('success');
    }
  });

  it('binds completion to the contact entry that started the pending submission', () => {
    const draft = renderHook(() => useContactDraft());
    act(() => draft.result.current.applyInquiryContext('?service=ai-workflow-buildout', 'pending-origin'));
    let submission;
    act(() => { submission = draft.result.current.beginSubmission(); });
    act(() => draft.result.current.applyInquiryContext('?service=data-extraction-automation-sprint', 'pending-other-cta'));
    act(() => draft.result.current.finishSubmission(submission, true));
    act(() => draft.result.current.applyInquiryContext('?service=ai-workflow-buildout', 'pending-origin'));
    expect(draft.result.current.formState).toEqual(emptyFields);
    expect(draft.result.current.outcome.status).toBe('success');
    act(() => draft.result.current.applyInquiryContext('?service=data-extraction-automation-sprint', 'pending-other-cta'));
    expect(draft.result.current.inquiryContext.id).toBe('data-extraction-automation-sprint');
  });

  it.each(['unsent', 'failed'])('preserves a later %s draft and its feedback when returning to an earlier completed entry', (status) => {
    const draft = renderHook(() => useContactDraft());
    const completedKey = `earlier-completed-${status}`;
    act(() => draft.result.current.applyInquiryContext('?service=ai-workflow-buildout', completedKey));
    let submission;
    act(() => { submission = draft.result.current.beginSubmission(); });
    act(() => draft.result.current.finishSubmission(submission, true));
    act(() => draft.result.current.applyInquiryContext('?service=data-extraction-automation-sprint', `later-${status}`));
    act(() => draft.result.current.setFormState(filledFields));
    if (status === 'failed') {
      act(() => { submission = draft.result.current.beginSubmission(); });
      act(() => draft.result.current.finishSubmission(submission, false, 'Synthetic retry feedback'));
    }
    const outcome = draft.result.current.outcome;
    act(() => draft.result.current.applyInquiryContext('?service=ai-workflow-buildout', completedKey));
    expect(draft.result.current.formState).toEqual(filledFields);
    expect(draft.result.current.inquiryContext.id).toBe('data-extraction-automation-sprint');
    expect(draft.result.current.outcome).toBe(outcome);
    expect(unloadIsPrevented()).toBe(true);
  });

  it('keeps one unload listener across StrictMode subscription cleanup and route remounts', () => {
    const addListener = vi.spyOn(window, 'addEventListener');
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const wrapper = ({ children }) => <React.StrictMode>{children}</React.StrictMode>;
    const first = renderHook(() => useContactDraft(), { wrapper });
    act(() => first.result.current.setFormState(filledFields));
    act(() => first.result.current.setFormState((fields) => ({ ...fields, name: 'Edited' })));
    first.unmount();
    expect(unloadIsPrevented()).toBe(true);

    const returned = renderHook(() => useContactDraft(), { wrapper });
    expect(returned.result.current.formState).toEqual({ ...filledFields, name: 'Edited' });
    expect(addListener.mock.calls.filter(([type]) => type === 'beforeunload')).toHaveLength(1);
    expect(removeListener.mock.calls.filter(([type]) => type === 'beforeunload')).toHaveLength(0);
    act(() => returned.result.current.setFormState(emptyFields));
    expect(unloadIsPrevented()).toBe(false);
    expect(removeListener.mock.calls.filter(([type]) => type === 'beforeunload')).toHaveLength(1);
  });

  it.each(Object.keys(emptyFields))('warns for %s alone and stops when its last character is cleared', (field) => {
    const draft = renderHook(() => useContactDraft());
    act(() => draft.result.current.setFormState({ ...emptyFields, [field]: ' ' }));
    expect(unloadIsPrevented()).toBe(true);
    act(() => draft.result.current.setFormState(emptyFields));
    expect(unloadIsPrevented()).toBe(false);
  });

  it('never reads or writes draft PII in localStorage or sessionStorage', () => {
    const read = vi.spyOn(Storage.prototype, 'getItem');
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const first = renderHook(() => useContactDraft());
    act(() => first.result.current.setFormState(filledFields));
    first.unmount();
    const returned = renderHook(() => useContactDraft());
    expect(returned.result.current.formState).toEqual(filledFields);
    let submission;
    act(() => { submission = returned.result.current.beginSubmission(); });
    act(() => returned.result.current.finishSubmission(submission, true));
    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it.each(Object.keys(emptyFields))('dismisses prior failure feedback when editing %s starts a new draft', (field) => {
    const draft = renderHook(() => useContactDraft());
    act(() => draft.result.current.setFormState(filledFields));
    let submission;
    act(() => { submission = draft.result.current.beginSubmission(); });
    const handle = { dismiss: vi.fn() };
    draft.result.current.setFeedbackToast(handle);
    act(() => draft.result.current.finishSubmission(submission, false, 'Synthetic failure'));
    act(() => draft.result.current.setFormState((fields) => ({ ...fields, [field]: 'New draft' })));
    expect(draft.result.current.outcome).toBeNull();
    expect(handle.dismiss).toHaveBeenCalledTimes(1);
    act(() => { submission = draft.result.current.beginSubmission(); });
    expect(handle.dismiss).toHaveBeenCalledTimes(1);
    act(() => draft.result.current.finishSubmission(submission, true));
  });

  it('does not let a stale completion clear a later draft or release a later pending send', () => {
    const draft = renderHook(() => useContactDraft());
    act(() => draft.result.current.setFormState(filledFields));
    let firstSubmission;
    act(() => { firstSubmission = draft.result.current.beginSubmission(); });
    act(() => draft.result.current.setFormState({ ...filledFields, description: 'New draft' }));
    act(() => draft.result.current.finishSubmission(firstSubmission, true));
    expect(draft.result.current.formState.description).toBe('New draft');
    expect(draft.result.current.outcome).toBeNull();
    expect(unloadIsPrevented()).toBe(true);

    let nextSubmission;
    act(() => { nextSubmission = draft.result.current.beginSubmission(); });
    act(() => draft.result.current.finishSubmission(firstSubmission, true));
    expect(draft.result.current.isSubmitting).toBe(true);
    act(() => draft.result.current.finishSubmission(nextSubmission, true));
    expect(draft.result.current.formState).toEqual(emptyFields);
    expect(draft.result.current.outcome.status).toBe('success');
    act(() => draft.result.current.setFormState({ ...emptyFields, name: 'Next draft' }));
    expect(draft.result.current.outcome).toBeNull();
    act(() => draft.result.current.setFormState(emptyFields));
    expect(unloadIsPrevented()).toBe(false);
  });
});

describe('accepted inquiry measurement at the draft lifecycle boundary', () => {
  let send;
  let unregister;
  beforeEach(() => {
    saveCookieConsentPreferences({ analytics: true });
    send = vi.fn();
    window.gtag = send;
    unregister = registerInquiryAnalytics('G-SYNTHETIC');
  });
  afterEach(() => {
    unregister();
    window.gtag = undefined;
    localStorage.clear();
  });

  it('captures original public context, emits once after acceptance away from Contact, and never replays on remount', () => {
    const first = renderHook(() => useContactDraft());
    act(() => first.result.current.applyInquiryContext('?service=ai-workflow-buildout', 'measurement-origin'));
    act(() => first.result.current.setFormState(filledFields));
    let submission;
    act(() => { submission = first.result.current.beginSubmission(); });
    expect(send).not.toHaveBeenCalled();
    act(() => first.result.current.applyInquiryContext('?service=data-extraction-automation-sprint', 'measurement-pending-other'));
    const finish = first.result.current.finishSubmission;
    first.unmount();
    act(() => finish(submission, true));
    act(() => finish(submission, true));
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]).toEqual(['event', 'generate_lead', expect.objectContaining({ inquiry_id: 'ai-workflow-buildout', inquiry_type: 'service' })]);
    expect(JSON.stringify(send.mock.calls)).not.toContain(filledFields.name);
    expect(JSON.stringify(send.mock.calls)).not.toContain(filledFields.email);
    expect(JSON.stringify(send.mock.calls)).not.toContain('First line');
    const returned = renderHook(() => useContactDraft());
    act(() => returned.result.current.claimOutcomePresentation(returned.result.current.outcome));
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('emits none for pending, duplicate begin or failure, then one for each accepted retry or new send', () => {
    const draft = renderHook(() => useContactDraft());
    act(() => draft.result.current.setFormState(filledFields));
    let failed;
    act(() => { failed = draft.result.current.beginSubmission(); });
    act(() => { expect(draft.result.current.beginSubmission()).toBeNull(); });
    expect(send).not.toHaveBeenCalled();
    act(() => draft.result.current.finishSubmission(failed, false, 'Synthetic safe error'));
    expect(send).not.toHaveBeenCalled();
    for (let index = 0; index < 2; index += 1) {
      act(() => draft.result.current.setFormState({ ...filledFields }));
      let accepted;
      act(() => { accepted = draft.result.current.beginSubmission(); });
      act(() => draft.result.current.finishSubmission(failed, true));
      expect(send).toHaveBeenCalledTimes(index);
      act(() => draft.result.current.finishSubmission(accepted, true));
      expect(send).toHaveBeenCalledTimes(index + 1);
    }
  });

  it('still clears accepted fields and exposes the receipt when the analytics transport throws', () => {
    send.mockImplementation(() => { throw new Error('PRIVATE_TELEMETRY_ERROR'); });
    const draft = renderHook(() => useContactDraft());
    act(() => draft.result.current.setFormState(filledFields));
    let submission;
    act(() => { submission = draft.result.current.beginSubmission(); });
    act(() => draft.result.current.finishSubmission(submission, true));
    expect(draft.result.current.formState).toEqual(emptyFields);
    expect(draft.result.current.outcome.status).toBe('success');
    expect(draft.result.current.isSubmitting).toBe(false);
  });
});
