export const createMediaQueryList = (mediaWindow, query) => {
  if (!mediaWindow || typeof mediaWindow.matchMedia !== 'function') {
    return null;
  }

  return mediaWindow.matchMedia(query);
};

export const subscribeMediaQuery = (query, listener) => {
  if (!query) {
    return () => {};
  }

  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', listener);
    return () => query.removeEventListener?.('change', listener);
  }

  if (typeof query.addListener === 'function') {
    query.addListener(listener);
    return () => query.removeListener?.(listener);
  }

  return () => {};
};

export const shouldMountCustomCursor = ({ hasFinePointer, prefersReducedMotion }) => {
  return hasFinePointer && !prefersReducedMotion;
};
