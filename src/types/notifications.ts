import type { ExpiryTone } from './inventory';

/** FR-052 notification categories */
export type NotificationType =
  | 'expiry'
  | 'inventory'
  | 'staff'
  | 'system'
  | 'ai';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export type DevicePlatform = 'ios' | 'android' | 'web';

/** FR-048 — one document per user device */
export type DeviceToken = {
  id: string;
  userId: string;
  restaurantId: string;
  fcmToken: string;
  deviceId: string;
  platform: DevicePlatform;
  appVersion: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
};

export type AppNotification = {
  id: string;
  restaurantId: string;
  userId: string;
  batchId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  dateReceived: string;
  expiryDate: string;
  daysRemaining: number;
  /** Legacy expiry tone; prefer `type` for filtering */
  status: 'amber' | 'red' | null;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  read: boolean;
  readBy: string[];
  deepLink: string;
  createdBy: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type NotificationHistoryEntry = {
  id: string;
  restaurantId: string;
  batchId: string;
  status: 'amber' | 'red';
  ingredientName: string;
  quantity: number;
  unit: string;
  dateReceived: string;
  expiryDate: string;
  daysRemaining: number;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  triggeredAt: string;
};

export type NotificationTypeFilter = NotificationType | 'all';

export type NotificationInboxFilters = {
  type: NotificationTypeFilter;
  unreadOnly: boolean;
};

export type ExpiryEvaluationFields = {
  evaluatedTone: ExpiryTone | null;
  lastNotifiedTone: ExpiryTone | null;
  lastNotifiedAt: string | null;
  lastEvaluatedAt: string | null;
};

export type RegisterDeviceTokenInput = {
  userId: string;
  restaurantId: string;
  fcmToken: string;
  deviceId: string;
  platform: DevicePlatform;
  appVersion: string;
};
