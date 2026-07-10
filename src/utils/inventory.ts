import type {
  ExpiryTone,
  IngredientGroup,
  InventoryBatch,
  InventoryFilters,
  InventorySortKey,
} from '@/types';
import {
  getExpiryTone,
  ingredientKey,
  isActiveBatch,
  resolveFifoBatchId,
} from '@utils/expiry';

function compareBatches(a: InventoryBatch, b: InventoryBatch, sort: InventorySortKey): number {
  switch (sort) {
    case 'expiryDate':
      return a.expiryDate.localeCompare(b.expiryDate) || a.dateReceived.localeCompare(b.dateReceived);
    case 'quantity':
      return a.quantity - b.quantity || a.dateReceived.localeCompare(b.dateReceived);
    case 'ingredientName':
      return a.ingredientName.localeCompare(b.ingredientName) || a.dateReceived.localeCompare(b.dateReceived);
    case 'dateReceived':
    default:
      return a.dateReceived.localeCompare(b.dateReceived) || a.createdAt.localeCompare(b.createdAt);
  }
}

function matchesVisibility(batch: InventoryBatch, visibility: InventoryFilters['visibility']): boolean {
  switch (visibility) {
    case 'active':
      return isActiveBatch(batch);
    case 'consumed':
      return batch.consumed;
    case 'archived':
      return batch.archived;
    case 'all':
      return true;
    default:
      return true;
  }
}

/**
 * FR-013 / FR-014 / FR-020 — filter, sort, and FIFO-group from a cached snapshot.
 */
export function buildInventoryGroups(
  batches: InventoryBatch[],
  filters: InventoryFilters,
  now = new Date(),
): IngredientGroup[] {
  const search = filters.search.trim().toLowerCase();

  const filtered = batches.filter((batch) => {
    if (!matchesVisibility(batch, filters.visibility)) return false;

    if (filters.supplier && batch.supplier.toLowerCase() !== filters.supplier.toLowerCase()) {
      return false;
    }

    if (search && !batch.ingredientName.toLowerCase().includes(search)) {
      return false;
    }

    if (filters.expiryTones.length > 0) {
      const tone = getExpiryTone(batch.expiryDate, now);
      if (!filters.expiryTones.includes(tone)) return false;
    }

    return true;
  });

  const byIngredient = new Map<string, InventoryBatch[]>();
  for (const batch of filtered) {
    const key = batch.ingredientKey || ingredientKey(batch.ingredientName);
    const list = byIngredient.get(key) ?? [];
    list.push(batch);
    byIngredient.set(key, list);
  }

  const groups: IngredientGroup[] = [];
  for (const [key, items] of byIngredient) {
    // Within group always FIFO by dateReceived (FR-013), then apply secondary sort for display.
    const fifoSorted = items
      .slice()
      .sort((a, b) => a.dateReceived.localeCompare(b.dateReceived) || a.createdAt.localeCompare(b.createdAt));

    const displaySorted =
      filters.sort === 'dateReceived'
        ? fifoSorted
        : fifoSorted.slice().sort((a, b) => compareBatches(a, b, filters.sort));

    groups.push({
      ingredientKey: key,
      ingredientName: fifoSorted[0]?.ingredientName ?? key,
      batches: displaySorted,
      fifoBatchId: resolveFifoBatchId(fifoSorted),
    });
  }

  groups.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
  return groups;
}

export function uniqueSuppliers(batches: InventoryBatch[]): string[] {
  const set = new Set(batches.map((b) => b.supplier.trim()).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function toggleTone(tones: ExpiryTone[], tone: ExpiryTone): ExpiryTone[] {
  return tones.includes(tone) ? tones.filter((t) => t !== tone) : [...tones, tone];
}
