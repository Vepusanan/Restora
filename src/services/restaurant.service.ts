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
import { EXPIRY_AMBER_DAYS } from '@constants/inventory';
import { mapRestaurant } from '@utils/mappers';
import { clampExpiryThreshold } from '@utils/expiry';
import { createServiceError, toServiceError } from '@utils/errors';
import { normalizeRestaurantCode } from '@utils/restaurantCode';
import {
  normalizeCurrency,
  validateRestaurantName,
} from '@utils/settings';
import type { Restaurant, UpdateRestaurantSettingsInput } from '@/types';
import { getFirebaseAuth } from './firebase/auth';
import { auditService } from './audit.service';
import { SUPPORTED_CURRENCIES } from '@/types';

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
        currency: 'USD',
        updatedBy: null,
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
    const previous = await this.getById(restaurantId);
    if (!previous) {
      throw createServiceError('restora/not-found', 'Restaurant not found');
    }
    await this.updateSettings(restaurantId, {
      name: previous.name,
      currency: previous.currency,
      expiryAlertThreshold: threshold,
    });
  },

  /**
   * FR-056 — admin restaurant settings (name, currency, amber threshold).
   */
  async updateSettings(
    restaurantId: string,
    input: UpdateRestaurantSettingsInput,
  ): Promise<void> {
    const nameError = validateRestaurantName(input.name);
    if (nameError) throw createServiceError('restora/validation', nameError);

    const currency = normalizeCurrency(input.currency);
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      throw createServiceError('restora/validation', 'Select a supported currency.');
    }

    const threshold = clampExpiryThreshold(input.expiryAlertThreshold);
    if (threshold < 1 || threshold > 30) {
      throw createServiceError(
        'restora/invalid-threshold',
        'Expiry alert threshold must be between 1 and 30 days.',
      );
    }

    try {
      const previous = await this.getById(restaurantId);
      if (!previous) {
        throw createServiceError('restora/not-found', 'Restaurant not found');
      }

      const uid = getFirebaseAuth().currentUser?.uid ?? 'unknown';
      const name = input.name.trim();

      await updateDoc(doc(getDb(), COLLECTIONS.restaurants, restaurantId), {
        name,
        currency,
        expiryAlertThreshold: threshold,
        updatedBy: uid,
        updatedAt: serverTimestamp(),
      });

      // Keep restaurantCodes display name in sync for staff registration lookups.
      if (previous.code) {
        await updateDoc(doc(getDb(), COLLECTIONS.restaurantCodes, previous.code), {
          name,
        }).catch(() => undefined);
      }

      // Sync denormalized restaurantName on the admin's own profile if they own it.
      if (uid !== 'unknown') {
        await updateDoc(doc(getDb(), COLLECTIONS.users, uid), {
          restaurantName: name,
          updatedAt: serverTimestamp(),
        }).catch(() => undefined);
      }

      await auditService.writeSafe({
        action: 'restaurant_settings_updated',
        restaurantId,
        userId: uid,
        target: {
          collection: 'restaurants',
          documentId: restaurantId,
          name,
        },
        before: {
          name: previous.name,
          currency: previous.currency,
          expiryAlertThreshold: previous.expiryAlertThreshold,
        },
        after: {
          name,
          currency,
          expiryAlertThreshold: threshold,
        },
      });
    } catch (error) {
      throw toServiceError(error, 'Unable to update restaurant settings');
    }
  },
};
