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
 * Send FCM notifications with retry for transient failures and invalid-token cleanup.
 */
export async function sendExpiryPush(input: {
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<PushResult> {
  const uniqueTokens = Array.from(new Set(input.tokens.filter(Boolean)));
  if (uniqueTokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const messaging: Messaging = getMessaging();
  let successCount = 0;
  let failureCount = 0;
  const invalidTokens: string[] = [];

  // FCM multicast supports up to 500 tokens per call.
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
              channelId: 'expiry-alerts',
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
}
