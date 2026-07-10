import type { DocumentData, Timestamp } from 'firebase/firestore';
import type {
  InventoryBatch,
  InventoryUnit,
  Restaurant,
  StaffMember,
  UserProfile,
  UserRole,
  UserStatus,
} from '@/types';
import { ingredientKey, normalizeIngredientName } from '@utils/expiry';

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
  };
}
