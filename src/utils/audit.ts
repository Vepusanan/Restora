import { AUDIT_ACTION_LABELS, AUDIT_MODULE_LABELS } from '@constants/audit';
import type {
  AuditAction,
  AuditActionType,
  AuditFilters,
  AuditLogEntry,
  AuditModule,
} from '@/types';

const ACTION_TYPE_MAP: Record<AuditAction, AuditActionType> = {
  batch_created: 'CREATE',
  batch_edited: 'UPDATE',
  batch_consumed: 'UPDATE',
  batch_archived: 'ARCHIVE',
  threshold_updated: 'CONFIGURATION_CHANGE',
  expiry_detected: 'SYSTEM',
  notification_sent: 'SYSTEM',
  notification_failed: 'SYSTEM',
  notification_delivered: 'SYSTEM',
  notification_opened: 'READ',
  notification_read: 'UPDATE',
  device_registered: 'CREATE',
  device_removed: 'DELETE',
  waste_created: 'CREATE',
  waste_voided: 'DELETE',
  usage_created: 'CREATE',
  usage_voided: 'DELETE',
  usage_updated: 'UPDATE',
  inventory_reduced: 'UPDATE',
  fifo_allocation: 'SYSTEM',
  inventory_restored: 'RESTORE',
  staff_approved: 'APPROVE',
  staff_rejected: 'REJECT',
  staff_deactivated: 'DEACTIVATE',
  user_login: 'LOGIN',
  user_logout: 'LOGOUT',
  ai_settings_updated: 'CONFIGURATION_CHANGE',
  analytics_exported: 'SYSTEM',
  profile_updated: 'UPDATE',
  profile_photo_updated: 'UPDATE',
  restaurant_settings_updated: 'CONFIGURATION_CHANGE',
  notification_prefs_updated: 'CONFIGURATION_CHANGE',
};

const MODULE_MAP: Record<AuditAction, AuditModule> = {
  batch_created: 'inventory',
  batch_edited: 'inventory',
  batch_consumed: 'inventory',
  batch_archived: 'inventory',
  threshold_updated: 'expiry',
  expiry_detected: 'expiry',
  notification_sent: 'notifications',
  notification_failed: 'notifications',
  notification_delivered: 'notifications',
  notification_opened: 'notifications',
  notification_read: 'notifications',
  device_registered: 'notifications',
  device_removed: 'notifications',
  waste_created: 'waste',
  waste_voided: 'waste',
  usage_created: 'consumption',
  usage_voided: 'consumption',
  usage_updated: 'consumption',
  inventory_reduced: 'inventory',
  fifo_allocation: 'consumption',
  inventory_restored: 'inventory',
  staff_approved: 'staff',
  staff_rejected: 'staff',
  staff_deactivated: 'staff',
  user_login: 'auth',
  user_logout: 'auth',
  ai_settings_updated: 'ai',
  analytics_exported: 'analytics',
  profile_updated: 'auth',
  profile_photo_updated: 'auth',
  restaurant_settings_updated: 'system',
  notification_prefs_updated: 'notifications',
};

const TARGET_COLLECTION_MAP: Record<AuditAction, string> = {
  batch_created: 'inventoryBatches',
  batch_edited: 'inventoryBatches',
  batch_consumed: 'inventoryBatches',
  batch_archived: 'inventoryBatches',
  threshold_updated: 'restaurants',
  expiry_detected: 'inventoryBatches',
  notification_sent: 'notifications',
  notification_failed: 'notifications',
  notification_delivered: 'notifications',
  notification_opened: 'notifications',
  notification_read: 'notifications',
  device_registered: 'deviceTokens',
  device_removed: 'deviceTokens',
  waste_created: 'wasteLogs',
  waste_voided: 'wasteLogs',
  usage_created: 'inventory_usage',
  usage_voided: 'inventory_usage',
  usage_updated: 'inventory_usage',
  inventory_reduced: 'inventoryBatches',
  fifo_allocation: 'inventory_usage',
  inventory_restored: 'inventoryBatches',
  staff_approved: 'users',
  staff_rejected: 'users',
  staff_deactivated: 'users',
  user_login: 'users',
  user_logout: 'users',
  ai_settings_updated: 'restaurants',
  analytics_exported: 'analytics',
  profile_updated: 'users',
  profile_photo_updated: 'users',
  restaurant_settings_updated: 'restaurants',
  notification_prefs_updated: 'users',
};

export function resolveAuditActionType(action: AuditAction): AuditActionType {
  return ACTION_TYPE_MAP[action] ?? 'SYSTEM';
}

export function resolveAuditModule(action: AuditAction): AuditModule {
  return MODULE_MAP[action] ?? 'system';
}

export function resolveAuditTargetCollection(action: AuditAction): string {
  return TARGET_COLLECTION_MAP[action] ?? 'unknown';
}

export function buildAuditDescription(input: {
  action: AuditAction;
  actorName: string;
  targetName?: string;
}): string {
  const label = AUDIT_ACTION_LABELS[input.action] ?? input.action;
  const target = input.targetName?.trim();
  if (target) return `${input.actorName} — ${label}: ${target}`;
  return `${input.actorName} — ${label}`;
}

export function auditActionLabel(action: AuditAction | string): string {
  return AUDIT_ACTION_LABELS[action as AuditAction] ?? action;
}

export function auditModuleLabel(module: AuditModule | string): string {
  return AUDIT_MODULE_LABELS[module as AuditModule] ?? module;
}

export function matchesAuditSearch(entry: AuditLogEntry, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    entry.actorName,
    entry.actorId,
    entry.targetName,
    entry.targetDocumentId,
    entry.description,
    entry.action,
    entry.actionType,
    entry.module,
    entry.batchId,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function filterAuditEntries(
  entries: AuditLogEntry[],
  filters: AuditFilters,
): AuditLogEntry[] {
  let result = entries.filter((entry) => {
    if (filters.action !== 'all' && entry.action !== filters.action) return false;
    if (filters.actionType !== 'all' && entry.actionType !== filters.actionType) return false;
    if (filters.module !== 'all' && entry.module !== filters.module) return false;
    if (filters.actorId !== 'all' && entry.actorId !== filters.actorId) return false;
    if (filters.dateFrom) {
      const day = entry.timestamp.slice(0, 10);
      if (day < filters.dateFrom) return false;
    }
    if (filters.dateTo) {
      const day = entry.timestamp.slice(0, 10);
      if (day > filters.dateTo) return false;
    }
    if (!matchesAuditSearch(entry, filters.search)) return false;
    return true;
  });

  result = [...result].sort((a, b) => {
    const delta = a.timestamp.localeCompare(b.timestamp);
    return filters.sort === 'oldest' ? delta : -delta;
  });

  return result;
}

export function diffAuditValues(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): Array<{ key: string; before: unknown; after: unknown; changed: boolean }> {
  const keys = Array.from(
    new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  ).sort();

  return keys.map((key) => {
    const left = before?.[key];
    const right = after?.[key];
    const changed = JSON.stringify(left) !== JSON.stringify(right);
    return { key, before: left ?? null, after: right ?? null, changed };
  });
}
