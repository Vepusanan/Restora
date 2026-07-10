/**
 * Module 3.9 — Audit Logging types (FR-053 / FR-054).
 */

export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ARCHIVE'
  | 'APPROVE'
  | 'REJECT'
  | 'DEACTIVATE'
  | 'RESTORE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'READ'
  | 'CONFIGURATION_CHANGE'
  | 'SYSTEM';

export type AuditModule =
  | 'auth'
  | 'inventory'
  | 'waste'
  | 'consumption'
  | 'expiry'
  | 'notifications'
  | 'cost'
  | 'analytics'
  | 'ai'
  | 'system'
  | 'staff';

/** Specific business actions (legacy + Module 3.9). */
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
  | 'usage_created'
  | 'usage_voided'
  | 'usage_updated'
  | 'inventory_reduced'
  | 'fifo_allocation'
  | 'inventory_restored'
  | 'staff_approved'
  | 'staff_rejected'
  | 'staff_deactivated'
  | 'user_login'
  | 'user_logout'
  | 'ai_settings_updated'
  | 'analytics_exported'
  | 'profile_updated'
  | 'profile_photo_updated'
  | 'restaurant_settings_updated'
  | 'notification_prefs_updated';

export type AuditActor = {
  id: string;
  name: string;
  role: string;
};

export type AuditTarget = {
  collection: string;
  documentId: string;
  name?: string;
};

export type AuditLogEntry = {
  id: string;
  restaurantId: string;
  /** Specific action key (e.g. batch_created) */
  action: AuditAction;
  /** Standardized action category (FR-053) */
  actionType: AuditActionType;
  module: AuditModule;
  actorId: string;
  actorName: string;
  actorRole: string;
  /** @deprecated Prefer actorId — kept for legacy docs */
  userId: string;
  targetCollection: string;
  targetDocumentId: string;
  targetName: string;
  /** @deprecated Prefer targetDocumentId when batch-related */
  batchId: string;
  notificationId: string | null;
  deviceId: string | null;
  wasteLogId: string | null;
  usageLogId: string | null;
  timestamp: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  /** Legacy aliases */
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  description: string;
  appVersion: string;
  platform: string;
};

export type WriteAuditInput = {
  action: AuditAction;
  restaurantId: string;
  actor?: Partial<AuditActor> & { id?: string };
  target?: Partial<AuditTarget>;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  notificationId?: string | null;
  deviceId?: string | null;
  wasteLogId?: string | null;
  usageLogId?: string | null;
  /** Legacy alias for target.documentId when inventory/waste */
  batchId?: string;
  /** Legacy alias for actor.id */
  userId?: string;
  description?: string;
};

export type AuditSortOrder = 'newest' | 'oldest';

export type AuditFilters = {
  search: string;
  action: AuditAction | 'all';
  actionType: AuditActionType | 'all';
  module: AuditModule | 'all';
  actorId: string | 'all';
  dateFrom: string;
  dateTo: string;
  sort: AuditSortOrder;
};
