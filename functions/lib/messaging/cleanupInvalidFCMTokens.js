"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupInvalidFCMTokens = void 0;
const firestore_1 = require("firebase-admin/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_functions_1 = require("firebase-functions");
/**
 * Daily cleanup: strip FCM tokens from deactivated accounts so they stop receiving alerts.
 * Invalid tokens for active users are removed inline during sendExpiryPush failures.
 */
exports.cleanupInvalidFCMTokens = (0, scheduler_1.onSchedule)({
    schedule: 'every 24 hours',
    timeZone: 'UTC',
    region: 'us-central1',
    timeoutSeconds: 300,
    memory: '256MiB',
}, async () => {
    const db = (0, firestore_1.getFirestore)();
    const snap = await db.collection('users').where('status', '==', 'deactivated').get();
    let cleared = 0;
    for (const userDoc of snap.docs) {
        const data = userDoc.data();
        const hasTokens = Boolean(data.fcmToken) ||
            (Array.isArray(data.fcmTokens) && data.fcmTokens.length > 0);
        if (!hasTokens)
            continue;
        await userDoc.ref.update({
            fcmToken: null,
            fcmTokens: [],
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        cleared += 1;
    }
    firebase_functions_1.logger.info('cleanupInvalidFCMTokens complete', {
        deactivatedUsers: snap.size,
        cleared,
    });
});
//# sourceMappingURL=cleanupInvalidFCMTokens.js.map