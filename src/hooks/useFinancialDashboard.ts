import { useEffect, useMemo, useState } from 'react';
import { useInventory } from '@hooks/useInventory';
import { useWasteLogs } from '@hooks/useWasteLogs';
import { useConsumptionLogs } from '@hooks/useConsumptionLogs';
import { useAuth } from '@hooks/useAuth';
import { canAccessModule } from '@utils/rbac';
import {
  calculateIngredientCost,
  calculateInventoryValuation,
  calculateWasteLoss,
  defaultFinancialRange,
} from '@utils/financial';
import { calculateConsumptionCostTotal } from '@utils/consumption';
import { ingredientKey } from '@utils/expiry';
import type { FinancialDateRange, WasteReason } from '@/types';

/**
 * Admin financial dashboard (FR-032–FR-035).
 * Computes from realtime inventory + waste + usage snapshots.
 */
export function useFinancialDashboard(restaurantId: string | undefined) {
  const { profile } = useAuth();
  const allowed = canAccessModule(profile?.role, 'financial');
  const inventory = useInventory(allowed ? restaurantId : undefined);
  const waste = useWasteLogs(allowed ? restaurantId : undefined);
  const usage = useConsumptionLogs(allowed ? restaurantId : undefined);

  const [ingredientRange, setIngredientRange] = useState<FinancialDateRange>(() =>
    defaultFinancialRange(),
  );
  const [wasteRange, setWasteRange] = useState<FinancialDateRange>(() =>
    defaultFinancialRange(),
  );
  const [ingredientName, setIngredientName] = useState<string | null>(null);
  const [supplier, setSupplier] = useState<string | null>(null);
  const [wasteReason, setWasteReason] = useState<WasteReason | null>(null);
  const [wasteIngredient, setWasteIngredient] = useState<string | null>(null);

  const valuation = useMemo(
    () => calculateInventoryValuation(inventory.batches, inventory.now),
    [inventory.batches, inventory.now],
  );

  const ingredientCost = useMemo(
    () =>
      calculateIngredientCost(
        inventory.batches,
        waste.logs,
        ingredientRange,
        {
          ingredientKey: ingredientName ? ingredientKey(ingredientName) : null,
          supplier,
        },
        usage.logs,
      ),
    [inventory.batches, waste.logs, usage.logs, ingredientRange, ingredientName, supplier],
  );

  const wasteLoss = useMemo(
    () =>
      calculateWasteLoss(waste.logs, wasteRange, {
        wasteReason,
        ingredientKey: wasteIngredient ? ingredientKey(wasteIngredient) : null,
      }),
    [waste.logs, wasteRange, wasteReason, wasteIngredient],
  );

  const consumptionCost = useMemo(
    () => calculateConsumptionCostTotal(usage.logs, wasteRange),
    [usage.logs, wasteRange],
  );

  const ingredientOptions = useMemo(() => {
    const names = new Set<string>();
    for (const batch of inventory.batches) names.add(batch.ingredientName);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [inventory.batches]);

  const wasteIngredientOptions = useMemo(() => {
    const names = new Set<string>();
    for (const log of waste.logs) {
      if (!log.voided) names.add(log.ingredientName);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [waste.logs]);

  return {
    allowed,
    loading: allowed ? inventory.loading || waste.loading || usage.loading : false,
    valuation,
    ingredientCost,
    wasteLoss,
    consumptionCost,
    ingredientRange,
    setIngredientRange,
    wasteRange,
    setWasteRange,
    ingredientName,
    setIngredientName,
    supplier,
    setSupplier,
    wasteReason,
    setWasteReason,
    wasteIngredient,
    setWasteIngredient,
    ingredientOptions,
    wasteIngredientOptions,
    suppliers: inventory.suppliers,
    lastUpdated: inventory.now,
  };
}

/** Lightweight access probe for staff denial messaging. */
export function useFinancialAccess(): { allowed: boolean; checking: boolean } {
  const { profile, profileLoading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setChecking(profileLoading);
  }, [profileLoading]);

  return {
    allowed: canAccessModule(profile?.role, 'financial'),
    checking,
  };
}
