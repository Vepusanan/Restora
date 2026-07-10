"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
        fcmTokens: [],
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    const deviceSnap = await db
        .collection('deviceTokens')
        .where('userId', '==', staffUid)
        .get();
    await Promise.all(deviceSnap.docs.map((d) => d.ref.delete()));
    const { writeAuditLog } = await Promise.resolve().then(() => __importStar(require('../audit/writeAuditLog')));
    await writeAuditLog({
        action: 'staff_deactivated',
        restaurantId: admin.restaurantId,
        actorId: request.auth.uid,
        actorName: String(admin.displayName ?? 'Admin'),
        actorRole: 'admin',
        targetCollection: 'users',
        targetDocumentId: staffUid,
        targetName: String(staff.displayName ?? staffUid),
        before: { status: staff.status },
        after: { status: 'deactivated', devicesRemoved: deviceSnap.size },
        metadata: { via: 'deactivateStaff' },
    });
    await (0, auth_1.getAuth)().revokeRefreshTokens(staffUid);
    return { ok: true };
});
//# sourceMappingURL=deactivateStaff.js.map