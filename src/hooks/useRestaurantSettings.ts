import { useEffect, useState } from 'react';
import { restaurantService } from '@services/restaurant.service';
import { EXPIRY_AMBER_DAYS } from '@constants/inventory';
import type { Restaurant, UpdateRestaurantSettingsInput } from '@/types';

export function useRestaurantSettings(restaurantId: string | undefined) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setRestaurant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    return restaurantService.subscribe(restaurantId, (next) => {
      setRestaurant(next);
      setLoading(false);
      setError(null);
    });
  }, [restaurantId]);

  const updateThreshold = async (threshold: number) => {
    if (!restaurantId) return;
    setError(null);
    try {
      await restaurantService.updateExpiryThreshold(restaurantId, threshold);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings');
      throw err;
    }
  };

  const updateSettings = async (input: UpdateRestaurantSettingsInput) => {
    if (!restaurantId) return;
    setError(null);
    try {
      await restaurantService.updateSettings(restaurantId, input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings');
      throw err;
    }
  };

  return {
    restaurant,
    loading,
    error,
    amberDays: restaurant?.expiryAlertThreshold ?? EXPIRY_AMBER_DAYS,
    currency: restaurant?.currency ?? 'USD',
    updateThreshold,
    updateSettings,
  };
}
