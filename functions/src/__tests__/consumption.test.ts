import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allocateFifoConsumption,
  calculateConsumptionCost,
  isValidUsageCategory,
} from '../consumption/types';

test('calculateConsumptionCost multiplies quantity by unit cost', () => {
  assert.equal(calculateConsumptionCost(2.5, 4), 10);
  assert.equal(calculateConsumptionCost(3, 1.5), 4.5);
});

test('calculateConsumptionCost rejects non-positive inputs', () => {
  assert.equal(calculateConsumptionCost(0, 5), 0);
  assert.equal(calculateConsumptionCost(-1, 5), 0);
  assert.equal(calculateConsumptionCost(2, -1), 0);
});

test('isValidUsageCategory accepts allowed categories only', () => {
  assert.equal(isValidUsageCategory('Breakfast'), true);
  assert.equal(isValidUsageCategory('Kitchen Use'), true);
  assert.equal(isValidUsageCategory('Spoiled'), false);
});

test('allocateFifoConsumption splits across oldest batches', () => {
  const allocations = allocateFifoConsumption(
    [
      {
        id: 'a',
        quantity: 2,
        unitCost: 1,
        ingredientName: 'Tomato',
        unit: 'kg',
        dateReceived: '2026-07-01',
        createdAt: '2026-07-01T00:00:00.000Z',
        consumed: false,
        archived: false,
        expiryDate: '2026-08-01',
      },
      {
        id: 'b',
        quantity: 5,
        unitCost: 1,
        ingredientName: 'Tomato',
        unit: 'kg',
        dateReceived: '2026-07-05',
        createdAt: '2026-07-05T00:00:00.000Z',
        consumed: false,
        archived: false,
        expiryDate: '2026-08-01',
      },
    ],
    3,
  );

  assert.deepEqual(
    allocations.map((item) => ({ batchId: item.batchId, quantityUsed: item.quantityUsed })),
    [
      { batchId: 'a', quantityUsed: 2 },
      { batchId: 'b', quantityUsed: 1 },
    ],
  );
});

test('allocateFifoConsumption rejects over-allocation', () => {
  assert.throws(() =>
    allocateFifoConsumption(
      [
        {
          id: 'a',
          quantity: 1,
          unitCost: 1,
          ingredientName: 'Tomato',
          unit: 'kg',
          dateReceived: '2026-07-01',
          createdAt: '2026-07-01T00:00:00.000Z',
          consumed: false,
          archived: false,
          expiryDate: '2026-08-01',
        },
      ],
      2,
    ),
  );
});
