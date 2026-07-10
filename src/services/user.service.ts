import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from './firebase/firestore';
import { COLLECTIONS } from '@constants/auth';
import { deviceTokenService } from './device-token.service';
import { mapUserProfile } from '@utils/mappers';
import { toServiceError } from '@utils/errors';
import type { UserProfile } from '@/types';

export const userService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(getDb(), COLLECTIONS.users, uid));
      if (!snap.exists()) return null;
      return mapUserProfile(snap.id, snap.data());
    } catch (error) {
      throw toServiceError(error, 'Unable to load profile');
    }
  },

  subscribeProfile(uid: string, callback: (profile: UserProfile | null) => void): Unsubscribe {
    return onSnapshot(
      doc(getDb(), COLLECTIONS.users, uid),
      (snap) => {
        callback(snap.exists() ? mapUserProfile(snap.id, snap.data()) : null);
      },
      (error) => {
        console.error('Profile listener error', error);
        callback(null);
      },
    );
  },

  /**
   * @deprecated Prefer deviceTokenService.register — retained for compatibility.
   * Mirrors token onto users/{uid} for legacy Function readers.
   */
  async registerFcmToken(uid: string, token: string): Promise<void> {
    if (!token.trim()) return;
    try {
      await updateDoc(doc(getDb(), COLLECTIONS.users, uid), {
        fcmToken: token,
        fcmTokens: arrayUnion(token),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw toServiceError(error, 'Unable to register push token');
    }
  },

  async removeFcmToken(uid: string, token: string): Promise<void> {
    if (!token.trim()) return;
    try {
      await Promise.all([
        updateDoc(doc(getDb(), COLLECTIONS.users, uid), {
          fcmTokens: arrayRemove(token),
          fcmToken: null,
          updatedAt: serverTimestamp(),
        }),
        deviceTokenService.removeByFcmToken(token).catch(() => undefined),
      ]);
    } catch (error) {
      throw toServiceError(error, 'Unable to remove push token');
    }
  },
};
