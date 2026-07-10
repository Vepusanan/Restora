import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { auditService } from '@services/audit.service';
import { useAuth } from '@hooks/useAuth';
import { filterAuditEntries } from '@utils/audit';
import { AUDIT_PAGE_SIZE } from '@constants/audit';
import type { AuditFilters, AuditLogEntry, ServiceError } from '@/types';

const DEFAULT_FILTERS: AuditFilters = {
  search: '',
  action: 'all',
  actionType: 'all',
  module: 'all',
  actorId: 'all',
  dateFrom: '',
  dateTo: '',
  sort: 'newest',
};

/**
 * FR-054 — admin audit history with cursor pagination + client-side filter refinement.
 */
export function useAuditLogs() {
  const { profile, isAdmin } = useAuth();
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const restaurantId = profile?.restaurantId;

  const loadPage = useCallback(
    async (reset: boolean) => {
      if (!restaurantId || !isAdmin) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        if (reset) setLoading(true);
        else setLoadingMore(true);

        const page = await auditService.fetchPage({
          restaurantId,
          pageSize: AUDIT_PAGE_SIZE,
          cursor: reset ? null : cursor,
          ascending: filters.sort === 'oldest',
        });

        setItems((prev) => (reset ? page.items : [...prev, ...page.items]));
        setCursor(page.cursor);
        setHasMore(page.hasMore);
        setError(null);
      } catch (err) {
        setError((err as ServiceError).message ?? 'Unable to load audit history');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [restaurantId, isAdmin, cursor, filters.sort],
  );

  useEffect(() => {
    setCursor(null);
    void loadPage(true);
    // Intentionally reset when restaurant / sort changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, isAdmin, filters.sort]);

  const filtered = useMemo(
    () => filterAuditEntries(items, filters),
    [items, filters],
  );

  const actors = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      if (item.actorId) map.set(item.actorId, item.actorName || item.actorId);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setCursor(null);
    // Force fresh first page
    if (!restaurantId || !isAdmin) {
      setRefreshing(false);
      return;
    }
    try {
      const page = await auditService.fetchPage({
        restaurantId,
        pageSize: AUDIT_PAGE_SIZE,
        cursor: null,
        ascending: filters.sort === 'oldest',
      });
      setItems(page.items);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
      setError(null);
    } catch (err) {
      setError((err as ServiceError).message ?? 'Unable to refresh audit history');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [restaurantId, isAdmin, filters.sort]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    void loadPage(false);
  }, [hasMore, loadingMore, loading, loadPage]);

  const updateFilters = useCallback((patch: Partial<AuditFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  return {
    items: filtered,
    rawCount: items.length,
    loading,
    loadingMore,
    refreshing,
    error,
    filters,
    hasMore,
    actors,
    updateFilters,
    refresh,
    loadMore,
    isAdmin,
  };
}
