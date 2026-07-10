import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from './firebase/firestore';
import { COLLECTIONS } from '@constants/auth';
import { mapInventoryBatch } from '@utils/mappers';
import { createServiceError, toServiceError } from '@utils/errors';
import { ingredientKey, normalizeIngredientName } from '@utils/expiry';
import { createBatchSchema, editBatchSchema } from '@utils/validators';
import type {
  AuditAction,
  CreateBatchInput,
  EditBatchInput,
  InventoryBatch,
} from '@/types';

async function writeAuditLog(input: {
  action: AuditAction;
  restaurantId: string;
  batchId: string;
  userId: string;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}): Promise<void> {
  await addDoc(collection(getDb(), COLLECTIONS.auditLogs), {
    action: input.action,
    restaurantId: input.restaurantId,
    batchId: input.batchId,
    userId: input.userId,
    previousValues: input.previousValues,
    newValues: input.newValues,
    timestamp: serverTimestamp(),
  });
}

function snapshotFields(batch: InventoryBatch): Record<string, unknown> {
  return {
    ingredientName: batch.ingredientName,
    quantity: batch.quantity,
    unit: batch.unit,
    unitCost: batch.unitCost,
    supplier: batch.supplier,
    dateReceived: batch.dateReceived,
    expiryDate: batch.expiryDate,
    consumed: batch.consumed,
    archived: batch.archived,
  };
}

export const inventoryService = {
  subscribeBatches(
    restaurantId: string,
    callback: (batches: InventoryBatch[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(getDb(), COLLECTIONS.inventoryBatches),
      where('restaurantId', '==', restaurantId),
      orderBy('dateReceived', 'asc'),
    );

    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((item) => mapInventoryBatch(item.id, item.data())));
      },
      (error) => {
        console.error('Inventory listener error', error);
        callback([]);
      },
    );
  },

  async getBatch(batchId: string): Promise<InventoryBatch | null> {
    try {
      const snap = await getDoc(doc(getDb(), COLLECTIONS.inventoryBatches, batchId));
      if (!snap.exists()) return null;
      return mapInventoryBatch(snap.id, snap.data());
    } catch (error) {
      throw toServiceError(error, 'Unable to load batch');
    }
  },

  subscribeBatch(
    batchId: string,
    callback: (batch: InventoryBatch | null) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(getDb(), COLLECTIONS.inventoryBatches, batchId),
      (snap) => {
        callback(snap.exists() ? mapInventoryBatch(snap.id, snap.data()) : null);
      },
      (error) => {
        console.error('Batch listener error', error);
        callback(null);
      },
    );
  },

  async createBatch(input: {
    restaurantId: string;
    userId: string;
    data: CreateBatchInput;
  }): Promise<string> {
    const parsed = createBatchSchema.safeParse(input.data);
    if (!parsed.success) {
      throw createServiceError(
        'restora/validation',
        parsed.error.issues[0]?.message ?? 'Invalid batch data',
      );
    }

    const data = parsed.data;
    const name = normalizeIngredientName(data.ingredientName);

    try {
      const ref = await addDoc(collection(getDb(), COLLECTIONS.inventoryBatches), {
        restaurantId: input.restaurantId,
        ingredientName: name,
        ingredientKey: ingredientKey(name),
        quantity: data.quantity,
        unit: data.unit,
        unitCost: data.unitCost,
        supplier: data.supplier.trim(),
        dateReceived: data.dateReceived,
        expiryDate: data.expiryDate,
        consumed: false,
        archived: false,
        consumedAt: null,
        consumedBy: null,
        createdAt: serverTimestamp(),
        createdBy: input.userId,
        lastModifiedAt: serverTimestamp(),
        lastModifiedBy: input.userId,
        evaluatedTone: null,
        lastNotifiedTone: null,
        lastNotifiedAt: null,
        lastEvaluatedAt: null,
      });

      await writeAuditLog({
        action: 'batch_created',
        restaurantId: input.restaurantId,
        batchId: ref.id,
        userId: input.userId,
        previousValues: null,
        newValues: {
          ingredientName: name,
          quantity: data.quantity,
          unit: data.unit,
          unitCost: data.unitCost,
          supplier: data.supplier.trim(),
          dateReceived: data.dateReceived,
          expiryDate: data.expiryDate,
        },
      });

      return ref.id;
    } catch (error) {
      throw toServiceError(error, 'Unable to create inventory batch');
    }
  },

  async editBatch(input: {
    batchId: string;
    userId: string;
    data: EditBatchInput & { dateReceived: string };
  }): Promise<void> {
    const parsed = editBatchSchema.safeParse(input.data);
    if (!parsed.success) {
      throw createServiceError(
        'restora/validation',
        parsed.error.issues[0]?.message ?? 'Invalid batch data',
      );
    }

    try {
      const ref = doc(getDb(), COLLECTIONS.inventoryBatches, input.batchId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        throw createServiceError('restora/not-found', 'Batch not found');
      }

      const current = mapInventoryBatch(snap.id, snap.data());
      if (current.consumed || current.archived) {
        throw createServiceError(
          'restora/batch-locked',
          'Consumed or archived batches cannot be edited',
        );
      }

      const next = parsed.data;
      await updateDoc(ref, {
        supplier: next.supplier.trim(),
        quantity: next.quantity,
        expiryDate: next.expiryDate,
        lastModifiedAt: serverTimestamp(),
        lastModifiedBy: input.userId,
      });

      await writeAuditLog({
        action: 'batch_edited',
        restaurantId: current.restaurantId,
        batchId: current.id,
        userId: input.userId,
        previousValues: snapshotFields(current),
        newValues: {
          ...snapshotFields(current),
          supplier: next.supplier.trim(),
          quantity: next.quantity,
          expiryDate: next.expiryDate,
        },
      });
    } catch (error) {
      throw toServiceError(error, 'Unable to update batch');
    }
  },

  async markConsumed(input: { batchId: string; userId: string }): Promise<void> {
    try {
      const ref = doc(getDb(), COLLECTIONS.inventoryBatches, input.batchId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        throw createServiceError('restora/not-found', 'Batch not found');
      }

      const current = mapInventoryBatch(snap.id, snap.data());
      if (current.consumed) {
        throw createServiceError('restora/already-consumed', 'Batch is already consumed');
      }
      if (current.archived) {
        throw createServiceError('restora/batch-locked', 'Archived batches cannot be consumed');
      }

      await updateDoc(ref, {
        consumed: true,
        consumedAt: serverTimestamp(),
        consumedBy: input.userId,
        lastModifiedAt: serverTimestamp(),
        lastModifiedBy: input.userId,
      });

      await writeAuditLog({
        action: 'batch_consumed',
        restaurantId: current.restaurantId,
        batchId: current.id,
        userId: input.userId,
        previousValues: snapshotFields(current),
        newValues: { ...snapshotFields(current), consumed: true },
      });
    } catch (error) {
      throw toServiceError(error, 'Unable to mark batch as consumed');
    }
  },

  async archiveBatch(input: { batchId: string; userId: string }): Promise<void> {
    try {
      const ref = doc(getDb(), COLLECTIONS.inventoryBatches, input.batchId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        throw createServiceError('restora/not-found', 'Batch not found');
      }

      const current = mapInventoryBatch(snap.id, snap.data());
      if (current.archived) {
        throw createServiceError('restora/already-archived', 'Batch is already archived');
      }

      await updateDoc(ref, {
        archived: true,
        lastModifiedAt: serverTimestamp(),
        lastModifiedBy: input.userId,
      });

      await writeAuditLog({
        action: 'batch_archived',
        restaurantId: current.restaurantId,
        batchId: current.id,
        userId: input.userId,
        previousValues: snapshotFields(current),
        newValues: { ...snapshotFields(current), archived: true },
      });
    } catch (error) {
      throw toServiceError(error, 'Unable to archive batch');
    }
  },
};
