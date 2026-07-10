import { useEffect, useMemo, useState } from 'react';
import { inventoryService } from '@services/inventory.service';
import { restaurantService } from '@services/restaurant.service';
import { DEFAULT_INVENTORY_FILTERS, EXPIRY_AMBER_DAYS } from '@constants/inventory';
import { buildInventoryGroups, uniqueSuppliers } from '@utils/inventory';
import type { InventoryBatch, InventoryFilters } from '@/types';

/**
 * Realtime inventory + restaurant threshold for expiry tones (FR-013/016/020/025).
 */
export function useInventory(restaurantId: string | undefined) {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>(DEFAULT_INVENTORY_FILTERS);
  const [now, setNow] = useState(() => new Date());
  const [amberDays, setAmberDays] = useState(EXPIRY_AMBER_DAYS);

  useEffect(() => {
    if (!restaurantId) {
      setBatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = inventoryService.subscribeBatches(restaurantId, (next) => {
      setBatches(next);
      setLoading(false);
      setNow(new Date());
    });

    return unsubscribe;
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    return restaurantService.subscribe(restaurantId, (restaurant) => {
      if (restaurant) setAmberDays(restaurant.expiryAlertThreshold);
    });
  }, [restaurantId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const groups = useMemo(
    () => buildInventoryGroups(batches, filters, now, amberDays),
    [batches, filters, now, amberDays],
  );

  const suppliers = useMemo(() => uniqueSuppliers(batches), [batches]);

  return {
    batches,
    groups,
    suppliers,
    loading,
    error,
    filters,
    setFilters,
    now,
    amberDays,
    refreshExpiry: () => setNow(new Date()),
  };
}
