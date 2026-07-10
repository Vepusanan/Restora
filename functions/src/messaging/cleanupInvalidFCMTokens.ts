import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';

/**
 * FR-051 — daily cleanup of tokens for deactivated users and inactive device docs.
 * Requires Blaze (Cloud Scheduler). Spark alternative: client logout + deactivate clears tokens.
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
    let clearedUsers = 0;
    let clearedDevices = 0;

    for (const userDoc of snap.docs) {
      const data = userDoc.data();
      const hasTokens =
        Boolean(data.fcmToken) ||
        (Array.isArray(data.fcmTokens) && data.fcmTokens.length > 0);

      const deviceSnap = await db
        .collection('deviceTokens')
        .where('userId', '==', userDoc.id)
        .get();

      await Promise.all(deviceSnap.docs.map((d) => d.ref.delete()));
      clearedDevices += deviceSnap.size;

      if (hasTokens) {
        await userDoc.ref.update({
          fcmToken: null,
          fcmTokens: [],
          updatedAt: FieldValue.serverTimestamp(),
        });
        clearedUsers += 1;
      }
    }

    logger.info('cleanupInvalidFCMTokens complete', {
      deactivatedUsers: snap.size,
      clearedUsers,
      clearedDevices,
    });
  },
);
