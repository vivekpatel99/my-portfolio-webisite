import assert from 'node:assert/strict';
import test from 'node:test';

import { formatTickerValue } from './Stats.jsx';

test('formats integer ticker values without decimals', () => {
  assert.equal(formatTickerValue(11, 0.4), '4');
  assert.equal(formatTickerValue(11, 1), '11');
});

test('preserves decimal precision and clamps final ticker value', () => {
  assert.equal(formatTickerValue(4.9, 1), '4.9');
  assert.equal(formatTickerValue(99.9, 2), '99.9');
  assert.equal(formatTickerValue(99.9, 1.2), '99.9');
});
