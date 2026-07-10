export type ExpiryTone = 'green' | 'amber' | 'red';

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_AMBER_DAYS = 3;
export const SUPPRESSION_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseDateOnly(value: string): Date {
  const datePart = String(value).slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return new Date(NaN);
  return new Date(year, month - 1, day);
}

export function daysUntilExpiry(expiryDate: string, now = new Date()): number {
  const expiry = startOfDay(parseDateOnly(expiryDate));
  const today = startOfDay(now);
  return Math.round((expiry.getTime() - today.getTime()) / DAY_MS);
}

export function clampExpiryThreshold(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_AMBER_DAYS;
  return Math.max(1, Math.min(30, Math.floor(value)));
}

export function getExpiryTone(
  expiryDate: string,
  now = new Date(),
  amberDays: number = DEFAULT_AMBER_DAYS,
): ExpiryTone {
  const threshold = clampExpiryThreshold(amberDays);
  const days = daysUntilExpiry(expiryDate, now);
  if (days < 0) return 'red';
  if (days <= threshold) return 'amber';
  return 'green';
}

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

export function shouldSuppressDuplicate(input: {
  lastNotifiedTone: ExpiryTone | null | undefined;
  lastNotifiedAt: Date | null | undefined;
  nextTone: 'amber' | 'red';
  now?: Date;
}): boolean {
  if (input.lastNotifiedTone !== input.nextTone || !input.lastNotifiedAt) return false;
  const now = input.now ?? new Date();
  return now.getTime() - input.lastNotifiedAt.getTime() < SUPPRESSION_MS;
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
