import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createMediaQueryList,
  shouldMountCustomCursor,
  subscribeMediaQuery,
} from './customCursor.js';

test('returns null when matchMedia is unavailable', () => {
  assert.equal(createMediaQueryList(undefined, '(pointer: fine)'), null);
  assert.equal(createMediaQueryList({}, '(pointer: fine)'), null);
  assert.equal(createMediaQueryList({ matchMedia: null }, '(pointer: fine)'), null);
});

test('subscribes and cleans up modern media query listeners', () => {
  let addedType;
  let addedListener;
  let removedType;
  let removedListener;
  const query = {
    addEventListener(type, listener) {
      addedType = type;
      addedListener = listener;
    },
    removeEventListener(type, listener) {
      removedType = type;
      removedListener = listener;
    },
  };
  const listener = () => {};

  const cleanup = subscribeMediaQuery(query, listener);
  cleanup();

  assert.equal(addedType, 'change');
  assert.equal(addedListener, listener);
  assert.equal(removedType, 'change');
  assert.equal(removedListener, listener);
});

test('subscribes and cleans up legacy media query listeners', () => {
  let addedListener;
  let removedListener;
  const query = {
    addListener(listener) {
      addedListener = listener;
    },
    removeListener(listener) {
      removedListener = listener;
    },
  };
  const listener = () => {};

  const cleanup = subscribeMediaQuery(query, listener);
  cleanup();

  assert.equal(addedListener, listener);
  assert.equal(removedListener, listener);
});

test('mounts custom cursor only for fine pointers without reduced motion', () => {
  assert.equal(
    shouldMountCustomCursor({ hasFinePointer: true, prefersReducedMotion: false }),
    true
  );
  assert.equal(
    shouldMountCustomCursor({ hasFinePointer: false, prefersReducedMotion: false }),
    false
  );
  assert.equal(
    shouldMountCustomCursor({ hasFinePointer: true, prefersReducedMotion: true }),
    false
  );
});
