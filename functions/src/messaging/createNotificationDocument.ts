import { FieldValue, getFirestore } from 'firebase-admin/firestore';

export type NotificationType = 'expiry' | 'inventory' | 'staff' | 'system' | 'ai';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * FR-052 / Functions — fan-out inbox documents to approved restaurant users.
 * Idempotent when called once per event; callers should pass a stable historyId.
 */
export async function createInboxNotifications(input: {
  restaurantId: string;
  userIds: string[];
  batchId?: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  body: string;
  deepLink?: string;
  historyId?: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
  expiryFields?: {
    ingredientName: string;
    quantity: number;
    unit: string;
    dateReceived: string;
    expiryDate: string;
    daysRemaining: number;
    status: 'amber' | 'red';
  };
}): Promise<string[]> {
  const db = getFirestore();
  const ids: string[] = [];
  const uniqueUsers = Array.from(new Set(input.userIds.filter(Boolean)));

  await Promise.all(
    uniqueUsers.map(async (userId) => {
      const ref = await db.collection('notifications').add({
        restaurantId: input.restaurantId,
        userId,
        batchId: input.batchId ?? '',
        type: input.type,
        priority: input.priority ?? 'normal',
        title: input.title,
        body: input.body,
        read: false,
        readBy: [],
        deepLink: input.deepLink ?? 'restora://inbox',
        historyId: input.historyId ?? null,
        createdBy: input.createdBy ?? 'system',
        metadata: input.metadata ?? {},
        ingredientName: input.expiryFields?.ingredientName ?? '',
        quantity: input.expiryFields?.quantity ?? 0,
        unit: input.expiryFields?.unit ?? '',
        dateReceived: input.expiryFields?.dateReceived ?? '',
        expiryDate: input.expiryFields?.expiryDate ?? '',
        daysRemaining: input.expiryFields?.daysRemaining ?? 0,
        status: input.expiryFields?.status ?? null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      ids.push(ref.id);
    }),
  );

  return ids;
}
