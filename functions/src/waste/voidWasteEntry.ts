import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

type VoidWasteRequest = {
  wasteLogId: string;
};

/**
 * FR-031 — admin-only void: restore inventory, mark voided, write audit.
 * Never hard-deletes. Idempotent against already-voided records.
 */
export const voidWasteEntry = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required');
    }

    const wasteLogId = String(
      (request.data as VoidWasteRequest | undefined)?.wasteLogId ?? '',
    ).trim();
    if (!wasteLogId) {
      throw new HttpsError('invalid-argument', 'wasteLogId is required');
    }

    const db = getFirestore();
    const adminSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!adminSnap.exists) {
      throw new HttpsError('permission-denied', 'Admin profile not found');
    }

    const admin = adminSnap.data()!;
    if (admin.role !== 'admin' || admin.status !== 'approved') {
      throw new HttpsError('permission-denied', 'Only approved admins can void waste entries');
    }

    const wasteRef = db.collection('wasteLogs').doc(wasteLogId);
    const auditRef = db.collection('auditLogs').doc();

    const result = await db.runTransaction(async (tx) => {
      const wasteSnap = await tx.get(wasteRef);
      if (!wasteSnap.exists) {
        throw new HttpsError('not-found', 'Waste entry not found');
      }

      const waste = wasteSnap.data()!;
      if (waste.restaurantId !== admin.restaurantId) {
        throw new HttpsError('permission-denied', 'Waste entry belongs to another restaurant');
      }
      if (waste.voided) {
        throw new HttpsError('failed-precondition', 'Waste entry has already been voided');
      }

      const batchRef = db.collection('inventoryBatches').doc(String(waste.batchId));
      const batchSnap = await tx.get(batchRef);
      if (!batchSnap.exists) {
        throw new HttpsError('failed-precondition', 'Source batch no longer exists');
      }

      const batch = batchSnap.data()!;
      if (batch.restaurantId !== admin.restaurantId) {
        throw new HttpsError('permission-denied', 'Batch belongs to another restaurant');
      }

      const quantityWasted = Number(waste.quantityWasted ?? 0);
      const previousQuantity = Number(batch.quantity ?? 0);
      const nextQuantity = Math.round((previousQuantity + quantityWasted) * 1000) / 1000;
      const now = FieldValue.serverTimestamp();

      tx.update(wasteRef, {
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
        archived: batch.archived === true, // never un-archive via void
        lastModifiedAt: now,
        lastModifiedBy: request.auth!.uid,
      });

      tx.set(auditRef, {
        action: 'waste_voided',
        restaurantId: admin.restaurantId,
        batchId: String(waste.batchId),
        wasteLogId,
        userId: request.auth!.uid,
        previousValues: {
          voided: false,
          quantity: previousQuantity,
          costLoss: waste.costLoss,
        },
        newValues: {
          voided: true,
          quantity: nextQuantity,
          inventoryRestored: quantityWasted,
        },
        timestamp: now,
      });

      // Separate audit for inventory restoration (reporting compatibility).
      const restoreAuditRef = db.collection('auditLogs').doc();
      tx.set(restoreAuditRef, {
        action: 'inventory_restored',
        restaurantId: admin.restaurantId,
        batchId: String(waste.batchId),
        wasteLogId,
        userId: request.auth!.uid,
        previousValues: { quantity: previousQuantity },
        newValues: { quantity: nextQuantity, restored: quantityWasted },
        timestamp: now,
      });

      return { wasteLogId, restoredQuantity: quantityWasted, remainingQuantity: nextQuantity };
    });

    logger.info('voidWasteEntry success', {
      wasteLogId: result.wasteLogId,
      uid: request.auth.uid,
      restored: result.restoredQuantity,
    });

    return { ok: true, ...result };
  },
);
