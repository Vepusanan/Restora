import { FieldValue, getFirestore, type DocumentSnapshot } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import {
  allocateFifoConsumption,
  calculateConsumptionCost,
  isValidUsageCategory,
  roundQty,
  type FifoBatchCandidate,
  type UsageCategory,
} from './types';

type CreateUsageRequest = {
  ingredientKey: string;
  quantityUsed: number;
  category: UsageCategory;
  notes?: string;
  batchId?: string | null;
  allowExpired?: boolean;
  candidateBatchIds?: string[];
};

/**
 * FR-059–FR-062 — create usage log(s) with FIFO multi-batch allocation + deduct inventory.
 */
export const createUsageLog = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required');
    }

    const data = request.data as CreateUsageRequest | undefined;
    const ingredientKey = String(data?.ingredientKey ?? '').trim().toLowerCase();
    const quantityUsed = Number(data?.quantityUsed);
    const category = data?.category;
    const notes = String(data?.notes ?? '').trim();
    const batchId = data?.batchId ? String(data.batchId).trim() : null;
    const allowExpired = data?.allowExpired === true;
    const candidateBatchIds = Array.isArray(data?.candidateBatchIds)
      ? data!.candidateBatchIds!.map(String).filter(Boolean)
      : [];

    if (!ingredientKey) {
      throw new HttpsError('invalid-argument', 'ingredientKey is required');
    }
    if (!isValidUsageCategory(category)) {
      throw new HttpsError('invalid-argument', 'Invalid usage category');
    }
    if (!Number.isFinite(quantityUsed) || quantityUsed <= 0) {
      throw new HttpsError('invalid-argument', 'Quantity must be greater than 0');
    }

    const db = getFirestore();
    const userSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!userSnap.exists) {
      throw new HttpsError('permission-denied', 'User profile not found');
    }

    const user = userSnap.data()!;
    if (user.status !== 'approved') {
      throw new HttpsError('permission-denied', 'Only approved users can log usage');
    }

    const ids =
      candidateBatchIds.length > 0
        ? candidateBatchIds
        : batchId
          ? [batchId]
          : (
              await db
                .collection('inventoryBatches')
                .where('restaurantId', '==', user.restaurantId)
                .where('ingredientKey', '==', ingredientKey)
                .get()
            ).docs.map((docSnap) => docSnap.id);

    if (ids.length === 0) {
      throw new HttpsError('failed-precondition', 'No batches found for this ingredient');
    }

    const usageGroupRef = db.collection('inventory_usage').doc();
    const usageGroupId = usageGroupRef.id;

    const result = await db.runTransaction(async (tx) => {
      const snaps = await Promise.all(
        ids.map((id) => tx.get(db.collection('inventoryBatches').doc(id))),
      );

      const liveCandidates: FifoBatchCandidate[] = [];
      const liveById = new Map<string, DocumentSnapshot>();

      for (const snap of snaps) {
        if (!snap.exists) continue;
        const batch = snap.data()!;
        if (batch.restaurantId !== user.restaurantId) {
          throw new HttpsError('permission-denied', 'Batch belongs to another restaurant');
        }
        if (String(batch.ingredientKey ?? '').toLowerCase() !== ingredientKey) continue;
        liveById.set(snap.id, snap);
        liveCandidates.push({
          id: snap.id,
          quantity: Number(batch.quantity ?? 0),
          unitCost: Number(batch.unitCost ?? 0),
          ingredientName: String(batch.ingredientName ?? ''),
          unit: String(batch.unit ?? ''),
          dateReceived: String(batch.dateReceived ?? '').slice(0, 10),
          createdAt:
            typeof batch.createdAt?.toDate === 'function'
              ? batch.createdAt.toDate().toISOString()
              : String(batch.createdAt ?? ''),
          consumed: Boolean(batch.consumed),
          archived: Boolean(batch.archived),
          expiryDate: String(batch.expiryDate ?? '').slice(0, 10),
        });
      }

      let confirmed;
      try {
        confirmed = allocateFifoConsumption(liveCandidates, quantityUsed, {
          allowExpired,
          batchId,
        });
      } catch (error) {
        throw new HttpsError(
          'invalid-argument',
          error instanceof Error ? error.message : 'Unable to allocate usage',
        );
      }

      const now = FieldValue.serverTimestamp();
      let totalCost = 0;
      const usageLogIds: string[] = [];
      const allocations: { batchId: string; quantityUsed: number; remainingQuantity: number }[] =
        [];

      for (const alloc of confirmed) {
        const snap = liveById.get(alloc.batchId);
        if (!snap?.exists) {
          throw new HttpsError('not-found', 'Batch not found');
        }
        const batch = snap.data()!;
        const remaining = Number(batch.quantity ?? 0);
        if (alloc.quantityUsed > remaining) {
          throw new HttpsError(
            'invalid-argument',
            `Only ${remaining} ${batch.unit ?? ''} remaining on a selected batch`,
          );
        }

        const unitCost = Number(batch.unitCost ?? 0);
        const consumptionCost = calculateConsumptionCost(alloc.quantityUsed, unitCost);
        totalCost += consumptionCost;
        const nextQuantity = roundQty(remaining - alloc.quantityUsed);
        const usageRef = db.collection('inventory_usage').doc();
        const auditRef = db.collection('auditLogs').doc();
        const reduceAuditRef = db.collection('auditLogs').doc();
        const ingredientName = String(batch.ingredientName ?? '');

        tx.set(usageRef, {
          restaurantId: user.restaurantId,
          batchId: alloc.batchId,
          ingredientName,
          ingredientKey: String(batch.ingredientKey ?? ingredientKey),
          quantityUsed: alloc.quantityUsed,
          unit: String(batch.unit ?? ''),
          category,
          notes,
          unitCost,
          consumptionCost,
          usedBy: request.auth!.uid,
          usedByName: String(user.displayName ?? user.email ?? ''),
          usedAt: now,
          voided: false,
          voidedAt: null,
          voidedBy: null,
          usageGroupId,
          createdAt: now,
          updatedAt: now,
        });

        tx.update(snap.ref, {
          quantity: nextQuantity,
          consumed: nextQuantity <= 0,
          consumedAt: nextQuantity <= 0 ? now : batch.consumedAt ?? null,
          consumedBy: nextQuantity <= 0 ? request.auth!.uid : batch.consumedBy ?? null,
          lastModifiedAt: now,
          lastModifiedBy: request.auth!.uid,
        });

        tx.set(auditRef, {
          action: 'usage_created',
          restaurantId: user.restaurantId,
          batchId: alloc.batchId,
          usageLogId: usageRef.id,
          userId: request.auth!.uid,
          previousValues: { quantity: remaining },
          newValues: {
            quantity: nextQuantity,
            quantityUsed: alloc.quantityUsed,
            category,
            consumptionCost,
          },
          timestamp: now,
        });

        tx.set(reduceAuditRef, {
          action: 'inventory_reduced',
          restaurantId: user.restaurantId,
          batchId: alloc.batchId,
          usageLogId: usageRef.id,
          userId: request.auth!.uid,
          previousValues: { quantity: remaining },
          newValues: { quantity: nextQuantity, reducedBy: alloc.quantityUsed },
          timestamp: now,
        });

        usageLogIds.push(usageRef.id);
        allocations.push({
          batchId: alloc.batchId,
          quantityUsed: alloc.quantityUsed,
          remainingQuantity: nextQuantity,
        });
      }

      if (confirmed.length > 1) {
        const fifoAuditRef = db.collection('auditLogs').doc();
        tx.set(fifoAuditRef, {
          action: 'fifo_allocation',
          restaurantId: user.restaurantId,
          usageLogId: usageLogIds[0] ?? null,
          userId: request.auth!.uid,
          previousValues: null,
          newValues: {
            usageGroupId,
            quantityUsed,
            allocations: confirmed.map((item) => ({
              batchId: item.batchId,
              quantityUsed: item.quantityUsed,
            })),
          },
          timestamp: now,
        });
      }

      return { usageLogIds, usageGroupId, consumptionCost: totalCost, allocations };
    });

    logger.info('createUsageLog success', {
      usageGroupId: result.usageGroupId,
      uid: request.auth.uid,
      consumptionCost: result.consumptionCost,
    });

    return { ok: true, ...result };
  },
);
