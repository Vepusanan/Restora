export type RestaurantCurrency = 'LKR' | 'USD' | 'EUR';

export type NotificationPreferences = {
  pushEnabled: boolean;
  amberAlertsEnabled: boolean;
  redAlertsEnabled: boolean;
  updatedAt: string;
};

export type UpdateProfileInput = {
  displayName: string;
  phoneNumber: string;
  avatarId?: string | null;
  localPhotoUri?: string | null;
  clearPhoto?: boolean;
};

export type UpdateRestaurantSettingsInput = {
  name: string;
  currency: RestaurantCurrency;
  expiryAlertThreshold: number;
};

export type UpdateNotificationPreferencesInput = {
  pushEnabled: boolean;
  amberAlertsEnabled: boolean;
  redAlertsEnabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'updatedAt'> = {
  pushEnabled: true,
  amberAlertsEnabled: true,
  redAlertsEnabled: true,
};

export const SUPPORTED_CURRENCIES: RestaurantCurrency[] = ['LKR', 'USD', 'EUR'];

export const CURRENCY_SYMBOLS: Record<RestaurantCurrency, string> = {
  LKR: 'Rs.',
  USD: '$',
  EUR: '€',
};
