export type UsageCategory =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Recipe'
  | 'Manual Adjustment'
  | 'Kitchen Use';

export const USAGE_CATEGORIES: UsageCategory[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Recipe',
  'Manual Adjustment',
  'Kitchen Use',
];

export function calculateConsumptionCost(quantityUsed: number, unitCost: number): number {
  const qty = Number(quantityUsed);
  const cost = Number(unitCost);
  if (!Number.isFinite(qty) || !Number.isFinite(cost) || qty <= 0 || cost < 0) {
    return 0;
  }
  return qty * cost;
}

export function isValidUsageCategory(value: unknown): value is UsageCategory {
  return typeof value === 'string' && (USAGE_CATEGORIES as string[]).includes(value);
}

export function roundQty(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export type FifoBatchCandidate = {
  id: string;
  quantity: number;
  unitCost: number;
  ingredientName: string;
  unit: string;
  dateReceived: string;
  createdAt: string;
  consumed: boolean;
  archived: boolean;
  expiryDate: string;
};

export type FifoAllocation = {
  batchId: string;
  quantityUsed: number;
  unitCost: number;
  remainingAfter: number;
  ingredientName: string;
  unit: string;
  dateReceived: string;
};

function daysUntilExpiry(expiryDate: string, now: Date): number {
  const [y, m, d] = expiryDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return 0;
  const expiry = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

export function allocateFifoConsumption(
  batches: FifoBatchCandidate[],
  quantityNeeded: number,
  options?: {
    allowExpired?: boolean;
    now?: Date;
    batchId?: string | null;
  },
): FifoAllocation[] {
  const needed = Number(quantityNeeded);
  if (!Number.isFinite(needed) || needed <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  const allowExpired = options?.allowExpired === true;
  const now = options?.now ?? new Date();
  const forcedId = options?.batchId?.trim() || null;

  let candidates = batches.filter((batch) => {
    if (batch.consumed || batch.archived) return false;
    if (!Number.isFinite(batch.quantity) || batch.quantity <= 0) return false;
    if (!allowExpired && daysUntilExpiry(batch.expiryDate, now) < 0) return false;
    return true;
  });

  if (forcedId) {
    candidates = candidates.filter((batch) => batch.id === forcedId);
    if (candidates.length === 0) {
      throw new Error('This batch is not available for consumption.');
    }
  } else {
    candidates = candidates
      .slice()
      .sort(
        (a, b) =>
          a.dateReceived.localeCompare(b.dateReceived) ||
          a.createdAt.localeCompare(b.createdAt),
      );
  }

  const available = roundQty(candidates.reduce((sum, batch) => sum + batch.quantity, 0));
  if (needed > available) {
    throw new Error(
      `Only ${available} remaining across available batches. Cannot use ${needed}.`,
    );
  }

  let remaining = needed;
  const allocations: FifoAllocation[] = [];

  for (const batch of candidates) {
    if (remaining <= 0) break;
    const take = roundQty(Math.min(batch.quantity, remaining));
    if (take <= 0) continue;
    allocations.push({
      batchId: batch.id,
      quantityUsed: take,
      unitCost: Number(batch.unitCost ?? 0),
      remainingAfter: roundQty(batch.quantity - take),
      ingredientName: batch.ingredientName,
      unit: batch.unit,
      dateReceived: batch.dateReceived,
    });
    remaining = roundQty(remaining - take);
  }

  if (remaining > 0) {
    throw new Error('Unable to allocate full quantity from available batches.');
  }

  return allocations;
}
