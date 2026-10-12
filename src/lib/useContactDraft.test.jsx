/** @vitest-environment jsdom */
import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useContactDraft } from './useContactDraft';

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
