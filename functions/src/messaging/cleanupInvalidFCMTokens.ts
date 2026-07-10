import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';

/**
 * Daily cleanup: strip FCM tokens from deactivated accounts so they stop receiving alerts.
 * Invalid tokens for active users are removed inline during sendExpiryPush failures.
 */
export const cleanupInvalidFCMTokens = onSchedule(
  {
    schedule: 'every 24 hours',
    timeZone: 'UTC',
    region: 'us-central1',
    timeoutSeconds: 300,
    memory: '256MiB',
  },
  async () => {
    const db = getFirestore();
    const snap = await db.collection('users').where('status', '==', 'deactivated').get();
    let cleared = 0;

    for (const userDoc of snap.docs) {
      const data = userDoc.data();
      const hasTokens =
        Boolean(data.fcmToken) ||
        (Array.isArray(data.fcmTokens) && data.fcmTokens.length > 0);
      if (!hasTokens) continue;

      await userDoc.ref.update({
        fcmToken: null,
        fcmTokens: [],
        updatedAt: FieldValue.serverTimestamp(),
      });
      cleared += 1;
    }

    logger.info('cleanupInvalidFCMTokens complete', {
      deactivatedUsers: snap.size,
      cleared,
    });
  },
);
