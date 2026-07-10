import { useMemo, useState } from 'react';
import { useInventory } from '@hooks/useInventory';
import { useWasteLogs } from '@hooks/useWasteLogs';
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
import type {
  AggregationPeriod,
  AnalyticsDashboardSnapshot,
  FinancialDateRange,
} from '@/types';

/**
 * Admin analytics dashboard (FR-036–FR-041).
 * Realtime via existing inventory + waste listeners; client-side aggregation (no Blaze).
 */
export function useAnalyticsDashboard(restaurantId: string | undefined) {
  const { profile, isAdmin } = useAuth();
  // Admin layout already gates this route; also accept isAdmin for profile timing edge cases.
  const allowed = isAdmin || canAccessModule(profile?.role, 'analytics');
  const inventory = useInventory(allowed ? restaurantId : undefined);
  const waste = useWasteLogs(allowed ? restaurantId : undefined);

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

  const ingredientBreakdown = useMemo(
    () => buildIngredientCostBreakdown(inventory.batches, waste.logs, range),
    [inventory.batches, waste.logs, range],
  );

  const totalIngredientCost = useMemo(
    () => calculateIngredientCost(inventory.batches, waste.logs, range).totalCost,
    [inventory.batches, waste.logs, range],
  );

  const snapshot: AnalyticsDashboardSnapshot = useMemo(
    () => ({
      restaurantName: profile?.restaurantName ?? 'Restaurant',
      range,
      period,
      generatedAt: new Date().toISOString(),
      inventoryValue: valuation.totalValue,
      totalWasteCost,
      totalIngredientCost,
      wasteTrends,
      topWasted,
      ingredientBreakdown,
    }),
    [
      profile?.restaurantName,
      range,
      period,
      valuation.totalValue,
      totalWasteCost,
      totalIngredientCost,
      wasteTrends,
      topWasted,
      ingredientBreakdown,
    ],
  );

  return {
    allowed,
    loading: allowed ? inventory.loading || waste.loading : false,
    error: inventory.error || waste.error,
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
    ingredientBreakdown,
    totalIngredientCost,
    lastUpdated: inventory.now,
    snapshot,
  };
}
