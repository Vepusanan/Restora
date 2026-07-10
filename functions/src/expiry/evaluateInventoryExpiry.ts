import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import {
  buildExpiryNotificationCopy,
  clampExpiryThreshold,
  daysUntilExpiry,
  DEFAULT_AMBER_DAYS,
  getExpiryTone,
  isExpiryTransition,
  shouldSuppressDuplicate,
  type ExpiryTone,
} from '../utils/expiry';
import { removeInvalidTokens, sendExpiryPush } from '../messaging/pushService';

type BatchDoc = {
  restaurantId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  dateReceived: string;
  expiryDate: string;
  evaluatedTone?: ExpiryTone | null;
  lastNotifiedTone?: ExpiryTone | null;
  lastNotifiedAt?: Timestamp | null;
};

function toDateOnly(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Timestamp) {
    const d = value.toDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return '';
}

/**
 * FR-021–FR-024 — hourly expiry evaluation + FCM dispatch with 24h duplicate suppression.
 * Writes batch docs only when tone changes or a notification is sent.
 */
export const evaluateInventoryExpiry = onSchedule(
  {
    schedule: 'every 1 hours',
    timeZone: 'UTC',
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async () => {
    const db = getFirestore();
    const now = new Date();
    let evaluated = 0;
    let transitions = 0;
    let notified = 0;
    let suppressed = 0;

    const restaurantsSnap = await db.collection('restaurants').get();
    logger.info('evaluateInventoryExpiry start', { restaurants: restaurantsSnap.size });

    for (const restaurantDoc of restaurantsSnap.docs) {
      const restaurantId = restaurantDoc.id;
      const restaurant = restaurantDoc.data();
      const amberDays = clampExpiryThreshold(
        Number(restaurant.expiryAlertThreshold ?? DEFAULT_AMBER_DAYS),
      );

      const batchesSnap = await db
        .collection('inventoryBatches')
        .where('restaurantId', '==', restaurantId)
        .where('consumed', '==', false)
        .where('archived', '==', false)
        .get();

      if (batchesSnap.empty) continue;

      const usersSnap = await db
        .collection('users')
        .where('restaurantId', '==', restaurantId)
        .where('status', '==', 'approved')
        .get();

      const userTokenMap = new Map<string, string[]>();
      for (const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        const tokens = Array.isArray(data.fcmTokens)
          ? data.fcmTokens.map(String).filter(Boolean)
          : [];
        if (data.fcmToken && !tokens.includes(String(data.fcmToken))) {
          tokens.push(String(data.fcmToken));
        }
        if (tokens.length > 0) userTokenMap.set(userDoc.id, tokens);
      }

      for (const batchDoc of batchesSnap.docs) {
        evaluated += 1;
        const data = batchDoc.data() as BatchDoc;
        const expiryDate = toDateOnly(data.expiryDate);
        if (!expiryDate) continue;

        const nextTone = getExpiryTone(expiryDate, now, amberDays);
        const previousTone = data.evaluatedTone ?? null;
        const toneChanged = previousTone !== nextTone;
        const shouldNotify = isExpiryTransition(previousTone, nextTone);

        if (!toneChanged && !shouldNotify) {
          continue;
        }

        const daysRemaining = daysUntilExpiry(expiryDate, now);
        const basePatch: Record<string, unknown> = {
          evaluatedTone: nextTone,
          lastEvaluatedAt: FieldValue.serverTimestamp(),
        };

        if (!shouldNotify) {
          await batchDoc.ref.update(basePatch);
          continue;
        }

        transitions += 1;
        const lastNotifiedAt = data.lastNotifiedAt?.toDate?.() ?? null;
        const suppress = shouldSuppressDuplicate({
          lastNotifiedTone: data.lastNotifiedTone,
          lastNotifiedAt,
          nextTone,
          now,
        });

        await db.collection('auditLogs').add({
          action: 'expiry_detected',
          restaurantId,
          batchId: batchDoc.id,
          userId: 'system',
          previousValues: { evaluatedTone: previousTone },
          newValues: { status: nextTone, daysRemaining, suppressed: suppress },
          timestamp: FieldValue.serverTimestamp(),
        });

        if (suppress) {
          suppressed += 1;
          await batchDoc.ref.update(basePatch);
          logger.info('Suppressed duplicate expiry notification', {
            batchId: batchDoc.id,
            status: nextTone,
          });
          continue;
        }

        const copy = buildExpiryNotificationCopy({
          ingredientName: String(data.ingredientName ?? 'Item'),
          quantity: Number(data.quantity ?? 0),
          unit: String(data.unit ?? ''),
          daysRemaining,
          status: nextTone,
        });

        const deepLink = 'restora://inventory';
        const payloadData = {
          type: 'expiry_alert',
          batchId: batchDoc.id,
          restaurantId,
          status: nextTone,
          deepLink,
          ingredientName: String(data.ingredientName ?? ''),
          quantity: String(data.quantity ?? 0),
          unit: String(data.unit ?? ''),
          dateReceived: toDateOnly(data.dateReceived),
          expiryDate,
          daysRemaining: String(daysRemaining),
        };

        const allTokens = Array.from(userTokenMap.values()).flat();
        const pushResult = await sendExpiryPush({
          tokens: allTokens,
          title: copy.title,
          body: copy.body,
          data: payloadData,
        });

        await removeInvalidTokens(userTokenMap, pushResult.invalidTokens);

        const historyRef = await db.collection('notificationHistory').add({
          restaurantId,
          batchId: batchDoc.id,
          status: nextTone,
          ingredientName: data.ingredientName,
          quantity: data.quantity,
          unit: data.unit,
          dateReceived: toDateOnly(data.dateReceived),
          expiryDate,
          daysRemaining,
          recipientCount: allTokens.length,
          successCount: pushResult.successCount,
          failureCount: pushResult.failureCount,
          triggeredAt: FieldValue.serverTimestamp(),
          title: copy.title,
          body: copy.body,
        });

        await Promise.all(
          usersSnap.docs.map((userDoc) =>
            db.collection('notifications').add({
              restaurantId,
              userId: userDoc.id,
              batchId: batchDoc.id,
              ingredientName: data.ingredientName,
              quantity: data.quantity,
              unit: data.unit,
              dateReceived: toDateOnly(data.dateReceived),
              expiryDate,
              daysRemaining,
              status: nextTone,
              title: copy.title,
              body: copy.body,
              read: false,
              deepLink,
              historyId: historyRef.id,
              createdAt: FieldValue.serverTimestamp(),
            }),
          ),
        );

        await db.collection('auditLogs').add({
          action:
            pushResult.failureCount > 0 && pushResult.successCount === 0
              ? 'notification_failed'
              : 'notification_sent',
          restaurantId,
          batchId: batchDoc.id,
          userId: 'system',
          previousValues: { evaluatedTone: previousTone },
          newValues: {
            status: nextTone,
            historyId: historyRef.id,
            successCount: pushResult.successCount,
            failureCount: pushResult.failureCount,
          },
          timestamp: FieldValue.serverTimestamp(),
        });

        await batchDoc.ref.update({
          ...basePatch,
          lastNotifiedTone: nextTone,
          lastNotifiedAt: FieldValue.serverTimestamp(),
        });

        notified += 1;
        logger.info('Expiry notification dispatched', {
          batchId: batchDoc.id,
          status: nextTone,
          successCount: pushResult.successCount,
          failureCount: pushResult.failureCount,
        });
      }
    }

    logger.info('evaluateInventoryExpiry complete', {
      evaluated,
      transitions,
      notified,
      suppressed,
    });
  },
);
