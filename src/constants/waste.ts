import type { WasteReason } from '@/types';

export const WASTE_REASONS: WasteReason[] = [
  'Expired',
  'Burnt',
  'Prep Waste',
  'Leftovers',
];

export const WASTE_REASON_OPTIONS = WASTE_REASONS.map((reason) => ({
  value: reason,
  label: reason,
}));

export const DEFAULT_WASTE_FILTERS = {
  search: '',
  wasteReason: null as WasteReason | null,
  loggedBy: null as string | null,
  batchId: null as string | null,
  visibility: 'active' as const,
  dateFrom: null as string | null,
  dateTo: null as string | null,
};
