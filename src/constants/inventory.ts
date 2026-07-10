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

/** Amber window: 0–3 days remaining (FR-015). */
export const EXPIRY_AMBER_DAYS = 3;

export const DEFAULT_INVENTORY_FILTERS = {
  search: '',
  supplier: null as string | null,
  expiryTones: [] as ('green' | 'amber' | 'red')[],
  visibility: 'active' as const,
  sort: 'dateReceived' as const,
};
