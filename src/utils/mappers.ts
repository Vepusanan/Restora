import type { DocumentData, Timestamp } from 'firebase/firestore';
import type {
  AppNotification,
  AuditAction,
  AuditLogEntry,
  DeviceToken,
  ExpiryTone,
  InventoryBatch,
  InventoryUnit,
  NotificationHistoryEntry,
  Restaurant,
  StaffMember,
  UserProfile,
  UserRole,
  UserStatus,
  WasteLog,
  WasteReason,
} from '@/types';
import { EXPIRY_AMBER_DAYS } from '@constants/inventory';
import { clampExpiryThreshold, ingredientKey, normalizeIngredientName } from '@utils/expiry';
import { resolveNotificationType } from '@utils/notifications';
import {
  buildAuditDescription,
  resolveAuditActionType,
  resolveAuditModule,
  resolveAuditTargetCollection,
} from '@utils/audit';
import { normalizeCurrency, normalizeNotificationPrefs } from '@utils/settings';
import { calculateCostLoss } from '@utils/waste';

export function toIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as Timestamp).toDate().toISOString();
  }
  return new Date().toISOString();
}

function toDateOnly(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return toDateOnly((value as Timestamp).toDate());
  }
  return '';
}

function mapTokens(data: DocumentData): string[] {
  const tokens = Array.isArray(data.fcmTokens)
    ? data.fcmTokens.map(String).filter(Boolean)
    : [];
  if (data.fcmToken && !tokens.includes(String(data.fcmToken))) {
    tokens.push(String(data.fcmToken));
  }
  return tokens;
}

export function mapUserProfile(uid: string, data: DocumentData): UserProfile {
  return {
    uid,
    email: String(data.email ?? ''),
    displayName: String(data.displayName ?? ''),
    phoneNumber: String(data.phoneNumber ?? ''),
    role: (data.role as UserRole) ?? 'staff',
    status: (data.status as UserStatus) ?? 'pending',
    restaurantId: String(data.restaurantId ?? ''),
    restaurantName: String(data.restaurantName ?? ''),
    restaurantCode: String(data.restaurantCode ?? ''),
    avatarId: data.avatarId ? String(data.avatarId) : null,
    photoURL: data.photoURL ? String(data.photoURL) : null,
    fcmToken: data.fcmToken ? String(data.fcmToken) : null,
    fcmTokens: mapTokens(data),
    notificationPrefs: normalizeNotificationPrefs(data.notificationPrefs),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export function mapRestaurant(id: string, data: DocumentData): Restaurant {
  return {
    id,
    name: String(data.name ?? ''),
    code: String(data.code ?? ''),
    ownerId: String(data.ownerId ?? ''),
    expiryAlertThreshold: clampExpiryThreshold(
      Number(data.expiryAlertThreshold ?? EXPIRY_AMBER_DAYS),
    ),
    currency: normalizeCurrency(data.currency),
    updatedBy: data.updatedBy ? String(data.updatedBy) : null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export function mapStaffMember(uid: string, data: DocumentData): StaffMember {
  return {
    uid,
    email: String(data.email ?? ''),
    displayName: String(data.displayName ?? ''),
    status: (data.status as UserStatus) ?? 'pending',
    avatarId: data.avatarId ? String(data.avatarId) : null,
    photoURL: data.photoURL ? String(data.photoURL) : null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export function mapInventoryBatch(id: string, data: DocumentData): InventoryBatch {
  const ingredientName = normalizeIngredientName(String(data.ingredientName ?? ''));
  return {
    id,
    restaurantId: String(data.restaurantId ?? ''),
    ingredientName,
    ingredientKey: String(data.ingredientKey ?? ingredientKey(ingredientName)),
    quantity: Number(data.quantity ?? 0),
    unit: (data.unit as InventoryUnit) ?? 'kg',
    unitCost: Number(data.unitCost ?? 0),
    supplier: String(data.supplier ?? ''),
    dateReceived: toDateOnly(data.dateReceived),
    expiryDate: toDateOnly(data.expiryDate),
    consumed: Boolean(data.consumed),
    archived: Boolean(data.archived),
    consumedAt: data.consumedAt ? toIso(data.consumedAt) : null,
    consumedBy: data.consumedBy ? String(data.consumedBy) : null,
    createdAt: toIso(data.createdAt),
    createdBy: String(data.createdBy ?? ''),
    lastModifiedAt: toIso(data.lastModifiedAt ?? data.createdAt),
    lastModifiedBy: String(data.lastModifiedBy ?? data.createdBy ?? ''),
    evaluatedTone: (data.evaluatedTone as ExpiryTone) ?? null,
    lastNotifiedTone: (data.lastNotifiedTone as ExpiryTone) ?? null,
    lastNotifiedAt: data.lastNotifiedAt ? toIso(data.lastNotifiedAt) : null,
    lastEvaluatedAt: data.lastEvaluatedAt ? toIso(data.lastEvaluatedAt) : null,
  };
}

export function mapAppNotification(id: string, data: DocumentData): AppNotification {
  const readBy = Array.isArray(data.readBy)
    ? data.readBy.map(String).filter(Boolean)
    : [];
  const status =
    data.status === 'red' ? 'red' : data.status === 'amber' ? 'amber' : null;

  return {
    id,
    restaurantId: String(data.restaurantId ?? ''),
    userId: String(data.userId ?? ''),
    batchId: String(data.batchId ?? ''),
    ingredientName: String(data.ingredientName ?? ''),
    quantity: Number(data.quantity ?? 0),
    unit: String(data.unit ?? ''),
    dateReceived: toDateOnly(data.dateReceived),
    expiryDate: toDateOnly(data.expiryDate),
    daysRemaining: Number(data.daysRemaining ?? 0),
    status,
    type: resolveNotificationType(data.type, data.status),
    priority:
      data.priority === 'low' ||
      data.priority === 'high' ||
      data.priority === 'critical'
        ? data.priority
        : 'normal',
    title: String(data.title ?? ''),
    body: String(data.body ?? ''),
    read: Boolean(data.read),
    readBy,
    deepLink: String(data.deepLink ?? 'restora://inventory'),
    createdBy: String(data.createdBy ?? 'system'),
    metadata:
      data.metadata && typeof data.metadata === 'object'
        ? (data.metadata as Record<string, unknown>)
        : {},
    createdAt: toIso(data.createdAt),
  };
}

export function mapDeviceToken(id: string, data: DocumentData): DeviceToken {
  const platform =
    data.platform === 'ios' || data.platform === 'android' || data.platform === 'web'
      ? data.platform
      : 'android';

  return {
    id,
    userId: String(data.userId ?? ''),
    restaurantId: String(data.restaurantId ?? ''),
    fcmToken: String(data.fcmToken ?? ''),
    deviceId: String(data.deviceId ?? ''),
    platform,
    appVersion: String(data.appVersion ?? '1.0.0'),
    active: data.active !== false,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    lastActiveAt: toIso(data.lastActiveAt),
  };
}

export function mapAuditLogEntry(id: string, data: DocumentData): AuditLogEntry {
  const action = String(data.action ?? 'threshold_updated') as AuditAction;
  const before =
    (data.before as Record<string, unknown> | null | undefined) ??
    (data.previousValues as Record<string, unknown> | null | undefined) ??
    null;
  const after =
    (data.after as Record<string, unknown> | null | undefined) ??
    (data.newValues as Record<string, unknown> | null | undefined) ??
    null;
  const actorId = String(data.actorId ?? data.userId ?? 'system');
  const actorName = String(data.actorName ?? (actorId === 'system' ? 'System' : 'Unknown'));
  const actorRole = String(data.actorRole ?? (actorId === 'system' ? 'system' : 'unknown'));
  const targetDocumentId = String(
    data.targetDocumentId ?? data.batchId ?? data.wasteLogId ?? data.notificationId ?? '',
  );
  const targetName = String(data.targetName ?? '');
  const targetCollection = String(
    data.targetCollection ?? resolveAuditTargetCollection(action),
  );
  const actionType =
    (data.actionType as AuditLogEntry['actionType']) || resolveAuditActionType(action);
  const module =
    (data.module as AuditLogEntry['module']) || resolveAuditModule(action);

  return {
    id,
    restaurantId: String(data.restaurantId ?? ''),
    action,
    actionType,
    module,
    actorId,
    actorName,
    actorRole,
    userId: actorId,
    targetCollection,
    targetDocumentId,
    targetName,
    batchId: String(data.batchId ?? ''),
    notificationId: data.notificationId != null ? String(data.notificationId) : null,
    deviceId: data.deviceId != null ? String(data.deviceId) : null,
    wasteLogId: data.wasteLogId != null ? String(data.wasteLogId) : null,
    timestamp: toIso(data.timestamp),
    before,
    after,
    previousValues: before,
    newValues: after,
    metadata:
      data.metadata && typeof data.metadata === 'object'
        ? (data.metadata as Record<string, unknown>)
        : {},
    description: String(
      data.description ??
        buildAuditDescription({ action, actorName, targetName }),
    ),
    appVersion: String(data.appVersion ?? ''),
    platform: String(data.platform ?? ''),
  };
}

export function mapNotificationHistory(
  id: string,
  data: DocumentData,
): NotificationHistoryEntry {
  return {
    id,
    restaurantId: String(data.restaurantId ?? ''),
    batchId: String(data.batchId ?? ''),
    status: data.status === 'red' ? 'red' : 'amber',
    ingredientName: String(data.ingredientName ?? ''),
    quantity: Number(data.quantity ?? 0),
    unit: String(data.unit ?? ''),
    dateReceived: toDateOnly(data.dateReceived),
    expiryDate: toDateOnly(data.expiryDate),
    daysRemaining: Number(data.daysRemaining ?? 0),
    recipientCount: Number(data.recipientCount ?? 0),
    successCount: Number(data.successCount ?? 0),
    failureCount: Number(data.failureCount ?? 0),
    triggeredAt: toIso(data.triggeredAt),
  };
}

export function mapWasteLog(id: string, data: DocumentData): WasteLog {
  const quantityWasted = Number(data.quantityWasted ?? 0);
  const unitCost = Number(data.unitCost ?? 0);
  const costLoss =
    data.costLoss != null ? Number(data.costLoss) : calculateCostLoss(quantityWasted, unitCost);

  return {
    id,
    restaurantId: String(data.restaurantId ?? ''),
    batchId: String(data.batchId ?? ''),
    ingredientName: String(data.ingredientName ?? ''),
    ingredientKey: String(data.ingredientKey ?? ingredientKey(String(data.ingredientName ?? ''))),
    quantityWasted,
    unit: String(data.unit ?? ''),
    wasteReason: (data.wasteReason as WasteReason) ?? 'Prep Waste',
    unitCost,
    costLoss,
    loggedBy: String(data.loggedBy ?? ''),
    loggedByName: String(data.loggedByName ?? ''),
    timestamp: toIso(data.timestamp ?? data.createdAt),
    voided: Boolean(data.voided),
    voidedAt: data.voidedAt ? toIso(data.voidedAt) : null,
    voidedBy: data.voidedBy ? String(data.voidedBy) : null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt ?? data.createdAt),
  };
}
