import {
  NOTIFICATION_RETENTION_DAYS,
  NOTIFICATION_TYPE_LABELS,
} from '@constants/notifications';
import type {
  AppNotification,
  NotificationInboxFilters,
  NotificationType,
} from '@/types';

/** Deterministic doc id prevents duplicate device records for the same user+device. */
export function buildDeviceTokenDocId(userId: string, deviceId: string): string {
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDevice = deviceId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return `${safeUser}_${safeDevice}`;
}

export function notificationRetentionCutoff(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - NOTIFICATION_RETENTION_DAYS);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}

export function isWithinNotificationRetention(
  createdAt: string,
  now = new Date(),
): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return created.getTime() >= notificationRetentionCutoff(now).getTime();
}

export function isNotificationUnread(
  notification: Pick<AppNotification, 'read' | 'readBy'>,
  userId: string,
): boolean {
  if (notification.readBy.length > 0) {
    return !notification.readBy.includes(userId);
  }
  return !notification.read;
}

export function countUnreadNotifications(
  items: AppNotification[],
  userId: string,
): number {
  return items.filter((item) => isNotificationUnread(item, userId)).length;
}

export function filterInboxNotifications(
  items: AppNotification[],
  filters: NotificationInboxFilters,
  userId: string,
  now = new Date(),
): AppNotification[] {
  return items.filter((item) => {
    if (!isWithinNotificationRetention(item.createdAt, now)) return false;
    if (filters.type !== 'all' && item.type !== filters.type) return false;
    if (filters.unreadOnly && !isNotificationUnread(item, userId)) return false;
    return true;
  });
}

export function notificationTypeLabel(type: NotificationType | 'all'): string {
  return NOTIFICATION_TYPE_LABELS[type] ?? type;
}

export function resolveNotificationType(raw: unknown, status?: unknown): NotificationType {
  if (
    raw === 'expiry' ||
    raw === 'inventory' ||
    raw === 'staff' ||
    raw === 'system' ||
    raw === 'ai'
  ) {
    return raw;
  }
  if (status === 'amber' || status === 'red') return 'expiry';
  return 'system';
}
