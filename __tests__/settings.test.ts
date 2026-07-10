import {
  defaultNotificationPrefs,
  shouldReceiveExpiryPush,
  validateDisplayName,
  validatePhoneNumber,
  validateRestaurantName,
  normalizeCurrency,
} from '../src/utils/settings';
import type { NotificationPreferences } from '../src/types';

describe('Module 3.10 — settings utilities', () => {
  it('validates profile display name and phone', () => {
    expect(validateDisplayName('')).toBeTruthy();
    expect(validateDisplayName('A')).toBeTruthy();
    expect(validateDisplayName('Ada Admin')).toBeNull();
    expect(validatePhoneNumber('')).toBeNull();
    expect(validatePhoneNumber('123')).toBeTruthy();
    expect(validatePhoneNumber('+94 77 123 4567')).toBeNull();
  });

  it('validates restaurant name and currency', () => {
    expect(validateRestaurantName('')).toBeTruthy();
    expect(validateRestaurantName('Restora Kitchen')).toBeNull();
    expect(normalizeCurrency('LKR')).toBe('LKR');
    expect(normalizeCurrency('XYZ')).toBe('USD');
  });

  it('filters expiry push by notification preferences', () => {
    const prefs: NotificationPreferences = {
      pushEnabled: true,
      amberAlertsEnabled: false,
      redAlertsEnabled: true,
      updatedAt: new Date().toISOString(),
    };
    expect(shouldReceiveExpiryPush(prefs, 'amber')).toBe(false);
    expect(shouldReceiveExpiryPush(prefs, 'red')).toBe(true);

    const disabled = { ...prefs, pushEnabled: false };
    expect(shouldReceiveExpiryPush(disabled, 'red')).toBe(false);
    expect(shouldReceiveExpiryPush(defaultNotificationPrefs(), 'amber')).toBe(true);
  });
});
