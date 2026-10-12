// Focus a section or main without changing the scroll position.
export const focusNavigationTarget = (element) => {
  if (!element) return;

  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1');
    element.addEventListener('blur', () => element.removeAttribute('tabindex'), { once: true });
  }

  element.focus({ preventScroll: true });
};

export const isModifiedClick = (event) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
