import { daysUntilExpiry, ingredientKey } from '@utils/expiry';
import type {
  FinancialDateRange,
  IngredientCostResult,
  IngredientCostRow,
  InventoryBatch,
  InventoryValuationResult,
  WasteLog,
  WasteLossResult,
  WasteLossRow,
  WasteReason,
} from '@/types';

/** Display currency consistently with restaurant settings (FR-056). */
export function formatMoney(
  value: number,
  currency: import('@/types').RestaurantCurrency | string = 'USD',
): string {
  const amount = Number.isFinite(value) ? value : 0;
  const symbols: Record<string, string> = { LKR: 'Rs.', USD: '$', EUR: '€' };
  const symbol = symbols[currency] ?? '$';
  return `${symbol}${amount.toFixed(2)}`;
}

function inDateRange(dateOnly: string, range: FinancialDateRange): boolean {
  const day = dateOnly.slice(0, 10);
  if (!day) return false;
  if (range.startDate && day < range.startDate) return false;
  if (range.endDate && day > range.endDate) return false;
  return true;
}

/**
 * FR-032 — remaining qty × unit cost for active, non-expired, non-consumed, non-archived batches.
 */
export function calculateInventoryValuation(
  batches: InventoryBatch[],
  now = new Date(),
): InventoryValuationResult {
  let totalValue = 0;
  let batchCount = 0;
  let excludedExpired = 0;
  let excludedConsumed = 0;
  let excludedArchived = 0;

  for (const batch of batches) {
    if (batch.archived) {
      excludedArchived += 1;
      continue;
    }
    if (batch.consumed) {
      excludedConsumed += 1;
      continue;
    }
    if (daysUntilExpiry(batch.expiryDate, now) < 0) {
      excludedExpired += 1;
      continue;
    }
    if (!Number.isFinite(batch.quantity) || batch.quantity <= 0) {
      continue;
    }
    if (!Number.isFinite(batch.unitCost) || batch.unitCost < 0) {
      continue;
    }

    totalValue += batch.quantity * batch.unitCost;
    batchCount += 1;
  }

  return {
    totalValue,
    batchCount,
    excludedExpired,
    excludedConsumed,
    excludedArchived,
    calculatedAt: now.toISOString(),
  };
}

/**
 * Reconstruct received quantity for purchase-cost reporting after waste deductions.
 */
export function getReceivedQuantity(batch: InventoryBatch, wasteLogs: WasteLog[]): number {
  const wasted = wasteLogs
    .filter((log) => log.batchId === batch.id && !log.voided)
    .reduce((sum, log) => sum + log.quantityWasted, 0);
  return batch.quantity + wasted;
}

/**
 * FR-033 — Σ(receivedQuantity × unitCost) for batches with dateReceived in range.
 */
export function calculateIngredientCost(
  batches: InventoryBatch[],
  wasteLogs: WasteLog[],
  range: FinancialDateRange,
  filters?: {
    ingredientKey?: string | null;
    supplier?: string | null;
  },
): IngredientCostResult {
  const ingredientFilter = filters?.ingredientKey?.trim().toLowerCase() || null;
  const supplierFilter = filters?.supplier?.trim().toLowerCase() || null;
  const map = new Map<string, IngredientCostRow>();
  let totalCost = 0;
  let batchCount = 0;

  for (const batch of batches) {
    if (!inDateRange(batch.dateReceived, range)) continue;
    if (ingredientFilter && batch.ingredientKey !== ingredientFilter) continue;
    if (supplierFilter && batch.supplier.trim().toLowerCase() !== supplierFilter) continue;

    const qty = getReceivedQuantity(batch, wasteLogs);
    if (!Number.isFinite(qty) || qty <= 0) continue;
    if (!Number.isFinite(batch.unitCost) || batch.unitCost < 0) continue;

    const cost = qty * batch.unitCost;
    totalCost += cost;
    batchCount += 1;

    const key = batch.ingredientKey || ingredientKey(batch.ingredientName);
    const existing = map.get(key);
    if (existing) {
      existing.batchCount += 1;
      existing.totalQuantity += qty;
      existing.totalCost += cost;
    } else {
      map.set(key, {
        ingredientName: batch.ingredientName,
        ingredientKey: key,
        batchCount: 1,
        totalQuantity: qty,
        totalCost: cost,
        unit: batch.unit,
      });
    }
  }

  const rows = Array.from(map.values()).sort((a, b) => b.totalCost - a.totalCost);
  return { totalCost, rows, batchCount };
}

/**
 * FR-034 — Σ costLoss for non-voided waste logs in date range.
 */
export function calculateWasteLoss(
  logs: WasteLog[],
  range: FinancialDateRange,
  filters?: {
    wasteReason?: WasteReason | null;
    ingredientKey?: string | null;
  },
): WasteLossResult {
  const reasonFilter = filters?.wasteReason ?? null;
  const ingredientFilter = filters?.ingredientKey?.trim().toLowerCase() || null;
  const map = new Map<string, WasteLossRow>();
  let totalLoss = 0;
  let eventCount = 0;

  for (const log of logs) {
    if (log.voided) continue;
    if (!inDateRange(log.timestamp.slice(0, 10), range)) continue;
    if (reasonFilter && log.wasteReason !== reasonFilter) continue;
    if (ingredientFilter && log.ingredientKey !== ingredientFilter) continue;

    const loss = Number(log.costLoss);
    if (!Number.isFinite(loss) || loss < 0) continue;

    totalLoss += loss;
    eventCount += 1;

    const key = reasonFilter || ingredientFilter ? log.ingredientKey || log.ingredientName : log.wasteReason;
    const label = reasonFilter || ingredientFilter ? log.ingredientName : log.wasteReason;
    const existing = map.get(key);
    if (existing) {
      existing.eventCount += 1;
      existing.totalLoss += loss;
    } else {
      map.set(key, { key, label, eventCount: 1, totalLoss: loss });
    }
  }

  const rows = Array.from(map.values()).sort((a, b) => b.totalLoss - a.totalLoss);
  return { totalLoss, rows, eventCount };
}

export function defaultFinancialRange(now = new Date()): FinancialDateRange {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  return { startDate: to(start), endDate: to(end) };
}
