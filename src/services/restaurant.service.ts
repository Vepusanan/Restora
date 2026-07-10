import { doc, getDoc } from 'firebase/firestore';
import { getDb } from './firebase/firestore';
import { COLLECTIONS } from '@constants/auth';
import { normalizeRestaurantCode } from '@utils/restaurantCode';
import { createServiceError, toServiceError } from '@utils/errors';
import type { Restaurant } from '@/types';

/**
 * Public code lookup used during staff registration (before Auth exists).
 * Only single-document get is allowed by Security Rules — never list.
 */
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
};
