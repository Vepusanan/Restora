export const COLLECTIONS = {
  users: 'users',
  restaurants: 'restaurants',
  restaurantCodes: 'restaurantCodes',
  notifications: 'notifications',
  inventoryBatches: 'inventoryBatches',
  auditLogs: 'auditLogs',
  waste: 'waste',
  /** Admin-only financial collections (rules deny staff) */
  costs: 'costs',
  analytics: 'analytics',
  financialSummaries: 'financialSummaries',
} as const;

/** @deprecated Use COLLECTIONS.users */
export const AUTH_COLLECTION = COLLECTIONS.users;

export const MIN_PASSWORD_LENGTH = 8;

export const RESTAURANT_CODE_PREFIX = 'RST';
export const RESTAURANT_CODE_LENGTH = 6;

export const USER_ROLES = ['admin', 'staff'] as const;
export const USER_STATUSES = ['pending', 'approved', 'rejected', 'deactivated'] as const;

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
