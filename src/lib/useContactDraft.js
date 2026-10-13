import { useSyncExternalStore } from 'react';
import { readInquiryContext } from './inquiryContext.js';

const emptyFields = () => ({ name: '', email: '', budget: '', description: '' });

// This SPA module lives only in the current browser document. Draft fields are
// never serialized to browser storage and disappear on reload or tab close.
let snapshot = { formState: emptyFields(), inquiryContext: null, generatedDescription: null, submission: null, outcome: null, presentedOutcome: null };
const subscribers = new Set();
let unloadProtected = false;
let feedbackToast = null;
let currentInquiryVisitKey = null;
let submissionInquiryVisitKey = null;
const completedInquiryVisitKeys = new Set();

function warnBeforeUnload(event) {
  event.preventDefault();
  event.returnValue = '';
}

function publish(nextSnapshot) {
  snapshot = nextSnapshot;
  const dirty = Object.entries(snapshot.formState).some(([field, value]) =>
    value !== '' && (field !== 'description' || value !== snapshot.generatedDescription));
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
  publish({ ...snapshot, formState,
    generatedDescription: formState.description === snapshot.formState.description ? snapshot.generatedDescription : null,
    inquiryContext: formState.description === '' ? null : snapshot.inquiryContext,
    outcome: null, presentedOutcome: null,
  });
}

function applyInquiryContext(search, visitKey = null) {
  // Track the contact entry even when a populated draft keeps its earlier
  // context. Back restores a completed entry; a fresh CTA has a new key.
  currentInquiryVisitKey = visitKey;
  if (completedInquiryVisitKeys.has(visitKey)) return;
  if (snapshot.submission || snapshot.formState.description !== '') return;
  const inquiryContext = readInquiryContext(search);
  if (!inquiryContext) return;
  publish({ ...snapshot, inquiryContext, generatedDescription: inquiryContext.description,
    formState: { ...snapshot.formState, description: inquiryContext.description },
    outcome: null, presentedOutcome: null,
  });
}

function beginSubmission() {
  if (snapshot.submission) return null;
  feedbackToast?.dismiss();
  feedbackToast = null;
  const submittedFields = snapshot.formState;
  submissionInquiryVisitKey = currentInquiryVisitKey;
  publish({ ...snapshot, submission: submittedFields, outcome: null, presentedOutcome: null });
  return submittedFields;
}

function finishSubmission(submittedFields, succeeded, errorMessage) {
  if (snapshot.submission !== submittedFields) return;
  if (succeeded && typeof submissionInquiryVisitKey === 'string') {
    completedInquiryVisitKeys.add(submissionInquiryVisitKey);
  }
  submissionInquiryVisitKey = null;
  publish({
    generatedDescription: succeeded && snapshot.formState === submittedFields ? null : snapshot.generatedDescription,
    inquiryContext: succeeded && snapshot.formState === submittedFields ? null : snapshot.inquiryContext,
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
    inquiryContext: state.inquiryContext,
    applyInquiryContext,
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
