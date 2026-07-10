"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateStaff = void 0;
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
/**
 * Admin-only staff deactivation (FR-006):
 * - status = deactivated
 * - clear FCM token
 * - revoke refresh tokens (sessions die within ~60s)
 */
exports.deactivateStaff = (0, https_1.onCall)({
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
}, async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in required');
    }
    const staffUid = String(request.data?.staffUid ?? '').trim();
    if (!staffUid) {
        throw new https_1.HttpsError('invalid-argument', 'staffUid is required');
    }
    const db = (0, firestore_1.getFirestore)();
    const adminSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!adminSnap.exists) {
        throw new https_1.HttpsError('permission-denied', 'Admin profile not found');
    }
    const admin = adminSnap.data();
    if (admin.role !== 'admin' || admin.status !== 'approved') {
        throw new https_1.HttpsError('permission-denied', 'Only approved admins can deactivate staff');
    }
    const staffRef = db.collection('users').doc(staffUid);
    const staffSnap = await staffRef.get();
    if (!staffSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Staff member not found');
    }
    const staff = staffSnap.data();
    if (staff.role !== 'staff') {
        throw new https_1.HttpsError('failed-precondition', 'Target user is not staff');
    }
    if (staff.restaurantId !== admin.restaurantId) {
        throw new https_1.HttpsError('permission-denied', 'Staff belongs to another restaurant');
    }
    await staffRef.update({
        status: 'deactivated',
        fcmToken: null,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await (0, auth_1.getAuth)().revokeRefreshTokens(staffUid);
    return { ok: true };
});
//# sourceMappingURL=deactivateStaff.js.map