import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

type DeactivateRequest = {
  staffUid: string;
};

/**
 * Admin-only staff deactivation (FR-006):
 * - status = deactivated
 * - clear FCM token
 * - revoke refresh tokens (sessions die within ~60s)
 */
export const deactivateStaff = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required');
    }

    const staffUid = String((request.data as DeactivateRequest | undefined)?.staffUid ?? '').trim();
    if (!staffUid) {
      throw new HttpsError('invalid-argument', 'staffUid is required');
    }

    const db = getFirestore();
    const adminSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!adminSnap.exists) {
      throw new HttpsError('permission-denied', 'Admin profile not found');
    }

    const admin = adminSnap.data()!;
    if (admin.role !== 'admin' || admin.status !== 'approved') {
      throw new HttpsError('permission-denied', 'Only approved admins can deactivate staff');
    }

    const staffRef = db.collection('users').doc(staffUid);
    const staffSnap = await staffRef.get();
    if (!staffSnap.exists) {
      throw new HttpsError('not-found', 'Staff member not found');
    }

    const staff = staffSnap.data()!;
    if (staff.role !== 'staff') {
      throw new HttpsError('failed-precondition', 'Target user is not staff');
    }

    if (staff.restaurantId !== admin.restaurantId) {
      throw new HttpsError('permission-denied', 'Staff belongs to another restaurant');
    }

    await staffRef.update({
      status: 'deactivated',
      fcmToken: null,
      fcmTokens: [],
      updatedAt: FieldValue.serverTimestamp(),
    });

    const deviceSnap = await db
      .collection('deviceTokens')
      .where('userId', '==', staffUid)
      .get();
    await Promise.all(deviceSnap.docs.map((d) => d.ref.delete()));

    const { writeAuditLog } = await import('../audit/writeAuditLog');
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

    await getAuth().revokeRefreshTokens(staffUid);

    return { ok: true };
  },
);
