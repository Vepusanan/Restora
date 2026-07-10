import {
  doc,
  getDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from './firebase/firestore';
import { COLLECTIONS } from '@constants/auth';
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
};
