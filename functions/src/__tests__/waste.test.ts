import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertWasteQuantity,
  calculateCostLoss,
  isValidWasteReason,
} from '../waste/types';

test('calculateCostLoss multiplies quantity by unit cost', () => {
  assert.equal(calculateCostLoss(2.5, 4), 10);
  assert.equal(calculateCostLoss(3, 1.5), 4.5);
});

test('calculateCostLoss rejects non-positive inputs', () => {
  assert.equal(calculateCostLoss(0, 5), 0);
  assert.equal(calculateCostLoss(-1, 5), 0);
  assert.equal(calculateCostLoss(2, -1), 0);
});

test('assertWasteQuantity enforces remaining stock', () => {
  assert.doesNotThrow(() => assertWasteQuantity(2, 5));
  assert.throws(() => assertWasteQuantity(0, 5));
  assert.throws(() => assertWasteQuantity(6, 5));
});

test('isValidWasteReason accepts allowed reasons only', () => {
  assert.equal(isValidWasteReason('Expired'), true);
  assert.equal(isValidWasteReason('Burnt'), true);
  assert.equal(isValidWasteReason('Prep Waste'), true);
  assert.equal(isValidWasteReason('Leftovers'), true);
  assert.equal(isValidWasteReason('Spoiled'), false);
});
