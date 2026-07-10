import { useMemo, useState } from 'react';
import { useInventory } from '@hooks/useInventory';
import { useWasteLogs } from '@hooks/useWasteLogs';
import { useConsumptionLogs } from '@hooks/useConsumptionLogs';
import { useAuth } from '@hooks/useAuth';
import { canAccessModule } from '@utils/rbac';
import {
  calculateIngredientCost,
  calculateInventoryValuation,
  defaultFinancialRange,
} from '@utils/financial';
import {
  aggregateWasteCostByPeriod,
  buildIngredientCostBreakdown,
  rankTopWastedIngredients,
  totalWasteInRange,
} from '@utils/analytics';
import {
  aggregateConsumptionByCategory,
  aggregateConsumptionByPeriod,
  buildInventoryTurnover,
  calculateConsumptionCostTotal,
  rankTopConsumedIngredients,
} from '@utils/consumption';
import type {
  AggregationPeriod,
  AnalyticsDashboardSnapshot,
  FinancialDateRange,
} from '@/types';

/**
 * Admin analytics dashboard (FR-036–FR-041 + Module 3.11 consumption).
 * Realtime via inventory + waste + usage listeners; client-side aggregation.
 */
export function useAnalyticsDashboard(restaurantId: string | undefined) {
  const { profile, isAdmin } = useAuth();
  const allowed = isAdmin || canAccessModule(profile?.role, 'analytics');
  const inventory = useInventory(allowed ? restaurantId : undefined);
  const waste = useWasteLogs(allowed ? restaurantId : undefined);
  const usage = useConsumptionLogs(allowed ? restaurantId : undefined);

  const [range, setRange] = useState<FinancialDateRange>(() => defaultFinancialRange());
  const [period, setPeriod] = useState<AggregationPeriod>('day');
  const [topLimit, setTopLimit] = useState<5 | 10 | 20>(10);

  const valuation = useMemo(
    () => calculateInventoryValuation(inventory.batches, inventory.now),
    [inventory.batches, inventory.now],
  );

  const wasteTrends = useMemo(
    () => aggregateWasteCostByPeriod(waste.logs, range, period),
    [waste.logs, range, period],
  );

  const totalWasteCost = useMemo(
    () => totalWasteInRange(waste.logs, range),
    [waste.logs, range],
  );

  const topWasted = useMemo(
    () => rankTopWastedIngredients(waste.logs, range, topLimit),
    [waste.logs, range, topLimit],
  );

  const consumptionTrends = useMemo(
    () => aggregateConsumptionByPeriod(usage.logs, range, period),
    [usage.logs, range, period],
  );

  const consumptionCost = useMemo(
    () => calculateConsumptionCostTotal(usage.logs, range),
    [usage.logs, range],
  );

  const topConsumed = useMemo(
    () => rankTopConsumedIngredients(usage.logs, range, topLimit),
    [usage.logs, range, topLimit],
  );

  const consumptionByCategory = useMemo(
    () => aggregateConsumptionByCategory(usage.logs, range),
    [usage.logs, range],
  );

  const inventoryTurnover = useMemo(
    () => buildInventoryTurnover(inventory.batches, usage.logs, range, inventory.now),
    [inventory.batches, usage.logs, range, inventory.now],
  );

  const ingredientBreakdown = useMemo(
    () => buildIngredientCostBreakdown(inventory.batches, waste.logs, range, usage.logs),
    [inventory.batches, waste.logs, usage.logs, range],
  );

  const totalIngredientCost = useMemo(
    () =>
      calculateIngredientCost(inventory.batches, waste.logs, range, undefined, usage.logs)
        .totalCost,
    [inventory.batches, waste.logs, usage.logs, range],
  );

  const snapshot: AnalyticsDashboardSnapshot = useMemo(
    () => ({
      restaurantName: profile?.restaurantName ?? 'Restaurant',
      range,
      period,
      generatedAt: new Date().toISOString(),
      inventoryValue: valuation.totalValue,
      totalWasteCost,
      totalConsumptionCost: consumptionCost.totalCost,
      totalIngredientCost,
      wasteTrends,
      consumptionTrends,
      topWasted,
      topConsumed,
      consumptionByCategory,
      inventoryTurnover,
      ingredientBreakdown,
    }),
    [
      profile?.restaurantName,
      range,
      period,
      valuation.totalValue,
      totalWasteCost,
      consumptionCost.totalCost,
      totalIngredientCost,
      wasteTrends,
      consumptionTrends,
      topWasted,
      topConsumed,
      consumptionByCategory,
      inventoryTurnover,
      ingredientBreakdown,
    ],
  );

  return {
    allowed,
    loading: allowed ? inventory.loading || waste.loading || usage.loading : false,
    error: inventory.error || waste.error || usage.error,
    range,
    setRange,
    period,
    setPeriod,
    topLimit,
    setTopLimit,
    valuation,
    wasteTrends,
    totalWasteCost,
    topWasted,
    consumptionTrends,
    totalConsumptionCost: consumptionCost.totalCost,
    topConsumed,
    consumptionByCategory,
    inventoryTurnover,
    ingredientBreakdown,
    totalIngredientCost,
    lastUpdated: inventory.now,
    snapshot,
  };
}
