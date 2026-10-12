import { useSyncExternalStore } from 'react';

const emptyFields = () => ({ name: '', email: '', budget: '', description: '' });

// This SPA module lives only in the current browser document. Draft fields are
// never serialized to browser storage and disappear on reload or tab close.
let snapshot = { formState: emptyFields(), submission: null, outcome: null, presentedOutcome: null };
const subscribers = new Set();
let unloadProtected = false;
let feedbackToast = null;

function warnBeforeUnload(event) {
  event.preventDefault();
  event.returnValue = '';
}

function publish(nextSnapshot) {
  snapshot = nextSnapshot;
  const dirty = Object.values(snapshot.formState).some((value) => value !== '');
  if (typeof window !== 'undefined' && dirty !== unloadProtected) {
    if (dirty) window.addEventListener('beforeunload', warnBeforeUnload);
    else window.removeEventListener('beforeunload', warnBeforeUnload);
    unloadProtected = dirty;
  }
  subscribers.forEach((notify) => notify());
}

function subscribe(notify) {
  subscribers.add(notify);
  // Keep unload protection when Contact unmounts: its unsent draft still lives
  // in memory and would be lost if the visitor reloads from another route.
  return () => subscribers.delete(notify);
}

const getSnapshot = () => snapshot;

function setFormState(update) {
  const formState = typeof update === 'function' ? update(snapshot.formState) : update;
  if (snapshot.outcome) {
    feedbackToast?.dismiss();
    feedbackToast = null;
  }
  publish({ ...snapshot, formState, outcome: null, presentedOutcome: null });
}

function beginSubmission() {
  if (snapshot.submission) return null;
  feedbackToast?.dismiss();
  feedbackToast = null;
  const submittedFields = snapshot.formState;
  publish({ ...snapshot, submission: submittedFields, outcome: null, presentedOutcome: null });
  return submittedFields;
}

function finishSubmission(submittedFields, succeeded, errorMessage) {
  if (snapshot.submission !== submittedFields) return;
  publish({
    formState: succeeded && snapshot.formState === submittedFields
      ? emptyFields()
      : snapshot.formState,
    submission: null,
    presentedOutcome: null,
    outcome: snapshot.formState === submittedFields
      ? { status: succeeded ? 'success' : 'error', errorMessage }
      : null,
  });
}

function setFeedbackToast(handle) {
  feedbackToast = handle;
}

function claimOutcomePresentation(outcome) {
  if (!outcome || snapshot.outcome !== outcome || snapshot.presentedOutcome === outcome) return false;
  publish({ ...snapshot, presentedOutcome: outcome });
  return true;
}

export function useContactDraft() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  return {
    formState: state.formState,
    outcome: state.outcome,
    hasUnpresentedOutcome: state.outcome !== state.presentedOutcome,
    claimOutcomePresentation,
    setFeedbackToast,
    isSubmitting: state.submission !== null,
    setFormState,
    beginSubmission,
    finishSubmission,
  };
}
