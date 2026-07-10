import { createWasteSchema } from '../src/utils/validators';
import {
  calculateCostLoss,
  filterWasteLogs,
  formatCostLoss,
  isValidWasteReason,
  summarizeWasteLogs,
} from '../src/utils/waste';
import type { WasteLog } from '../src/types';

function makeLog(partial: Partial<WasteLog> & Pick<WasteLog, 'id'>): WasteLog {
  return {
    restaurantId: 'r1',
    batchId: 'b1',
    ingredientName: 'Tomato',
    ingredientKey: 'tomato',
    quantityWasted: 2,
    unit: 'kg',
    wasteReason: 'Expired',
    unitCost: 3,
    costLoss: 6,
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

describe('FR-026/027 waste validation', () => {
  it('accepts a valid waste payload', () => {
    const result = createWasteSchema.safeParse({
      batchId: 'batch-1',
      quantityWasted: 1.5,
      wasteReason: 'Prep Waste',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-positive quantity', () => {
    const result = createWasteSchema.safeParse({
      batchId: 'batch-1',
      quantityWasted: 0,
      wasteReason: 'Burnt',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid waste reasons', () => {
    expect(isValidWasteReason('Spoiled')).toBe(false);
    const result = createWasteSchema.safeParse({
      batchId: 'batch-1',
      quantityWasted: 1,
      wasteReason: 'Spoiled',
    });
    expect(result.success).toBe(false);
  });
});

describe('FR-028 cost loss calculation', () => {
  it('computes quantity × unit cost server-side formula', () => {
    expect(calculateCostLoss(2.5, 4)).toBe(10);
    expect(formatCostLoss(10)).toBe('$10.00');
  });
});

describe('FR-030/031 filtering and void exclusion', () => {
  const logs = [
    makeLog({ id: 'w1', ingredientName: 'Tomato', wasteReason: 'Expired', costLoss: 6 }),
    makeLog({
      id: 'w2',
      ingredientName: 'Milk',
      wasteReason: 'Leftovers',
      costLoss: 4,
      loggedBy: 'u2',
      loggedByName: 'Sam',
      timestamp: '2026-07-08T10:00:00.000Z',
    }),
    makeLog({
      id: 'w3',
      ingredientName: 'Tomato',
      wasteReason: 'Burnt',
      costLoss: 9,
      voided: true,
      timestamp: '2026-07-09T10:00:00.000Z',
    }),
  ];

  it('filters by ingredient search and reason', () => {
    const filtered = filterWasteLogs(logs, {
      search: 'tom',
      wasteReason: 'Expired',
      loggedBy: null,
      batchId: null,
      visibility: 'all',
      dateFrom: null,
      dateTo: null,
    });
    expect(filtered.map((l) => l.id)).toEqual(['w1']);
  });

  it('excludes voided entries from active summaries', () => {
    const summary = summarizeWasteLogs(logs);
    expect(summary.activeEvents).toBe(2);
    expect(summary.voidedEvents).toBe(1);
    expect(summary.totalCostLoss).toBe(10);
  });

  it('filters by date range and loggedBy', () => {
    const filtered = filterWasteLogs(logs, {
      search: '',
      wasteReason: null,
      loggedBy: 'u2',
      batchId: null,
      visibility: 'active',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-09',
    });
    expect(filtered.map((l) => l.id)).toEqual(['w2']);
  });
});
