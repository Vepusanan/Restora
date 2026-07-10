"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditLog = writeAuditLog;
const firestore_1 = require("firebase-admin/firestore");
const ACTION_TYPE = {
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
async function writeAuditLog(input) {
    const actorId = input.actorId ?? 'system';
    const actorName = input.actorName ?? (actorId === 'system' ? 'System' : 'Unknown');
    const actorRole = input.actorRole ?? (actorId === 'system' ? 'system' : 'unknown');
    const before = input.before ?? null;
    const after = input.after ?? null;
    const targetDocumentId = input.targetDocumentId ?? input.batchId ?? '';
    const ref = await (0, firestore_1.getFirestore)().collection('auditLogs').add({
        restaurantId: input.restaurantId,
        action: input.action,
        actionType: ACTION_TYPE[input.action] ?? 'SYSTEM',
        module: input.action.startsWith('waste')
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
        description: input.description ?? `${actorName} — ${input.action}${input.targetName ? `: ${input.targetName}` : ''}`,
        appVersion: 'functions',
        platform: 'server',
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    });
    return ref.id;
}
//# sourceMappingURL=writeAuditLog.js.map