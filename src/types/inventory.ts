export type InventoryUnit =
  | 'kg'
  | 'g'
  | 'L'
  | 'ml'
  | 'pcs'
  | 'box'
  | 'pack'
  | 'dozen';

/** Derived only — never persisted (FR-015). */
export type ExpiryTone = 'green' | 'amber' | 'red';

export type InventoryBatch = {
  id: string;
  restaurantId: string;
  ingredientName: string;
  /** Normalized lowercase key for grouping */
  ingredientKey: string;
  quantity: number;
  unit: InventoryUnit;
  unitCost: number;
  supplier: string;
  dateReceived: string;
  expiryDate: string;
  consumed: boolean;
  archived: boolean;
  consumedAt: string | null;
  consumedBy: string | null;
  createdAt: string;
  createdBy: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
};

export type CreateBatchInput = {
  ingredientName: string;
  quantity: number;
  unit: InventoryUnit;
  unitCost: number;
  supplier: string;
  dateReceived: string;
  expiryDate: string;
};

export type EditBatchInput = {
  supplier: string;
  quantity: number;
  expiryDate: string;
};

export type AuditAction =
  | 'batch_created'
  | 'batch_edited'
  | 'batch_consumed'
  | 'batch_archived';

export type AuditLogEntry = {
  id: string;
  action: AuditAction;
  restaurantId: string;
  batchId: string;
  userId: string;
  timestamp: string;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
};

export type InventoryVisibilityFilter =
  | 'active'
  | 'consumed'
  | 'archived'
  | 'all';

export type InventorySortKey =
  | 'expiryDate'
  | 'dateReceived'
  | 'ingredientName'
  | 'quantity';

export type InventoryFilters = {
  search: string;
  supplier: string | null;
  expiryTones: ExpiryTone[];
  visibility: InventoryVisibilityFilter;
  sort: InventorySortKey;
};

export type IngredientGroup = {
  ingredientName: string;
  ingredientKey: string;
  batches: InventoryBatch[];
  fifoBatchId: string | null;
};
