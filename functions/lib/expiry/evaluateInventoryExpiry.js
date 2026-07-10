"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateInventoryExpiry = void 0;
const firestore_1 = require("firebase-admin/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_functions_1 = require("firebase-functions");
const expiry_1 = require("../utils/expiry");
const pushService_1 = require("../messaging/pushService");
function toDateOnly(value) {
    if (!value)
        return '';
    if (typeof value === 'string')
        return value.slice(0, 10);
    if (value instanceof firestore_1.Timestamp) {
        const d = value.toDate();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    return '';
}
/**
 * FR-021–FR-024 — hourly expiry evaluation + FCM dispatch with 24h duplicate suppression.
 * Writes batch docs only when tone changes or a notification is sent.
 */
exports.evaluateInventoryExpiry = (0, scheduler_1.onSchedule)({
    schedule: 'every 1 hours',
    timeZone: 'UTC',
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '512MiB',
}, async () => {
    const db = (0, firestore_1.getFirestore)();
    const now = new Date();
    let evaluated = 0;
    let transitions = 0;
    let notified = 0;
    let suppressed = 0;
    const restaurantsSnap = await db.collection('restaurants').get();
    firebase_functions_1.logger.info('evaluateInventoryExpiry start', { restaurants: restaurantsSnap.size });
    for (const restaurantDoc of restaurantsSnap.docs) {
        const restaurantId = restaurantDoc.id;
        const restaurant = restaurantDoc.data();
        const amberDays = (0, expiry_1.clampExpiryThreshold)(Number(restaurant.expiryAlertThreshold ?? expiry_1.DEFAULT_AMBER_DAYS));
        const batchesSnap = await db
            .collection('inventoryBatches')
            .where('restaurantId', '==', restaurantId)
            .where('consumed', '==', false)
            .where('archived', '==', false)
            .get();
        if (batchesSnap.empty)
            continue;
        const usersSnap = await db
            .collection('users')
            .where('restaurantId', '==', restaurantId)
            .where('status', '==', 'approved')
            .get();
        const userTokenMap = new Map();
        for (const userDoc of usersSnap.docs) {
            const data = userDoc.data();
            const tokens = Array.isArray(data.fcmTokens)
                ? data.fcmTokens.map(String).filter(Boolean)
                : [];
            if (data.fcmToken && !tokens.includes(String(data.fcmToken))) {
                tokens.push(String(data.fcmToken));
            }
            if (tokens.length > 0)
                userTokenMap.set(userDoc.id, tokens);
        }
        for (const batchDoc of batchesSnap.docs) {
            evaluated += 1;
            const data = batchDoc.data();
            const expiryDate = toDateOnly(data.expiryDate);
            if (!expiryDate)
                continue;
            const nextTone = (0, expiry_1.getExpiryTone)(expiryDate, now, amberDays);
            const previousTone = data.evaluatedTone ?? null;
            const toneChanged = previousTone !== nextTone;
            const shouldNotify = (0, expiry_1.isExpiryTransition)(previousTone, nextTone);
            if (!toneChanged && !shouldNotify) {
                continue;
            }
            const daysRemaining = (0, expiry_1.daysUntilExpiry)(expiryDate, now);
            const basePatch = {
                evaluatedTone: nextTone,
                lastEvaluatedAt: firestore_1.FieldValue.serverTimestamp(),
            };
            if (!shouldNotify) {
                await batchDoc.ref.update(basePatch);
                continue;
            }
            transitions += 1;
            const lastNotifiedAt = data.lastNotifiedAt?.toDate?.() ?? null;
            const suppress = (0, expiry_1.shouldSuppressDuplicate)({
                lastNotifiedTone: data.lastNotifiedTone,
                lastNotifiedAt,
                nextTone,
                now,
            });
            await db.collection('auditLogs').add({
                action: 'expiry_detected',
                restaurantId,
                batchId: batchDoc.id,
                userId: 'system',
                previousValues: { evaluatedTone: previousTone },
                newValues: { status: nextTone, daysRemaining, suppressed: suppress },
                timestamp: firestore_1.FieldValue.serverTimestamp(),
            });
            if (suppress) {
                suppressed += 1;
                await batchDoc.ref.update(basePatch);
                firebase_functions_1.logger.info('Suppressed duplicate expiry notification', {
                    batchId: batchDoc.id,
                    status: nextTone,
                });
                continue;
            }
            const copy = (0, expiry_1.buildExpiryNotificationCopy)({
                ingredientName: String(data.ingredientName ?? 'Item'),
                quantity: Number(data.quantity ?? 0),
                unit: String(data.unit ?? ''),
                daysRemaining,
                status: nextTone,
            });
            const deepLink = 'restora://inventory';
            const payloadData = {
                type: 'expiry_alert',
                batchId: batchDoc.id,
                restaurantId,
                status: nextTone,
                deepLink,
                ingredientName: String(data.ingredientName ?? ''),
                quantity: String(data.quantity ?? 0),
                unit: String(data.unit ?? ''),
                dateReceived: toDateOnly(data.dateReceived),
                expiryDate,
                daysRemaining: String(daysRemaining),
            };
            const allTokens = Array.from(userTokenMap.values()).flat();
            const pushResult = await (0, pushService_1.sendExpiryPush)({
                tokens: allTokens,
                title: copy.title,
                body: copy.body,
                data: payloadData,
            });
            await (0, pushService_1.removeInvalidTokens)(userTokenMap, pushResult.invalidTokens);
            const historyRef = await db.collection('notificationHistory').add({
                restaurantId,
                batchId: batchDoc.id,
                status: nextTone,
                ingredientName: data.ingredientName,
                quantity: data.quantity,
                unit: data.unit,
                dateReceived: toDateOnly(data.dateReceived),
                expiryDate,
                daysRemaining,
                recipientCount: allTokens.length,
                successCount: pushResult.successCount,
                failureCount: pushResult.failureCount,
                triggeredAt: firestore_1.FieldValue.serverTimestamp(),
                title: copy.title,
                body: copy.body,
            });
            await Promise.all(usersSnap.docs.map((userDoc) => db.collection('notifications').add({
                restaurantId,
                userId: userDoc.id,
                batchId: batchDoc.id,
                ingredientName: data.ingredientName,
                quantity: data.quantity,
                unit: data.unit,
                dateReceived: toDateOnly(data.dateReceived),
                expiryDate,
                daysRemaining,
                status: nextTone,
                title: copy.title,
                body: copy.body,
                read: false,
                deepLink,
                historyId: historyRef.id,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            })));
            await db.collection('auditLogs').add({
                action: pushResult.failureCount > 0 && pushResult.successCount === 0
                    ? 'notification_failed'
                    : 'notification_sent',
                restaurantId,
                batchId: batchDoc.id,
                userId: 'system',
                previousValues: { evaluatedTone: previousTone },
                newValues: {
                    status: nextTone,
                    historyId: historyRef.id,
                    successCount: pushResult.successCount,
                    failureCount: pushResult.failureCount,
                },
                timestamp: firestore_1.FieldValue.serverTimestamp(),
            });
            await batchDoc.ref.update({
                ...basePatch,
                lastNotifiedTone: nextTone,
                lastNotifiedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            notified += 1;
            firebase_functions_1.logger.info('Expiry notification dispatched', {
                batchId: batchDoc.id,
                status: nextTone,
                successCount: pushResult.successCount,
                failureCount: pushResult.failureCount,
            });
        }
    }
    firebase_functions_1.logger.info('evaluateInventoryExpiry complete', {
        evaluated,
        transitions,
        notified,
        suppressed,
    });
});
//# sourceMappingURL=evaluateInventoryExpiry.js.map