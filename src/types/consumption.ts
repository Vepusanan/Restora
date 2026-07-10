export type UsageCategory =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Recipe'
  | 'Manual Adjustment'
  | 'Kitchen Use';

export type InventoryUsageLog = {
  id: string;
  restaurantId: string;
  batchId: string;
  ingredientName: string;
  ingredientKey: string;
  quantityUsed: number;
  unit: string;
  category: UsageCategory;
  notes: string;
  unitCost: number;
  /** quantityUsed × unitCost — ingredient cost contribution (not waste loss). */
  consumptionCost: number;
  usedBy: string;
  usedByName: string;
  usedAt: string;
  voided: boolean;
  voidedAt: string | null;
  voidedBy: string | null;
  /** Links multi-batch FIFO allocations from a single usage event. */
  usageGroupId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateUsageInput = {
  /** Prefer FIFO across this ingredient when batchId is omitted. */
  ingredientKey: string;
  quantityUsed: number;
  category: UsageCategory;
  notes?: string;
  /** When set, consume from this batch only. When omitted, auto-FIFO. */
  batchId?: string | null;
  /** When false (default), expired batches are excluded from FIFO. */
  allowExpired?: boolean;
};

export type FifoAllocation = {
  batchId: string;
  quantityUsed: number;
  unitCost: number;
  remainingAfter: number;
  ingredientName: string;
  unit: string;
  dateReceived: string;
};

export type UsageVisibilityFilter = 'active' | 'voided' | 'all';

export type UsageFilters = {
  search: string;
  category: UsageCategory | null;
  usedBy: string | null;
  batchId: string | null;
  ingredientKey: string | null;
  visibility: UsageVisibilityFilter;
  dateFrom: string | null;
  dateTo: string | null;
};

export type UsageSummary = {
  totalEvents: number;
  activeEvents: number;
  voidedEvents: number;
  totalConsumptionCost: number;
  quantityUsed: number;
};

export type ConsumptionTrendPoint = {
  key: string;
  label: string;
  totalCost: number;
  quantityUsed: number;
};

export type TopConsumedIngredient = {
  rank: number;
  ingredientName: string;
  ingredientKey: string;
  totalCost: number;
  quantityUsed: number;
  eventCount: number;
  percentage: number;
  unit: string;
};

export type ConsumptionByCategoryRow = {
  category: UsageCategory;
  totalCost: number;
  quantityUsed: number;
  eventCount: number;
};

export type InventoryTurnoverRow = {
  ingredientName: string;
  ingredientKey: string;
  quantityConsumed: number;
  remainingQuantity: number;
  turnoverRatio: number;
  unit: string;
  frequency: number;
  averageDailyConsumption: number;
};

export type ConsumptionCostResult = {
  totalCost: number;
  eventCount: number;
  quantityUsed: number;
  rows: { key: string; label: string; totalCost: number; eventCount: number }[];
};
