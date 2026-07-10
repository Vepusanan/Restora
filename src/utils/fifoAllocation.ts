import { daysUntilExpiry, isActiveBatch } from '@utils/expiry';
import type { FifoAllocation, InventoryBatch } from '@/types';

export function roundQty(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export type FifoBatchCandidate = Pick<
  InventoryBatch,
  | 'id'
  | 'quantity'
  | 'unitCost'
  | 'ingredientName'
  | 'unit'
  | 'dateReceived'
  | 'createdAt'
  | 'consumed'
  | 'archived'
  | 'expiryDate'
>;

/**
 * FR-060 — allocate quantity across oldest active batches first.
 * Does not mutate input. Throws when stock is insufficient.
 */
export function allocateFifoConsumption(
  batches: FifoBatchCandidate[],
  quantityNeeded: number,
  options?: {
    allowExpired?: boolean;
    now?: Date;
    /** When set, only this batch is used (manual override). */
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
    if (!isActiveBatch(batch as InventoryBatch)) return false;
    if (!Number.isFinite(batch.quantity) || batch.quantity <= 0) return false;
    if (!allowExpired && daysUntilExpiry(batch.expiryDate, now) < 0) return false;
    return true;
  });

  if (forcedId) {
    candidates = candidates.filter((batch) => batch.id === forcedId);
    if (candidates.length === 0) {
      const raw = batches.find((batch) => batch.id === forcedId);
      if (!raw) throw new Error('Batch not found');
      if (raw.archived || raw.consumed) {
        throw new Error('This batch is not available for consumption.');
      }
      if (!allowExpired && daysUntilExpiry(raw.expiryDate, now) < 0) {
        throw new Error('This batch is expired. Enable allow expired to continue.');
      }
      throw new Error('This batch has no remaining quantity.');
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
    const remainingAfter = roundQty(batch.quantity - take);
    allocations.push({
      batchId: batch.id,
      quantityUsed: take,
      unitCost: Number(batch.unitCost ?? 0),
      remainingAfter,
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

export function totalAvailableForConsumption(
  batches: FifoBatchCandidate[],
  options?: { allowExpired?: boolean; now?: Date; ingredientKey?: string },
): number {
  const allowExpired = options?.allowExpired === true;
  const now = options?.now ?? new Date();
  return roundQty(
    batches
      .filter((batch) => {
        if (!isActiveBatch(batch as InventoryBatch)) return false;
        if (!Number.isFinite(batch.quantity) || batch.quantity <= 0) return false;
        if (!allowExpired && daysUntilExpiry(batch.expiryDate, now) < 0) return false;
        return true;
      })
      .reduce((sum, batch) => sum + batch.quantity, 0),
  );
}
