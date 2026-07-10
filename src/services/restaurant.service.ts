import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from './firebase/firestore';
import { COLLECTIONS } from '@constants/auth';
import { EXPIRY_AMBER_DAYS } from '@constants/inventory';
import { mapRestaurant } from '@utils/mappers';
import { clampExpiryThreshold } from '@utils/expiry';
import { createServiceError, toServiceError } from '@utils/errors';
import { normalizeRestaurantCode } from '@utils/restaurantCode';
import type { Restaurant } from '@/types';
import { getFirebaseAuth } from './firebase/auth';

export const restaurantService = {
  async findByCode(code: string): Promise<Restaurant | null> {
    try {
      const normalized = normalizeRestaurantCode(code);
      const codeSnap = await getDoc(doc(getDb(), COLLECTIONS.restaurantCodes, normalized));
      if (!codeSnap.exists()) return null;

      const data = codeSnap.data();
      const restaurantId = String(data.restaurantId ?? '');
      if (!restaurantId) return null;

      return {
        id: restaurantId,
        name: String(data.name ?? 'Restaurant'),
        code: String(data.code ?? normalized),
        ownerId: String(data.ownerId ?? ''),
        expiryAlertThreshold: EXPIRY_AMBER_DAYS,
        createdAt: '',
        updatedAt: '',
      };
    } catch (error) {
      throw toServiceError(error, 'Unable to validate restaurant code');
    }
  },

  async requireByCode(code: string): Promise<Restaurant> {
    const restaurant = await this.findByCode(code);
    if (!restaurant) {
      throw createServiceError(
        'restora/restaurant-not-found',
        'No restaurant found for that code.',
      );
    }
    return restaurant;
  },

  async getById(restaurantId: string): Promise<Restaurant | null> {
    try {
      const snap = await getDoc(doc(getDb(), COLLECTIONS.restaurants, restaurantId));
      if (!snap.exists()) return null;
      return mapRestaurant(snap.id, snap.data());
    } catch (error) {
      throw toServiceError(error, 'Unable to load restaurant');
    }
  },

  subscribe(
    restaurantId: string,
    callback: (restaurant: Restaurant | null) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(getDb(), COLLECTIONS.restaurants, restaurantId),
      (snap) => {
        callback(snap.exists() ? mapRestaurant(snap.id, snap.data()) : null);
      },
      (error) => {
        console.error('Restaurant listener error', error);
        callback(null);
      },
    );
  },

  async updateExpiryThreshold(restaurantId: string, threshold: number): Promise<void> {
    const value = clampExpiryThreshold(threshold);
    if (value < 1 || value > 30) {
      throw createServiceError(
        'restora/invalid-threshold',
        'Expiry alert threshold must be between 1 and 30 days.',
      );
    }

    try {
      const previous = await this.getById(restaurantId);
      await updateDoc(doc(getDb(), COLLECTIONS.restaurants, restaurantId), {
        expiryAlertThreshold: value,
        updatedAt: serverTimestamp(),
      });

      const uid = getFirebaseAuth().currentUser?.uid ?? 'unknown';
      await addDoc(collection(getDb(), COLLECTIONS.auditLogs), {
        action: 'threshold_updated',
        restaurantId,
        batchId: '',
        userId: uid,
        previousValues: {
          expiryAlertThreshold: previous?.expiryAlertThreshold ?? EXPIRY_AMBER_DAYS,
        },
        newValues: { expiryAlertThreshold: value },
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      throw toServiceError(error, 'Unable to update expiry settings');
    }
  },
};
