import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_USAGE_FILTERS } from '@constants/consumption';
import { consumptionService } from '@services/consumption.service';
import { filterUsageLogs, summarizeUsageLogs } from '@utils/consumption';
import type { UsageFilters, InventoryUsageLog, UsageSummary } from '@/types';

export function useConsumptionLogs(restaurantId: string | undefined) {
  const [logs, setLogs] = useState<InventoryUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UsageFilters>({ ...DEFAULT_USAGE_FILTERS });

  useEffect(() => {
    if (!restaurantId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    return consumptionService.subscribeLogs(restaurantId, (next) => {
      setLogs(next);
      setLoading(false);
      setError(null);
    });
  }, [restaurantId]);

  const filtered = useMemo(() => filterUsageLogs(logs, filters), [logs, filters]);
  const summary: UsageSummary = useMemo(() => summarizeUsageLogs(logs), [logs]);

  const users = useMemo(() => {
    const map = new Map<string, string>();
    for (const log of logs) {
      if (log.usedBy) map.set(log.usedBy, log.usedByName || log.usedBy);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  return {
    logs,
    filtered,
    summary,
    users,
    loading,
    error,
    filters,
    setFilters,
  };
}
