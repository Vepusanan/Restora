export type UserRole = 'admin' | 'staff';

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
  restaurantId: string;
  restaurantName: string;
  restaurantCode: string;
  avatarId: string | null;
  photoURL: string | null;
  /** @deprecated Prefer fcmTokens for multi-device support */
  fcmToken: string | null;
  fcmTokens: string[];
  notificationPrefs: import('./settings').NotificationPreferences;
  createdAt: string;
  updatedAt: string;
};

export type Restaurant = {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  /** Amber alert threshold in days (FR-025). Default 3. */
  expiryAlertThreshold: number;
  currency: import('./settings').RestaurantCurrency;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StaffMember = {
  uid: string;
  email: string;
  displayName: string;
  status: UserStatus;
  avatarId: string | null;
  photoURL: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export type ServiceError = {
  code: string;
  message: string;
};

export type AvatarOption = {
  id: string;
  label: string;
  color: string;
  emoji: string;
};
