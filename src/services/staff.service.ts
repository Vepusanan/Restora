import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { getDb } from './firebase/firestore';
import { getFirebaseApp } from './firebase/config';
import { COLLECTIONS } from '@constants/auth';
import { env } from '@config/env';
import { mapStaffMember } from '@utils/mappers';
import { toServiceError } from '@utils/errors';
import type { StaffMember, UserStatus } from '@/types';

export const staffService = {
  subscribeStaff(
    restaurantId: string,
    callback: (staff: StaffMember[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(getDb(), COLLECTIONS.users),
      where('restaurantId', '==', restaurantId),
      where('role', '==', 'staff'),
      orderBy('createdAt', 'desc'),
    );

    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((item) => mapStaffMember(item.id, item.data())));
      },
      (error) => {
        console.error('Staff listener error', error);
        callback([]);
      },
    );
  },

  async setStatus(
    staffUid: string,
    status: Extract<UserStatus, 'approved' | 'rejected'>,
  ): Promise<void> {
    try {
      await updateDoc(doc(getDb(), COLLECTIONS.users, staffUid), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw toServiceError(error, 'Unable to update staff status');
    }
  },

  /**
   * Deactivate staff (FR-006): status + clear FCM + revoke refresh tokens via Cloud Function.
   * Falls back to Firestore-only deactivation if the function is not deployed yet.
   */
  async deactivate(staffUid: string): Promise<void> {
    try {
      const functions = getFunctions(getFirebaseApp(), env.functionsRegion);
      const callable = httpsCallable<{ staffUid: string }, { ok: boolean }>(
        functions,
        'deactivateStaff',
      );
      await callable({ staffUid });
      return;
    } catch (error) {
      const serviceError = toServiceError(error, 'Unable to deactivate staff');
      const canFallback =
        serviceError.code.includes('not-found') ||
        serviceError.code.includes('unavailable') ||
        serviceError.code.includes('failed-precondition') ||
        serviceError.message.toLowerCase().includes('not found');

      if (!canFallback) {
        throw serviceError;
      }
    }

    try {
      await updateDoc(doc(getDb(), COLLECTIONS.users, staffUid), {
        status: 'deactivated',
        fcmToken: null,
        updatedAt: serverTimestamp(),
      });
    } catch (fallbackError) {
      throw toServiceError(fallbackError, 'Unable to deactivate staff');
    }
  },
};
