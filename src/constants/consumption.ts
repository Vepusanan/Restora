import type { UsageCategory } from '@/types';

export const USAGE_CATEGORIES: UsageCategory[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Recipe',
  'Manual Adjustment',
  'Kitchen Use',
];

export const USAGE_CATEGORY_OPTIONS = USAGE_CATEGORIES.map((category) => ({
  value: category,
  label: category,
}));

export const DEFAULT_USAGE_FILTERS = {
  search: '',
  category: null as UsageCategory | null,
  usedBy: null as string | null,
  batchId: null as string | null,
  ingredientKey: null as string | null,
  visibility: 'active' as const,
  dateFrom: null as string | null,
  dateTo: null as string | null,
};

/** Collection id matches Module 3.11 Firestore design (`inventory_usage`). */
export const INVENTORY_USAGE_COLLECTION = 'inventory_usage';
