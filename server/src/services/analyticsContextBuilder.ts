import type { AiAnalyticsContext } from '../types';

type RawBatch = {
  ingredientName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  expiryDate: string;
  dateReceived?: string;
  consumed: boolean;
  archived: boolean;
};

type RawWaste = {
  ingredientName: string;
  quantityWasted: number;
  unit: string;
  wasteReason: string;
  costLoss: number;
  voided: boolean;
  date: string;
};

type RawUsage = {
  ingredientName: string;
  quantityUsed: number;
  unit: string;
  category: string;
  consumptionCost: number;
  voided: boolean;
  date: string;
};

type RestaurantSettings = {
  currency: string;
  expiryAlertThreshold: number;
  name: string;
};

function daysUntil(expiryDate: string, now: Date): number {
  const [y, m, d] = expiryDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return 0;
  const expiry = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expiry.getTime() - today.getTime()) / 86_400_000);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function inRange(dateOnly: string, start: string, end: string): boolean {
  const day = dateOnly.slice(0, 10);
  if (!day) return false;
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
}

function defaultRange(now: Date): { startDate: string; endDate: string } {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end.getFullYear(), end.getMonth(), 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { startDate: fmt(start), endDate: fmt(end) };
}

/**
 * Build a compact, restaurant-isolated analytics context for Gemini.
 * Aggregates only — never invents metrics. Admin financial fields included.
 */
export function buildAiAnalyticsContext(input: {
  restaurantId: string;
  restaurantName: string;
  batches: RawBatch[];
  wasteLogs: RawWaste[];
  usageLogs?: RawUsage[];
  settings?: RestaurantSettings | null;
  range?: { startDate: string; endDate: string };
  now?: Date;
}): AiAnalyticsContext {
  const now = input.now ?? new Date();
  const range = input.range ?? defaultRange(now);
  const amberDays = Math.max(
    1,
    Math.min(30, input.settings?.expiryAlertThreshold ?? 3),
  );
  const currency = input.settings?.currency || 'USD';

  let valuation = 0;
  let activeBatchCount = 0;
  let expiredBatchCount = 0;
  let amberBatchCount = 0;
  let greenBatchCount = 0;

  const expiringSoon: AiAnalyticsContext['inventory']['expiringSoon'] = [];
  const lowStock: AiAnalyticsContext['inventory']['lowStock'] = [];
  const highValueItems: AiAnalyticsContext['inventory']['highValueItems'] = [];

  for (const batch of input.batches) {
    if (batch.archived || batch.consumed) continue;
    const days = daysUntil(batch.expiryDate, now);
    const qty = Number(batch.quantity) || 0;
    const unitCost = Number(batch.unitCost) || 0;

    if (days < 0) {
      expiredBatchCount += 1;
      continue;
    }

    activeBatchCount += 1;
    const lineValue = qty * unitCost;
    valuation += lineValue;

    if (days <= amberDays) {
      amberBatchCount += 1;
      expiringSoon.push({
        ingredientName: batch.ingredientName,
        quantity: qty,
        unit: batch.unit,
        expiryDate: batch.expiryDate.slice(0, 10),
        daysUntilExpiry: days,
        unitCost,
      });
    } else {
      greenBatchCount += 1;
    }

    if (qty > 0 && qty <= 2) {
      lowStock.push({
        ingredientName: batch.ingredientName,
        quantity: qty,
        unit: batch.unit,
      });
    }

    if (lineValue > 0) {
      highValueItems.push({
        ingredientName: batch.ingredientName,
        quantity: qty,
        unit: batch.unit,
        lineValue: round2(lineValue),
      });
    }
  }

  expiringSoon.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  highValueItems.sort((a, b) => b.lineValue - a.lineValue);

  const activeWaste = input.wasteLogs.filter(
    (log) => !log.voided && inRange(log.date, range.startDate, range.endDate),
  );

  let totalLossInRange = 0;
  const byReasonMap = new Map<string, { totalLoss: number; eventCount: number }>();
  const byIngredientMap = new Map<
    string,
    { ingredientName: string; totalLoss: number; eventCount: number }
  >();
  const dailyMap = new Map<string, number>();

  for (const log of activeWaste) {
    const loss = Number(log.costLoss) || 0;
    totalLossInRange += loss;
    const reason = log.wasteReason || 'Unknown';
    const reasonRow = byReasonMap.get(reason) ?? { totalLoss: 0, eventCount: 0 };
    reasonRow.totalLoss += loss;
    reasonRow.eventCount += 1;
    byReasonMap.set(reason, reasonRow);

    const key = log.ingredientName.toLowerCase();
    const ing = byIngredientMap.get(key) ?? {
      ingredientName: log.ingredientName,
      totalLoss: 0,
      eventCount: 0,
    };
    ing.totalLoss += loss;
    ing.eventCount += 1;
    byIngredientMap.set(key, ing);

    const day = log.date.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + loss);
  }

  const byReason = Array.from(byReasonMap.entries())
    .map(([reason, row]) => ({
      reason,
      totalLoss: round2(row.totalLoss),
      eventCount: row.eventCount,
    }))
    .sort((a, b) => b.totalLoss - a.totalLoss);

  const topIngredients = Array.from(byIngredientMap.values())
    .map((row) => ({
      ingredientName: row.ingredientName,
      totalLoss: round2(row.totalLoss),
      eventCount: row.eventCount,
      percentage:
        totalLossInRange > 0
          ? round2((row.totalLoss / totalLossInRange) * 100)
          : 0,
    }))
    .sort((a, b) => b.totalLoss - a.totalLoss)
    .slice(0, 8);

  const dailyTrend = Array.from(dailyMap.entries())
    .map(([date, totalLoss]) => ({ date, totalLoss: round2(totalLoss) }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const activeUsage = (input.usageLogs ?? []).filter(
    (log) => !log.voided && inRange(log.date, range.startDate, range.endDate),
  );
  let totalConsumptionCost = 0;
  const usageByIngredient = new Map<
    string,
    { ingredientName: string; totalCost: number; quantityUsed: number; eventCount: number }
  >();
  const usageByCategory = new Map<string, { totalCost: number; eventCount: number }>();
  const usageDaily = new Map<string, number>();

  for (const log of activeUsage) {
    const cost = Number(log.consumptionCost) || 0;
    totalConsumptionCost += cost;
    const key = log.ingredientName.toLowerCase();
    const ing = usageByIngredient.get(key) ?? {
      ingredientName: log.ingredientName,
      totalCost: 0,
      quantityUsed: 0,
      eventCount: 0,
    };
    ing.totalCost += cost;
    ing.quantityUsed += Number(log.quantityUsed) || 0;
    ing.eventCount += 1;
    usageByIngredient.set(key, ing);

    const cat = log.category || 'Kitchen Use';
    const catRow = usageByCategory.get(cat) ?? { totalCost: 0, eventCount: 0 };
    catRow.totalCost += cost;
    catRow.eventCount += 1;
    usageByCategory.set(cat, catRow);

    const day = log.date.slice(0, 10);
    usageDaily.set(day, (usageDaily.get(day) ?? 0) + cost);
  }

  let ingredientSpendInRange = 0;
  for (const batch of input.batches) {
    const received = (batch.dateReceived || '').slice(0, 10);
    if (!inRange(received, range.startDate, range.endDate)) continue;
    const qty = Number(batch.quantity) || 0;
    const unitCost = Number(batch.unitCost) || 0;
    if (qty > 0 && unitCost >= 0) ingredientSpendInRange += qty * unitCost;
  }

  const valuationRounded = round2(valuation);
  const wasteRounded = round2(totalLossInRange);
  const consumptionRounded = round2(totalConsumptionCost);
  const spendRounded = round2(ingredientSpendInRange);
  const wasteLossRatioPercent =
    spendRounded > 0 ? round2((wasteRounded / spendRounded) * 100) : null;
  const consumptionCostRatioPercent =
    spendRounded > 0 ? round2((consumptionRounded / spendRounded) * 100) : null;

  const notes: string[] = [
    'Admin-only analytics context. All monetary fields are included.',
    'Use only these numbers. If a list is empty, say data is insufficient for that topic.',
    'Do not invent ingredients, costs, or percentages not present in this JSON.',
    'Consumption is kitchen usage (orders/prep), not waste. Keep waste and consumption separate.',
  ];

  if (activeBatchCount === 0 && activeWaste.length === 0 && activeUsage.length === 0) {
    notes.push('Very little operational data available for this restaurant/range.');
  }

  return {
    restaurantId: input.restaurantId,
    restaurantName: input.settings?.name || input.restaurantName,
    currency,
    amberThresholdDays: amberDays,
    asOf: now.toISOString(),
    range,
    inventory: {
      valuation: valuationRounded,
      activeBatchCount,
      expiredBatchCount,
      amberBatchCount,
      greenBatchCount,
      expiringSoon: expiringSoon.slice(0, 10),
      lowStock: lowStock.slice(0, 8),
      highValueItems: highValueItems.slice(0, 8),
    },
    waste: {
      totalLossInRange: wasteRounded,
      eventCountInRange: activeWaste.length,
      byReason,
      topIngredients,
      dailyTrend,
    },
    consumption: {
      totalCostInRange: consumptionRounded,
      eventCountInRange: activeUsage.length,
      topIngredients: Array.from(usageByIngredient.values())
        .map((row) => ({
          ingredientName: row.ingredientName,
          totalCost: round2(row.totalCost),
          quantityUsed: round2(row.quantityUsed),
          eventCount: row.eventCount,
        }))
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 8),
      byCategory: Array.from(usageByCategory.entries())
        .map(([category, row]) => ({
          category,
          totalCost: round2(row.totalCost),
          eventCount: row.eventCount,
        }))
        .sort((a, b) => b.totalCost - a.totalCost),
      dailyTrend: Array.from(usageDaily.entries())
        .map(([date, totalCost]) => ({ date, totalCost: round2(totalCost) }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14),
    },
    cost: {
      inventoryValue: valuationRounded,
      ingredientSpendInRange: spendRounded,
      wasteLossRatioPercent,
      consumptionCostRatioPercent,
    },
    notes,
  };
}
