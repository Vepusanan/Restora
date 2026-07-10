import {
  daysUntilExpiry,
  getExpiryTone,
  ingredientKey,
  resolveFifoBatchId,
} from '../src/utils/expiry';
import { buildInventoryGroups } from '../src/utils/inventory';
import { createBatchSchema, editBatchSchema } from '../src/utils/validators';
import type { InventoryBatch } from '../src/types';

function makeBatch(partial: Partial<InventoryBatch> & Pick<InventoryBatch, 'id' | 'ingredientName' | 'dateReceived' | 'expiryDate'>): InventoryBatch {
  const name = partial.ingredientName;
  return {
    restaurantId: 'r1',
    ingredientKey: ingredientKey(name),
    quantity: 10,
    unit: 'kg',
    unitCost: 2,
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

describe('FR-012 batch validation', () => {
  it('rejects empty ingredient name', () => {
    const result = createBatchSchema.safeParse({
      ingredientName: '',
      quantity: 1,
      unit: 'kg',
      unitCost: 1,
      supplier: 'A',
      dateReceived: '2026-07-01',
      expiryDate: '2026-07-10',
    });
    expect(result.success).toBe(false);
  });

  it('rejects quantity <= 0', () => {
    const result = createBatchSchema.safeParse({
      ingredientName: 'Tomato',
      quantity: 0,
      unit: 'kg',
      unitCost: 1,
      supplier: 'A',
      dateReceived: '2026-07-01',
      expiryDate: '2026-07-10',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative unit cost', () => {
    const result = createBatchSchema.safeParse({
      ingredientName: 'Tomato',
      quantity: 1,
      unit: 'kg',
      unitCost: -1,
      supplier: 'A',
      dateReceived: '2026-07-01',
      expiryDate: '2026-07-10',
    });
    expect(result.success).toBe(false);
  });

  it('rejects expiry before received', () => {
    const result = createBatchSchema.safeParse({
      ingredientName: 'Tomato',
      quantity: 1,
      unit: 'kg',
      unitCost: 1,
      supplier: 'A',
      dateReceived: '2026-07-10',
      expiryDate: '2026-07-01',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid batch', () => {
    const result = createBatchSchema.safeParse({
      ingredientName: 'Tomato',
      quantity: 5,
      unit: 'kg',
      unitCost: 0,
      supplier: 'Fresh Co',
      dateReceived: '2026-07-01',
      expiryDate: '2026-07-10',
    });
    expect(result.success).toBe(true);
  });

  it('validates edit payload', () => {
    const result = editBatchSchema.safeParse({
      supplier: 'Fresh Co',
      quantity: 3,
      dateReceived: '2026-07-01',
      expiryDate: '2026-07-08',
    });
    expect(result.success).toBe(true);
  });
});

describe('FR-015 expiry tones', () => {
  const now = new Date(2026, 6, 10); // Jul 10, 2026

  it('marks green when more than 3 days remain', () => {
    expect(getExpiryTone('2026-07-20', now)).toBe('green');
    expect(daysUntilExpiry('2026-07-20', now)).toBe(10);
  });

  it('marks amber for 0–3 days remaining', () => {
    expect(getExpiryTone('2026-07-10', now)).toBe('amber');
    expect(getExpiryTone('2026-07-13', now)).toBe('amber');
  });

  it('marks red when expired', () => {
    expect(getExpiryTone('2026-07-09', now)).toBe('red');
  });

  it('FR-025 uses configurable amber threshold', () => {
    expect(getExpiryTone('2026-07-15', now, 3)).toBe('green');
    expect(getExpiryTone('2026-07-15', now, 7)).toBe('amber');
  });
});

describe('FR-013/014 FIFO grouping', () => {
  const batches = [
    makeBatch({ id: 'b2', ingredientName: 'Tomato', dateReceived: '2026-07-05', expiryDate: '2026-07-20' }),
    makeBatch({ id: 'b1', ingredientName: 'Tomato', dateReceived: '2026-07-01', expiryDate: '2026-07-15' }),
    makeBatch({ id: 'b3', ingredientName: 'Onion', dateReceived: '2026-07-02', expiryDate: '2026-07-18' }),
    makeBatch({
      id: 'b0',
      ingredientName: 'Tomato',
      dateReceived: '2026-06-01',
      expiryDate: '2026-06-10',
      consumed: true,
    }),
  ];

  it('groups by ingredient and sorts FIFO by dateReceived', () => {
    const groups = buildInventoryGroups(batches, {
      search: '',
      supplier: null,
      expiryTones: [],
      visibility: 'active',
      sort: 'dateReceived',
    });

    const tomato = groups.find((g) => g.ingredientKey === 'tomato');
    expect(tomato?.batches.map((b) => b.id)).toEqual(['b1', 'b2']);
    expect(tomato?.fifoBatchId).toBe('b1');
  });

  it('assigns exactly one FIFO badge to the oldest active batch', () => {
    const tomato = batches.filter((b) => b.ingredientKey === 'tomato');
    expect(resolveFifoBatchId(tomato)).toBe('b1');
  });

  it('filters by search and expiry tone', () => {
    const groups = buildInventoryGroups(
      batches,
      {
        search: 'tom',
        supplier: null,
        expiryTones: ['green'],
        visibility: 'active',
        sort: 'dateReceived',
      },
      new Date(2026, 6, 10),
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.batches.every((b) => b.ingredientName === 'Tomato')).toBe(true);
  });
});
