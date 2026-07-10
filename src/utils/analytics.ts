import { parseDateOnly, toDateOnlyString, ingredientKey } from '@utils/expiry';
import { calculateIngredientCost, calculateWasteLoss } from '@utils/financial';
import type {
  AggregationPeriod,
  FinancialDateRange,
  IngredientCostShare,
  InventoryBatch,
  InventoryUsageLog,
  TopWastedIngredient,
  WasteLog,
  WasteTrendPoint,
} from '@/types';

function inDateRange(dateOnly: string, range: FinancialDateRange): boolean {
  const day = dateOnly.slice(0, 10);
  if (!day) return false;
  if (range.startDate && day < range.startDate) return false;
  if (range.endDate && day > range.endDate) return false;
  return true;
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function periodKey(dateOnly: string, period: AggregationPeriod): { key: string; label: string } {
  if (period === 'day') {
    return { key: dateOnly, label: dateOnly };
  }
  if (period === 'month') {
    const key = dateOnly.slice(0, 7);
    const [y, m] = key.split('-');
    const monthName = new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    return { key, label: monthName };
  }
  const monday = startOfWeekMonday(parseDateOnly(dateOnly));
  const key = toDateOnlyString(monday);
  return { key: `week-${key}`, label: `Week of ${key}` };
}

/**
 * FR-036 — aggregate non-voided waste costLoss by day / week / month.
 */
export function aggregateWasteCostByPeriod(
  logs: WasteLog[],
  range: FinancialDateRange,
  period: AggregationPeriod,
): WasteTrendPoint[] {
  const map = new Map<string, WasteTrendPoint>();

  for (const log of logs) {
    if (log.voided) continue;
    const day = log.timestamp.slice(0, 10);
    if (!inDateRange(day, range)) continue;
    const loss = Number(log.costLoss);
    if (!Number.isFinite(loss) || loss < 0) continue;

    const { key, label } = periodKey(day, period);
    const existing = map.get(key);
    if (existing) {
      existing.totalLoss += loss;
    } else {
      map.set(key, { key, label, totalLoss: loss });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * FR-037 — top wasted ingredients by monetary loss.
 */
export function rankTopWastedIngredients(
  logs: WasteLog[],
  range: FinancialDateRange,
  limit: number = 10,
): TopWastedIngredient[] {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const map = new Map<string, { name: string; loss: number; events: number }>();
  let total = 0;

  for (const log of logs) {
    if (log.voided) continue;
    if (!inDateRange(log.timestamp.slice(0, 10), range)) continue;
    const loss = Number(log.costLoss);
    if (!Number.isFinite(loss) || loss < 0) continue;

    total += loss;
    const key = log.ingredientKey || ingredientKey(log.ingredientName);
    const existing = map.get(key);
    if (existing) {
      existing.loss += loss;
      existing.events += 1;
    } else {
      map.set(key, { name: log.ingredientName, loss, events: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([key, value]) => ({
      rank: 0,
      ingredientKey: key,
      ingredientName: value.name,
      totalLoss: value.loss,
      eventCount: value.events,
      percentage: total > 0 ? (value.loss / total) * 100 : 0,
    }))
    .sort((a, b) => b.totalLoss - a.totalLoss)
    .slice(0, safeLimit)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

/**
 * FR-038 — ingredient cost with percentage contribution.
 */
export function buildIngredientCostBreakdown(
  batches: InventoryBatch[],
  wasteLogs: WasteLog[],
  range: FinancialDateRange,
  usageLogs: InventoryUsageLog[] = [],
): IngredientCostShare[] {
  const result = calculateIngredientCost(batches, wasteLogs, range, undefined, usageLogs);
  return result.rows.map((row) => ({
    ingredientName: row.ingredientName,
    ingredientKey: row.ingredientKey,
    totalCost: row.totalCost,
    batchCount: row.batchCount,
    totalQuantity: row.totalQuantity,
    unit: row.unit,
    percentage: result.totalCost > 0 ? (row.totalCost / result.totalCost) * 100 : 0,
  }));
}

export function totalWasteInRange(logs: WasteLog[], range: FinancialDateRange): number {
  return calculateWasteLoss(logs, range).totalLoss;
}
