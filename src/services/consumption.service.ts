import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDb } from './firebase/firestore';
import { getFirebaseApp } from './firebase/config';
import { COLLECTIONS } from '@constants/auth';
import { env } from '@config/env';
import { mapInventoryUsageLog } from '@utils/mappers';
import { createServiceError, toServiceError } from '@utils/errors';
import { createUsageSchema } from '@utils/validators';
import { calculateConsumptionCost } from '@utils/consumption';
import {
  allocateFifoConsumption,
  roundQty,
  type FifoBatchCandidate,
} from '@utils/fifoAllocation';
import { auditService } from './audit.service';
import type { CreateUsageInput, InventoryBatch, InventoryUsageLog } from '@/types';

function canFallbackToFirestore(error: { code: string; message: string }): boolean {
  const code = error.code.toLowerCase();
  const message = error.message.toLowerCase();
  return (
    code.includes('not-found') ||
    code.includes('unavailable') ||
    code.includes('failed-precondition') ||
    message.includes('not found') ||
    message.includes('not been deployed') ||
    message.includes('internal')
  );
}

async function createUsageViaTransaction(input: {
  restaurantId: string;
  userId: string;
  displayName: string;
  data: CreateUsageInput;
  candidateBatches: FifoBatchCandidate[];
}): Promise<{
  usageLogIds: string[];
  usageGroupId: string;
  consumptionCost: number;
  allocations: { batchId: string; quantityUsed: number; remainingQuantity: number }[];
}> {
  const parsed = createUsageSchema.safeParse(input.data);
  if (!parsed.success) {
    throw createServiceError(
      'restora/validation',
      parsed.error.issues[0]?.message ?? 'Invalid usage data',
    );
  }

  let allocations;
  try {
    allocations = allocateFifoConsumption(input.candidateBatches, parsed.data.quantityUsed, {
      allowExpired: parsed.data.allowExpired === true,
      batchId: parsed.data.batchId ?? null,
    });
  } catch (error) {
    throw createServiceError(
      'restora/invalid-usage-quantity',
      error instanceof Error ? error.message : 'Unable to allocate usage',
    );
  }

  const db = getDb();
  const usageGroupId = doc(collection(db, COLLECTIONS.inventoryUsage)).id;
  // Pre-create enough refs for worst-case (one usage + 2 audits per candidate batch).
  const maxSlots = Math.max(allocations.length, input.candidateBatches.length, 1);
  const usageRefs = Array.from({ length: maxSlots }, () =>
    doc(collection(db, COLLECTIONS.inventoryUsage)),
  );
  const auditRefs = Array.from({ length: maxSlots * 2 }, () =>
    doc(collection(db, COLLECTIONS.auditLogs)),
  );
  const fifoAuditRef = doc(collection(db, COLLECTIONS.auditLogs));
  const candidateIds = Array.from(
    new Set([
      ...input.candidateBatches.map((batch) => batch.id),
      ...allocations.map((alloc) => alloc.batchId),
    ]),
  );

  return runTransaction(db, async (tx) => {
    const batchSnaps = await Promise.all(
      candidateIds.map((id) => tx.get(doc(db, COLLECTIONS.inventoryBatches, id))),
    );

    const liveById = new Map<string, { snap: (typeof batchSnaps)[number]; data: Record<string, unknown> }>();
    const liveCandidates: FifoBatchCandidate[] = [];

    for (const snap of batchSnaps) {
      if (!snap.exists()) continue;
      const batch = snap.data()!;
      if (batch.restaurantId !== input.restaurantId) {
        throw createServiceError('permission-denied', 'Batch belongs to another restaurant');
      }
      liveById.set(snap.id, { snap, data: batch });
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
      confirmed = allocateFifoConsumption(liveCandidates, parsed.data.quantityUsed, {
        allowExpired: parsed.data.allowExpired === true,
        batchId: parsed.data.batchId ?? null,
      });
    } catch (error) {
      throw createServiceError(
        'restora/invalid-usage-quantity',
        error instanceof Error ? error.message : 'Unable to allocate usage',
      );
    }

    const now = serverTimestamp();
    let totalCost = 0;
    const results: { batchId: string; quantityUsed: number; remainingQuantity: number }[] = [];
    let auditIndex = 0;

    for (let i = 0; i < confirmed.length; i += 1) {
      const alloc = confirmed[i]!;
      const usageRef = usageRefs[i]!;
      const live = liveById.get(alloc.batchId);
      if (!live) {
        throw createServiceError('restora/not-found', 'Batch not found');
      }
      const batch = live.data;
      const remaining = Number(batch.quantity ?? 0);
      if (alloc.quantityUsed > remaining) {
        throw createServiceError(
          'restora/invalid-usage-quantity',
          `Only ${remaining} ${String(batch.unit ?? '')} remaining on a selected batch.`,
        );
      }

      const unitCost = Number(batch.unitCost ?? 0);
      const consumptionCost = calculateConsumptionCost(alloc.quantityUsed, unitCost);
      totalCost += consumptionCost;
      const nextQuantity = roundQty(remaining - alloc.quantityUsed);
      const batchRef = doc(db, COLLECTIONS.inventoryBatches, alloc.batchId);

      tx.set(usageRef, {
        restaurantId: input.restaurantId,
        batchId: alloc.batchId,
        ingredientName: String(batch.ingredientName ?? ''),
        ingredientKey: String(batch.ingredientKey ?? parsed.data.ingredientKey),
        quantityUsed: alloc.quantityUsed,
        unit: String(batch.unit ?? ''),
        category: parsed.data.category,
        notes: parsed.data.notes?.trim() ?? '',
        unitCost,
        consumptionCost,
        usedBy: input.userId,
        usedByName: input.displayName,
        usedAt: now,
        voided: false,
        voidedAt: null,
        voidedBy: null,
        usageGroupId,
        createdAt: now,
        updatedAt: now,
      });

      tx.update(batchRef, {
        quantity: nextQuantity,
        consumed: nextQuantity <= 0,
        consumedAt: nextQuantity <= 0 ? now : batch.consumedAt ?? null,
        consumedBy: nextQuantity <= 0 ? input.userId : batch.consumedBy ?? null,
        lastModifiedAt: now,
        lastModifiedBy: input.userId,
      });

      tx.set(
        auditRefs[auditIndex++]!,
        auditService.buildRecord({
          action: 'usage_created',
          restaurantId: input.restaurantId,
          userId: input.userId,
          batchId: alloc.batchId,
          usageLogId: usageRef.id,
          target: {
            collection: 'inventory_usage',
            documentId: usageRef.id,
            name: String(batch.ingredientName ?? ''),
          },
          before: { quantity: remaining },
          after: {
            quantity: nextQuantity,
            quantityUsed: alloc.quantityUsed,
            category: parsed.data.category,
            consumptionCost,
          },
        }),
      );

      tx.set(
        auditRefs[auditIndex++]!,
        auditService.buildRecord({
          action: 'inventory_reduced',
          restaurantId: input.restaurantId,
          userId: input.userId,
          batchId: alloc.batchId,
          usageLogId: usageRef.id,
          target: {
            collection: 'inventoryBatches',
            documentId: alloc.batchId,
            name: String(batch.ingredientName ?? ''),
          },
          before: { quantity: remaining },
          after: { quantity: nextQuantity, reducedBy: alloc.quantityUsed },
        }),
      );

      results.push({
        batchId: alloc.batchId,
        quantityUsed: alloc.quantityUsed,
        remainingQuantity: nextQuantity,
      });
    }

    if (confirmed.length > 1) {
      tx.set(
        fifoAuditRef,
        auditService.buildRecord({
          action: 'fifo_allocation',
          restaurantId: input.restaurantId,
          userId: input.userId,
          usageLogId: usageRefs[0]?.id,
          target: {
            collection: 'inventory_usage',
            documentId: usageGroupId,
            name: confirmed[0]?.ingredientName ?? parsed.data.ingredientKey,
          },
          after: {
            usageGroupId,
            quantityUsed: parsed.data.quantityUsed,
            allocations: confirmed.map((item) => ({
              batchId: item.batchId,
              quantityUsed: item.quantityUsed,
            })),
          },
        }),
      );
    }

    return {
      usageLogIds: usageRefs.slice(0, confirmed.length).map((ref) => ref.id),
      usageGroupId,
      consumptionCost: totalCost,
      allocations: results,
    };
  });
}

async function voidUsageViaTransaction(input: {
  restaurantId: string;
  userId: string;
  usageLogId: string;
}): Promise<{ usageLogId: string; restoredQuantity: number; remainingQuantity: number }> {
  const db = getDb();
  const usageRef = doc(db, COLLECTIONS.inventoryUsage, input.usageLogId);
  const auditRef = doc(collection(db, COLLECTIONS.auditLogs));
  const restoreAuditRef = doc(collection(db, COLLECTIONS.auditLogs));

  return runTransaction(db, async (tx) => {
    const usageSnap = await tx.get(usageRef);
    if (!usageSnap.exists()) {
      throw createServiceError('restora/usage-not-found', 'Usage entry not found.');
    }

    const usage = usageSnap.data()!;
    if (usage.restaurantId !== input.restaurantId) {
      throw createServiceError('permission-denied', 'Usage entry belongs to another restaurant');
    }
    if (usage.voided) {
      throw createServiceError('restora/already-voided', 'This usage entry has already been voided.');
    }

    const batchRef = doc(db, COLLECTIONS.inventoryBatches, String(usage.batchId));
    const batchSnap = await tx.get(batchRef);
    if (!batchSnap.exists()) {
      throw createServiceError('restora/not-found', 'Source batch no longer exists');
    }

    const batch = batchSnap.data()!;
    const quantityUsed = Number(usage.quantityUsed ?? 0);
    const previousQuantity = Number(batch.quantity ?? 0);
    const nextQuantity = roundQty(previousQuantity + quantityUsed);
    const now = serverTimestamp();

    tx.update(usageRef, {
      voided: true,
      voidedAt: now,
      voidedBy: input.userId,
      updatedAt: now,
    });

    tx.update(batchRef, {
      quantity: nextQuantity,
      consumed: false,
      consumedAt: null,
      consumedBy: null,
      lastModifiedAt: now,
      lastModifiedBy: input.userId,
    });

    tx.set(
      auditRef,
      auditService.buildRecord({
        action: 'usage_voided',
        restaurantId: input.restaurantId,
        userId: input.userId,
        batchId: String(usage.batchId),
        usageLogId: input.usageLogId,
        target: {
          collection: 'inventory_usage',
          documentId: input.usageLogId,
          name: String(usage.ingredientName ?? ''),
        },
        before: { voided: false, quantity: previousQuantity },
        after: { voided: true, quantity: nextQuantity },
      }),
    );

    tx.set(
      restoreAuditRef,
      auditService.buildRecord({
        action: 'inventory_restored',
        restaurantId: input.restaurantId,
        userId: input.userId,
        batchId: String(usage.batchId),
        usageLogId: input.usageLogId,
        target: {
          collection: 'inventoryBatches',
          documentId: String(usage.batchId),
          name: String(usage.ingredientName ?? ''),
        },
        before: { quantity: previousQuantity },
        after: { quantity: nextQuantity, restored: quantityUsed },
      }),
    );

    return {
      usageLogId: input.usageLogId,
      restoredQuantity: quantityUsed,
      remainingQuantity: nextQuantity,
    };
  });
}

export const consumptionService = {
  subscribeLogs(
    restaurantId: string,
    callback: (logs: InventoryUsageLog[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(getDb(), COLLECTIONS.inventoryUsage),
      where('restaurantId', '==', restaurantId),
      orderBy('usedAt', 'desc'),
    );

    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((item) => mapInventoryUsageLog(item.id, item.data())));
      },
      (error) => {
        console.error('Usage logs listener error', error);
        callback([]);
      },
    );
  },

  subscribeLog(
    usageLogId: string,
    callback: (log: InventoryUsageLog | null) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(getDb(), COLLECTIONS.inventoryUsage, usageLogId),
      (snap) => {
        callback(snap.exists() ? mapInventoryUsageLog(snap.id, snap.data()) : null);
      },
      (error) => {
        console.error('Usage log listener error', error);
        callback(null);
      },
    );
  },

  async createUsageLog(input: {
    restaurantId: string;
    userId: string;
    displayName: string;
    data: CreateUsageInput;
    /** Active batches for the ingredient (from realtime inventory). */
    candidateBatches: InventoryBatch[];
  }): Promise<{
    usageLogIds: string[];
    usageGroupId: string;
    consumptionCost: number;
    allocations: { batchId: string; quantityUsed: number; remainingQuantity: number }[];
  }> {
    const parsed = createUsageSchema.safeParse(input.data);
    if (!parsed.success) {
      throw createServiceError(
        'restora/validation',
        parsed.error.issues[0]?.message ?? 'Invalid usage data',
      );
    }

    const candidates: FifoBatchCandidate[] = input.candidateBatches
      .filter((batch) => batch.ingredientKey === parsed.data.ingredientKey)
      .map((batch) => ({
        id: batch.id,
        quantity: batch.quantity,
        unitCost: batch.unitCost,
        ingredientName: batch.ingredientName,
        unit: batch.unit,
        dateReceived: batch.dateReceived,
        createdAt: batch.createdAt,
        consumed: batch.consumed,
        archived: batch.archived,
        expiryDate: batch.expiryDate,
      }));

    if (env.useCallableFunctions) {
      try {
        const functions = getFunctions(getFirebaseApp(), env.functionsRegion);
        const callable = httpsCallable<
          CreateUsageInput & { candidateBatchIds: string[] },
          {
            ok: boolean;
            usageLogIds: string[];
            usageGroupId: string;
            consumptionCost: number;
            allocations: { batchId: string; quantityUsed: number; remainingQuantity: number }[];
          }
        >(functions, 'createUsageLog');
        const response = await callable({
          ...parsed.data,
          candidateBatchIds: candidates.map((item) => item.id),
        });
        return {
          usageLogIds: response.data.usageLogIds,
          usageGroupId: response.data.usageGroupId,
          consumptionCost: response.data.consumptionCost,
          allocations: response.data.allocations,
        };
      } catch (error) {
        const serviceError = toServiceError(error, 'Unable to log usage');
        if (!canFallbackToFirestore(serviceError)) {
          throw serviceError;
        }
      }
    }

    try {
      return await createUsageViaTransaction({
        restaurantId: input.restaurantId,
        userId: input.userId,
        displayName: input.displayName,
        data: parsed.data,
        candidateBatches: candidates,
      });
    } catch (fallbackError) {
      throw toServiceError(fallbackError, 'Unable to log usage');
    }
  },

  async voidUsageEntry(input: {
    restaurantId: string;
    userId: string;
    usageLogId: string;
  }): Promise<{ usageLogId: string; restoredQuantity: number; remainingQuantity: number }> {
    if (env.useCallableFunctions) {
      try {
        const functions = getFunctions(getFirebaseApp(), env.functionsRegion);
        const callable = httpsCallable<
          { usageLogId: string },
          { ok: boolean; usageLogId: string; restoredQuantity: number; remainingQuantity: number }
        >(functions, 'voidUsageEntry');
        const response = await callable({ usageLogId: input.usageLogId });
        return {
          usageLogId: response.data.usageLogId,
          restoredQuantity: response.data.restoredQuantity,
          remainingQuantity: response.data.remainingQuantity,
        };
      } catch (error) {
        const serviceError = toServiceError(error, 'Unable to void usage entry');
        if (!canFallbackToFirestore(serviceError)) {
          throw serviceError;
        }
      }
    }

    try {
      return await voidUsageViaTransaction(input);
    } catch (fallbackError) {
      throw toServiceError(fallbackError, 'Unable to void usage entry');
    }
  },
};
