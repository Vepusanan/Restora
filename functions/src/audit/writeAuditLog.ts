import { FieldValue, getFirestore } from 'firebase-admin/firestore';

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
  | 'inventory_restored'
  | 'staff_approved'
  | 'staff_rejected'
  | 'staff_deactivated'
  | 'user_login'
  | 'user_logout'
  | 'ai_settings_updated'
  | 'analytics_exported';

type AuditActionType =
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

const ACTION_TYPE: Record<string, AuditActionType> = {
  batch_created: 'CREATE',
  batch_edited: 'UPDATE',
  batch_consumed: 'UPDATE',
  batch_archived: 'ARCHIVE',
  threshold_updated: 'CONFIGURATION_CHANGE',
  expiry_detected: 'SYSTEM',
  notification_sent: 'SYSTEM',
  notification_failed: 'SYSTEM',
  waste_created: 'CREATE',
  waste_voided: 'DELETE',
  inventory_restored: 'RESTORE',
  staff_deactivated: 'DEACTIVATE',
  device_removed: 'DELETE',
};

/**
 * Centralized Admin SDK audit writer for Cloud Functions (FR-053).
 */
export async function writeAuditLog(input: {
  action: AuditAction;
  restaurantId: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  targetCollection?: string;
  targetDocumentId?: string;
  targetName?: string;
  batchId?: string;
  wasteLogId?: string;
  notificationId?: string | null;
  deviceId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  description?: string;
}): Promise<string> {
  const actorId = input.actorId ?? 'system';
  const actorName = input.actorName ?? (actorId === 'system' ? 'System' : 'Unknown');
  const actorRole = input.actorRole ?? (actorId === 'system' ? 'system' : 'unknown');
  const before = input.before ?? null;
  const after = input.after ?? null;
  const targetDocumentId = input.targetDocumentId ?? input.batchId ?? '';

  const ref = await getFirestore().collection('auditLogs').add({
    restaurantId: input.restaurantId,
    action: input.action,
    actionType: ACTION_TYPE[input.action] ?? 'SYSTEM',
    module:
      input.action.startsWith('waste')
        ? 'waste'
        : input.action.startsWith('batch') || input.action === 'inventory_restored'
          ? 'inventory'
          : input.action.startsWith('staff')
            ? 'staff'
            : input.action.startsWith('notification') || input.action.startsWith('device')
              ? 'notifications'
              : input.action.startsWith('expiry') || input.action === 'threshold_updated'
                ? 'expiry'
                : 'system',
    actorId,
    actorName,
    actorRole,
    userId: actorId,
    targetCollection: input.targetCollection ?? '',
    targetDocumentId,
    targetName: input.targetName ?? '',
    batchId: input.batchId ?? '',
    wasteLogId: input.wasteLogId ?? null,
    notificationId: input.notificationId ?? null,
    deviceId: input.deviceId ?? null,
    before,
    after,
    previousValues: before,
    newValues: after,
    metadata: input.metadata ?? {},
    description:
      input.description ?? `${actorName} — ${input.action}${input.targetName ? `: ${input.targetName}` : ''}`,
    appVersion: 'functions',
    platform: 'server',
    timestamp: FieldValue.serverTimestamp(),
  });

  return ref.id;
}
