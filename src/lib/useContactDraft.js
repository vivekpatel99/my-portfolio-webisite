import { useSyncExternalStore } from 'react';

const emptyFields = () => ({ name: '', email: '', budget: '', description: '' });

// This SPA module lives only in the current browser document. Draft fields are
// never serialized to browser storage and disappear on reload or tab close.
let snapshot = { formState: emptyFields(), submission: null };
const subscribers = new Set();
let unloadProtected = false;

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
  publish({ ...snapshot, formState });
}

function beginSubmission() {
  if (snapshot.submission) return null;
  const submittedFields = snapshot.formState;
  publish({ ...snapshot, submission: submittedFields });
  return submittedFields;
}

function finishSubmission(submittedFields, succeeded) {
  if (snapshot.submission !== submittedFields) return;
  publish({
    formState: succeeded && snapshot.formState === submittedFields
      ? emptyFields()
      : snapshot.formState,
    submission: null,
  });
}

export function useContactDraft() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  return {
    formState: state.formState,
    isSubmitting: state.submission !== null,
    setFormState,
    beginSubmission,
    finishSubmission,
  };
}
