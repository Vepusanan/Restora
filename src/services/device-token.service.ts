import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getDb } from './firebase/firestore';
import { COLLECTIONS } from '@constants/auth';
import {
  DEVICE_ID_STORAGE_KEY,
  DEVICE_TOKEN_STORAGE_KEY,
} from '@constants/notifications';
import { createServiceError, toServiceError } from '@utils/errors';
import { buildDeviceTokenDocId } from '@utils/notifications';
import { auditService } from './audit.service';
import type {
  DevicePlatform,
  RegisterDeviceTokenInput,
} from '@/types';

export { buildDeviceTokenDocId } from '@utils/notifications';

type ActiveRegistration = {
  docId: string;
  userId: string;
  restaurantId: string;
  fcmToken: string;
  deviceId: string;
};

let activeRegistration: ActiveRegistration | null = null;

function resolvePlatform(): DevicePlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

function resolveAppVersion(): string {
  return Constants.expoConfig?.version || Constants.nativeAppVersion || '1.0.0';
}

async function writeDeviceAudit(input: {
  action: 'device_registered' | 'device_removed';
  userId: string;
  restaurantId: string;
  deviceId: string;
  fcmToken: string;
}): Promise<void> {
  await auditService.writeSafe({
    action: input.action,
    restaurantId: input.restaurantId,
    userId: input.userId,
    deviceId: input.deviceId,
    target: {
      collection: 'deviceTokens',
      documentId: buildDeviceTokenDocId(input.userId, input.deviceId),
      name: input.deviceId,
    },
    before: input.action === 'device_removed' ? { active: true } : null,
    after: {
      deviceId: input.deviceId,
      platform: resolvePlatform(),
      tokenSuffix: input.fcmToken.slice(-8),
      active: input.action === 'device_registered',
    },
  });
}

/**
 * FR-048 / FR-051 — device token registration and cleanup.
 * Dual-writes to `deviceTokens` (canonical) and `users.fcmTokens` (legacy Functions path).
 */
export const deviceTokenService = {
  getActiveRegistration(): ActiveRegistration | null {
    return activeRegistration;
  },

  async getOrCreateDeviceId(): Promise<string> {
    const existing = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing?.trim()) return existing.trim();

    const generated = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
    return generated;
  },

  async register(input: RegisterDeviceTokenInput): Promise<string> {
    const fcmToken = input.fcmToken.trim();
    if (!fcmToken) {
      throw createServiceError('restora/validation', 'FCM token is required');
    }
    if (!input.userId || !input.restaurantId || !input.deviceId) {
      throw createServiceError('restora/validation', 'Device registration is incomplete');
    }

    const docId = buildDeviceTokenDocId(input.userId, input.deviceId);
    const ref = doc(getDb(), COLLECTIONS.deviceTokens, docId);

    try {
      const dupQuery = query(
        collection(getDb(), COLLECTIONS.deviceTokens),
        where('fcmToken', '==', fcmToken),
      );
      const [dupSnap, existingSnap] = await Promise.all([getDocs(dupQuery), getDoc(ref)]);
      const batch = writeBatch(getDb());

      dupSnap.docs.forEach((dup) => {
        // Clients may only delete their own docs; cross-user orphans cleaned by Functions.
        if (dup.id !== docId && String(dup.data().userId) === input.userId) {
          batch.delete(dup.ref);
        }
      });

      const payload = {
        userId: input.userId,
        restaurantId: input.restaurantId,
        fcmToken,
        deviceId: input.deviceId,
        platform: input.platform,
        appVersion: input.appVersion,
        active: true,
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      };

      if (existingSnap.exists()) {
        batch.update(ref, payload);
      } else {
        batch.set(ref, {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      batch.update(doc(getDb(), COLLECTIONS.users, input.userId), {
        fcmToken,
        fcmTokens: arrayUnion(fcmToken),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      activeRegistration = {
        docId,
        userId: input.userId,
        restaurantId: input.restaurantId,
        fcmToken,
        deviceId: input.deviceId,
      };
      await AsyncStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, fcmToken);
      await writeDeviceAudit({
        action: 'device_registered',
        userId: input.userId,
        restaurantId: input.restaurantId,
        deviceId: input.deviceId,
        fcmToken,
      });

      return docId;
    } catch (error) {
      throw toServiceError(error, 'Unable to register device for push notifications');
    }
  },

  async touchLastActive(docId: string): Promise<void> {
    if (!docId) return;
    try {
      await updateDoc(doc(getDb(), COLLECTIONS.deviceTokens, docId), {
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        active: true,
      });
    } catch {
      // Non-fatal — registration may have been cleaned up.
    }
  },

  async unregisterCurrent(): Promise<void> {
    const current = activeRegistration;
    const storedToken = await AsyncStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
    const token = current?.fcmToken || storedToken;

    if (current) {
      await this.removeByDocId(current.docId, {
        userId: current.userId,
        restaurantId: current.restaurantId,
        deviceId: current.deviceId,
        fcmToken: current.fcmToken,
      });
    } else if (token) {
      await this.removeByFcmToken(token);
    }

    activeRegistration = null;
    await AsyncStorage.removeItem(DEVICE_TOKEN_STORAGE_KEY);
  },

  async removeByDocId(
    docId: string,
    meta?: {
      userId: string;
      restaurantId: string;
      deviceId: string;
      fcmToken: string;
    },
  ): Promise<void> {
    try {
      const batch = writeBatch(getDb());
      batch.delete(doc(getDb(), COLLECTIONS.deviceTokens, docId));
      if (meta?.userId && meta.fcmToken) {
        batch.update(doc(getDb(), COLLECTIONS.users, meta.userId), {
          fcmTokens: arrayRemove(meta.fcmToken),
          fcmToken: null,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();

      if (meta) {
        await writeDeviceAudit({
          action: 'device_removed',
          userId: meta.userId,
          restaurantId: meta.restaurantId,
          deviceId: meta.deviceId,
          fcmToken: meta.fcmToken,
        });
      }

      if (activeRegistration?.docId === docId) {
        activeRegistration = null;
      }
    } catch (error) {
      throw toServiceError(error, 'Unable to remove device token');
    }
  },

  async removeByFcmToken(fcmToken: string): Promise<void> {
    const token = fcmToken.trim();
    if (!token) return;

    try {
      const snap = await getDocs(
        query(collection(getDb(), COLLECTIONS.deviceTokens), where('fcmToken', '==', token)),
      );
      if (snap.empty) return;

      const batch = writeBatch(getDb());
      for (const item of snap.docs) {
        const data = item.data();
        batch.delete(item.ref);
        if (data.userId) {
          batch.update(doc(getDb(), COLLECTIONS.users, String(data.userId)), {
            fcmTokens: arrayRemove(token),
            fcmToken: null,
            updatedAt: serverTimestamp(),
          });
        }
      }
      await batch.commit();

      for (const item of snap.docs) {
        const data = item.data();
        await writeDeviceAudit({
          action: 'device_removed',
          userId: String(data.userId ?? ''),
          restaurantId: String(data.restaurantId ?? ''),
          deviceId: String(data.deviceId ?? ''),
          fcmToken: token,
        });
      }

      if (activeRegistration?.fcmToken === token) {
        activeRegistration = null;
      }
    } catch (error) {
      throw toServiceError(error, 'Unable to remove device token');
    }
  },

  buildRegistrationPayload(input: {
    userId: string;
    restaurantId: string;
    fcmToken: string;
    deviceId: string;
  }): RegisterDeviceTokenInput {
    return {
      userId: input.userId,
      restaurantId: input.restaurantId,
      fcmToken: input.fcmToken,
      deviceId: input.deviceId,
      platform: resolvePlatform(),
      appVersion: resolveAppVersion(),
    };
  },
};
