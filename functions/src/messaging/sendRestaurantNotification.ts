import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import {
  loadRestaurantDeviceTokens,
  removeInvalidTokens,
  sendRestaurantPush,
} from './pushService';
import { createInboxNotifications, type NotificationPriority, type NotificationType } from './createNotificationDocument';

type SendRequest = {
  restaurantId?: string;
  title?: string;
  body?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  batchId?: string;
  deepLink?: string;
  metadata?: Record<string, unknown>;
  createInbox?: boolean;
};

/**
 * FR-049 — admin-triggered restaurant-wide push + optional inbox fan-out.
 * Requires Blaze (callable + FCM Admin SDK).
 */
export const sendRestaurantNotification = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required');
    }

    const data = (request.data ?? {}) as SendRequest;
    const title = String(data.title ?? '').trim();
    const body = String(data.body ?? '').trim();
    const restaurantId = String(data.restaurantId ?? '').trim();
    const type = (data.type ?? 'system') as NotificationType;

    if (!title || !body || !restaurantId) {
      throw new HttpsError('invalid-argument', 'restaurantId, title, and body are required');
    }

    const db = getFirestore();
    const adminSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!adminSnap.exists) {
      throw new HttpsError('permission-denied', 'Profile not found');
    }
    const admin = adminSnap.data()!;
    if (
      admin.role !== 'admin' ||
      admin.status !== 'approved' ||
      admin.restaurantId !== restaurantId
    ) {
      throw new HttpsError('permission-denied', 'Only restaurant admins can send notifications');
    }

    const { tokens, userTokenMap, userIds } = await loadRestaurantDeviceTokens(restaurantId);
    const pushResult = await sendRestaurantPush({
      tokens,
      title,
      body,
      data: {
        type,
        restaurantId,
        batchId: String(data.batchId ?? ''),
        deepLink: String(data.deepLink ?? 'restora://inbox'),
      },
      androidChannelId: 'restora-alerts',
    });

    await removeInvalidTokens(userTokenMap, pushResult.invalidTokens);

    let inboxIds: string[] = [];
    if (data.createInbox !== false) {
      inboxIds = await createInboxNotifications({
        restaurantId,
        userIds,
        batchId: data.batchId,
        type,
        priority: data.priority ?? 'normal',
        title,
        body,
        deepLink: data.deepLink,
        createdBy: request.auth.uid,
        metadata: data.metadata ?? {},
      });
    }

    await db.collection('auditLogs').add({
      action:
        pushResult.failureCount > 0 && pushResult.successCount === 0
          ? 'notification_failed'
          : 'notification_sent',
      restaurantId,
      batchId: data.batchId ?? '',
      userId: request.auth.uid,
      notificationId: inboxIds[0] ?? null,
      deviceId: null,
      previousValues: null,
      newValues: {
        successCount: pushResult.successCount,
        failureCount: pushResult.failureCount,
        recipientCount: tokens.length,
        inboxCount: inboxIds.length,
        type,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    logger.info('sendRestaurantNotification complete', {
      restaurantId,
      successCount: pushResult.successCount,
      failureCount: pushResult.failureCount,
    });

    return {
      ok: true,
      successCount: pushResult.successCount,
      failureCount: pushResult.failureCount,
      recipientCount: tokens.length,
      inboxIds,
    };
  },
);
