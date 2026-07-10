import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_WASTE_FILTERS } from '@constants/waste';
import { wasteService } from '@services/waste.service';
import { filterWasteLogs, summarizeWasteLogs } from '@utils/waste';
import type { WasteFilters, WasteLog, WasteSummary } from '@/types';

export function useWasteLogs(restaurantId: string | undefined) {
  const [logs, setLogs] = useState<WasteLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WasteFilters>({ ...DEFAULT_WASTE_FILTERS });

  useEffect(() => {
    if (!restaurantId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    return wasteService.subscribeLogs(restaurantId, (next) => {
      setLogs(next);
      setLoading(false);
      setError(null);
    });
  }, [restaurantId]);

  const filtered = useMemo(() => filterWasteLogs(logs, filters), [logs, filters]);
  const summary: WasteSummary = useMemo(() => summarizeWasteLogs(logs), [logs]);

  const loggers = useMemo(() => {
    const map = new Map<string, string>();
    for (const log of logs) {
      if (log.loggedBy) map.set(log.loggedBy, log.loggedByName || log.loggedBy);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  return {
    logs,
    filtered,
    summary,
    loggers,
    loading,
    error,
    filters,
    setFilters,
  };
}
