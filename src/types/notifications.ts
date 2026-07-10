import type { ExpiryTone } from './inventory';

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
  status: 'amber' | 'red';
  title: string;
  body: string;
  read: boolean;
  deepLink: string;
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

export type ExpiryEvaluationFields = {
  evaluatedTone: ExpiryTone | null;
  lastNotifiedTone: ExpiryTone | null;
  lastNotifiedAt: string | null;
  lastEvaluatedAt: string | null;
};
