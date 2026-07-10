import type { DocumentData, Timestamp } from 'firebase/firestore';
import type {
  AppNotification,
  ExpiryTone,
  InventoryBatch,
  InventoryUnit,
  NotificationHistoryEntry,
  Restaurant,
  StaffMember,
  UserProfile,
  UserRole,
  UserStatus,
} from '@/types';
import { EXPIRY_AMBER_DAYS } from '@constants/inventory';
import { clampExpiryThreshold, ingredientKey, normalizeIngredientName } from '@utils/expiry';

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
    role: (data.role as UserRole) ?? 'staff',
    status: (data.status as UserStatus) ?? 'pending',
    restaurantId: String(data.restaurantId ?? ''),
    restaurantName: String(data.restaurantName ?? ''),
    restaurantCode: String(data.restaurantCode ?? ''),
    avatarId: data.avatarId ? String(data.avatarId) : null,
    photoURL: data.photoURL ? String(data.photoURL) : null,
    fcmToken: data.fcmToken ? String(data.fcmToken) : null,
    fcmTokens: mapTokens(data),
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
    status: data.status === 'red' ? 'red' : 'amber',
    title: String(data.title ?? ''),
    body: String(data.body ?? ''),
    read: Boolean(data.read),
    deepLink: String(data.deepLink ?? 'restora://inventory'),
    createdAt: toIso(data.createdAt),
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
