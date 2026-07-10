import {
  calculateIngredientCost,
  calculateInventoryValuation,
  calculateWasteLoss,
  formatMoney,
  getReceivedQuantity,
} from '../src/utils/financial';
import { canAccessModule } from '../src/utils/rbac';
import type { InventoryBatch, WasteLog } from '../src/types';
import { ingredientKey } from '../src/utils/expiry';

function makeBatch(
  partial: Partial<InventoryBatch> &
    Pick<InventoryBatch, 'id' | 'ingredientName' | 'quantity' | 'unitCost' | 'dateReceived' | 'expiryDate'>,
): InventoryBatch {
  return {
    restaurantId: 'r1',
    ingredientKey: ingredientKey(partial.ingredientName),
    unit: 'kg',
    supplier: 'Fresh Co',
    consumed: false,
    archived: false,
    consumedAt: null,
    consumedBy: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'u1',
    lastModifiedAt: '2026-01-01T00:00:00.000Z',
    lastModifiedBy: 'u1',
    evaluatedTone: null,
    lastNotifiedTone: null,
    lastNotifiedAt: null,
    lastEvaluatedAt: null,
    ...partial,
  };
}

function makeWaste(partial: Partial<WasteLog> & Pick<WasteLog, 'id'>): WasteLog {
  return {
    restaurantId: 'r1',
    batchId: 'b1',
    ingredientName: 'Tomato',
    ingredientKey: 'tomato',
    quantityWasted: 2,
    unit: 'kg',
    wasteReason: 'Expired',
    unitCost: 300,
    costLoss: 600,
    loggedBy: 'u1',
    loggedByName: 'Alex',
    timestamp: '2026-07-10T10:00:00.000Z',
    voided: false,
    voidedAt: null,
    voidedBy: null,
    createdAt: '2026-07-10T10:00:00.000Z',
    updatedAt: '2026-07-10T10:00:00.000Z',
    ...partial,
  };
}

describe('FR-032 inventory valuation', () => {
  const now = new Date(2026, 6, 10);

  const batches = [
    makeBatch({
      id: 'a',
      ingredientName: 'Tomato',
      quantity: 10,
      unitCost: 500,
      dateReceived: '2026-07-01',
      expiryDate: '2026-07-20',
    }),
    makeBatch({
      id: 'b',
      ingredientName: 'Onion',
      quantity: 5,
      unitCost: 300,
      dateReceived: '2026-07-01',
      expiryDate: '2026-07-20',
    }),
    makeBatch({
      id: 'expired',
      ingredientName: 'Milk',
      quantity: 4,
      unitCost: 100,
      dateReceived: '2026-06-01',
      expiryDate: '2026-07-01',
    }),
    makeBatch({
      id: 'consumed',
      ingredientName: 'Rice',
      quantity: 8,
      unitCost: 50,
      dateReceived: '2026-07-01',
      expiryDate: '2026-07-20',
      consumed: true,
    }),
    makeBatch({
      id: 'archived',
      ingredientName: 'Oil',
      quantity: 2,
      unitCost: 200,
      dateReceived: '2026-07-01',
      expiryDate: '2026-07-20',
      archived: true,
    }),
  ];

  it('sums remaining quantity × unit cost for active non-expired batches', () => {
    const result = calculateInventoryValuation(batches, now);
    expect(result.totalValue).toBe(6500);
    expect(result.batchCount).toBe(2);
    expect(formatMoney(result.totalValue)).toBe('$6500.00');
  });

  it('excludes expired, consumed, and archived batches', () => {
    const result = calculateInventoryValuation(batches, now);
    expect(result.excludedExpired).toBe(1);
    expect(result.excludedConsumed).toBe(1);
    expect(result.excludedArchived).toBe(1);
  });
});

describe('FR-033 ingredient cost by date range', () => {
  const batches = [
    makeBatch({
      id: 't1',
      ingredientName: 'Tomatoes',
      quantity: 18,
      unitCost: 300,
      dateReceived: '2026-01-05',
      expiryDate: '2026-02-01',
    }),
    makeBatch({
      id: 't2',
      ingredientName: 'Tomatoes',
      quantity: 10,
      unitCost: 350,
      dateReceived: '2026-01-20',
      expiryDate: '2026-02-10',
    }),
    makeBatch({
      id: 'out',
      ingredientName: 'Tomatoes',
      quantity: 50,
      unitCost: 300,
      dateReceived: '2025-12-01',
      expiryDate: '2026-01-15',
    }),
  ];

  const waste = [
    makeWaste({
      id: 'w1',
      batchId: 't1',
      quantityWasted: 2,
      unitCost: 300,
      costLoss: 600,
      voided: false,
    }),
  ];

  it('sums received quantity × unit cost inside the range', () => {
    // t1 received qty = 18 + 2 waste = 20; t2 = 10
    expect(getReceivedQuantity(batches[0]!, waste)).toBe(20);
    const result = calculateIngredientCost(batches, waste, {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    expect(result.totalCost).toBe(20 * 300 + 10 * 350);
    expect(result.batchCount).toBe(2);
  });

  it('filters by ingredient', () => {
    const result = calculateIngredientCost(
      batches,
      waste,
      { startDate: '2026-01-01', endDate: '2026-01-31' },
      { ingredientKey: 'tomatoes' },
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.totalCost).toBe(9500);
  });
});

describe('FR-034 waste loss by date range', () => {
  const logs = [
    makeWaste({ id: '1', costLoss: 500, timestamp: '2026-07-05T12:00:00.000Z' }),
    makeWaste({ id: '2', costLoss: 300, timestamp: '2026-07-08T12:00:00.000Z' }),
    makeWaste({
      id: '3',
      costLoss: 900,
      timestamp: '2026-07-09T12:00:00.000Z',
      voided: true,
    }),
    makeWaste({ id: '4', costLoss: 100, timestamp: '2026-06-01T12:00:00.000Z' }),
  ];

  it('sums non-voided costLoss inside the range', () => {
    const result = calculateWasteLoss(logs, {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });
    expect(result.totalLoss).toBe(800);
    expect(result.eventCount).toBe(2);
  });

  it('excludes voided entries', () => {
    const result = calculateWasteLoss(logs, {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });
    expect(result.rows.every((row) => row.totalLoss !== 900)).toBe(true);
  });
});

describe('FR-035 financial access restriction', () => {
  it('denies staff cost/financial modules', () => {
    expect(canAccessModule('staff', 'cost')).toBe(false);
    expect(canAccessModule('staff', 'financial')).toBe(false);
    expect(canAccessModule('staff', 'analytics')).toBe(false);
  });

  it('allows admin financial modules', () => {
    expect(canAccessModule('admin', 'cost')).toBe(true);
    expect(canAccessModule('admin', 'financial')).toBe(true);
  });
});
