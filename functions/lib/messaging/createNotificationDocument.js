"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInboxNotifications = createInboxNotifications;
const firestore_1 = require("firebase-admin/firestore");
/**
 * FR-052 / Functions — fan-out inbox documents to approved restaurant users.
 * Idempotent when called once per event; callers should pass a stable historyId.
 */
async function createInboxNotifications(input) {
    const db = (0, firestore_1.getFirestore)();
    const ids = [];
    const uniqueUsers = Array.from(new Set(input.userIds.filter(Boolean)));
    await Promise.all(uniqueUsers.map(async (userId) => {
        const ref = await db.collection('notifications').add({
            restaurantId: input.restaurantId,
            userId,
            batchId: input.batchId ?? '',
            type: input.type,
            priority: input.priority ?? 'normal',
            title: input.title,
            body: input.body,
            read: false,
            readBy: [],
            deepLink: input.deepLink ?? 'restora://inbox',
            historyId: input.historyId ?? null,
            createdBy: input.createdBy ?? 'system',
            metadata: input.metadata ?? {},
            ingredientName: input.expiryFields?.ingredientName ?? '',
            quantity: input.expiryFields?.quantity ?? 0,
            unit: input.expiryFields?.unit ?? '',
            dateReceived: input.expiryFields?.dateReceived ?? '',
            expiryDate: input.expiryFields?.expiryDate ?? '',
            daysRemaining: input.expiryFields?.daysRemaining ?? 0,
            status: input.expiryFields?.status ?? null,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        ids.push(ref.id);
    }));
    return ids;
}
//# sourceMappingURL=createNotificationDocument.js.map