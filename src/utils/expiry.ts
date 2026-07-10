import { EXPIRY_AMBER_DAYS, NOTIFICATION_SUPPRESSION_HOURS } from '@constants/inventory';
import type { ExpiryTone, InventoryBatch } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseDateOnly(value: string): Date {
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
 * FR-015 / FR-025 — derive expiry tone from expiryDate + configurable amber threshold.
 * Never persist the result for UI display; Cloud Functions may cache evaluatedTone for transitions.
 */
export function getExpiryTone(
  expiryDate: string,
  now = new Date(),
  amberDays: number = EXPIRY_AMBER_DAYS,
): ExpiryTone {
  const threshold = Number.isFinite(amberDays) ? Math.max(1, Math.min(30, Math.floor(amberDays))) : EXPIRY_AMBER_DAYS;
  const days = daysUntilExpiry(expiryDate, now);
  if (days < 0) return 'red';
  if (days <= threshold) return 'amber';
  return 'green';
}

export function getExpiryLabel(
  expiryDate: string,
  now = new Date(),
): string {
  const days = daysUntilExpiry(expiryDate, now);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `${days} days left`;
}

export function buildExpiryNotificationCopy(input: {
  ingredientName: string;
  quantity: number;
  unit: string;
  daysRemaining: number;
  status: 'amber' | 'red';
}): { title: string; body: string } {
  const qty = `${input.quantity}${input.unit}`;
  const title = 'Inventory Expiry Alert';
  if (input.status === 'red') {
    const overdue = Math.abs(input.daysRemaining);
    const body =
      overdue === 0
        ? `${input.ingredientName} (${qty}) expired today.`
        : `${input.ingredientName} (${qty}) expired ${overdue} day${overdue === 1 ? '' : 's'} ago.`;
    return { title, body };
  }

  const days = input.daysRemaining;
  const body =
    days === 0
      ? `${input.ingredientName} (${qty}) expires today.`
      : `${input.ingredientName} (${qty}) will expire in ${days} day${days === 1 ? '' : 's'}.`;
  return { title, body };
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

export function resolveFifoBatchId(batches: InventoryBatch[]): string | null {
  const active = batches
    .filter(isActiveBatch)
    .slice()
    .sort((a, b) => a.dateReceived.localeCompare(b.dateReceived) || a.createdAt.localeCompare(b.createdAt));
  return active[0]?.id ?? null;
}

export function clampExpiryThreshold(value: number): number {
  if (!Number.isFinite(value)) return EXPIRY_AMBER_DAYS;
  return Math.max(1, Math.min(30, Math.floor(value)));
}

/** True when tone transition should trigger a notification (FR-021). */
export function isExpiryTransition(
  previous: ExpiryTone | null | undefined,
  next: ExpiryTone,
): next is 'amber' | 'red' {
  if (next !== 'amber' && next !== 'red') return false;
  const prev = previous ?? 'green';
  return (
    (prev === 'green' && next === 'amber') ||
    (prev === 'amber' && next === 'red') ||
    (prev === 'green' && next === 'red')
  );
}

/** FR-024 — suppress same batch + status within a rolling 24h window. */
export function shouldSuppressDuplicate(input: {
  lastNotifiedTone: ExpiryTone | null | undefined;
  lastNotifiedAt: Date | string | null | undefined;
  nextTone: 'amber' | 'red';
  now?: Date;
}): boolean {
  if (input.lastNotifiedTone !== input.nextTone || !input.lastNotifiedAt) return false;
  const lastAt =
    input.lastNotifiedAt instanceof Date
      ? input.lastNotifiedAt
      : new Date(input.lastNotifiedAt);
  if (Number.isNaN(lastAt.getTime())) return false;
  const now = input.now ?? new Date();
  return now.getTime() - lastAt.getTime() < NOTIFICATION_SUPPRESSION_HOURS * 60 * 60 * 1000;
}
