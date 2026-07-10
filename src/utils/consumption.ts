import { USAGE_CATEGORIES } from '@constants/consumption';
import type {
  ConsumptionByCategoryRow,
  ConsumptionCostResult,
  ConsumptionTrendPoint,
  FinancialDateRange,
  InventoryBatch,
  InventoryTurnoverRow,
  InventoryUsageLog,
  TopConsumedIngredient,
  UsageCategory,
  UsageFilters,
  UsageSummary,
  AggregationPeriod,
} from '@/types';
import { ingredientKey, parseDateOnly, toDateOnlyString } from '@utils/expiry';
import { calculateCostLoss } from '@utils/waste';

/** Same formula as waste costLoss — qty × unitCost (FR-062 cost contribution). */
export function calculateConsumptionCost(quantityUsed: number, unitCost: number): number {
  return calculateCostLoss(quantityUsed, unitCost);
}

export function isValidUsageCategory(value: string): value is UsageCategory {
  return (USAGE_CATEGORIES as string[]).includes(value);
}

export function filterUsageLogs(
  logs: InventoryUsageLog[],
  filters: UsageFilters,
): InventoryUsageLog[] {
  const search = filters.search.trim().toLowerCase();

  return logs
    .filter((log) => {
      if (filters.visibility === 'active' && log.voided) return false;
      if (filters.visibility === 'voided' && !log.voided) return false;
      if (filters.category && log.category !== filters.category) return false;
      if (filters.usedBy && log.usedBy !== filters.usedBy) return false;
      if (filters.batchId && log.batchId !== filters.batchId) return false;
      if (filters.ingredientKey && log.ingredientKey !== filters.ingredientKey) return false;

      if (filters.dateFrom || filters.dateTo) {
        const day = log.usedAt.slice(0, 10);
        if (filters.dateFrom && day < filters.dateFrom) return false;
        if (filters.dateTo && day > filters.dateTo) return false;
      }

      if (!search) return true;
      return (
        log.ingredientName.toLowerCase().includes(search) ||
        log.category.toLowerCase().includes(search) ||
        log.usedByName.toLowerCase().includes(search) ||
        log.batchId.toLowerCase().includes(search) ||
        log.notes.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => b.usedAt.localeCompare(a.usedAt));
}

export function summarizeUsageLogs(logs: InventoryUsageLog[]): UsageSummary {
  const active = logs.filter((log) => !log.voided);
  return {
    totalEvents: logs.length,
    activeEvents: active.length,
    voidedEvents: logs.length - active.length,
    totalConsumptionCost: active.reduce((sum, log) => sum + log.consumptionCost, 0),
    quantityUsed: active.reduce((sum, log) => sum + log.quantityUsed, 0),
  };
}

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

export function calculateConsumptionCostTotal(
  logs: InventoryUsageLog[],
  range: FinancialDateRange,
  filters?: { category?: UsageCategory | null; ingredientKey?: string | null },
): ConsumptionCostResult {
  const categoryFilter = filters?.category ?? null;
  const ingredientFilter = filters?.ingredientKey?.trim().toLowerCase() || null;
  const map = new Map<string, { key: string; label: string; totalCost: number; eventCount: number }>();
  let totalCost = 0;
  let eventCount = 0;
  let quantityUsed = 0;

  for (const log of logs) {
    if (log.voided) continue;
    if (!inDateRange(log.usedAt.slice(0, 10), range)) continue;
    if (categoryFilter && log.category !== categoryFilter) continue;
    if (ingredientFilter && log.ingredientKey !== ingredientFilter) continue;

    const cost = Number(log.consumptionCost);
    if (!Number.isFinite(cost) || cost < 0) continue;

    totalCost += cost;
    eventCount += 1;
    quantityUsed += log.quantityUsed;

    const key =
      categoryFilter || ingredientFilter
        ? log.ingredientKey || log.ingredientName
        : log.category;
    const label = categoryFilter || ingredientFilter ? log.ingredientName : log.category;
    const existing = map.get(key);
    if (existing) {
      existing.eventCount += 1;
      existing.totalCost += cost;
    } else {
      map.set(key, { key, label, eventCount: 1, totalCost: cost });
    }
  }

  return {
    totalCost,
    eventCount,
    quantityUsed,
    rows: Array.from(map.values()).sort((a, b) => b.totalCost - a.totalCost),
  };
}

export function aggregateConsumptionByPeriod(
  logs: InventoryUsageLog[],
  range: FinancialDateRange,
  period: AggregationPeriod,
): ConsumptionTrendPoint[] {
  const map = new Map<string, ConsumptionTrendPoint>();

  for (const log of logs) {
    if (log.voided) continue;
    const day = log.usedAt.slice(0, 10);
    if (!inDateRange(day, range)) continue;
    const cost = Number(log.consumptionCost);
    if (!Number.isFinite(cost) || cost < 0) continue;

    const { key, label } = periodKey(day, period);
    const existing = map.get(key);
    if (existing) {
      existing.totalCost += cost;
      existing.quantityUsed += log.quantityUsed;
    } else {
      map.set(key, { key, label, totalCost: cost, quantityUsed: log.quantityUsed });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export function rankTopConsumedIngredients(
  logs: InventoryUsageLog[],
  range: FinancialDateRange,
  limit: number = 10,
): TopConsumedIngredient[] {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const map = new Map<
    string,
    { name: string; cost: number; qty: number; events: number; unit: string }
  >();
  let total = 0;

  for (const log of logs) {
    if (log.voided) continue;
    if (!inDateRange(log.usedAt.slice(0, 10), range)) continue;
    const cost = Number(log.consumptionCost);
    if (!Number.isFinite(cost) || cost < 0) continue;

    total += cost;
    const key = log.ingredientKey || ingredientKey(log.ingredientName);
    const existing = map.get(key);
    if (existing) {
      existing.cost += cost;
      existing.qty += log.quantityUsed;
      existing.events += 1;
    } else {
      map.set(key, {
        name: log.ingredientName,
        cost,
        qty: log.quantityUsed,
        events: 1,
        unit: log.unit,
      });
    }
  }

  return Array.from(map.entries())
    .map(([key, value]) => ({
      rank: 0,
      ingredientKey: key,
      ingredientName: value.name,
      totalCost: value.cost,
      quantityUsed: value.qty,
      eventCount: value.events,
      percentage: total > 0 ? (value.cost / total) * 100 : 0,
      unit: value.unit,
    }))
    .sort((a, b) => b.totalCost - a.totalCost || b.quantityUsed - a.quantityUsed)
    .slice(0, safeLimit)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function aggregateConsumptionByCategory(
  logs: InventoryUsageLog[],
  range: FinancialDateRange,
): ConsumptionByCategoryRow[] {
  const map = new Map<UsageCategory, ConsumptionByCategoryRow>();

  for (const log of logs) {
    if (log.voided) continue;
    if (!inDateRange(log.usedAt.slice(0, 10), range)) continue;
    const existing = map.get(log.category);
    if (existing) {
      existing.totalCost += log.consumptionCost;
      existing.quantityUsed += log.quantityUsed;
      existing.eventCount += 1;
    } else {
      map.set(log.category, {
        category: log.category,
        totalCost: log.consumptionCost,
        quantityUsed: log.quantityUsed,
        eventCount: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalCost - a.totalCost);
}

/**
 * Inventory turnover & fast/slow movers from consumption vs remaining stock.
 */
export function buildInventoryTurnover(
  batches: InventoryBatch[],
  logs: InventoryUsageLog[],
  range: FinancialDateRange,
  now = new Date(),
): InventoryTurnoverRow[] {
  const daySpan = Math.max(
    1,
    Math.round(
      (parseDateOnly(range.endDate).getTime() - parseDateOnly(range.startDate).getTime()) /
        (24 * 60 * 60 * 1000),
    ) + 1,
  );

  const consumed = new Map<
    string,
    { name: string; qty: number; frequency: number; unit: string }
  >();

  for (const log of logs) {
    if (log.voided) continue;
    if (!inDateRange(log.usedAt.slice(0, 10), range)) continue;
    const key = log.ingredientKey || ingredientKey(log.ingredientName);
    const existing = consumed.get(key);
    if (existing) {
      existing.qty += log.quantityUsed;
      existing.frequency += 1;
    } else {
      consumed.set(key, {
        name: log.ingredientName,
        qty: log.quantityUsed,
        frequency: 1,
        unit: log.unit,
      });
    }
  }

  const remaining = new Map<string, { name: string; qty: number; unit: string }>();
  for (const batch of batches) {
    if (batch.archived || batch.consumed) continue;
    if (batch.quantity <= 0) continue;
    const key = batch.ingredientKey || ingredientKey(batch.ingredientName);
    const existing = remaining.get(key);
    if (existing) {
      existing.qty += batch.quantity;
    } else {
      remaining.set(key, {
        name: batch.ingredientName,
        qty: batch.quantity,
        unit: batch.unit,
      });
    }
  }

  const keys = new Set([...consumed.keys(), ...remaining.keys()]);
  const rows: InventoryTurnoverRow[] = [];

  for (const key of keys) {
    const c = consumed.get(key);
    const r = remaining.get(key);
    const quantityConsumed = c?.qty ?? 0;
    const remainingQuantity = r?.qty ?? 0;
    const turnoverRatio =
      remainingQuantity > 0
        ? quantityConsumed / remainingQuantity
        : quantityConsumed > 0
          ? Number.POSITIVE_INFINITY
          : 0;

    rows.push({
      ingredientName: c?.name ?? r?.name ?? key,
      ingredientKey: key,
      quantityConsumed,
      remainingQuantity,
      turnoverRatio: Number.isFinite(turnoverRatio) ? turnoverRatio : 999,
      unit: c?.unit ?? r?.unit ?? '',
      frequency: c?.frequency ?? 0,
      averageDailyConsumption: quantityConsumed / daySpan,
    });
  }

  void now;
  return rows.sort((a, b) => b.turnoverRatio - a.turnoverRatio);
}

export function formatConsumptionCost(value: number): string {
  return `$${value.toFixed(2)}`;
}
