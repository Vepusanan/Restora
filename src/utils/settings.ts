import type { NotificationPreferences, RestaurantCurrency } from '@/types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/types';

export const SETTINGS_DOC_ID = 'notifications';

export function normalizeCurrency(value: unknown): RestaurantCurrency {
  if (value === 'LKR' || value === 'EUR' || value === 'USD') return value;
  return 'USD';
}

export function normalizeNotificationPrefs(raw: unknown): NotificationPreferences {
  const data =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    pushEnabled: data.pushEnabled !== false,
    amberAlertsEnabled: data.amberAlertsEnabled !== false,
    redAlertsEnabled: data.redAlertsEnabled !== false,
    updatedAt:
      typeof data.updatedAt === 'string'
        ? data.updatedAt
        : new Date(0).toISOString(),
  };
}

export function defaultNotificationPrefs(): NotificationPreferences {
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    updatedAt: new Date(0).toISOString(),
  };
}

export function shouldReceiveExpiryPush(
  prefs: NotificationPreferences | null | undefined,
  tone: 'amber' | 'red',
): boolean {
  const resolved = prefs ?? defaultNotificationPrefs();
  if (!resolved.pushEnabled) return false;
  if (tone === 'amber') return resolved.amberAlertsEnabled;
  return resolved.redAlertsEnabled;
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Display name is required.';
  if (trimmed.length < 2) return 'Display name must be at least 2 characters.';
  if (trimmed.length > 80) return 'Display name must be 80 characters or fewer.';
  return null;
}

export function validatePhoneNumber(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  if (!/^[+0-9()\-\s]{7,20}$/.test(trimmed)) {
    return 'Enter a valid phone number.';
  }
  return null;
}

export function validateRestaurantName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Restaurant name is required.';
  if (trimmed.length < 2) return 'Restaurant name must be at least 2 characters.';
  if (trimmed.length > 100) return 'Restaurant name must be 100 characters or fewer.';
  return null;
}
