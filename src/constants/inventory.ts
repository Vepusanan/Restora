import type { InventoryUnit } from '@/types';

export const INVENTORY_UNITS: InventoryUnit[] = [
  'kg',
  'g',
  'L',
  'ml',
  'pcs',
  'box',
  'pack',
  'dozen',
];

/** Default amber window in days (FR-015 / FR-025). Overridden per restaurant. */
export const EXPIRY_AMBER_DAYS = 3;
export const EXPIRY_THRESHOLD_MIN = 1;
export const EXPIRY_THRESHOLD_MAX = 30;
export const NOTIFICATION_SUPPRESSION_HOURS = 24;

export const DEFAULT_INVENTORY_FILTERS = {
  search: '',
  supplier: null as string | null,
  expiryTones: [] as ('green' | 'amber' | 'red')[],
  visibility: 'active' as const,
  sort: 'dateReceived' as const,
};
