import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from './firebase/firestore';
import { COLLECTIONS } from '@constants/auth';
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_BYTES } from '@constants/auth';
import { mapUserProfile } from '@utils/mappers';
import { createServiceError, toServiceError } from '@utils/errors';
import {
  validateDisplayName,
  validatePhoneNumber,
} from '@utils/settings';
import { auditService } from './audit.service';
import { storageService } from './storage.service';
import {
  arrayRemove,
  arrayUnion,
  setDoc,
} from 'firebase/firestore';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { getFirebaseAuth } from './firebase/auth';
import type {
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
  UpdateProfileInput,
  UserProfile,
} from '@/types';

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
   * FR-055 / FR-058 — update editable profile fields. Email/role/restaurant locked.
   */
  async updateProfile(uid: string, input: UpdateProfileInput): Promise<UserProfile> {
    const nameError = validateDisplayName(input.displayName);
    if (nameError) throw createServiceError('restora/validation', nameError);
    const phoneError = validatePhoneNumber(input.phoneNumber);
    if (phoneError) throw createServiceError('restora/validation', phoneError);

    try {
      const current = await this.getProfile(uid);
      if (!current) throw createServiceError('restora/not-found', 'Profile not found');

      let photoURL = current.photoURL;
      let avatarId = input.avatarId !== undefined ? input.avatarId : current.avatarId;
      let photoChanged = false;

      if (input.clearPhoto) {
        await storageService.deleteAvatar(uid);
        photoURL = null;
        photoChanged = true;
      } else if (input.localPhotoUri) {
        photoURL = await storageService.uploadAvatar(uid, input.localPhotoUri);
        avatarId = null;
        photoChanged = true;
      }

      const displayName = input.displayName.trim();
      const phoneNumber = input.phoneNumber.trim();

      await updateDoc(doc(getDb(), COLLECTIONS.users, uid), {
        displayName,
        phoneNumber,
        avatarId,
        photoURL,
        updatedAt: serverTimestamp(),
      });

      const authUser = getFirebaseAuth().currentUser;
      if (authUser && authUser.uid === uid) {
        await updateAuthProfile(authUser, {
          displayName,
          photoURL: photoURL ?? undefined,
        }).catch(() => undefined);
      }

      await auditService.writeSafe({
        action: photoChanged ? 'profile_photo_updated' : 'profile_updated',
        restaurantId: current.restaurantId,
        userId: uid,
        target: {
          collection: 'users',
          documentId: uid,
          name: displayName,
        },
        before: {
          displayName: current.displayName,
          phoneNumber: current.phoneNumber,
          avatarId: current.avatarId,
          photoURL: current.photoURL,
        },
        after: {
          displayName,
          phoneNumber,
          avatarId,
          photoURL,
        },
      });

      const updated = await this.getProfile(uid);
      if (!updated) throw createServiceError('restora/not-found', 'Profile not found after update');
      return updated;
    } catch (error) {
      throw toServiceError(error, 'Unable to update profile');
    }
  },

  /**
   * FR-057 — notification preferences on user doc + settings subcollection mirror.
   */
  async updateNotificationPreferences(
    uid: string,
    input: UpdateNotificationPreferencesInput,
  ): Promise<NotificationPreferences> {
    try {
      const current = await this.getProfile(uid);
      if (!current) throw createServiceError('restora/not-found', 'Profile not found');

      const prefs: NotificationPreferences = {
        pushEnabled: Boolean(input.pushEnabled),
        amberAlertsEnabled: Boolean(input.amberAlertsEnabled),
        redAlertsEnabled: Boolean(input.redAlertsEnabled),
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(getDb(), COLLECTIONS.users, uid), {
        notificationPrefs: prefs,
        updatedAt: serverTimestamp(),
      });

      // FR path mirror: users/{uid}/settings/notifications
      await setDoc(doc(getDb(), COLLECTIONS.users, uid, 'settings', 'notifications'), {
        ...prefs,
        updatedAt: serverTimestamp(),
      });

      await auditService.writeSafe({
        action: 'notification_prefs_updated',
        restaurantId: current.restaurantId,
        userId: uid,
        target: {
          collection: 'users',
          documentId: uid,
          name: current.displayName,
        },
        before: current.notificationPrefs,
        after: prefs,
      });

      return prefs;
    } catch (error) {
      throw toServiceError(error, 'Unable to update notification preferences');
    }
  },

  /** @deprecated Prefer deviceTokenService.register */
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
      const { deviceTokenService } = await import('./device-token.service');
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

/** Validate MIME for avatar uploads (used by storage service). */
export function assertAllowedAvatarType(contentType: string | undefined): void {
  const type = (contentType || '').toLowerCase();
  if (
    type &&
    !ALLOWED_AVATAR_TYPES.some((allowed) => type === allowed || type.startsWith(`${allowed};`))
  ) {
    throw createServiceError(
      'restora/invalid-avatar-type',
      'Profile photo must be JPG, PNG, or WEBP.',
    );
  }
  void MAX_AVATAR_BYTES;
}
