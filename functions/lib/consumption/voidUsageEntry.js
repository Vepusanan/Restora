"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voidUsageEntry = void 0;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const types_1 = require("./types");
/**
 * FR-064 — admin void usage entry and restore inventory quantity.
 */
exports.voidUsageEntry = (0, https_1.onCall)({
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
}, async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in required');
    }
    const data = request.data;
    const usageLogId = String(data?.usageLogId ?? '').trim();
    if (!usageLogId) {
        throw new https_1.HttpsError('invalid-argument', 'usageLogId is required');
    }
    const db = (0, firestore_1.getFirestore)();
    const userSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!userSnap.exists) {
        throw new https_1.HttpsError('permission-denied', 'User profile not found');
    }
    const user = userSnap.data();
    if (user.status !== 'approved' || user.role !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Only admins can void usage entries');
    }
    const usageRef = db.collection('inventory_usage').doc(usageLogId);
    const auditRef = db.collection('auditLogs').doc();
    const restoreAuditRef = db.collection('auditLogs').doc();
    const result = await db.runTransaction(async (tx) => {
        const usageSnap = await tx.get(usageRef);
        if (!usageSnap.exists) {
            throw new https_1.HttpsError('not-found', 'Usage entry not found');
        }
        const usage = usageSnap.data();
        if (usage.restaurantId !== user.restaurantId) {
            throw new https_1.HttpsError('permission-denied', 'Usage entry belongs to another restaurant');
        }
        if (usage.voided) {
            throw new https_1.HttpsError('failed-precondition', 'Usage entry already voided');
        }
        const batchRef = db.collection('inventoryBatches').doc(String(usage.batchId));
        const batchSnap = await tx.get(batchRef);
        if (!batchSnap.exists) {
            throw new https_1.HttpsError('not-found', 'Source batch no longer exists');
        }
        const batch = batchSnap.data();
        const quantityUsed = Number(usage.quantityUsed ?? 0);
        const previousQuantity = Number(batch.quantity ?? 0);
        const nextQuantity = (0, types_1.roundQty)(previousQuantity + quantityUsed);
        const now = firestore_1.FieldValue.serverTimestamp();
        tx.update(usageRef, {
            voided: true,
            voidedAt: now,
            voidedBy: request.auth.uid,
            updatedAt: now,
        });
        tx.update(batchRef, {
            quantity: nextQuantity,
            consumed: false,
            consumedAt: null,
            consumedBy: null,
            lastModifiedAt: now,
            lastModifiedBy: request.auth.uid,
        });
        tx.set(auditRef, {
            action: 'usage_voided',
            restaurantId: user.restaurantId,
            batchId: String(usage.batchId),
            usageLogId,
            userId: request.auth.uid,
            previousValues: { voided: false, quantity: previousQuantity },
            newValues: { voided: true, quantity: nextQuantity },
            timestamp: now,
        });
        tx.set(restoreAuditRef, {
            action: 'inventory_restored',
            restaurantId: user.restaurantId,
            batchId: String(usage.batchId),
            usageLogId,
            userId: request.auth.uid,
            previousValues: { quantity: previousQuantity },
            newValues: { quantity: nextQuantity, restored: quantityUsed },
            timestamp: now,
        });
        return {
            usageLogId,
            restoredQuantity: quantityUsed,
            remainingQuantity: nextQuantity,
        };
    });
    firebase_functions_1.logger.info('voidUsageEntry success', {
        usageLogId: result.usageLogId,
        uid: request.auth.uid,
    });
    return { ok: true, ...result };
});
//# sourceMappingURL=voidUsageEntry.js.map