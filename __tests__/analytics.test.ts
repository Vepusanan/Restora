import {
  aggregateWasteCostByPeriod,
  buildIngredientCostBreakdown,
  rankTopWastedIngredients,
} from '../src/utils/analytics';
import { buildAnalyticsCsv, buildAnalyticsPdfHtml } from '../src/utils/export';
import { calculateInventoryValuation } from '../src/utils/financial';
import { canAccessModule } from '../src/utils/rbac';
import { ingredientKey } from '../src/utils/expiry';
import type {
  AnalyticsDashboardSnapshot,
  InventoryBatch,
  WasteLog,
} from '../src/types';

function makeBatch(
  partial: Partial<InventoryBatch> &
    Pick<
      InventoryBatch,
      'id' | 'ingredientName' | 'quantity' | 'unitCost' | 'dateReceived' | 'expiryDate'
    >,
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

function makeWaste(partial: Partial<WasteLog> & Pick<WasteLog, 'id' | 'timestamp' | 'costLoss'>): WasteLog {
  return {
    restaurantId: 'r1',
    batchId: 'b1',
    ingredientName: 'Tomato',
    ingredientKey: 'tomato',
    quantityWasted: 1,
    unit: 'kg',
    wasteReason: 'Expired',
    unitCost: 100,
    loggedBy: 'u1',
    loggedByName: 'Alex',
    voided: false,
    voidedAt: null,
    voidedBy: null,
    createdAt: partial.timestamp,
    updatedAt: partial.timestamp,
    ...partial,
  };
}

describe('FR-036 waste cost aggregation', () => {
  const logs = [
    makeWaste({ id: '1', timestamp: '2026-01-01T10:00:00.000Z', costLoss: 500, ingredientName: 'Tomato', ingredientKey: 'tomato' }),
    makeWaste({ id: '2', timestamp: '2026-01-02T10:00:00.000Z', costLoss: 900, ingredientName: 'Milk', ingredientKey: 'milk' }),
    makeWaste({ id: '3', timestamp: '2026-01-02T12:00:00.000Z', costLoss: 100, ingredientName: 'Milk', ingredientKey: 'milk', voided: true }),
    makeWaste({ id: '4', timestamp: '2026-01-08T10:00:00.000Z', costLoss: 200, ingredientName: 'Onion', ingredientKey: 'onion' }),
  ];
  const range = { startDate: '2026-01-01', endDate: '2026-01-31' };

  it('aggregates daily excluding voided', () => {
    const points = aggregateWasteCostByPeriod(logs, range, 'day');
    expect(points.find((p) => p.key === '2026-01-01')?.totalLoss).toBe(500);
    expect(points.find((p) => p.key === '2026-01-02')?.totalLoss).toBe(900);
    expect(points.find((p) => p.key === '2026-01-02')?.totalLoss).not.toBe(1000);
  });

  it('aggregates weekly', () => {
    const points = aggregateWasteCostByPeriod(logs, range, 'week');
    expect(points.length).toBeGreaterThanOrEqual(2);
    expect(points.reduce((sum, p) => sum + p.totalLoss, 0)).toBe(1600);
  });

  it('aggregates monthly', () => {
    const points = aggregateWasteCostByPeriod(logs, range, 'month');
    expect(points).toHaveLength(1);
    expect(points[0]?.totalLoss).toBe(1600);
    expect(points[0]?.label).toMatch(/January/);
  });
});

describe('FR-037 top wasted ingredients', () => {
  const logs = [
    makeWaste({ id: '1', timestamp: '2026-07-01T00:00:00.000Z', costLoss: 50000, ingredientName: 'Tomatoes', ingredientKey: 'tomatoes' }),
    makeWaste({ id: '2', timestamp: '2026-07-02T00:00:00.000Z', costLoss: 30000, ingredientName: 'Milk', ingredientKey: 'milk' }),
    makeWaste({ id: '3', timestamp: '2026-07-03T00:00:00.000Z', costLoss: 20000, ingredientName: 'Chicken', ingredientKey: 'chicken' }),
    makeWaste({ id: '4', timestamp: '2026-07-03T00:00:00.000Z', costLoss: 5000, ingredientName: 'Oil', ingredientKey: 'oil', voided: true }),
  ];

  it('ranks by loss descending with percentages', () => {
    const ranked = rankTopWastedIngredients(logs, { startDate: '2026-07-01', endDate: '2026-07-31' }, 5);
    expect(ranked.map((r) => r.ingredientName)).toEqual(['Tomatoes', 'Milk', 'Chicken']);
    expect(ranked[0]?.rank).toBe(1);
    expect(ranked[0]?.percentage).toBe(50);
    expect(ranked).toHaveLength(3);
  });

  it('respects top limit', () => {
    const ranked = rankTopWastedIngredients(logs, { startDate: '2026-07-01', endDate: '2026-07-31' }, 2);
    expect(ranked).toHaveLength(2);
  });
});

describe('FR-038 cost breakdown by ingredient', () => {
  const batches = [
    makeBatch({
      id: '1',
      ingredientName: 'Tomatoes',
      quantity: 100,
      unitCost: 1000,
      dateReceived: '2026-01-10',
      expiryDate: '2026-02-01',
    }),
    makeBatch({
      id: '2',
      ingredientName: 'Chicken',
      quantity: 100,
      unitCost: 2000,
      dateReceived: '2026-01-15',
      expiryDate: '2026-02-01',
    }),
  ];

  it('groups costs and computes percentage contribution', () => {
    const rows = buildIngredientCostBreakdown(batches, [], {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    expect(rows.find((r) => r.ingredientName === 'Chicken')?.percentage).toBeCloseTo(66.666, 1);
    expect(rows.find((r) => r.ingredientName === 'Tomatoes')?.percentage).toBeCloseTo(33.333, 1);
  });
});

describe('FR-039 inventory valuation on dashboard', () => {
  it('reuses FR-032 valuation rules', () => {
    const now = new Date(2026, 6, 10);
    const result = calculateInventoryValuation(
      [
        makeBatch({
          id: 'a',
          ingredientName: 'Rice',
          quantity: 10,
          unitCost: 100,
          dateReceived: '2026-07-01',
          expiryDate: '2026-07-20',
        }),
        makeBatch({
          id: 'b',
          ingredientName: 'Old',
          quantity: 5,
          unitCost: 100,
          dateReceived: '2026-06-01',
          expiryDate: '2026-07-01',
        }),
      ],
      now,
    );
    expect(result.totalValue).toBe(1000);
    expect(result.excludedExpired).toBe(1);
  });
});

describe('FR-041 export generation', () => {
  const snapshot: AnalyticsDashboardSnapshot = {
    restaurantName: 'Demo Kitchen',
    range: { startDate: '2026-07-01', endDate: '2026-07-31' },
    period: 'day',
    generatedAt: '2026-07-10T12:00:00.000Z',
    inventoryValue: 2500,
    totalWasteCost: 800,
    totalIngredientCost: 9500,
    wasteTrends: [{ key: '2026-07-01', label: '2026-07-01', totalLoss: 500 }],
    topWasted: [
      {
        rank: 1,
        ingredientName: 'Tomatoes',
        ingredientKey: 'tomatoes',
        totalLoss: 500,
        percentage: 62.5,
        eventCount: 2,
      },
    ],
    ingredientBreakdown: [
      {
        ingredientName: 'Tomatoes',
        ingredientKey: 'tomatoes',
        totalCost: 9500,
        percentage: 100,
        batchCount: 2,
        totalQuantity: 30,
        unit: 'kg',
      },
    ],
  };

  it('builds CSV with headers and sections', () => {
    const csv = buildAnalyticsCsv(snapshot);
    expect(csv).toContain('Restora Analytics Report');
    expect(csv).toContain('Demo Kitchen');
    expect(csv).toContain('Top Wasted Ingredients');
    expect(csv).toContain('Tomatoes');
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });

  it('builds PDF HTML with restaurant branding and tables', () => {
    const html = buildAnalyticsPdfHtml(snapshot);
    expect(html).toContain('Restora');
    expect(html).toContain('Demo Kitchen');
    expect(html).toContain('Waste Cost Trends');
    expect(html).toContain('Top Wasted Ingredients');
  });
});

describe('FR analytics security', () => {
  it('blocks staff from analytics module', () => {
    expect(canAccessModule('staff', 'analytics')).toBe(false);
    expect(canAccessModule('admin', 'analytics')).toBe(true);
  });
});
