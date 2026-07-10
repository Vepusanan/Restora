import {
  allocateFifoConsumption,
  totalAvailableForConsumption,
} from '@utils/fifoAllocation';
import {
  calculateConsumptionCost,
  filterUsageLogs,
  isValidUsageCategory,
  rankTopConsumedIngredients,
  summarizeUsageLogs,
} from '@utils/consumption';
import type { InventoryUsageLog } from '@/types';

function batch(
  overrides: Partial<Parameters<typeof allocateFifoConsumption>[0][number]> & { id: string },
) {
  return {
    quantity: 5,
    unitCost: 2,
    ingredientName: 'Tomato',
    unit: 'kg' as const,
    dateReceived: '2026-07-01',
    createdAt: '2026-07-01T10:00:00.000Z',
    consumed: false,
    archived: false,
    expiryDate: '2026-08-01',
    ...overrides,
  };
}

describe('FIFO consumption allocation', () => {
  it('allocates oldest batches first across multiple batches', () => {
    const allocations = allocateFifoConsumption(
      [
        batch({
          id: 'a',
          quantity: 2,
          dateReceived: '2026-07-01',
          createdAt: '2026-07-01T08:00:00.000Z',
        }),
        batch({
          id: 'b',
          quantity: 5,
          dateReceived: '2026-07-05',
          createdAt: '2026-07-05T08:00:00.000Z',
        }),
      ],
      3,
    );

    expect(allocations).toHaveLength(2);
    expect(allocations[0]).toMatchObject({ batchId: 'a', quantityUsed: 2, remainingAfter: 0 });
    expect(allocations[1]).toMatchObject({ batchId: 'b', quantityUsed: 1, remainingAfter: 4 });
  });

  it('rejects quantity greater than available stock', () => {
    expect(() =>
      allocateFifoConsumption(
        [batch({ id: 'a', quantity: 2 }), batch({ id: 'b', quantity: 1 })],
        4,
      ),
    ).toThrow(/Only 3 remaining/);
  });

  it('rejects zero and negative quantities', () => {
    expect(() => allocateFifoConsumption([batch({ id: 'a' })], 0)).toThrow();
    expect(() => allocateFifoConsumption([batch({ id: 'a' })], -1)).toThrow();
  });

  it('skips consumed and archived batches', () => {
    expect(() =>
      allocateFifoConsumption(
        [
          batch({ id: 'a', quantity: 10, consumed: true }),
          batch({ id: 'b', quantity: 10, archived: true }),
        ],
        1,
      ),
    ).toThrow();
  });

  it('supports manual batch override', () => {
    const allocations = allocateFifoConsumption(
      [
        batch({ id: 'a', quantity: 2, dateReceived: '2026-07-01' }),
        batch({ id: 'b', quantity: 5, dateReceived: '2026-07-05' }),
      ],
      3,
      { batchId: 'b' },
    );
    expect(allocations).toHaveLength(1);
    expect(allocations[0]).toMatchObject({ batchId: 'b', quantityUsed: 3 });
  });

  it('excludes expired batches by default', () => {
    const expired = batch({
      id: 'old',
      quantity: 4,
      expiryDate: '2026-01-01',
      dateReceived: '2025-12-01',
    });
    const fresh = batch({ id: 'new', quantity: 4, dateReceived: '2026-07-01' });
    const now = new Date('2026-07-10');

    expect(totalAvailableForConsumption([expired, fresh], { now })).toBe(4);
    expect(() => allocateFifoConsumption([expired, fresh], 5, { now })).toThrow();

    const withExpired = allocateFifoConsumption([expired, fresh], 5, {
      allowExpired: true,
      now,
    });
    expect(withExpired[0]?.batchId).toBe('old');
  });
});

describe('consumption analytics helpers', () => {
  function usage(overrides: Partial<InventoryUsageLog>): InventoryUsageLog {
    return {
      id: 'u1',
      restaurantId: 'r1',
      batchId: 'b1',
      ingredientName: 'Chicken',
      ingredientKey: 'chicken',
      quantityUsed: 2,
      unit: 'kg',
      category: 'Lunch',
      notes: '',
      unitCost: 5,
      consumptionCost: 10,
      usedBy: 'user1',
      usedByName: 'Chef',
      usedAt: '2026-07-10T12:00:00.000Z',
      voided: false,
      voidedAt: null,
      voidedBy: null,
      usageGroupId: 'g1',
      createdAt: '2026-07-10T12:00:00.000Z',
      updatedAt: '2026-07-10T12:00:00.000Z',
      ...overrides,
    };
  }

  it('calculates consumption cost', () => {
    expect(calculateConsumptionCost(2.5, 4)).toBe(10);
    expect(calculateConsumptionCost(0, 4)).toBe(0);
  });

  it('validates usage categories', () => {
    expect(isValidUsageCategory('Breakfast')).toBe(true);
    expect(isValidUsageCategory('Expired')).toBe(false);
  });

  it('summarizes active usage only', () => {
    const summary = summarizeUsageLogs([
      usage({ id: '1', consumptionCost: 10, quantityUsed: 2 }),
      usage({ id: '2', voided: true, consumptionCost: 50, quantityUsed: 9 }),
    ]);
    expect(summary).toMatchObject({
      activeEvents: 1,
      voidedEvents: 1,
      totalConsumptionCost: 10,
      quantityUsed: 2,
    });
  });

  it('filters by category and date range', () => {
    const filtered = filterUsageLogs(
      [
        usage({ id: '1', category: 'Breakfast', usedAt: '2026-07-01T10:00:00.000Z' }),
        usage({ id: '2', category: 'Dinner', usedAt: '2026-07-10T10:00:00.000Z' }),
      ],
      {
        search: '',
        category: 'Dinner',
        usedBy: null,
        batchId: null,
        ingredientKey: null,
        visibility: 'active',
        dateFrom: '2026-07-05',
        dateTo: '2026-07-15',
      },
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('2');
  });

  it('ranks top consumed ingredients excluding voided', () => {
    const ranked = rankTopConsumedIngredients(
      [
        usage({
          id: '1',
          ingredientName: 'Chicken',
          ingredientKey: 'chicken',
          consumptionCost: 30,
          quantityUsed: 3,
        }),
        usage({
          id: '2',
          ingredientName: 'Tomato',
          ingredientKey: 'tomato',
          consumptionCost: 10,
          quantityUsed: 5,
        }),
        usage({
          id: '3',
          ingredientName: 'Chicken',
          ingredientKey: 'chicken',
          consumptionCost: 20,
          quantityUsed: 2,
          voided: true,
        }),
      ],
      { startDate: '2026-07-01', endDate: '2026-07-31' },
      5,
    );

    expect(ranked[0]).toMatchObject({ ingredientKey: 'chicken', totalCost: 30, rank: 1 });
  });
});
