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
  /** Server-side evaluation cache for Cloud Functions (not used for UI badges). */
  evaluatedTone: ExpiryTone | null;
  lastNotifiedTone: ExpiryTone | null;
  lastNotifiedAt: string | null;
  lastEvaluatedAt: string | null;
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
  | 'batch_archived'
  | 'threshold_updated'
  | 'expiry_detected'
  | 'notification_sent'
  | 'notification_failed'
  | 'notification_delivered'
  | 'notification_opened'
  | 'notification_read'
  | 'device_registered'
  | 'device_removed'
  | 'waste_created'
  | 'waste_voided'
  | 'inventory_restored';

export type AuditLogEntry = {
  id: string;
  action: AuditAction;
  restaurantId: string;
  batchId: string;
  userId: string;
  notificationId?: string | null;
  deviceId?: string | null;
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
