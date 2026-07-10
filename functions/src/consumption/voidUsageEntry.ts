import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { roundQty } from './types';

type VoidUsageRequest = {
  usageLogId: string;
};

/**
 * FR-064 — admin void usage entry and restore inventory quantity.
 */
export const voidUsageEntry = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required');
    }

    const data = request.data as VoidUsageRequest | undefined;
    const usageLogId = String(data?.usageLogId ?? '').trim();
    if (!usageLogId) {
      throw new HttpsError('invalid-argument', 'usageLogId is required');
    }

    const db = getFirestore();
    const userSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!userSnap.exists) {
      throw new HttpsError('permission-denied', 'User profile not found');
    }

    const user = userSnap.data()!;
    if (user.status !== 'approved' || user.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can void usage entries');
    }

    const usageRef = db.collection('inventory_usage').doc(usageLogId);
    const auditRef = db.collection('auditLogs').doc();
    const restoreAuditRef = db.collection('auditLogs').doc();

    const result = await db.runTransaction(async (tx) => {
      const usageSnap = await tx.get(usageRef);
      if (!usageSnap.exists) {
        throw new HttpsError('not-found', 'Usage entry not found');
      }

      const usage = usageSnap.data()!;
      if (usage.restaurantId !== user.restaurantId) {
        throw new HttpsError('permission-denied', 'Usage entry belongs to another restaurant');
      }
      if (usage.voided) {
        throw new HttpsError('failed-precondition', 'Usage entry already voided');
      }

      const batchRef = db.collection('inventoryBatches').doc(String(usage.batchId));
      const batchSnap = await tx.get(batchRef);
      if (!batchSnap.exists) {
        throw new HttpsError('not-found', 'Source batch no longer exists');
      }

      const batch = batchSnap.data()!;
      const quantityUsed = Number(usage.quantityUsed ?? 0);
      const previousQuantity = Number(batch.quantity ?? 0);
      const nextQuantity = roundQty(previousQuantity + quantityUsed);
      const now = FieldValue.serverTimestamp();

      tx.update(usageRef, {
        voided: true,
        voidedAt: now,
        voidedBy: request.auth!.uid,
        updatedAt: now,
      });

      tx.update(batchRef, {
        quantity: nextQuantity,
        consumed: false,
        consumedAt: null,
        consumedBy: null,
        lastModifiedAt: now,
        lastModifiedBy: request.auth!.uid,
      });

      tx.set(auditRef, {
        action: 'usage_voided',
        restaurantId: user.restaurantId,
        batchId: String(usage.batchId),
        usageLogId,
        userId: request.auth!.uid,
        previousValues: { voided: false, quantity: previousQuantity },
        newValues: { voided: true, quantity: nextQuantity },
        timestamp: now,
      });

      tx.set(restoreAuditRef, {
        action: 'inventory_restored',
        restaurantId: user.restaurantId,
        batchId: String(usage.batchId),
        usageLogId,
        userId: request.auth!.uid,
        previousValues: { quantity: previousQuantity },
        newValues: { quantity: nextQuantity, restored: quantityUsed },
        timestamp: now,
      });

      return {
        usageLogId,
        restoredQuantity: quantityUsed,
        remainingQuantity: nextQuantity,
      };
    });

    logger.info('voidUsageEntry success', {
      usageLogId: result.usageLogId,
      uid: request.auth.uid,
    });

    return { ok: true, ...result };
  },
);
