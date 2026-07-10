import type { NotificationType, NotificationTypeFilter } from '@/types';

export const NOTIFICATION_RETENTION_DAYS = 30;
export const NOTIFICATION_PAGE_SIZE = 30;

export const NOTIFICATION_TYPES: NotificationType[] = [
  'expiry',
  'inventory',
  'staff',
  'system',
  'ai',
];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType | 'all', string> = {
  all: 'All',
  expiry: 'Expiry',
  inventory: 'Inventory',
  staff: 'Staff',
  system: 'System',
  ai: 'AI',
};

export const DEVICE_ID_STORAGE_KEY = 'restora.deviceId';
export const DEVICE_TOKEN_STORAGE_KEY = 'restora.fcmToken';

export function isNotificationTypeFilter(value: string): value is NotificationTypeFilter {
  return value === 'all' || NOTIFICATION_TYPES.includes(value as NotificationType);
}
