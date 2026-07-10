import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import {
  assertWasteQuantity,
  calculateCostLoss,
  isValidWasteReason,
  type WasteReason,
} from './types';

type CreateWasteRequest = {
  batchId: string;
  quantityWasted: number;
  wasteReason: WasteReason;
};

/**
 * FR-026–FR-029 — create waste log + deduct inventory atomically.
 * costLoss is always computed server-side from batch.unitCost.
 */
export const createWasteLog = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required');
    }

    const data = request.data as CreateWasteRequest | undefined;
    const batchId = String(data?.batchId ?? '').trim();
    const quantityWasted = Number(data?.quantityWasted);
    const wasteReason = data?.wasteReason;

    if (!batchId) {
      throw new HttpsError('invalid-argument', 'batchId is required');
    }
    if (!isValidWasteReason(wasteReason)) {
      throw new HttpsError('invalid-argument', 'Invalid waste reason');
    }

    const db = getFirestore();
    const userSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!userSnap.exists) {
      throw new HttpsError('permission-denied', 'User profile not found');
    }

    const user = userSnap.data()!;
    if (user.status !== 'approved') {
      throw new HttpsError('permission-denied', 'Only approved users can log waste');
    }

    const batchRef = db.collection('inventoryBatches').doc(batchId);
    const wasteRef = db.collection('wasteLogs').doc();
    const auditRef = db.collection('auditLogs').doc();

    const result = await db.runTransaction(async (tx) => {
      const batchSnap = await tx.get(batchRef);
      if (!batchSnap.exists) {
        throw new HttpsError('not-found', 'Batch not found');
      }

      const batch = batchSnap.data()!;
      if (batch.restaurantId !== user.restaurantId) {
        throw new HttpsError('permission-denied', 'Batch belongs to another restaurant');
      }
      if (batch.archived || batch.consumed) {
        throw new HttpsError(
          'failed-precondition',
          'Batch is not available for waste logging',
        );
      }

      const remaining = Number(batch.quantity ?? 0);
      try {
        assertWasteQuantity(quantityWasted, remaining);
      } catch (error) {
        throw new HttpsError(
          'invalid-argument',
          error instanceof Error ? error.message : 'Invalid waste quantity',
        );
      }

      const unitCost = Number(batch.unitCost ?? 0);
      const costLoss = calculateCostLoss(quantityWasted, unitCost);
      const nextQuantity = Math.round((remaining - quantityWasted) * 1000) / 1000;
      const now = FieldValue.serverTimestamp();
      const ingredientName = String(batch.ingredientName ?? '');

      tx.set(wasteRef, {
        restaurantId: user.restaurantId,
        batchId,
        ingredientName,
        ingredientKey: String(batch.ingredientKey ?? ingredientName.toLowerCase()),
        quantityWasted,
        unit: String(batch.unit ?? ''),
        wasteReason,
        unitCost,
        costLoss,
        loggedBy: request.auth!.uid,
        loggedByName: String(user.displayName ?? user.email ?? ''),
        timestamp: now,
        voided: false,
        voidedAt: null,
        voidedBy: null,
        createdAt: now,
        updatedAt: now,
      });

      tx.update(batchRef, {
        quantity: nextQuantity,
        consumed: nextQuantity <= 0,
        consumedAt: nextQuantity <= 0 ? now : batch.consumedAt ?? null,
        consumedBy: nextQuantity <= 0 ? request.auth!.uid : batch.consumedBy ?? null,
        lastModifiedAt: now,
        lastModifiedBy: request.auth!.uid,
      });

      tx.set(auditRef, {
        action: 'waste_created',
        restaurantId: user.restaurantId,
        batchId,
        wasteLogId: wasteRef.id,
        userId: request.auth!.uid,
        previousValues: { quantity: remaining, consumed: Boolean(batch.consumed) },
        newValues: {
          quantity: nextQuantity,
          quantityWasted,
          wasteReason,
          unitCost,
          costLoss,
          consumed: nextQuantity <= 0,
        },
        timestamp: now,
      });

      return {
        wasteLogId: wasteRef.id,
        costLoss,
        remainingQuantity: nextQuantity,
      };
    });

    logger.info('createWasteLog success', {
      wasteLogId: result.wasteLogId,
      batchId,
      uid: request.auth.uid,
      costLoss: result.costLoss,
    });

    return { ok: true, ...result };
  },
);
