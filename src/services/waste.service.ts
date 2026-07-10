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
import { mapWasteLog } from '@utils/mappers';
import { createServiceError, toServiceError } from '@utils/errors';
import { createWasteSchema } from '@utils/validators';
import { calculateCostLoss } from '@utils/waste';
import type { CreateWasteInput, WasteLog } from '@/types';

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

async function createWasteViaTransaction(input: {
  restaurantId: string;
  userId: string;
  displayName: string;
  data: CreateWasteInput;
}): Promise<{ wasteLogId: string; costLoss: number; remainingQuantity: number }> {
  const parsed = createWasteSchema.safeParse(input.data);
  if (!parsed.success) {
    throw createServiceError(
      'restora/validation',
      parsed.error.issues[0]?.message ?? 'Invalid waste data',
    );
  }

  const db = getDb();
  const batchRef = doc(db, COLLECTIONS.inventoryBatches, parsed.data.batchId);
  const wasteRef = doc(collection(db, COLLECTIONS.wasteLogs));
  const auditRef = doc(collection(db, COLLECTIONS.auditLogs));

  return runTransaction(db, async (tx) => {
    const batchSnap = await tx.get(batchRef);
    if (!batchSnap.exists()) {
      throw createServiceError('restora/not-found', 'Batch not found');
    }

    const batch = batchSnap.data()!;
    if (batch.restaurantId !== input.restaurantId) {
      throw createServiceError('permission-denied', 'Batch belongs to another restaurant');
    }
    if (batch.archived || batch.consumed) {
      throw createServiceError(
        'restora/batch-not-active',
        'This batch is not available for waste logging.',
      );
    }

    const remaining = Number(batch.quantity ?? 0);
    const quantityWasted = parsed.data.quantityWasted;
    if (quantityWasted > remaining) {
      throw createServiceError(
        'restora/invalid-waste-quantity',
        `Only ${remaining} ${batch.unit ?? ''} remaining on this batch.`,
      );
    }

    const unitCost = Number(batch.unitCost ?? 0);
    const costLoss = calculateCostLoss(quantityWasted, unitCost);
    const nextQuantity = Math.round((remaining - quantityWasted) * 1000) / 1000;
    const now = serverTimestamp();

    tx.set(wasteRef, {
      restaurantId: input.restaurantId,
      batchId: parsed.data.batchId,
      ingredientName: String(batch.ingredientName ?? ''),
      ingredientKey: String(batch.ingredientKey ?? ''),
      quantityWasted,
      unit: String(batch.unit ?? ''),
      wasteReason: parsed.data.wasteReason,
      unitCost,
      costLoss,
      loggedBy: input.userId,
      loggedByName: input.displayName,
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
      consumedBy: nextQuantity <= 0 ? input.userId : batch.consumedBy ?? null,
      lastModifiedAt: now,
      lastModifiedBy: input.userId,
    });

    tx.set(auditRef, {
      action: 'waste_created',
      restaurantId: input.restaurantId,
      batchId: parsed.data.batchId,
      wasteLogId: wasteRef.id,
      userId: input.userId,
      previousValues: { quantity: remaining },
      newValues: {
        quantity: nextQuantity,
        quantityWasted,
        wasteReason: parsed.data.wasteReason,
        costLoss,
      },
      timestamp: now,
    });

    return {
      wasteLogId: wasteRef.id,
      costLoss,
      remainingQuantity: nextQuantity,
    };
  });
}

async function voidWasteViaTransaction(input: {
  restaurantId: string;
  userId: string;
  wasteLogId: string;
}): Promise<{ wasteLogId: string; restoredQuantity: number; remainingQuantity: number }> {
  const db = getDb();
  const wasteRef = doc(db, COLLECTIONS.wasteLogs, input.wasteLogId);
  const auditRef = doc(collection(db, COLLECTIONS.auditLogs));
  const restoreAuditRef = doc(collection(db, COLLECTIONS.auditLogs));

  return runTransaction(db, async (tx) => {
    const wasteSnap = await tx.get(wasteRef);
    if (!wasteSnap.exists()) {
      throw createServiceError('restora/waste-not-found', 'Waste entry not found.');
    }

    const waste = wasteSnap.data()!;
    if (waste.restaurantId !== input.restaurantId) {
      throw createServiceError('permission-denied', 'Waste entry belongs to another restaurant');
    }
    if (waste.voided) {
      throw createServiceError('restora/already-voided', 'This waste entry has already been voided.');
    }

    const batchRef = doc(db, COLLECTIONS.inventoryBatches, String(waste.batchId));
    const batchSnap = await tx.get(batchRef);
    if (!batchSnap.exists()) {
      throw createServiceError('restora/not-found', 'Source batch no longer exists');
    }

    const batch = batchSnap.data()!;
    const quantityWasted = Number(waste.quantityWasted ?? 0);
    const previousQuantity = Number(batch.quantity ?? 0);
    const nextQuantity = Math.round((previousQuantity + quantityWasted) * 1000) / 1000;
    const now = serverTimestamp();

    tx.update(wasteRef, {
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

    tx.set(auditRef, {
      action: 'waste_voided',
      restaurantId: input.restaurantId,
      batchId: String(waste.batchId),
      wasteLogId: input.wasteLogId,
      userId: input.userId,
      previousValues: { voided: false, quantity: previousQuantity },
      newValues: { voided: true, quantity: nextQuantity },
      timestamp: now,
    });

    tx.set(restoreAuditRef, {
      action: 'inventory_restored',
      restaurantId: input.restaurantId,
      batchId: String(waste.batchId),
      wasteLogId: input.wasteLogId,
      userId: input.userId,
      previousValues: { quantity: previousQuantity },
      newValues: { quantity: nextQuantity, restored: quantityWasted },
      timestamp: now,
    });

    return {
      wasteLogId: input.wasteLogId,
      restoredQuantity: quantityWasted,
      remainingQuantity: nextQuantity,
    };
  });
}

export const wasteService = {
  subscribeLogs(
    restaurantId: string,
    callback: (logs: WasteLog[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(getDb(), COLLECTIONS.wasteLogs),
      where('restaurantId', '==', restaurantId),
      orderBy('timestamp', 'desc'),
    );

    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((item) => mapWasteLog(item.id, item.data())));
      },
      (error) => {
        console.error('Waste logs listener error', error);
        callback([]);
      },
    );
  },

  subscribeLog(
    wasteLogId: string,
    callback: (log: WasteLog | null) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(getDb(), COLLECTIONS.wasteLogs, wasteLogId),
      (snap) => {
        callback(snap.exists() ? mapWasteLog(snap.id, snap.data()) : null);
      },
      (error) => {
        console.error('Waste log listener error', error);
        callback(null);
      },
    );
  },

  async createWasteLog(input: {
    restaurantId: string;
    userId: string;
    displayName: string;
    data: CreateWasteInput;
  }): Promise<{ wasteLogId: string; costLoss: number; remainingQuantity: number }> {
    const parsed = createWasteSchema.safeParse(input.data);
    if (!parsed.success) {
      throw createServiceError(
        'restora/validation',
        parsed.error.issues[0]?.message ?? 'Invalid waste data',
      );
    }

    if (env.useCallableFunctions) {
      try {
        const functions = getFunctions(getFirebaseApp(), env.functionsRegion);
        const callable = httpsCallable<
          CreateWasteInput,
          { ok: boolean; wasteLogId: string; costLoss: number; remainingQuantity: number }
        >(functions, 'createWasteLog');
        const response = await callable(parsed.data);
        return {
          wasteLogId: response.data.wasteLogId,
          costLoss: response.data.costLoss,
          remainingQuantity: response.data.remainingQuantity,
        };
      } catch (error) {
        const serviceError = toServiceError(error, 'Unable to log waste');
        if (!canFallbackToFirestore(serviceError)) {
          throw serviceError;
        }
      }
    }

    try {
      return await createWasteViaTransaction({
        ...input,
        data: parsed.data,
      });
    } catch (fallbackError) {
      throw toServiceError(fallbackError, 'Unable to log waste');
    }
  },

  async voidWasteEntry(input: {
    restaurantId: string;
    userId: string;
    wasteLogId: string;
  }): Promise<{ wasteLogId: string; restoredQuantity: number; remainingQuantity: number }> {
    if (env.useCallableFunctions) {
      try {
        const functions = getFunctions(getFirebaseApp(), env.functionsRegion);
        const callable = httpsCallable<
          { wasteLogId: string },
          { ok: boolean; wasteLogId: string; restoredQuantity: number; remainingQuantity: number }
        >(functions, 'voidWasteEntry');
        const response = await callable({ wasteLogId: input.wasteLogId });
        return {
          wasteLogId: response.data.wasteLogId,
          restoredQuantity: response.data.restoredQuantity,
          remainingQuantity: response.data.remainingQuantity,
        };
      } catch (error) {
        const serviceError = toServiceError(error, 'Unable to void waste entry');
        if (!canFallbackToFirestore(serviceError)) {
          throw serviceError;
        }
      }
    }

    try {
      return await voidWasteViaTransaction(input);
    } catch (fallbackError) {
      throw toServiceError(fallbackError, 'Unable to void waste entry');
    }
  },
};
