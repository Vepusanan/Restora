import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getDb } from './firebase/firestore';
import { COLLECTIONS } from '@constants/auth';
import { AUDIT_PAGE_SIZE, CLIENT_AUDIT_ACTIONS } from '@constants/audit';
import { useAuthStore } from '@store/authStore';
import { mapAuditLogEntry } from '@utils/mappers';
import {
  buildAuditDescription,
  resolveAuditActionType,
  resolveAuditModule,
  resolveAuditTargetCollection,
} from '@utils/audit';
import { createServiceError, toServiceError } from '@utils/errors';
import type {
  AuditActor,
  AuditLogEntry,
  WriteAuditInput,
} from '@/types';

function resolveAppVersion(): string {
  return Constants.expoConfig?.version || Constants.nativeAppVersion || '1.0.0';
}

function resolvePlatform(): string {
  return Platform.OS;
}

function resolveActor(input: WriteAuditInput): AuditActor {
  const state = useAuthStore.getState();
  const id =
    input.actor?.id ||
    input.userId ||
    state.user?.uid ||
    'system';
  return {
    id,
    name:
      input.actor?.name ||
      state.profile?.displayName ||
      (id === 'system' ? 'System' : 'Unknown'),
    role:
      input.actor?.role ||
      state.profile?.role ||
      (id === 'system' ? 'system' : 'unknown'),
  };
}

/**
 * FR-053 — centralized immutable audit writer + admin query API.
 * All modules must call `auditService.write` (or `buildRecord` inside transactions).
 */
export const auditService = {
  /**
   * Build a Firestore-ready audit document (no write).
   * Use inside transactions via `tx.set(ref, auditService.buildRecord(...))`.
   */
  buildRecord(input: WriteAuditInput): Record<string, unknown> {
    if (!input.restaurantId) {
      throw createServiceError('restora/validation', 'restaurantId is required for audit logs');
    }
    if (!CLIENT_AUDIT_ACTIONS.includes(input.action) && input.actor?.id !== 'system') {
      // Still allow building CF-style records client-side for typing; rules will block create.
    }

    const actor = resolveActor(input);
    const actionType = resolveAuditActionType(input.action);
    const module = resolveAuditModule(input.action);
    const targetCollection =
      input.target?.collection || resolveAuditTargetCollection(input.action);
    const targetDocumentId =
      input.target?.documentId ||
      input.batchId ||
      input.wasteLogId ||
      input.notificationId ||
      input.deviceId ||
      actor.id ||
      '';
    const targetName = input.target?.name || '';
    const before = input.before ?? null;
    const after = input.after ?? null;
    const description =
      input.description ||
      buildAuditDescription({
        action: input.action,
        actorName: actor.name,
        targetName,
      });

    return {
      // New schema (FR-053)
      restaurantId: input.restaurantId,
      action: input.action,
      actionType,
      module,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      targetCollection,
      targetDocumentId,
      targetName,
      before,
      after,
      metadata: input.metadata ?? {},
      description,
      appVersion: resolveAppVersion(),
      platform: resolvePlatform(),
      notificationId: input.notificationId ?? null,
      deviceId: input.deviceId ?? null,
      wasteLogId: input.wasteLogId ?? null,
      // Legacy fields for existing queries / rules
      userId: actor.id,
      batchId: input.batchId ?? (targetCollection === 'inventoryBatches' ? targetDocumentId : ''),
      previousValues: before,
      newValues: after,
      timestamp: serverTimestamp(),
    };
  },

  async write(input: WriteAuditInput): Promise<string> {
    try {
      const record = this.buildRecord(input);
      const ref = await addDoc(collection(getDb(), COLLECTIONS.auditLogs), record);
      return ref.id;
    } catch (error) {
      // Audit must not break primary business flows when rules/network fail.
      console.warn('Audit write failed', error);
      throw toServiceError(error, 'Unable to write audit log');
    }
  },

  /** Best-effort write — never throws (for non-critical paths like device/login). */
  async writeSafe(input: WriteAuditInput): Promise<string | null> {
    try {
      return await this.write(input);
    } catch {
      return null;
    }
  },

  async getById(id: string): Promise<AuditLogEntry | null> {
    try {
      const snap = await getDoc(doc(getDb(), COLLECTIONS.auditLogs, id));
      if (!snap.exists()) return null;
      return mapAuditLogEntry(snap.id, snap.data());
    } catch (error) {
      throw toServiceError(error, 'Unable to load audit log');
    }
  },

  subscribeRecent(
    restaurantId: string,
    callback: (items: AuditLogEntry[]) => void,
    pageSize = 100,
  ): Unsubscribe {
    const q = query(
      collection(getDb(), COLLECTIONS.auditLogs),
      where('restaurantId', '==', restaurantId),
      orderBy('timestamp', 'desc'),
      limit(pageSize),
    );

    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((item) => mapAuditLogEntry(item.id, item.data())));
      },
      (error) => {
        console.error('Audit listener error', error);
        callback([]);
      },
    );
  },

  async fetchPage(input: {
    restaurantId: string;
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData> | null;
    ascending?: boolean;
  }): Promise<{
    items: AuditLogEntry[];
    cursor: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
  }> {
    const pageSize = input.pageSize ?? AUDIT_PAGE_SIZE;
    const direction = input.ascending ? 'asc' : 'desc';
    const constraints = [
      where('restaurantId', '==', input.restaurantId),
      orderBy('timestamp', direction),
      ...(input.cursor ? [startAfter(input.cursor)] : []),
      limit(pageSize),
    ];

    try {
      const snap = await getDocs(query(collection(getDb(), COLLECTIONS.auditLogs), ...constraints));
      const items = snap.docs.map((item) => mapAuditLogEntry(item.id, item.data()));
      const nextCursor =
        snap.docs.length > 0 ? (snap.docs[snap.docs.length - 1] ?? null) : null;
      return {
        items,
        cursor: nextCursor,
        hasMore: snap.docs.length === pageSize,
      };
    } catch (error) {
      throw toServiceError(error, 'Unable to load audit history');
    }
  },
};
