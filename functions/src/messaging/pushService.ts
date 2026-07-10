import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

export type PushResult = {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
};

const MAX_RETRIES = 2;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * FR-049 — multicast FCM with retry and invalid-token collection.
 */
export async function sendRestaurantPush(input: {
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, string>;
  androidChannelId?: string;
}): Promise<PushResult> {
  const uniqueTokens = Array.from(new Set(input.tokens.filter(Boolean)));
  if (uniqueTokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const messaging: Messaging = getMessaging();
  let successCount = 0;
  let failureCount = 0;
  const invalidTokens: string[] = [];
  const channelId = input.androidChannelId ?? 'expiry-alerts';

  for (let i = 0; i < uniqueTokens.length; i += 500) {
    const chunk = uniqueTokens.slice(i, i + 500);
    let attempt = 0;
    let sent = false;

    while (attempt <= MAX_RETRIES && !sent) {
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: chunk,
          notification: {
            title: input.title,
            body: input.body,
          },
          data: input.data,
          android: {
            priority: 'high',
            notification: {
              channelId,
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
              },
            },
          },
        });

        response.responses.forEach((item, index) => {
          if (item.success) {
            successCount += 1;
            return;
          }
          failureCount += 1;
          const code = item.error?.code ?? '';
          if (
            code.includes('registration-token-not-registered') ||
            code.includes('invalid-registration-token') ||
            code.includes('invalid-argument')
          ) {
            const token = chunk[index];
            if (token) invalidTokens.push(token);
          }
        });
        sent = true;
      } catch (error) {
        attempt += 1;
        console.error('FCM send attempt failed', { attempt, error });
        if (attempt > MAX_RETRIES) {
          failureCount += chunk.length;
        } else {
          await sleep(250 * attempt);
        }
      }
    }
  }

  return { successCount, failureCount, invalidTokens };
}

/** @deprecated Use sendRestaurantPush */
export const sendExpiryPush = sendRestaurantPush;

/**
 * FR-051 — remove invalid tokens from deviceTokens + legacy users.fcmTokens.
 */
export async function removeInvalidTokens(
  userTokenMap: Map<string, string[]>,
  invalidTokens: string[],
): Promise<void> {
  if (invalidTokens.length === 0) return;
  const db = getFirestore();
  const invalid = new Set(invalidTokens);

  for (const [uid, tokens] of userTokenMap.entries()) {
    const stale = tokens.filter((token) => invalid.has(token));
    if (stale.length === 0) continue;
    await db
      .collection('users')
      .doc(uid)
      .update({
        fcmTokens: FieldValue.arrayRemove(...stale),
        fcmToken: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
  }

  for (const token of invalid) {
    const snap = await db.collection('deviceTokens').where('fcmToken', '==', token).get();
    await Promise.all(
      snap.docs.map((docSnap) =>
        docSnap.ref.delete().catch((error) => {
          console.warn('Failed deleting invalid deviceTokens doc', docSnap.id, error);
        }),
      ),
    );
  }
}

/**
 * Load all active FCM tokens for a restaurant (deviceTokens preferred, users fallback).
 * FR-057 — optionally filter by notification preferences and expiry tone.
 */
export async function loadRestaurantDeviceTokens(
  restaurantId: string,
  options?: { tone?: 'amber' | 'red' },
): Promise<{
  tokens: string[];
  userTokenMap: Map<string, string[]>;
  userIds: string[];
}> {
  const db = getFirestore();
  const userTokenMap = new Map<string, string[]>();

  const usersSnap = await db
    .collection('users')
    .where('restaurantId', '==', restaurantId)
    .where('status', '==', 'approved')
    .get();

  const eligibleUserIds = new Set<string>();
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const prefs = (data.notificationPrefs ?? {}) as {
      pushEnabled?: boolean;
      amberAlertsEnabled?: boolean;
      redAlertsEnabled?: boolean;
    };

    const pushEnabled = prefs.pushEnabled !== false;
    if (!pushEnabled) continue;

    if (options?.tone === 'amber' && prefs.amberAlertsEnabled === false) continue;
    if (options?.tone === 'red' && prefs.redAlertsEnabled === false) continue;

    eligibleUserIds.add(userDoc.id);
  }

  const deviceSnap = await db
    .collection('deviceTokens')
    .where('restaurantId', '==', restaurantId)
    .where('active', '==', true)
    .get();

  for (const docSnap of deviceSnap.docs) {
    const data = docSnap.data();
    const uid = String(data.userId ?? '');
    const token = String(data.fcmToken ?? '');
    if (!uid || !token) continue;
    if (!eligibleUserIds.has(uid)) continue;
    const existing = userTokenMap.get(uid) ?? [];
    if (!existing.includes(token)) existing.push(token);
    userTokenMap.set(uid, existing);
  }

  // Legacy fallback — users.fcmTokens for devices not yet migrated.
  for (const userDoc of usersSnap.docs) {
    if (!eligibleUserIds.has(userDoc.id)) continue;
    const data = userDoc.data();
    const tokens = Array.isArray(data.fcmTokens)
      ? data.fcmTokens.map(String).filter(Boolean)
      : [];
    if (data.fcmToken && !tokens.includes(String(data.fcmToken))) {
      tokens.push(String(data.fcmToken));
    }
    if (tokens.length === 0) continue;
    const existing = userTokenMap.get(userDoc.id) ?? [];
    for (const token of tokens) {
      if (!existing.includes(token)) existing.push(token);
    }
    userTokenMap.set(userDoc.id, existing);
  }

  const tokens = Array.from(userTokenMap.values()).flat();
  return {
    tokens,
    userTokenMap,
    userIds: Array.from(eligibleUserIds),
  };
}
