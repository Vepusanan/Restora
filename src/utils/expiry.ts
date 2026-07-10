import { EXPIRY_AMBER_DAYS } from '@constants/inventory';
import type { ExpiryTone, InventoryBatch } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseDateOnly(value: string): Date {
  // Accept YYYY-MM-DD or ISO strings.
  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return new Date(NaN);
  return new Date(year, month - 1, day);
}

export function toDateOnlyString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysUntilExpiry(expiryDate: string, now = new Date()): number {
  const expiry = startOfDay(parseDateOnly(expiryDate));
  const today = startOfDay(now);
  return Math.round((expiry.getTime() - today.getTime()) / DAY_MS);
}

/**
 * FR-015 — derive expiry tone from expiryDate only (never persisted).
 * Green: > 3 days | Amber: 0–3 days | Red: expired (< 0)
 */
export function getExpiryTone(expiryDate: string, now = new Date()): ExpiryTone {
  const days = daysUntilExpiry(expiryDate, now);
  if (days < 0) return 'red';
  if (days <= EXPIRY_AMBER_DAYS) return 'amber';
  return 'green';
}

export function getExpiryLabel(expiryDate: string, now = new Date()): string {
  const days = daysUntilExpiry(expiryDate, now);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `${days} days left`;
}

export function normalizeIngredientName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function ingredientKey(name: string): string {
  return normalizeIngredientName(name).toLowerCase();
}

export function isActiveBatch(batch: InventoryBatch): boolean {
  return !batch.consumed && !batch.archived;
}

/**
 * FR-014 — oldest active batch in a FIFO-sorted group gets the badge.
 */
export function resolveFifoBatchId(batches: InventoryBatch[]): string | null {
  const active = batches
    .filter(isActiveBatch)
    .slice()
    .sort((a, b) => a.dateReceived.localeCompare(b.dateReceived) || a.createdAt.localeCompare(b.createdAt));
  return active[0]?.id ?? null;
}
