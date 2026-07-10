"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWasteLog = void 0;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const types_1 = require("./types");
/**
 * FR-026–FR-029 — create waste log + deduct inventory atomically.
 * costLoss is always computed server-side from batch.unitCost.
 */
exports.createWasteLog = (0, https_1.onCall)({
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
}, async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in required');
    }
    const data = request.data;
    const batchId = String(data?.batchId ?? '').trim();
    const quantityWasted = Number(data?.quantityWasted);
    const wasteReason = data?.wasteReason;
    if (!batchId) {
        throw new https_1.HttpsError('invalid-argument', 'batchId is required');
    }
    if (!(0, types_1.isValidWasteReason)(wasteReason)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid waste reason');
    }
    const db = (0, firestore_1.getFirestore)();
    const userSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!userSnap.exists) {
        throw new https_1.HttpsError('permission-denied', 'User profile not found');
    }
    const user = userSnap.data();
    if (user.status !== 'approved') {
        throw new https_1.HttpsError('permission-denied', 'Only approved users can log waste');
    }
    const batchRef = db.collection('inventoryBatches').doc(batchId);
    const wasteRef = db.collection('wasteLogs').doc();
    const auditRef = db.collection('auditLogs').doc();
    const result = await db.runTransaction(async (tx) => {
        const batchSnap = await tx.get(batchRef);
        if (!batchSnap.exists) {
            throw new https_1.HttpsError('not-found', 'Batch not found');
        }
        const batch = batchSnap.data();
        if (batch.restaurantId !== user.restaurantId) {
            throw new https_1.HttpsError('permission-denied', 'Batch belongs to another restaurant');
        }
        if (batch.archived || batch.consumed) {
            throw new https_1.HttpsError('failed-precondition', 'Batch is not available for waste logging');
        }
        const remaining = Number(batch.quantity ?? 0);
        try {
            (0, types_1.assertWasteQuantity)(quantityWasted, remaining);
        }
        catch (error) {
            throw new https_1.HttpsError('invalid-argument', error instanceof Error ? error.message : 'Invalid waste quantity');
        }
        const unitCost = Number(batch.unitCost ?? 0);
        const costLoss = (0, types_1.calculateCostLoss)(quantityWasted, unitCost);
        const nextQuantity = Math.round((remaining - quantityWasted) * 1000) / 1000;
        const now = firestore_1.FieldValue.serverTimestamp();
        const ingredientName = String(batch.ingredientName ?? '');
        tx.set(wasteRef, {
            restaurantId: user.restaurantId,
            batchId,
            ingredientName,
            ingredientKey: String(batch.ingredientKey ?? ingredientName.toLowerCase()),
            quantityWasted,
            unit: String(batch.unit ?? ''),
            wasteReason,
            unitCost,
            costLoss,
            loggedBy: request.auth.uid,
            loggedByName: String(user.displayName ?? user.email ?? ''),
            timestamp: now,
            voided: false,
            voidedAt: null,
            voidedBy: null,
            createdAt: now,
            updatedAt: now,
        });
        tx.update(batchRef, {
            quantity: nextQuantity,
            consumed: nextQuantity <= 0,
            consumedAt: nextQuantity <= 0 ? now : batch.consumedAt ?? null,
            consumedBy: nextQuantity <= 0 ? request.auth.uid : batch.consumedBy ?? null,
            lastModifiedAt: now,
            lastModifiedBy: request.auth.uid,
        });
        tx.set(auditRef, {
            action: 'waste_created',
            restaurantId: user.restaurantId,
            batchId,
            wasteLogId: wasteRef.id,
            userId: request.auth.uid,
            previousValues: { quantity: remaining, consumed: Boolean(batch.consumed) },
            newValues: {
                quantity: nextQuantity,
                quantityWasted,
                wasteReason,
                unitCost,
                costLoss,
                consumed: nextQuantity <= 0,
            },
            timestamp: now,
        });
        return {
            wasteLogId: wasteRef.id,
            costLoss,
            remainingQuantity: nextQuantity,
        };
    });
    firebase_functions_1.logger.info('createWasteLog success', {
        wasteLogId: result.wasteLogId,
        batchId,
        uid: request.auth.uid,
        costLoss: result.costLoss,
    });
    return { ok: true, ...result };
});
//# sourceMappingURL=createWasteLog.js.map