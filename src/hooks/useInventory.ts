import { useEffect, useMemo, useState } from 'react';
import { inventoryService } from '@services/inventory.service';
import { DEFAULT_INVENTORY_FILTERS } from '@constants/inventory';
import { buildInventoryGroups, uniqueSuppliers } from '@utils/inventory';
import type { InventoryBatch, InventoryFilters } from '@/types';

/**
 * Realtime inventory subscription + client-side search/filter/FIFO grouping (FR-013/020).
 * Expiry tones recalculate on every snapshot and on a 60s tick (covers FR-016).
 */
export function useInventory(restaurantId: string | undefined) {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>(DEFAULT_INVENTORY_FILTERS);
  const [now, setNow] = useState(() => new Date());

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

  // Recalculate derived expiry status while the screen is open (FR-016).
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const groups = useMemo(
    () => buildInventoryGroups(batches, filters, now),
    [batches, filters, now],
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
    refreshExpiry: () => setNow(new Date()),
  };
}
