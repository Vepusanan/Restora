import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationService } from '@services/notifications.service';
import { useAuth } from '@hooks/useAuth';
import {
  countUnreadNotifications,
  filterInboxNotifications,
  isNotificationUnread,
} from '@utils/notifications';
import type {
  AppNotification,
  NotificationInboxFilters,
  NotificationTypeFilter,
  ServiceError,
} from '@/types';

const DEFAULT_FILTERS: NotificationInboxFilters = {
  type: 'all',
  unreadOnly: false,
};

/**
 * FR-052 — realtime inbox with filters, badge count, and mark-read actions.
 */
export function useNotifications() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationInboxFilters>(DEFAULT_FILTERS);
  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = notificationService.subscribeForUser(user.uid, (next) => {
      setItems(next);
      setLoading(false);
      setError(null);
    });

    return unsub;
  }, [user?.uid]);

  const filtered = useMemo(() => {
    if (!user?.uid) return [];
    return filterInboxNotifications(items, filters, user.uid);
  }, [items, filters, user?.uid]);

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const unreadCount = useMemo(() => {
    if (!user?.uid) return 0;
    return countUnreadNotifications(items, user.uid);
  }, [items, user?.uid]);

  const hasMore = visible.length < filtered.length;

  const setTypeFilter = useCallback((type: NotificationTypeFilter) => {
    setFilters((prev) => ({ ...prev, type }));
    setVisibleCount(30);
  }, []);

  const setUnreadOnly = useCallback((unreadOnly: boolean) => {
    setFilters((prev) => ({ ...prev, unreadOnly }));
    setVisibleCount(30);
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((prev) => prev + 30);
  }, [hasMore]);

  const refresh = useCallback(async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    try {
      // Listener is live; pull-to-refresh just re-asserts loading UX.
      setRefreshing(false);
    } catch (err) {
      setError((err as ServiceError).message ?? 'Unable to refresh notifications');
      setRefreshing(false);
    }
  }, [user?.uid]);

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!user?.uid) return;
      try {
        await notificationService.markRead(
          notificationId,
          user.uid,
          profile?.restaurantId,
        );
      } catch (err) {
        setError((err as ServiceError).message ?? 'Unable to mark as read');
      }
    },
    [user?.uid, profile?.restaurantId],
  );

  const markAllRead = useCallback(async () => {
    if (!user?.uid) return;
    try {
      await notificationService.markAllRead(user.uid, items);
    } catch (err) {
      setError((err as ServiceError).message ?? 'Unable to mark all as read');
    }
  }, [user?.uid, items]);

  const openNotification = useCallback(
    async (item: AppNotification) => {
      if (!user?.uid) return;
      if (isNotificationUnread(item, user.uid)) {
        await markRead(item.id);
      }
      await notificationService.markOpened(item.id, user.uid, profile?.restaurantId);
    },
    [user?.uid, profile?.restaurantId, markRead],
  );

  return {
    items: visible,
    allItems: items,
    filteredCount: filtered.length,
    loading,
    refreshing,
    error,
    filters,
    unreadCount,
    hasMore,
    setTypeFilter,
    setUnreadOnly,
    loadMore,
    refresh,
    markRead,
    markAllRead,
    openNotification,
  };
}
