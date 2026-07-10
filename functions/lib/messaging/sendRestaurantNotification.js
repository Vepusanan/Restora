"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRestaurantNotification = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const pushService_1 = require("./pushService");
const createNotificationDocument_1 = require("./createNotificationDocument");
const writeAuditLog_1 = require("../audit/writeAuditLog");
/**
 * FR-049 — admin-triggered restaurant-wide push + optional inbox fan-out.
 * Requires Blaze (callable + FCM Admin SDK).
 */
exports.sendRestaurantNotification = (0, https_1.onCall)({
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
}, async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in required');
    }
    const data = (request.data ?? {});
    const title = String(data.title ?? '').trim();
    const body = String(data.body ?? '').trim();
    const restaurantId = String(data.restaurantId ?? '').trim();
    const type = (data.type ?? 'system');
    if (!title || !body || !restaurantId) {
        throw new https_1.HttpsError('invalid-argument', 'restaurantId, title, and body are required');
    }
    const db = (0, firestore_1.getFirestore)();
    const adminSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!adminSnap.exists) {
        throw new https_1.HttpsError('permission-denied', 'Profile not found');
    }
    const admin = adminSnap.data();
    if (admin.role !== 'admin' ||
        admin.status !== 'approved' ||
        admin.restaurantId !== restaurantId) {
        throw new https_1.HttpsError('permission-denied', 'Only restaurant admins can send notifications');
    }
    const { tokens, userTokenMap, userIds } = await (0, pushService_1.loadRestaurantDeviceTokens)(restaurantId);
    const pushResult = await (0, pushService_1.sendRestaurantPush)({
        tokens,
        title,
        body,
        data: {
            type,
            restaurantId,
            batchId: String(data.batchId ?? ''),
            deepLink: String(data.deepLink ?? 'restora://inbox'),
        },
        androidChannelId: 'restora-alerts',
    });
    await (0, pushService_1.removeInvalidTokens)(userTokenMap, pushResult.invalidTokens);
    let inboxIds = [];
    if (data.createInbox !== false) {
        inboxIds = await (0, createNotificationDocument_1.createInboxNotifications)({
            restaurantId,
            userIds,
            batchId: data.batchId,
            type,
            priority: data.priority ?? 'normal',
            title,
            body,
            deepLink: data.deepLink,
            createdBy: request.auth.uid,
            metadata: data.metadata ?? {},
        });
    }
    await (0, writeAuditLog_1.writeAuditLog)({
        action: pushResult.failureCount > 0 && pushResult.successCount === 0
            ? 'notification_failed'
            : 'notification_sent',
        restaurantId,
        actorId: request.auth.uid,
        actorName: String(admin.displayName ?? 'Admin'),
        actorRole: 'admin',
        batchId: data.batchId ?? '',
        notificationId: inboxIds[0] ?? null,
        targetCollection: 'notifications',
        targetDocumentId: inboxIds[0] ?? '',
        before: null,
        after: {
            successCount: pushResult.successCount,
            failureCount: pushResult.failureCount,
            recipientCount: tokens.length,
            inboxCount: inboxIds.length,
            type,
        },
    });
    firebase_functions_1.logger.info('sendRestaurantNotification complete', {
        restaurantId,
        successCount: pushResult.successCount,
        failureCount: pushResult.failureCount,
    });
    return {
        ok: true,
        successCount: pushResult.successCount,
        failureCount: pushResult.failureCount,
        recipientCount: tokens.length,
        inboxIds,
    };
});
//# sourceMappingURL=sendRestaurantNotification.js.map